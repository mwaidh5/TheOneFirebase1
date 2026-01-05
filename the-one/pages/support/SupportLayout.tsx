
import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';

const SupportLayout: React.FC = () => {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="flex flex-1 bg-neutral-50 overflow-hidden min-h-[calc(100vh-80px)]">
      <aside className="w-72 bg-white border-r border-neutral-100 flex flex-col shrink-0">
        <div className="p-8 flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-600 rounded-xl shadow-lg flex items-center justify-center text-white">
            <span className="material-symbols-outlined text-2xl">support_agent</span>
          </div>
          <div>
            <h1 className="text-black text-lg font-bold font-display leading-tight">Support Hub</h1>
            <p className="text-neutral-400 text-[10px] font-bold uppercase tracking-widest">Customer Success</p>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-2 overflow-y-auto no-scrollbar pb-10">
          <Link to="/support" className={`flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all text-sm font-bold ${isActive('/support') ? 'bg-neutral-50 text-black' : 'text-neutral-500 hover:bg-neutral-50 hover:text-black'}`}>
            <span className={`material-symbols-outlined ${isActive('/support') ? 'filled text-purple-600' : ''}`}>dashboard</span>
            Overview
          </Link>
          <Link to="/support/messages" className={`flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all text-sm font-bold ${isActive('/support/messages') ? 'bg-neutral-50 text-black' : 'text-neutral-500 hover:bg-neutral-50 hover:text-black'}`}>
            <span className={`material-symbols-outlined ${isActive('/support/messages') ? 'filled text-purple-600' : ''}`}>chat_bubble</span>
            Client Inbox
          </Link>

          <div className="pt-6 pb-2 px-5">
            <p className="text-[10px] font-black text-neutral-300 uppercase tracking-widest">Resolver Tools</p>
          </div>

          <Link to="/support/subscriptions" className={`flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all text-sm font-bold ${isActive('/support/subscriptions') ? 'bg-neutral-50 text-black' : 'text-neutral-500 hover:bg-neutral-50 hover:text-black'}`}>
            <span className={`material-symbols-outlined ${isActive('/support/subscriptions') ? 'filled text-purple-600' : ''}`}>payments</span>
            Subscriptions
          </Link>
          <Link to="/support/catalog" className={`flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all text-sm font-bold ${isActive('/support/catalog') ? 'bg-neutral-50 text-black' : 'text-neutral-500 hover:bg-neutral-50 hover:text-black'}`}>
            <span className={`material-symbols-outlined ${isActive('/support/catalog') ? 'filled text-purple-600' : ''}`}>library_books</span>
            Course Catalog
          </Link>
          <Link to="/support/diagnostics" className={`flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all text-sm font-bold ${isActive('/support/diagnostics') ? 'bg-neutral-50 text-black' : 'text-neutral-500 hover:bg-neutral-50 hover:text-black'}`}>
            <span className={`material-symbols-outlined ${isActive('/support/diagnostics') ? 'filled text-purple-600' : ''}`}>quiz</span>
            Diagnostic Logic
          </Link>
        </nav>
      </aside>

      <main className="flex-1 overflow-y-auto p-10">
        <div className="max-w-7xl mx-auto h-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default SupportLayout;
