
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
  const [showThreadList, setShowThreadList] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const lastThreadId = useRef<string | null>(null);

  const isAdmin = currentUser.role === UserRole.ADMIN;
  const isCoach = currentUser.role === UserRole.COACH;
  const isClient = currentUser.role === UserRole.CLIENT;
  const isSupport = currentUser.role === UserRole.SUPPORT;

  const [conversations, setConversations] = useState<Conversation[]>(() => {
    const base: Conversation[] = [];
    if (isClient || isSupport || isAdmin) {
      base.push({
        id: 'support-main',
        type: 'support',
        participants: [
          { id: 'u1', name: 'Alex Johnson', avatar: MOCK_USER.avatar, role: UserRole.CLIENT },
          { id: 'support-team', name: 'Platform Support', avatar: 'https://i.pravatar.cc/150?u=support', role: UserRole.ADMIN }
        ],
        lastMessage: "Welcome to support.",
        unreadCount: 0,
        messages: [{ id: 'm-sys-1', senderId: 'support-team', text: "Welcome to the internal support line. How can we help?", timestamp: "9:00 AM" }]
      });
    }
    if (isCoach) {
      base.push({
        id: 'admin-contact',
        type: 'admin',
        participants: [
          { id: currentUser.id, name: currentUser.firstName, avatar: currentUser.avatar, role: currentUser.role },
          { id: MOCK_ADMIN.id, name: 'System Management', avatar: MOCK_ADMIN.avatar, role: UserRole.ADMIN }
        ],
        lastMessage: "Schedule review.",
        unreadCount: 1,
        messages: [{ id: 'm-adm-1', senderId: MOCK_ADMIN.id, text: "Coach, please confirm your schedule.", timestamp: "10:15 AM" }]
      });
    }
    return base;
  });

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const targetCoachId = params.get('coachId');
    if (targetCoachId && conversations.length > 0) {
        setShowThreadList(false);
    }
  }, [location.search]);

  useEffect(() => {
    if (!scrollContainerRef.current) return;
    scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
  }, [activeThread?.messages]);

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

  const getRecipient = (conv: Conversation) => conv.participants.find(p => p.id !== currentUser.id);

  return (
    <div className="flex-grow flex bg-white min-h-[calc(100vh-80px)] overflow-hidden relative">
      {/* Thread Sidebar - Responsive */}
      <div className={`${showThreadList ? 'flex' : 'hidden md:flex'} w-full md:w-80 lg:w-96 border-r border-neutral-100 flex-col shrink-0 bg-neutral-50/30 absolute inset-0 z-20 md:relative`}>
        <div className="p-6 md:p-8 border-b border-neutral-100 bg-white">
          <h2 className="text-xl font-black font-display uppercase text-black">Inbox</h2>
        </div>
        <div className="flex-1 overflow-y-auto no-scrollbar py-4 px-3 space-y-4">
          {conversations.map(conv => {
            const isActive = activeThread?.id === conv.id;
            const recipient = getRecipient(conv);
            return (
              <button
                key={conv.id}
                onClick={() => { setActiveThread(conv); setShowThreadList(false); }}
                className={`w-full p-4 text-left rounded-2xl transition-all flex gap-4 items-center ${isActive ? 'bg-black text-white' : 'hover:bg-white text-neutral-500'}`}
              >
                <img src={recipient?.avatar} className="w-10 h-10 rounded-xl object-cover shrink-0" alt="" />
                <div className="flex-grow min-w-0">
                  <p className={`font-black uppercase text-xs truncate ${isActive ? 'text-white' : 'text-black'}`}>{recipient?.name}</p>
                  <p className="text-[10px] truncate opacity-60">{conv.lastMessage}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className={`${!showThreadList ? 'flex' : 'hidden md:flex'} flex-1 flex-col bg-white w-full h-full relative z-10`}>
        {activeThread ? (
          <>
            <div className="p-4 md:p-6 border-b border-neutral-100 flex items-center gap-4">
              <button onClick={() => setShowThreadList(true)} className="md:hidden p-2 text-neutral-400">
                <span className="material-symbols-outlined">arrow_back</span>
              </button>
              <div className="flex items-center gap-3">
                <img src={getRecipient(activeThread)?.avatar} className="w-8 h-8 md:w-10 md:h-10 rounded-full" alt="" />
                <h3 className="font-black text-black uppercase text-sm">{getRecipient(activeThread)?.name}</h3>
              </div>
            </div>

            <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-4 md:p-10 space-y-4 no-scrollbar bg-neutral-50/20">
              {activeThread.messages.map((msg) => {
                const isMine = msg.senderId === currentUser.id;
                return (
                  <div key={msg.id} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} max-w-[85%]`}>
                    <div className={`p-3 md:p-4 rounded-2xl text-sm font-medium ${isMine ? 'bg-black text-white rounded-tr-none ml-auto' : 'bg-white text-black border border-neutral-100 rounded-tl-none mr-auto'}`}>
                      {msg.text}
                    </div>
                    <span className="text-[9px] font-bold text-neutral-300 mt-1 uppercase">{msg.timestamp}</span>
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
