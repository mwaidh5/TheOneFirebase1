
import React, { useState, useRef, useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';

const AdminLayout: React.FC = () => {
  const location = useLocation();
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const isActive = (path: string) => location.pathname === path;

  const notifications = [
    { id: 1, type: 'COURSE', title: 'New Course Logic', text: 'Coach Mercer published "Engine Builder 2.0"', time: '2m ago', icon: 'school' },
    { id: 2, type: 'CUSTOM', title: 'Bespoke Cycle Ready', text: 'Sarah Jenkins custom plan is now live.', time: '15m ago', icon: 'architecture' },
    { id: 3, type: 'ORDER', title: 'Revenue Event', text: 'New enrollment: Fran Masterclass ($199)', time: '1h ago', icon: 'payments' },
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="flex flex-1 bg-neutral-50 overflow-hidden min-h-[calc(100vh-80px)] relative">
      <aside className="w-72 bg-white border-r border-neutral-100 flex flex-col shrink-0">
        <div className="p-8 flex items-center gap-3">
          <div className="w-10 h-10 bg-black rounded-xl shadow-lg flex items-center justify-center text-white">
            <span className="material-symbols-outlined text-2xl">fitness_center</span>
          </div>
          <div>
            <h1 className="text-black text-lg font-bold font-display leading-tight">The One Admin</h1>
            <p className="text-neutral-400 text-[10px] font-bold uppercase tracking-widest">Management Console</p>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-2 overflow-y-auto no-scrollbar">
          <Link to="/admin" className={`flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all text-sm font-bold ${isActive('/admin') ? 'bg-neutral-50 text-black' : 'text-neutral-500 hover:bg-neutral-50 hover:text-black'}`}>
            <span className={`material-symbols-outlined ${isActive('/admin') ? 'filled text-accent' : ''}`}>dashboard</span>
            Overview
          </Link>
          <Link to="/admin/custom-requests" className={`flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all text-sm font-bold ${isActive('/admin/custom-requests') ? 'bg-neutral-50 text-black' : 'text-neutral-500 hover:bg-neutral-50 hover:text-black'}`}>
            <span className={`material-symbols-outlined ${isActive('/admin/custom-requests') ? 'filled text-accent' : ''}`}>edit_note</span>
            Custom Leads
          </Link>
          <Link to="/admin/messages" className={`flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all text-sm font-bold ${isActive('/admin/messages') ? 'bg-neutral-50 text-black' : 'text-neutral-500 hover:bg-neutral-50 hover:text-black'}`}>
            <span className={`material-symbols-outlined ${isActive('/admin/messages') ? 'filled text-accent' : ''}`}>chat_bubble</span>
            Platform Inbox
          </Link>
          <Link to="/admin/architect" className={`flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all text-sm font-bold group ${isActive('/admin/architect') ? 'bg-neutral-900 text-white shadow-xl' : 'text-neutral-500 hover:bg-neutral-50 hover:text-black'}`}>
            <span className={`material-symbols-outlined ${isActive('/admin/architect') ? 'filled text-accent animate-pulse' : 'text-accent'}`}>auto_awesome</span>
            AI Architect
          </Link>
          
          <div className="pt-4 pb-2 px-6">
            <p className="text-[10px] font-black text-neutral-300 uppercase tracking-widest">Financial Intelligence</p>
          </div>
          <Link to="/admin/financials" className={`flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all text-sm font-bold ${isActive('/admin/financials') ? 'bg-neutral-50 text-black' : 'text-neutral-500 hover:bg-neutral-50 hover:text-black'}`}>
            <span className={`material-symbols-outlined ${isActive('/admin/financials') ? 'filled text-accent' : ''}`}>payments</span>
            Revenue
          </Link>
          <Link to="/admin/orders" className={`flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all text-sm font-bold ${isActive('/admin/orders') ? 'bg-neutral-50 text-black' : 'text-neutral-500 hover:bg-neutral-50 hover:text-black'}`}>
            <span className={`material-symbols-outlined ${isActive('/admin/orders') ? 'filled text-accent' : ''}`}>shopping_cart</span>
            Orders
          </Link>
          <Link to="/admin/coupons" className={`flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all text-sm font-bold ${isActive('/admin/coupons') ? 'bg-neutral-50 text-black' : 'text-neutral-500 hover:bg-neutral-50 hover:text-black'}`}>
            <span className={`material-symbols-outlined ${isActive('/admin/coupons') ? 'filled text-accent' : ''}`}>sell</span>
            Promotions
          </Link>

          <div className="pt-4 pb-2 px-6">
            <p className="text-[10px] font-black text-neutral-300 uppercase tracking-widest">Platform Core</p>
          </div>
          <Link to="/admin/users" className={`flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all text-sm font-bold ${isActive('/admin/users') || isActive('/admin/users/new') ? 'bg-neutral-50 text-black' : 'text-neutral-500 hover:bg-neutral-50 hover:text-black'}`}>
            <span className={`material-symbols-outlined ${isActive('/admin/users') || isActive('/admin/users/new') ? 'filled text-accent' : ''}`}>group</span>
            Users
          </Link>
          <Link to="/admin/courses" className={`flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all text-sm font-bold ${isActive('/admin/courses') ? 'bg-neutral-50 text-black' : 'text-neutral-500 hover:bg-neutral-50 hover:text-black'}`}>
            <span className={`material-symbols-outlined ${isActive('/admin/courses') ? 'filled text-accent' : ''}`}>school</span>
            Courses
          </Link>

          <div className="pt-4 pb-2 px-6">
            <p className="text-[10px] font-black text-neutral-300 uppercase tracking-widest">Libraries</p>
          </div>
          <Link to="/admin/exercise-library" className={`flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all text-sm font-bold ${isActive('/admin/exercise-library') ? 'bg-neutral-50 text-black' : 'text-neutral-500 hover:bg-neutral-50 hover:text-black'}`}>
            <span className={`material-symbols-outlined ${isActive('/admin/exercise-library') ? 'filled text-accent' : ''}`}>menu_book</span>
            Exercises
          </Link>
          <Link to="/admin/workout-library" className={`flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all text-sm font-bold ${isActive('/admin/workout-library') ? 'bg-neutral-50 text-black' : 'text-neutral-500 hover:bg-neutral-50 hover:text-black'}`}>
            <span className={`material-symbols-outlined ${isActive('/admin/workout-library') ? 'filled text-accent' : ''}`}>library_books</span>
            Workouts
          </Link>
          <Link to="/admin/meal-library" className={`flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all text-sm font-bold ${isActive('/admin/meal-library') ? 'bg-neutral-50 text-black' : 'text-neutral-500 hover:bg-neutral-50 hover:text-black'}`}>
            <span className={`material-symbols-outlined ${isActive('/admin/meal-library') ? 'filled text-accent' : ''}`}>restaurant_menu</span>
            Meal Plans
          </Link>
          <Link to="/admin/media" className={`flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all text-sm font-bold ${isActive('/admin/media') ? 'bg-neutral-50 text-black' : 'text-neutral-500 hover:bg-neutral-50 hover:text-black'}`}>
            <span className={`material-symbols-outlined ${isActive('/admin/media') ? 'filled text-accent' : ''}`}>perm_media</span>
            Media Studio
          </Link>

          <div className="my-6 border-t border-neutral-100 mx-4"></div>
          <p className="px-6 text-[10px] font-black text-neutral-300 uppercase tracking-[0.2em] mb-4">Infrastructure</p>
          <Link to="/admin/payment-gateway" className={`flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all text-sm font-bold ${isActive('/admin/payment-gateway') ? 'bg-neutral-50 text-black' : 'text-neutral-500 hover:bg-neutral-50 hover:text-black'}`}>
            <span className={`material-symbols-outlined ${isActive('/admin/payment-gateway') ? 'filled text-accent' : ''}`}>hub</span>
            Gateway
          </Link>
          <Link to="/admin/settings" className={`flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all text-sm font-bold ${isActive('/admin/settings') ? 'bg-neutral-50 text-black' : 'text-neutral-500 hover:bg-neutral-50 hover:text-black'}`}>
            <span className={`material-symbols-outlined ${isActive('/admin/settings') ? 'filled text-accent' : ''}`}>settings</span>
            CMS Settings
          </Link>
        </nav>
      </aside>

      <main className="flex-1 overflow-y-auto bg-neutral-50/50">
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-neutral-100 h-20 px-10 flex items-center justify-between">
           <div className="flex items-center gap-4">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-300">Logic Hub /</span>
              <span className="text-xs font-black uppercase tracking-widest text-black">{location.pathname.split('/').pop() || 'Dashboard'}</span>
           </div>
           
           <div className="flex items-center gap-6 relative" ref={notifRef}>
              <button 
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all relative ${isNotifOpen ? 'bg-black text-white' : 'bg-neutral-50 text-neutral-400 hover:text-black'}`}
              >
                 <span className="material-symbols-outlined text-[22px]">notifications</span>
                 <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
              </button>

              {isNotifOpen && (
                <div className="absolute top-full right-0 mt-4 w-96 bg-white border border-neutral-100 rounded-[2rem] shadow-[0_20px_60px_rgba(0,0,0,0.2)] overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300 z-50">
                   <div className="p-6 border-b border-neutral-50 flex justify-between items-center bg-neutral-50/30">
                      <h3 className="text-sm font-black uppercase tracking-widest text-black">System Pulse</h3>
                      <button className="text-[10px] font-black text-accent uppercase tracking-widest hover:underline">Clear All</button>
                   </div>
                   <div className="max-h-[400px] overflow-y-auto no-scrollbar py-2">
                      {notifications.map(notif => (
                        <div key={notif.id} className="p-6 hover:bg-neutral-50 transition-colors border-b border-neutral-50 last:border-0 flex gap-4 text-left group">
                           <div className="w-10 h-10 rounded-xl bg-neutral-900 flex items-center justify-center text-white shrink-0 shadow-lg group-hover:scale-110 transition-transform">
                              <span className="material-symbols-outlined text-[18px]">{notif.icon}</span>
                           </div>
                           <div>
                              <p className="text-[10px] font-black text-neutral-300 uppercase tracking-widest mb-1">{notif.title}</p>
                              <p className="text-xs font-bold text-black leading-tight mb-1">{notif.text}</p>
                              <p className="text-[9px] font-black text-accent uppercase">{notif.time}</p>
                           </div>
                        </div>
                      ))}
                   </div>
                   <Link to="/admin/activity" onClick={() => setIsNotifOpen(false)} className="block p-4 text-center bg-neutral-50 text-[10px] font-black uppercase tracking-widest text-neutral-400 hover:text-black hover:bg-neutral-100 transition-all">
                      View Full Intelligence Feed
                   </Link>
                </div>
              )}

              <div className="h-8 w-px bg-neutral-100"></div>
              <div className="flex items-center gap-3">
                 <div className="text-right">
                    <p className="text-[10px] font-black uppercase tracking-widest text-black leading-none">Admin Master</p>
                    <p className="text-[8px] font-bold text-accent uppercase tracking-widest mt-1">Platform God View</p>
                 </div>
                 <div className="w-10 h-10 rounded-full border border-neutral-100 p-0.5 shadow-sm">
                    <img src="https://picsum.photos/100/100?random=admin" className="w-full h-full rounded-full object-cover" alt="Admin" />
                 </div>
              </div>
           </div>
        </header>

        <div className="p-10 max-w-7xl mx-auto h-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
