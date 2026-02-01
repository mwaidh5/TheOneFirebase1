
import React, { useState, useRef, useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';

const AdminLayout: React.FC = () => {
  const location = useLocation();
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);
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
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        setIsSidebarOpen(false);
      }
    };
    if (isSidebarOpen || isNotifOpen) {
        document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isSidebarOpen, isNotifOpen]);

  useEffect(() => {
      setIsSidebarOpen(false);
  }, [location]);

  return (
    <div className="flex bg-neutral-50 relative min-h-screen">
      {/* Sidebar Overlay for Mobile */}
      {isSidebarOpen && <div className="fixed inset-0 bg-black/40 z-[60] md:hidden" onClick={() => setIsSidebarOpen(false)}></div>}

      {/* Sidebar */}
      <aside ref={sidebarRef} className={`fixed top-0 left-0 h-full w-72 bg-white border-r border-neutral-100 flex flex-col shrink-0 transition-transform duration-300 md:sticky md:top-20 md:h-[calc(100vh-5rem)] ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 z-[70]`}>
        <div className="p-8 flex items-center justify-between md:hidden">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-black rounded-xl shadow-lg flex items-center justify-center text-white">
                    <span className="material-symbols-outlined text-2xl">fitness_center</span>
                </div>
                <h1 className="text-lg font-bold font-display uppercase leading-tight">Admin</h1>
            </div>
             <button onClick={() => setIsSidebarOpen(false)} className="text-neutral-400">
               <span className="material-symbols-outlined">close</span>
            </button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto no-scrollbar">
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
            Inbox
          </Link>
          <Link to="/admin/architect" className={`flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all text-sm font-bold group ${isActive('/admin/architect') ? 'bg-neutral-900 text-white shadow-xl' : 'text-neutral-500 hover:bg-neutral-50 hover:text-black'}`}>
            <span className={`material-symbols-outlined ${isActive('/admin/architect') ? 'filled text-accent animate-pulse' : 'text-accent'}`}>auto_awesome</span>
            AI Architect
          </Link>
          
          <div className="pt-4 pb-2 px-6">
            <p className="text-[10px] font-black text-neutral-300 uppercase tracking-widest">Platform</p>
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
            <p className="text-[10px] font-black text-neutral-300 uppercase tracking-widest">Library</p>
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
            Media
          </Link>

          <div className="my-6 border-t border-neutral-100 mx-4"></div>
          <Link to="/admin/settings" className={`flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all text-sm font-bold ${isActive('/admin/settings') ? 'bg-neutral-50 text-black' : 'text-neutral-500 hover:bg-neutral-50 hover:text-black'}`}>
            <span className={`material-symbols-outlined ${isActive('/admin/settings') ? 'filled text-accent' : ''}`}>settings</span>
            Settings
          </Link>
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-20 z-50 bg-white/80 backdrop-blur-md border-b border-neutral-100 h-20 px-4 sm:px-10 flex items-center justify-between shrink-0">
           <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="md:hidden text-neutral-600">
                <span className="material-symbols-outlined">{isSidebarOpen ? 'close' : 'menu'}</span>
            </button>
              <span className="text-xs font-black uppercase tracking-widest text-black">{location.pathname.split('/').pop()?.replace('-',' ') || 'Dashboard'}</span>
           </div>
           
           <div className="flex items-center gap-6">
              <div className="relative" ref={notifRef}>
                <button 
                    onClick={() => setIsNotifOpen(!isNotifOpen)}
                    className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all relative ${isNotifOpen ? 'bg-black text-white' : 'bg-neutral-50 text-neutral-400 hover:text-black'}`}>
                    <span className="material-symbols-outlined text-[20px]">notifications</span>
                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                </button>

                {isNotifOpen && (
                    <div className="absolute top-full right-0 mt-4 w-[calc(100vw-2rem)] sm:w-80 bg-white border border-neutral-100 rounded-2xl shadow-xl overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2">
                        <div className="p-4 border-b border-neutral-50 flex justify-between items-center bg-neutral-50/30">
                            <h3 className="text-xs font-black uppercase tracking-widest text-black">Pulse</h3>
                            <button className="text-[10px] font-black text-accent uppercase hover:underline">Clear</button>
                        </div>
                        <div className="max-h-[300px] overflow-y-auto no-scrollbar py-2">
                            {notifications.map(notif => (
                                <div key={notif.id} className="p-4 hover:bg-neutral-50 transition-colors flex gap-3 text-left">
                                    <div className="w-8 h-8 rounded-lg bg-neutral-900 flex items-center justify-center text-white shrink-0"><span className="material-symbols-outlined text-sm">{notif.icon}</span></div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-[9px] font-black text-neutral-300 uppercase mb-0.5">{notif.title}</p>
                                        <p className="text-xs font-bold text-black leading-tight truncate">{notif.text}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
              </div>
              <div className="w-10 h-10 rounded-full border border-neutral-100 p-0.5 shrink-0">
                <img src="https://picsum.photos/100/100?random=admin" className="w-full h-full rounded-full object-cover" alt="" />
              </div>
           </div>
        </header>

        {/* This div no longer has overflow-y-auto, letting the body handle scrolling */}
        <div className="flex-1">
          <div className="p-4 sm:p-10 max-w-7xl mx-auto">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
