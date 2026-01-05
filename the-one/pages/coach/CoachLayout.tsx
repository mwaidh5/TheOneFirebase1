
import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { MOCK_COACH_USER, COACHES } from '../../constants';

const CoachLayout: React.FC = () => {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  // Simulate permission check for current coach (Coach Mercer has rights)
  const isAuthorized = COACHES.find(c => c.id === MOCK_COACH_USER.id)?.isBespokeAuthorized;

  return (
    <div className="flex flex-1 bg-neutral-50 overflow-hidden min-h-[calc(100vh-80px)]">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-neutral-100 flex flex-col shrink-0">
        <div className="p-8 flex items-center gap-3">
          <div className="w-10 h-10 bg-black rounded-xl shadow-lg flex items-center justify-center text-white">
            <span className="material-symbols-outlined text-2xl">fitness_center</span>
          </div>
          <div>
            <h1 className="text-black text-lg font-bold font-display leading-tight">Coach Hub</h1>
            <p className="text-neutral-400 text-[10px] font-bold uppercase tracking-widest">Training Console</p>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-2 overflow-y-auto no-scrollbar pb-10">
          <Link to="/coach" className={`flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all text-sm font-bold ${isActive('/coach') ? 'bg-neutral-50 text-black' : 'text-neutral-500 hover:bg-neutral-50 hover:text-black'}`}>
            <span className={`material-symbols-outlined ${isActive('/coach') ? 'filled text-accent' : ''}`}>dashboard</span>
            Overview
          </Link>
          <Link to="/coach/messages" className={`flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all text-sm font-bold ${isActive('/coach/messages') ? 'bg-neutral-50 text-black' : 'text-neutral-500 hover:bg-neutral-50 hover:text-black'}`}>
            <span className={`material-symbols-outlined ${isActive('/coach/messages') ? 'filled text-accent' : ''}`}>chat_bubble</span>
            Messages
          </Link>
          <Link to="/coach/athletes" className={`flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all text-sm font-bold ${isActive('/coach/athletes') ? 'bg-neutral-50 text-black' : 'text-neutral-500 hover:bg-neutral-50 hover:text-black'}`}>
            <span className={`material-symbols-outlined ${isActive('/coach/athletes') ? 'filled text-accent' : ''}`}>groups</span>
            My Athletes
          </Link>

          {isAuthorized && (
             <div className="pt-4 space-y-2">
               <p className="px-6 text-[10px] font-black text-accent uppercase tracking-widest mb-4">Custom Workouts</p>
               <Link to="/coach/custom-cycles" className={`flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all text-sm font-bold ${isActive('/coach/custom-cycles') ? 'bg-neutral-900 text-white shadow-xl' : 'text-neutral-500 hover:bg-neutral-50 hover:text-black'}`}>
                 <span className={`material-symbols-outlined ${isActive('/coach/custom-cycles') ? 'filled text-accent' : 'text-accent'}`}>architecture</span>
                 Client Orders
               </Link>
               <Link to="/coach/global-questions" className={`flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all text-sm font-bold ${isActive('/coach/global-questions') ? 'bg-neutral-50 text-black' : 'text-neutral-500 hover:bg-neutral-50 hover:text-black'}`}>
                 <span className={`material-symbols-outlined ${isActive('/coach/global-questions') ? 'filled text-accent' : ''}`}>quiz</span>
                 Test Questions
               </Link>
             </div>
          )}
          
          <div className="my-6 border-t border-neutral-100 mx-4"></div>

          <Link to="/coach/courses" className={`flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all text-sm font-bold ${isActive('/coach/courses') || isActive('/coach/courses/new') ? 'bg-neutral-50 text-black' : 'text-neutral-500 hover:bg-neutral-50 hover:text-black'}`}>
            <span className={`material-symbols-outlined ${isActive('/coach/courses') || isActive('/coach/courses/new') ? 'filled text-accent' : ''}`}>school</span>
            Normal Courses
          </Link>

          <div className="pt-4 pb-2 px-6">
            <p className="text-[10px] font-black text-neutral-300 uppercase tracking-widest">Library</p>
          </div>
          <Link to="/coach/exercise-library" className={`flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all text-sm font-bold ${isActive('/coach/exercise-library') ? 'bg-neutral-50 text-black' : 'text-neutral-500 hover:bg-neutral-50 hover:text-black'}`}>
            <span className={`material-symbols-outlined ${isActive('/coach/exercise-library') ? 'filled text-accent' : ''}`}>menu_book</span>
            Exercises
          </Link>
          <Link to="/coach/workout-library" className={`flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all text-sm font-bold ${isActive('/coach/workout-library') ? 'bg-neutral-50 text-black' : 'text-neutral-500 hover:bg-neutral-50 hover:text-black'}`}>
            <span className={`material-symbols-outlined ${isActive('/coach/workout-library') ? 'filled text-accent' : ''}`}>library_books</span>
            Workouts
          </Link>
          <Link to="/coach/media" className={`flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all text-sm font-bold ${isActive('/coach/media') ? 'bg-neutral-50 text-black' : 'text-neutral-500 hover:bg-neutral-50 hover:text-black'}`}>
            <span className={`material-symbols-outlined ${isActive('/coach/media') ? 'filled text-accent' : ''}`}>perm_media</span>
            Media Gallery
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

export default CoachLayout;
