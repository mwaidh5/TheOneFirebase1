import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { User } from '../types';
import { useT } from '../i18n/I18nContext';
import { readActiveSession, ActiveSession } from '../hooks/activeSession';

interface BottomNavProps {
  isLoggedIn: boolean;
  currentUser: User | null;
}

const BottomNav: React.FC<BottomNavProps> = ({ isLoggedIn, currentUser }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useT();
  const [active, setActive] = useState<ActiveSession | null>(() => readActiveSession());

  // Keep the Resume button in sync with the active workout session.
  useEffect(() => {
    const update = () => setActive(readActiveSession());
    update();
    window.addEventListener('storage', update);
    window.addEventListener('theone-session-change', update as EventListener);
    const iv = setInterval(update, 5000); // expire the chip if the 3h window lapses
    return () => {
      window.removeEventListener('storage', update);
      window.removeEventListener('theone-session-change', update as EventListener);
      clearInterval(iv);
    };
  }, [location.pathname]);

  const path = location.pathname;
  const isHome = path === '/';
  const isCourses = path.startsWith('/courses');
  const isMenu = path === '/menu';
  const onWorkout = path.startsWith('/workout');

  const tabBase = 'relative flex flex-col items-center justify-center flex-1 gap-1 transition-colors';

  const resumeWorkout = () => {
    if (!active) return;
    navigate(`/workout/${active.courseId}?week=${active.weekNumber}`);
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-[100] bg-white/90 backdrop-blur-lg border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.04)]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="max-w-xl mx-auto flex items-stretch justify-around px-2 h-16">
        <Link to="/" className={`${tabBase} ${isHome ? 'text-accent' : 'text-gray-400 hover:text-black'}`}>
          <span className={`material-symbols-outlined text-[24px] ${isHome ? 'filled' : ''}`}>home</span>
          <span className="text-[10px] font-bold tracking-wide">{t('nav.home')}</span>
        </Link>

        <Link to="/courses" className={`${tabBase} ${isCourses ? 'text-accent' : 'text-gray-400 hover:text-black'}`}>
          <span className={`material-symbols-outlined text-[24px] ${isCourses ? 'filled' : ''}`}>fitness_center</span>
          <span className="text-[10px] font-bold tracking-wide">{t('nav.courses')}</span>
        </Link>

        {/* Resume training — only when a workout is in progress and we're not already on it */}
        {active && !onWorkout && (
          <button onClick={resumeWorkout} className={`${tabBase} text-accent`}>
            <span className="absolute -top-3 flex items-center justify-center w-12 h-12 rounded-full bg-accent text-white shadow-lg shadow-accent/30 animate-pulse">
              <span className="material-symbols-outlined text-[26px] filled">play_arrow</span>
            </span>
            <span className="text-[10px] font-bold tracking-wide mt-7">{t('nav.resume')}</span>
          </button>
        )}

        <Link to="/menu" className={`${tabBase} ${isMenu ? 'text-accent' : 'text-gray-400 hover:text-black'}`}>
          <span className={`material-symbols-outlined text-[24px] ${isMenu ? 'filled' : ''}`}>settings</span>
          <span className="text-[10px] font-bold tracking-wide">{t('nav.settings')}</span>
        </Link>
      </div>
    </nav>
  );
};

export default BottomNav;
