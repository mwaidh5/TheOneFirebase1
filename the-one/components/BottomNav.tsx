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
  // Center button opens a small sheet so daily nutrition is one tap away too.
  const [showActions, setShowActions] = useState(false);

  useEffect(() => {
    const update = () => setActive(readActiveSession());
    update();
    window.addEventListener('storage', update);
    window.addEventListener('theone-session-change', update as EventListener);
    const iv = setInterval(update, 5000);
    return () => {
      window.removeEventListener('storage', update);
      window.removeEventListener('theone-session-change', update as EventListener);
      clearInterval(iv);
    };
  }, [location.pathname]);

  const path = location.pathname;
  const hasCourses = !!currentUser?.enrolledCourseIds?.length;

  // Where "My Courses" / "Start training" should go: log in → buy a course → train.
  const trainingDestination = () => {
    if (!isLoggedIn) return '/login';
    if (!hasCourses) return '/courses';
    return '/profile/courses';
  };

  const onWorkout = path.startsWith('/workout');
  const startOrResume = () => {
    setShowActions(false);
    if (active && !onWorkout) {
      navigate(`/workout/${active.courseId}?week=${active.weekNumber}`);
    } else {
      navigate(trainingDestination());
    }
  };
  const goNutrition = () => {
    setShowActions(false);
    navigate(isLoggedIn ? '/profile/nutrition' : '/login');
  };

  const tab = (opts: { active: boolean; icon: string; label: string; onClick: () => void }) => (
    <button
      onClick={opts.onClick}
      className={`relative flex flex-col items-center justify-center flex-1 gap-1 transition-colors ${opts.active ? 'text-accent' : 'text-gray-400 hover:text-black'}`}
    >
      <span className={`material-symbols-outlined text-[24px] ${opts.active ? 'filled' : ''}`}>{opts.icon}</span>
      <span className="text-[9px] font-bold tracking-wide">{opts.label}</span>
    </button>
  );

  const isResume = !!active && !onWorkout;

  return (
    <>
    {/* Quick actions — train or log today's nutrition */}
    {showActions && (
      <div className="fixed inset-0 z-[110] flex items-end justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-150" onClick={() => setShowActions(false)}>
        <div
          className="w-full max-w-xl bg-white rounded-t-[2rem] p-5 pb-8 space-y-3 shadow-2xl animate-in slide-in-from-bottom duration-200"
          onClick={(e) => e.stopPropagation()}
          style={{ paddingBottom: 'calc(2rem + env(safe-area-inset-bottom))' }}
        >
          <div className="w-10 h-1 bg-neutral-200 rounded-full mx-auto mb-1" />
          <button
            onClick={startOrResume}
            className={`w-full flex items-center gap-4 p-4 rounded-2xl text-white shadow-lg transition active:scale-[0.98] ${isResume ? 'bg-accent shadow-accent/30' : 'bg-black'}`}
          >
            <span className="material-symbols-outlined text-[26px] filled">{isResume ? 'play_arrow' : 'exercise'}</span>
            <span className="flex-1 text-start text-sm font-black uppercase tracking-widest">{isResume ? t('nav.resume') : t('nav.start')}</span>
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
          <button
            onClick={goNutrition}
            className="w-full flex items-center gap-4 p-4 rounded-2xl bg-green-50 text-green-700 border border-green-100 transition active:scale-[0.98]"
          >
            <span className="material-symbols-outlined text-[26px] filled">restaurant</span>
            <span className="flex-1 text-start text-sm font-black uppercase tracking-widest">{t('nav.nutrition')}</span>
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
        </div>
      </div>
    )}

    <nav
      className="fixed bottom-0 left-0 right-0 z-[100] bg-white/90 backdrop-blur-lg border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="max-w-xl mx-auto flex items-stretch justify-around px-2 h-16">
        {tab({ active: path === '/', icon: 'home', label: t('nav.home'), onClick: () => navigate('/') })}
        {tab({ active: path.startsWith('/courses'), icon: 'fitness_center', label: t('nav.courses'), onClick: () => navigate('/courses') })}

        {/* Center Start / Resume button */}
        <div className="flex-1 flex justify-center">
          <button onClick={() => setShowActions(true)} className="relative flex flex-col items-center" aria-label={isResume ? t('nav.resume') : t('home.app_explore')}>
            <span className={`absolute -top-5 flex items-center justify-center w-14 h-14 rounded-full text-white shadow-lg shadow-accent/30 ${isResume ? 'bg-accent animate-pulse' : 'bg-black'}`}>
              <span className="material-symbols-outlined text-[28px] filled">{isResume ? 'play_arrow' : 'exercise'}</span>
            </span>
            <span className="text-[9px] font-bold tracking-wide mt-9 text-gray-500">{isResume ? t('nav.resume') : t('nav.start')}</span>
          </button>
        </div>

        {tab({ active: path === '/profile', icon: 'person', label: t('nav.profile'), onClick: () => navigate(isLoggedIn ? '/profile' : '/login') })}
        {tab({ active: path === '/menu', icon: 'settings', label: t('nav.settings'), onClick: () => navigate('/menu') })}
      </div>
    </nav>
    </>
  );
};

export default BottomNav;
