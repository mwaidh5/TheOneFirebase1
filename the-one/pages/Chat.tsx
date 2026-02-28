
import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { User, UserRole } from '../types';
import { db } from '../firebase';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, getDocs, doc, setDoc, getDoc } from 'firebase/firestore';

interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: any;
}

interface Conversation {
  id: string;
  participants: string[]; // Array of User IDs
  lastMessage: string;
  lastMessageTimestamp: any;
  unreadCount: number;
  type?: 'support' | 'coach_client' | 'general';
  participantDetails?: { [userId: string]: User }; // Local cache of user details
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
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [usersCache, setUsersCache] = useState<{ [userId: string]: User }>({});

  // 1. Fetch Conversations
  useEffect(() => {
    let q;
    // Admins/Support see ALL support chats + their own chats
    // Clients see chats where they are a participant

    if (currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.SUPPORT) {
       // Ideally, support should see all 'support' type chats + chats where they are explicitly included.
       // For this MVP step: Fetch all, filter in memory or client side if needed.
       q = query(collection(db, 'conversations'), orderBy('lastMessageTimestamp', 'desc')); 
    } else {
       q = query(collection(db, 'conversations'), where('participants', 'array-contains', currentUser.id), orderBy('lastMessageTimestamp', 'desc'));
    }

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const convos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Conversation));
      
      const visibleConvos = (currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.SUPPORT) 
        ? convos // Admins see all
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
                }
              } catch (e) { console.error(e); }
          }
          setUsersCache(newUsersCache);
      }

      setConversations(visibleConvos);
    });

    return () => unsubscribe();
  }, [currentUser.id, currentUser.role]); 

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
            // Only create if we have loaded conversations and confirmed it doesn't exist
            // But conversations might be loading. 
            // We can check if conversations array is populated or rely on user action.
            // For URL params, it's tricky. Let's wait for user interaction or check if conversations length > 0
            if (conversations.length > 0) {
                 // It might be risky to auto-create here if conversations are just empty because user has none.
                 // Better to prompt user or just create it.
                 // createConversation(targetCoachId); 
                 // Let's create it.
                 createConversation(targetCoachId);
            }
        }
    }
  }, [location.search, conversations]);

  const createConversation = async (targetId: string) => {
      const isSupportChat = targetId === 'support' || targetId === 'support-team';
      
      // Double check if we already have it in current state to avoid race conditions
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

      const newConvData = {
          participants,
          lastMessage: '',
          lastMessageTimestamp: serverTimestamp(),
          unreadCount: 0,
          type: (isSupportChat ? 'support' : 'general') as 'support' | 'general'
      };

      try {
          const docRef = await addDoc(collection(db, 'conversations'), newConvData);
          
          // Optimistic update to ensure UI reflects the new chat immediately
          const newConv: Conversation = {
              id: docRef.id,
              ...newConvData,
              // Use a Date object for local render until serverTimestamp syncs
              lastMessageTimestamp: { toDate: () => new Date() } 
          } as any; 

          setConversations(prev => [newConv, ...prev]);
          setActiveThreadId(docRef.id);
          setShowThreadList(false);
      } catch (error) {
          console.error("Error creating conversation", error);
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

    const text = inputText;
    setInputText(''); // Optimistic clear

    try {
        await addDoc(collection(db, `conversations/${activeThreadId}/messages`), {
            senderId: currentUser.id,
            text,
            timestamp: serverTimestamp()
        });

        await setDoc(doc(db, 'conversations', activeThreadId), {
            lastMessage: text,
            lastMessageTimestamp: serverTimestamp(),
        }, { merge: true });

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
      const recipientId = getRecipientId(conv);
      if (recipientId === 'support-team') return { firstName: 'Platform', lastName: 'Support', avatar: 'https://via.placeholder.com/150?text=Support' };
      return usersCache[recipientId || ''] || { firstName: 'Unknown', lastName: '', avatar: '' };
  };

  const startSupportChat = async () => {
      // Check if existing support chat
      const existing = conversations.find(c => c.type === 'support' && c.participants.includes(currentUser.id));
      if (existing) {
          setActiveThreadId(existing.id);
          setShowThreadList(false);
      } else {
          await createConversation('support');
      }
  };

  return (
    <div className="flex-grow flex bg-white min-h-[calc(100vh-80px)] overflow-hidden relative">
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
            return (
              <button
                key={conv.id}
                onClick={() => { setActiveThreadId(conv.id); setShowThreadList(false); }}
                className={`w-full p-4 text-left rounded-2xl transition-all flex gap-4 items-center ${isActive ? 'bg-black text-white' : 'hover:bg-white text-neutral-500'}`}
              >
                <img src={recipient.avatar || 'https://via.placeholder.com/40'} className="w-10 h-10 rounded-xl object-cover shrink-0" alt="" />
                <div className="flex-grow min-w-0">
                  <p className={`font-black uppercase text-xs truncate ${isActive ? 'text-white' : 'text-black'}`}>{recipient.firstName} {recipient.lastName}</p>
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
                      {msg.text}
                    </div>
                    <span className="text-[9px] font-bold text-neutral-300 mt-1 uppercase">
                        {msg.timestamp?.toDate ? msg.timestamp.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '...'}
                    </span>
                  </div>
                );
              })}
            </div>

            <form onSubmit={handleSendMessage} className="p-4 md:p-8 border-t border-neutral-100 bg-white">
              <div className="flex items-center gap-2 md:gap-4 bg-neutral-50 p-1 md:p-2 rounded-2xl border border-neutral-100">
                <input type="text" value={inputText} onChange={(e) => setInputText(e.target.value)} placeholder="Message..." className="flex-1 bg-transparent border-none outline-none p-3 md:p-4 text-sm font-medium" />
                <button type="submit" disabled={!inputText.trim()} className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-black text-white flex items-center justify-center disabled:opacity-20"><span className="material-symbols-outlined">send</span></button>
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
