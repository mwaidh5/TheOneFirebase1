
import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { User, UserRole } from '../types';
import { GoogleGenAI } from '@google/genai';
import { COACHES, MOCK_ADMIN, MOCK_USER } from '../constants';

interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
}

interface Conversation {
  id: string;
  participants: { id: string; name: string; avatar: string; role: UserRole }[];
  lastMessage: string;
  unreadCount: number;
  messages: Message[];
  type?: 'support' | 'coach' | 'admin' | 'athlete';
}

interface ChatProps {
  currentUser: User;
}

const Chat: React.FC<ChatProps> = ({ currentUser }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeThread, setActiveThread] = useState<Conversation | null>(null);
  const [inputText, setInputText] = useState('');
  const [isAiDrafting, setIsAiDrafting] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const lastThreadId = useRef<string | null>(null);

  const isAdmin = currentUser.role === UserRole.ADMIN;
  const isCoach = currentUser.role === UserRole.COACH;
  const isClient = currentUser.role === UserRole.CLIENT;
  const isSupport = currentUser.role === UserRole.SUPPORT;

  // Initial Mock Data
  const [conversations, setConversations] = useState<Conversation[]>(() => {
    const base: Conversation[] = [];
    
    // Support Threads logic
    if (isClient || isSupport || isAdmin) {
      const supportMessages: Message[] = [
        { id: 'm-sys-1', senderId: 'support-team', text: "Welcome to the IronPulse internal support line. We're here to help with any platform issues.", timestamp: "9:00 AM" }
      ];

      if (localStorage.getItem('automated_msg_purchase')) {
        supportMessages.push({ id: 'auto-p', senderId: 'support-team', text: "Thank you for your enrollment! Your training profile is now active.", timestamp: "Just now" });
      }

      base.push({
        id: 'support-main',
        type: 'support',
        participants: [
          { id: 'u1', name: 'Alex Johnson', avatar: MOCK_USER.avatar, role: UserRole.CLIENT },
          { id: 'support-team', name: 'Platform Support', avatar: 'https://i.pravatar.cc/150?u=support', role: UserRole.ADMIN }
        ],
        lastMessage: supportMessages[supportMessages.length - 1].text,
        unreadCount: 0,
        messages: supportMessages
      });

      // If Support, add more mock threads to act as "Client Inbox"
      if (isSupport) {
        base.push({
          id: 'support-client-2',
          type: 'support',
          participants: [
            { id: 'u2', name: 'Mark Ruffalo', avatar: 'https://i.pravatar.cc/150?u=u2', role: UserRole.CLIENT },
            { id: 'support-team', name: 'Platform Support', avatar: 'https://i.pravatar.cc/150?u=support', role: UserRole.ADMIN }
          ],
          lastMessage: "I cannot access the video vault.",
          unreadCount: 2,
          messages: [{ id: 'm-sub-2', senderId: 'u2', text: "I cannot access the video vault. Please check my subscription status.", timestamp: "10:00 AM" }]
        });
      }
    }

    // Coaches get specific threads
    if (isCoach) {
      base.push({
        id: 'admin-contact',
        type: 'admin',
        participants: [
          { id: currentUser.id, name: currentUser.firstName, avatar: currentUser.avatar, role: currentUser.role },
          { id: MOCK_ADMIN.id, name: 'System Management', avatar: MOCK_ADMIN.avatar, role: UserRole.ADMIN }
        ],
        lastMessage: "Verify your Q4 training schedule.",
        unreadCount: 1,
        messages: [{ id: 'm-adm-1', senderId: MOCK_ADMIN.id, text: "Coach, we've reviewed your new Engine Builder track. Please confirm equipment.", timestamp: "10:15 AM" }]
      });
      base.push({
        id: 'athlete-alex',
        type: 'athlete',
        participants: [
          { id: currentUser.id, name: currentUser.firstName, avatar: currentUser.avatar, role: currentUser.role },
          { id: MOCK_USER.id, name: 'Alex Johnson', avatar: MOCK_USER.avatar, role: UserRole.CLIENT }
        ],
        lastMessage: "PR today!",
        unreadCount: 0,
        messages: [{ id: 'm-ath-1', senderId: MOCK_USER.id, text: "Hey Coach! Just hit a new PR on my back squat.", timestamp: "Yesterday" }]
      });
    }

    return base;
  });

  const getOrCreateCoachConv = (coachId: string) => {
    const coach = COACHES.find(c => c.id === coachId);
    if (!coach) return;
    const existing = conversations.find(c => c.participants.some(p => p.id === coach.id));
    if (existing) {
      setActiveThread(existing);
    } else {
      const newConv: Conversation = {
        id: `conv-coach-${coach.id}-${currentUser.id}`,
        type: 'coach',
        participants: [
          { id: currentUser.id, name: currentUser.firstName, avatar: currentUser.avatar, role: currentUser.role },
          { id: coach.id, name: coach.name, avatar: coach.avatar, role: UserRole.COACH }
        ],
        lastMessage: "Conversation started.",
        unreadCount: 0,
        messages: [{ id: `m-init-${coach.id}`, senderId: coach.id, text: `Hi ${currentUser.firstName}! How's the training going?`, timestamp: "Just now" }]
      };
      setConversations(prev => [newConv, ...prev]);
      setActiveThread(newConv);
    }
  };

  const getOrCreateAthleteConv = (athleteId: string) => {
    const athleteName = 'SARAH JENKINS'; 
    const existing = conversations.find(c => c.participants.some(p => p.id === athleteId));
    if (existing) {
      setActiveThread(existing);
    } else {
      const newConv: Conversation = {
        id: `conv-ath-${athleteId}-${currentUser.id}`,
        type: 'athlete',
        participants: [
          { id: currentUser.id, name: currentUser.firstName, avatar: currentUser.avatar, role: currentUser.role },
          { id: athleteId, name: athleteName, avatar: `https://i.pravatar.cc/150?u=${athleteId}`, role: UserRole.CLIENT }
        ],
        lastMessage: "Conversation started.",
        unreadCount: 0,
        messages: [{ id: `m-init-${athleteId}`, senderId: currentUser.id, text: `Hi! Checking in on your latest session.`, timestamp: "Just now" }]
      };
      setConversations(prev => [newConv, ...prev]);
      setActiveThread(newConv);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const targetCoachId = params.get('coachId');
    const targetAthleteId = params.get('athleteId');
    if (targetCoachId) getOrCreateCoachConv(targetCoachId);
    else if (targetAthleteId && isCoach) getOrCreateAthleteConv(targetAthleteId);
    else if (!activeThread && conversations.length > 0) setActiveThread(conversations[0]);
  }, [location.search, currentUser]);

  useEffect(() => {
    if (!scrollContainerRef.current) return;
    const isThreadSwitch = lastThreadId.current !== activeThread?.id;
    const timer = setTimeout(() => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTo({ top: scrollContainerRef.current.scrollHeight, behavior: isThreadSwitch ? 'auto' : 'smooth' });
      }
      lastThreadId.current = activeThread?.id || null;
    }, 50);
    return () => clearTimeout(timer);
  }, [activeThread?.messages, activeThread?.id]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeThread) return;
    const newMessage: Message = {
      id: Math.random().toString(),
      senderId: currentUser.id,
      text: inputText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    const updatedThread = { ...activeThread, messages: [...activeThread.messages, newMessage], lastMessage: inputText };
    setActiveThread(updatedThread);
    setConversations(conversations.map(c => c.id === activeThread.id ? updatedThread : c));
    setInputText('');
  };

  const draftWithAi = async () => {
    if (!activeThread) return;
    setIsAiDrafting(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const lastMsg = activeThread.messages[activeThread.messages.length - 1].text;
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `You are an expert platform administrator or support agent. Draft a professional, helpful reply to: "${lastMsg}".`,
      });
      setInputText(response.text || '');
    } catch (error) { console.error('AI Draft Error:', error); } finally { setIsAiDrafting(false); }
  };

  const getRecipient = (conv: Conversation) => {
    // For support threads, support users want to see the CLIENT they are talking to
    if (isSupport && conv.type === 'support') {
        return conv.participants.find(p => p.role === UserRole.CLIENT);
    }
    return conv.participants.find(p => p.id !== currentUser.id);
  };

  return (
    <div className="flex-grow flex bg-white min-h-[calc(100vh-80px)] overflow-hidden animate-in fade-in duration-500">
      {/* Sidebar */}
      <div className="w-80 lg:w-96 border-r border-neutral-100 flex flex-col shrink-0 bg-neutral-50/30">
        <div className="p-8 border-b border-neutral-100 bg-white">
          <h2 className="text-xl font-black font-display uppercase tracking-tight text-black">Inbox</h2>
          <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mt-1">
            {isAdmin ? 'Management' : isCoach ? 'Athlete Sync' : isSupport ? 'Customer Success' : 'Messages'}
          </p>
        </div>
        
        <div className="flex-1 overflow-y-auto no-scrollbar py-4 px-3 space-y-6">
          {/* Support Tickets for Support Role */}
          {(isSupport || isAdmin) && (
            <div className="space-y-2">
              <p className="px-5 text-[10px] font-black text-purple-600 uppercase tracking-widest flex items-center gap-2">
                 <span className="w-1.5 h-1.5 rounded-full bg-purple-600 animate-pulse"></span>
                 Inbound Tickets
              </p>
              {conversations.filter(c => c.type === 'support').map(conv => {
                const isActive = activeThread?.id === conv.id;
                const client = conv.participants.find(p => p.role === UserRole.CLIENT);
                return (
                  <button
                    key={conv.id}
                    onClick={() => setActiveThread(conv)}
                    className={`w-full p-4 text-left rounded-2xl transition-all flex gap-4 items-center ${isActive ? 'bg-purple-600 text-white shadow-xl' : 'hover:bg-white text-neutral-500 hover:text-black'}`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isActive ? 'bg-white/20' : 'bg-neutral-100'}`}>
                      <img src={client?.avatar} className="w-full h-full object-cover rounded-xl" alt="" />
                    </div>
                    <div className="flex-grow min-w-0">
                      <p className={`font-black uppercase text-xs truncate ${isActive ? 'text-white' : 'text-black'}`}>{client?.name}</p>
                      <p className={`text-[10px] truncate ${isActive ? 'text-white/60' : 'text-neutral-400'}`}>{conv.lastMessage}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Regular Support Thread for Clients */}
          {isClient && (
            <div className="space-y-2">
              <p className="px-5 text-[10px] font-black text-neutral-300 uppercase tracking-widest">Help Desk</p>
              {conversations.filter(c => c.type === 'support').map(conv => {
                const isActive = activeThread?.id === conv.id;
                return (
                  <button
                    key={conv.id}
                    onClick={() => setActiveThread(conv)}
                    className={`w-full p-4 text-left rounded-2xl transition-all flex gap-4 items-center ${isActive ? 'bg-black text-white shadow-xl' : 'hover:bg-white text-neutral-500 hover:text-black'}`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-neutral-900 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-white text-xl">support_agent</span>
                    </div>
                    <div className="flex-grow min-w-0">
                      <p className={`font-black uppercase text-xs truncate ${isActive ? 'text-white' : 'text-black'}`}>Support Team</p>
                      <p className={`text-[10px] truncate ${isActive ? 'text-white/60' : 'text-neutral-400'}`}>{conv.lastMessage}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Other thread categories logic remains same ... */}
          {isCoach && (
            <div className="space-y-2">
              <p className="px-5 text-[10px] font-black text-accent uppercase tracking-widest">Management</p>
              {conversations.filter(c => c.type === 'admin').map(conv => {
                const isActive = activeThread?.id === conv.id;
                return (
                  <button key={conv.id} onClick={() => setActiveThread(conv)} className={`w-full p-4 text-left rounded-2xl transition-all flex gap-4 items-center ${isActive ? 'bg-accent text-white shadow-xl' : 'hover:bg-white text-neutral-500'}`}>
                    <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center shrink-0 shadow-sm"><span className="material-symbols-outlined text-white text-xl">shield_person</span></div>
                    <div className="flex-grow min-w-0"><p className={`font-black uppercase text-xs truncate ${isActive ? 'text-white' : 'text-black'}`}>Platform Admin</p><p className={`text-[10px] truncate ${isActive ? 'text-white/60' : 'text-neutral-400'}`}>{conv.lastMessage}</p></div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white">
        {activeThread ? (
          <>
            <div className="p-6 border-b border-neutral-100 flex items-center justify-between">
              <div className="flex items-center gap-4 text-left">
                <div className="w-10 h-10 rounded-full overflow-hidden shadow-sm">
                  <img src={getRecipient(activeThread)?.avatar} className="w-full h-full object-cover" alt="" />
                </div>
                <div>
                  <h3 className="font-black text-black uppercase text-sm tracking-tight leading-none">{getRecipient(activeThread)?.name}</h3>
                  <p className="text-[10px] text-accent font-black uppercase tracking-widest mt-1">
                    {activeThread.type === 'support' ? 'Verified Client' : `Protocol Link: ${getRecipient(activeThread)?.role}`}
                  </p>
                </div>
              </div>
              
              {!isClient && (
                <button onClick={draftWithAi} disabled={isAiDrafting} className="px-4 py-2 bg-neutral-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-accent transition-all flex items-center gap-2 shadow-xl disabled:opacity-50">
                  <span className={`material-symbols-outlined text-[16px] ${isAiDrafting ? 'animate-spin' : ''}`}>auto_awesome</span>
                  AI Assist
                </button>
              )}
            </div>

            <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-10 space-y-6 flex flex-col no-scrollbar bg-neutral-50/20">
              {activeThread.messages.map((msg) => {
                const isMine = msg.senderId === currentUser.id;
                return (
                  <div key={msg.id} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} max-w-[80%] ${isMine ? 'self-end' : 'self-start'}`}>
                    <div className={`p-4 rounded-2xl text-sm font-medium leading-relaxed shadow-sm ${isMine ? 'bg-black text-white rounded-tr-none' : 'bg-white text-black border border-neutral-100 rounded-tl-none'}`}>
                      {msg.text}
                    </div>
                    <span className="text-[10px] font-bold text-neutral-300 mt-2 mx-1 uppercase tracking-widest">{msg.timestamp}</span>
                  </div>
                );
              })}
            </div>

            <form onSubmit={handleSendMessage} className="p-8 border-t border-neutral-100 bg-white">
              <div className="relative flex items-center gap-4 bg-neutral-50 p-2 rounded-2xl border border-neutral-100 focus-within:border-black transition-all">
                <input type="text" value={inputText} onChange={(e) => setInputText(e.target.value)} placeholder="Type your response..." className="flex-1 bg-transparent border-none outline-none p-4 text-sm font-medium" />
                <button type="submit" disabled={!inputText.trim()} className="w-12 h-12 rounded-xl bg-black text-white flex items-center justify-center hover:bg-neutral-800 transition-all shadow-lg disabled:opacity-20"><span className="material-symbols-outlined">send</span></button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-12 opacity-30">
            <span className="material-symbols-outlined text-[120px] mb-6">chat_bubble</span>
            <h2 className="text-4xl font-black font-display uppercase tracking-tight">Active Threads</h2>
            <p className="text-lg font-medium">Select a conversation to begin resolution.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;
