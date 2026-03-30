
import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { User, UserRole } from '../types';
import { db, storage } from '../firebase';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, getDocs, doc, setDoc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: any;
  imageUrl?: string;
  videoUrl?: string;
}

interface Conversation {
  id: string;
  participants: string[]; // Array of User IDs
  lastMessage: string;
  lastMessageTimestamp: any;
  unreadCount: number; // Legacy/Global
  unreadCounts?: { [userId: string]: number }; // Per-user unread counts
  type?: 'support' | 'coach_client' | 'general';
  participantDetails?: { [userId: string]: Partial<User> }; // Cached user details
}

interface ChatProps {
  currentUser: User;
}

const Chat: React.FC<ChatProps> = ({ currentUser }) => {
  const location = useLocation();
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [inputText, setInputText] = useState('');
  const [showThreadList, setShowThreadList] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const lastMessageTimeRef = useRef<number>(0); // Rate limit: 1 message/second
  const MAX_MSG_LENGTH = 2000;
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [conversationsLoaded, setConversationsLoaded] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [usersCache, setUsersCache] = useState<{ [userId: string]: User }>({});

  // 1. Fetch Conversations
  useEffect(() => {
    let q;

    if (currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.SUPPORT) {
       q = query(collection(db, 'conversations'), orderBy('lastMessageTimestamp', 'desc')); 
    } else {
       // Removing orderBy('lastMessageTimestamp', 'desc') to avoid composite index requirement
       q = query(collection(db, 'conversations'), where('participants', 'array-contains', currentUser.id));
    }

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      let convos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Conversation));
      
      // Sort manually
      if (currentUser.role !== UserRole.ADMIN && currentUser.role !== UserRole.SUPPORT) {
          convos = convos.sort((a, b) => {
              const getMillis = (ts: any) => {
                  if (!ts) return 0;
                  if (ts.toMillis) return ts.toMillis();
                  if (ts.seconds) return ts.seconds * 1000;
                  // Handle Date object (optimistic update)
                  if (ts instanceof Date) return ts.getTime();
                  // Handle FieldValue or pending
                  return Date.now(); 
              };
              return getMillis(b.lastMessageTimestamp) - getMillis(a.lastMessageTimestamp);
          });
      }

      const visibleConvos = (currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.SUPPORT) 
        ? convos 
        : convos;

      // Fetch user details for participants
      const userIds = new Set<string>();
      visibleConvos.forEach(c => c.participants.forEach(p => userIds.add(p)));
      
      const params = new URLSearchParams(location.search);
      const targetCoachId = params.get('coachId');
      if (targetCoachId) userIds.add(targetCoachId);

      const newUsersCache = { ...usersCache };
      const missingIds = Array.from(userIds).filter(id => !newUsersCache[id]);

      if (missingIds.length > 0) {
          for (const uid of missingIds) {
              if (uid === 'support-team') {
                  newUsersCache[uid] = { id: 'support-team', firstName: 'Platform', lastName: 'Support', role: UserRole.SUPPORT, avatar: '', email: '', memberSince: '', level: '' };
                  continue;
              }
              try {
                const userSnap = await getDoc(doc(db, 'users', uid));
                if (userSnap.exists()) {
                    newUsersCache[uid] = userSnap.data() as User;
                } else {
                    newUsersCache[uid] = { id: uid, firstName: 'Deleted', lastName: 'User' } as any;
                }
              } catch (e) { console.error(e); }
          }
          setUsersCache(newUsersCache);
      }

      setConversations(visibleConvos);
      setConversationsLoaded(true);
    }, (error) => {
        console.error("Error fetching conversations:", error);
        setConversationsLoaded(true);
    });

    return () => unsubscribe();
  }, [currentUser.id, currentUser.role]); 

  // Reset unread count when opening a thread
  useEffect(() => {
    if (activeThreadId && currentUser.id) {
       const resetUnread = async () => {
           try {
               // Use setDoc with merge to ensure nested object structure exists/merges
               await setDoc(doc(db, 'conversations', activeThreadId), {
                   unreadCounts: {
                       [currentUser.id]: 0
                   }
               }, { merge: true });
               
               // Also reset 'support-team' count if I am admin/support
               if (currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.SUPPORT) {
                   // Check if this is a support chat
                   // We need to know the type. activeThread state might not be updated yet if we just switched.
                   // But we can check safely.
                   const conv = conversations.find(c => c.id === activeThreadId);
                   if (conv?.type === 'support') {
                       await setDoc(doc(db, 'conversations', activeThreadId), {
                           unreadCounts: {
                               'support-team': 0
                           }
                       }, { merge: true });
                   }
               }
           } catch (e) {
               console.error("Error resetting unread count", e);
           }
       };
       resetUnread();
    }
  }, [activeThreadId, currentUser.id, conversations]); // Added conversations dependency to check type

  // 2. Handle URL param to start/open chat
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const targetCoachId = params.get('coachId'); 

    if (targetCoachId) {
        let existingConv;
        if (targetCoachId === 'support') {
             existingConv = conversations.find(c => c.type === 'support' && c.participants.includes(currentUser.id));
        } else {
             existingConv = conversations.find(c => c.participants.includes(currentUser.id) && c.participants.includes(targetCoachId) && c.type !== 'support');
        }

        if (existingConv) {
            setActiveThreadId(existingConv.id);
            setShowThreadList(false);
        } else {
            if (conversationsLoaded) {
                 createConversation(targetCoachId);
            }
        }
    }
  }, [location.search, conversations, conversationsLoaded]);

  const createConversation = async (targetId: string) => {
      const isSupportChat = targetId === 'support' || targetId === 'support-team';
      
      if (isSupportChat) {
          const existing = conversations.find(c => c.type === 'support' && c.participants.includes(currentUser.id));
          if (existing) {
              setActiveThreadId(existing.id);
              setShowThreadList(false);
              return;
          }
      }

      const participants = [currentUser.id];
      if (!isSupportChat) participants.push(targetId);
      if (isSupportChat) participants.push('support-team');

      const participantDetails: any = {};
      participantDetails[currentUser.id] = { firstName: currentUser.firstName, lastName: currentUser.lastName, avatar: currentUser.avatar };
      if (usersCache[targetId]) {
          participantDetails[targetId] = { firstName: usersCache[targetId].firstName, lastName: usersCache[targetId].lastName, avatar: usersCache[targetId].avatar };
      }

      const newConvData = {
          participants,
          lastMessage: '',
          lastMessageTimestamp: serverTimestamp(),
          unreadCount: 0,
          unreadCounts: {}, // Initialize empty
          type: (isSupportChat ? 'support' : 'general') as 'support' | 'general',
          participantDetails
      };

      try {
          const docRef = await addDoc(collection(db, 'conversations'), newConvData);
          
          const newConv: Conversation = {
              id: docRef.id,
              ...newConvData,
              lastMessageTimestamp: new Date()
          } as any; 

          setConversations(prev => [newConv, ...prev]);
          setActiveThreadId(docRef.id);
          setShowThreadList(false);
      } catch (error: any) {
          console.error("Error creating conversation", error);
          alert("Failed to start chat. " + (error.message.includes('permission') ? 'This action is disabled while Impersonating another user.' : error.message));
      }
  };

  // 3. Fetch Messages for Active Thread
  useEffect(() => {
      if (!activeThreadId) return;

      const q = query(
          collection(db, `conversations/${activeThreadId}/messages`),
          orderBy('timestamp', 'asc')
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
          setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message)));
      });

      return () => unsubscribe();
  }, [activeThreadId]);

  // Scroll to bottom
  useEffect(() => {
    if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeThreadId) return;

    // Rate limit: max 1 message per second
    const now = Date.now();
    if (now - lastMessageTimeRef.current < 1000) return;
    lastMessageTimeRef.current = now;

    // Length cap
    if (inputText.length > MAX_MSG_LENGTH) return;

    const text = inputText;
    setInputText(''); // Optimistic clear
    
    // Get participants safely
    let participants: string[] = [];
    const activeConvState = conversations.find(c => c.id === activeThreadId);
    
    if (activeConvState) {
        participants = activeConvState.participants;
    } else {
        // Fallback fetch
        try {
            const docSnap = await getDoc(doc(db, 'conversations', activeThreadId));
            if (docSnap.exists()) {
                participants = docSnap.data().participants || [];
            }
        } catch (err) {
            console.error("Error fetching conv details", err);
        }
    }

    try {
        await addDoc(collection(db, `conversations/${activeThreadId}/messages`), {
            senderId: currentUser.id,
            text,
            timestamp: serverTimestamp()
        });
        
        // Prepare updates
        const updates: any = {
            lastMessage: text,
            lastMessageTimestamp: serverTimestamp(),
        };
        
        // Increment unread counts for others
        const unreadUpdates: any = {};
        participants.forEach(pId => {
             if (pId !== currentUser.id) {
                 unreadUpdates[pId] = increment(1);
             }
        });
        
        // Use setDoc with merge to ensure unreadCounts map is created if missing
        const finalUpdates = {
            ...updates,
            unreadCounts: unreadUpdates
        };

        await setDoc(doc(db, 'conversations', activeThreadId), finalUpdates, { merge: true });

    } catch (error) {
        console.error("Error sending message", error);
    }
  };

  const activeThread = conversations.find(c => c.id === activeThreadId);
  
  const getRecipientId = (conv: Conversation) => {
      if (conv.type === 'support') {
          if (currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.SUPPORT) {
              return conv.participants.find(p => p !== 'support-team' && p !== currentUser.id) || 'u1'; 
          }
          return 'support-team';
      }
      return conv.participants.find(p => p !== currentUser.id);
  };

  const getRecipientDetails = (conv: Conversation) => {
      const recipientId = getRecipientId(conv) || '';
      if (recipientId === 'support-team') return { firstName: 'Platform', lastName: 'Support', avatar: 'https://via.placeholder.com/150?text=Support' };
      
      const cachedDetail = conv.participantDetails?.[recipientId];
      const liveDetail = usersCache[recipientId];
      
      if (liveDetail && liveDetail.firstName !== 'Deleted') return liveDetail;
      if (cachedDetail) return cachedDetail;
      if (liveDetail && liveDetail.firstName === 'Deleted') return { ...liveDetail, isDeleted: true } as any;
      
      return { firstName: 'Unknown', lastName: '', avatar: '' };
  };

  const startSupportChat = async () => {
      const existing = conversations.find(c => c.type === 'support' && c.participants.includes(currentUser.id));
      if (existing) {
          setActiveThreadId(existing.id);
          setShowThreadList(false);
      } else {
          await createConversation('support');
      }
  };

  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !activeThreadId) return;
      
      setIsUploading(true);
      try {
          const fileRef = ref(storage, `chat/${activeThreadId}/${Date.now()}_${file.name}`);
          await uploadBytes(fileRef, file);
          const url = await getDownloadURL(fileRef);
          
          const isVideo = file.type.startsWith('video/');
          const msgData: any = {
              senderId: currentUser.id,
              text: isVideo ? 'Sent a video' : 'Sent an image',
              timestamp: serverTimestamp()
          };
          if (isVideo) msgData.videoUrl = url;
          else msgData.imageUrl = url;

          await addDoc(collection(db, `conversations/${activeThreadId}/messages`), msgData);
          
          const updates: any = { lastMessage: msgData.text, lastMessageTimestamp: serverTimestamp() };
          await setDoc(doc(db, 'conversations', activeThreadId), updates, { merge: true });
          
      } catch (err) {
          console.error("Upload failed", err);
      }
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="flex-grow flex bg-white h-[calc(100vh-80px)] overflow-hidden relative">
      <input type="file" className="hidden" ref={fileInputRef} accept="image/*,video/*" onChange={handleFileUpload} />
      {/* Sidebar */}
      <div className={`${showThreadList ? 'flex' : 'hidden md:flex'} w-full md:w-80 lg:w-96 border-r border-neutral-100 flex-col shrink-0 bg-neutral-50/30 absolute inset-0 z-20 md:relative`}>
        <div className="p-6 md:p-8 border-b border-neutral-100 bg-white flex justify-between items-center">
          <h2 className="text-xl font-black font-display uppercase text-black">Inbox</h2>
          {(currentUser.role === UserRole.CLIENT || currentUser.role === UserRole.COACH) && (
              <button onClick={startSupportChat} className="text-[10px] font-black uppercase text-accent hover:underline">
                  Contact Support
              </button>
          )}
        </div>
        <div className="flex-1 overflow-y-auto no-scrollbar py-4 px-3 space-y-4">
          {conversations.length === 0 && (
              <div className="text-center p-8 text-neutral-400 text-xs">No conversations yet</div>
          )}
          {conversations.map(conv => {
            const isActive = activeThreadId === conv.id;
            const recipient = getRecipientDetails(conv);
            
            if (recipient.firstName === 'Unknown' || recipient.isDeleted) return null;
            
            // Calculate unread for display
            let unread = 0;
            if (conv.unreadCounts) {
                unread = conv.unreadCounts[currentUser.id] || 0;
                if ((currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.SUPPORT) && conv.type === 'support') {
                     unread += (conv.unreadCounts['support-team'] || 0);
                }
            }
            
            return (
              <button
                key={conv.id}
                onClick={() => { setActiveThreadId(conv.id); setShowThreadList(false); }}
                className={`w-full p-4 text-left rounded-2xl transition-all flex gap-4 items-center ${isActive ? 'bg-black text-white' : 'hover:bg-white text-neutral-500'}`}
              >
                <img src={recipient.avatar || 'https://via.placeholder.com/40'} className="w-10 h-10 rounded-xl object-cover shrink-0" alt="" />
                <div className="flex-grow min-w-0">
                  <div className="flex justify-between items-center">
                      <p className={`font-black uppercase text-xs truncate ${isActive ? 'text-white' : 'text-black'}`}>{recipient.firstName} {recipient.lastName}</p>
                      {unread > 0 && (
                          <span className="w-2 h-2 rounded-full bg-accent ml-2"></span>
                      )}
                  </div>
                  <p className="text-[10px] truncate opacity-60">{conv.lastMessage || 'Start of conversation'}</p>
                </div>
                {conv.type === 'support' && (
                    <span className="material-symbols-outlined text-[14px] text-accent" title="Support Ticket">support_agent</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Chat Area */}
      <div className={`${!showThreadList ? 'flex' : 'hidden md:flex'} flex-1 flex-col bg-white w-full h-full relative z-10`}>
        {activeThread ? (
          <>
            <div className="p-4 md:p-6 border-b border-neutral-100 flex items-center gap-4">
              <button onClick={() => setShowThreadList(true)} className="md:hidden p-2 text-neutral-400">
                <span className="material-symbols-outlined">arrow_back</span>
              </button>
              <div className="flex items-center gap-3">
                <img src={getRecipientDetails(activeThread).avatar || 'https://via.placeholder.com/40'} className="w-8 h-8 md:w-10 md:h-10 rounded-full" alt="" />
                <h3 className="font-black text-black uppercase text-sm">
                    {getRecipientDetails(activeThread).firstName} {getRecipientDetails(activeThread).lastName}
                </h3>
              </div>
            </div>

            <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-4 md:p-10 space-y-4 no-scrollbar bg-neutral-50/20">
              {messages.map((msg) => {
                const isMine = msg.senderId === currentUser.id;
                return (
                  <div key={msg.id} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} max-w-[85%]`}>
                    <div className={`p-3 md:p-4 rounded-2xl text-sm font-medium ${isMine ? 'bg-black text-white rounded-tr-none ml-auto' : 'bg-white text-black border border-neutral-100 rounded-tl-none mr-auto'}`}>
                      {msg.imageUrl && <img src={msg.imageUrl} className="max-w-[200px] md:max-w-xs rounded-xl mb-2 object-cover" alt="attachment" />}
                      {msg.videoUrl && <video src={msg.videoUrl} controls className="max-w-[200px] md:max-w-xs rounded-xl mb-2" />}
                      {msg.text && msg.text !== 'Sent an image' && msg.text !== 'Sent a video' && <span>{msg.text}</span>}
                      {msg.text && (msg.text === 'Sent an image' || msg.text === 'Sent a video') && !(msg.imageUrl || msg.videoUrl) && <span>{msg.text}</span>}
                    </div>
                    <span className="text-[9px] font-bold text-neutral-300 mt-1 uppercase">
                        {msg.timestamp?.toDate ? msg.timestamp.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '...'}
                    </span>
                  </div>
                );
              })}
            </div>

            <form onSubmit={handleSendMessage} className="p-4 md:p-8 border-t border-neutral-100 bg-white shadow-[0_-10px_40px_rgba(0,0,0,0.05)] relative z-10">
              <div className="flex items-center gap-2 md:gap-4 bg-neutral-50 p-1 md:p-2 rounded-2xl border border-neutral-200 focus-within:border-black transition-all">
                <button type="button" onClick={() => fileInputRef.current?.click()} className="w-10 h-10 flex items-center justify-center text-neutral-400 hover:text-black">
                  {isUploading ? <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div> : <span className="material-symbols-outlined">attach_file</span>}
                </button>
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value.slice(0, MAX_MSG_LENGTH))}
                  placeholder="Message..."
                  className="flex-1 bg-transparent border-none outline-none py-3 text-sm font-medium"
                />
                {inputText.length > MAX_MSG_LENGTH * 0.8 && (
                  <span className={`text-[9px] font-black shrink-0 ${inputText.length >= MAX_MSG_LENGTH ? 'text-red-500' : 'text-neutral-300'}`}>
                    {inputText.length}/{MAX_MSG_LENGTH}
                  </span>
                )}
                <button type="submit" disabled={!inputText.trim() || inputText.length > MAX_MSG_LENGTH} className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-black text-white flex items-center justify-center disabled:opacity-20 transition-all"><span className="material-symbols-outlined text-sm md:text-base">send</span></button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-12 opacity-20 hidden md:flex">
            <span className="material-symbols-outlined text-[100px] mb-4">chat_bubble</span>
            <p className="font-black uppercase tracking-widest text-sm">Select conversation</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;
