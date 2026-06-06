import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, onSnapshot, query, limit, where } from 'firebase/firestore';
import { db } from '../firebase';
import { Course, CustomCourseRequest, User } from '../types';
import LazyImage from '../components/LazyImage';
import { useT } from '../i18n/I18nContext';
import { readActiveSession, ActiveSession } from '../hooks/activeSession';

interface HomepageProps {
  currentUser?: User | null;
  settings: {
    heroImage: string;
    missionImage: string;
    heroHeadline: string;
    heroSubline: string;
  };
}

const Homepage: React.FC<HomepageProps> = ({ currentUser, settings }) => {
  const { t } = useT();
  const navigate = useNavigate();
  const [featuredCourses, setFeaturedCourses] = useState<Course[]>([]);
  const [pendingDiagnostic, setPendingDiagnostic] = useState<CustomCourseRequest | null>(null);
  const [active, setActive] = useState<ActiveSession | null>(() => readActiveSession());

  useEffect(() => {
    const update = () => setActive(readActiveSession());
    window.addEventListener('theone-session-change', update as EventListener);
    window.addEventListener('storage', update);
    return () => {
      window.removeEventListener('theone-session-change', update as EventListener);
      window.removeEventListener('storage', update);
    };
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'courses'), limit(6));
    const unsub = onSnapshot(q, (snapshot) => {
      setFeaturedCourses(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Course)));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!currentUser) { setPendingDiagnostic(null); return; }
    const q = query(
      collection(db, 'custom_requests'),
      where('athleteId', '==', currentUser.id),
      where('status', '==', 'DIAGNOSTIC')
    );
    const unsub = onSnapshot(q, (snapshot) => {
      setPendingDiagnostic(snapshot.empty ? null : ({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as CustomCourseRequest));
    });
    return () => unsub();
  }, [currentUser]);

  const workouts = (currentUser as any)?.workoutsCompleted ?? 0;
  const minutes = (currentUser as any)?.minutesLogged ?? 0;

  const quickActions = [
    { to: '/courses', icon: 'fitness_center', label: t('nav.courses') },
    { to: '/profile/courses', icon: 'school', label: t('nav.my_courses') },
    { to: '/profile/nutrition', icon: 'restaurant', label: t('nav.nutrition') },
    { to: '/profile/messages', icon: 'chat_bubble', label: t('nav.messages') },
  ];

  return (
    <div className="w-full bg-neutral-50 min-h-screen pb-6">
      <div className="max-w-xl mx-auto px-5 pt-6 space-y-7">

        {/* Greeting header */}
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-neutral-400">{t('home.app_welcome')}</p>
            <h1 className="text-2xl font-black font-display uppercase tracking-tight text-black truncate">
              {currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'The One Training'}
            </h1>
          </div>
          {currentUser ? (
            <Link to="/menu"><img src={currentUser.avatar} alt="" className="w-12 h-12 rounded-2xl object-cover border border-neutral-200" /></Link>
          ) : (
            <Link to="/login" className="px-5 py-3 bg-black text-white rounded-2xl text-[11px] font-black uppercase tracking-widest">{t('nav.login')}</Link>
          )}
        </div>

        {/* Diagnostic banner */}
        {pendingDiagnostic && (
          <Link to={`/athlete/diagnostic/${pendingDiagnostic.id}`} className="flex items-center gap-3 p-4 bg-accent text-white rounded-2xl shadow-lg">
            <span className="material-symbols-outlined animate-pulse">priority_high</span>
            <span className="flex-1 text-[11px] font-black uppercase tracking-widest">{t('home.diagnostic_banner', { sport: pendingDiagnostic.sport })}</span>
            <span className="material-symbols-outlined">chevron_right</span>
          </Link>
        )}

        {/* Resume training card */}
        {active && (
          <button
            onClick={() => navigate(`/workout/${active.courseId}?week=${active.weekNumber}`)}
            className="w-full text-left relative overflow-hidden rounded-3xl bg-black text-white p-6 shadow-xl"
          >
            <div className="absolute -bottom-10 -right-8 w-40 h-40 bg-accent/30 rounded-full blur-3xl" />
            <div className="relative z-10 flex items-center gap-4">
              <span className="flex items-center justify-center w-14 h-14 rounded-2xl bg-accent text-white shrink-0 animate-pulse">
                <span className="material-symbols-outlined text-3xl filled">play_arrow</span>
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60">{t('home.app_resume_title')}</p>
                <p className="text-lg font-black uppercase truncate">{active.dayTitle || active.courseTitle}</p>
                <p className="text-[11px] font-bold text-white/50 uppercase tracking-widest mt-0.5">{active.courseTitle} · {t('nav.resume')}</p>
              </div>
              <span className="material-symbols-outlined">chevron_right</span>
            </div>
          </button>
        )}

        {/* Stats (logged in) */}
        {currentUser && (
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-2xl border border-neutral-100 p-5">
              <p className="text-3xl font-black font-display text-black leading-none">{workouts}</p>
              <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mt-2">{t('home.app_workouts')}</p>
            </div>
            <div className="bg-white rounded-2xl border border-neutral-100 p-5">
              <p className="text-3xl font-black font-display text-black leading-none">{minutes}</p>
              <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mt-2">{t('home.app_minutes')}</p>
            </div>
          </div>
        )}

        {/* Quick actions */}
        <div className="space-y-3">
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-neutral-400 ml-1">{t('home.app_quick')}</p>
          <div className="grid grid-cols-4 gap-3">
            {quickActions.map((a) => (
              <Link key={a.to} to={a.to} className="flex flex-col items-center gap-2 bg-white rounded-2xl border border-neutral-100 py-4 hover:border-black transition-all">
                <span className="material-symbols-outlined text-[26px] text-black">{a.icon}</span>
                <span className="text-[9px] font-black uppercase tracking-wider text-neutral-500 text-center px-1 leading-tight">{a.label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Featured tracks */}
        <div className="space-y-3">
          <div className="flex items-center justify-between ml-1">
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-neutral-400">{t('home.app_featured')}</p>
            <Link to="/courses" className="text-[10px] font-black uppercase tracking-widest text-accent">{t('home.browse_all')}</Link>
          </div>

          {featuredCourses.length > 0 ? (
            <div className="flex gap-4 overflow-x-auto pb-2 -mx-5 px-5 snap-x snap-mandatory theone-hide-scrollbar">
              {featuredCourses.map((course) => (
                <Link key={course.id} to={`/courses/${course.id}`} className="snap-start shrink-0 w-64 bg-white rounded-3xl border border-neutral-100 overflow-hidden hover:shadow-xl transition-all">
                  <div className="h-36 relative">
                    <LazyImage src={course.image} alt={course.title} className="w-full h-full object-cover" displayWidth={500} />
                    <span className="absolute top-3 left-3 bg-white/90 backdrop-blur text-black text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest">{course.category}</span>
                  </div>
                  <div className="p-4 space-y-2">
                    <h3 className="text-base font-black font-display uppercase tracking-tight text-black leading-tight line-clamp-2">{course.title}</h3>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px]">schedule</span>{course.duration}
                      </span>
                      <span className="text-lg font-black font-display text-black">${course.price}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center bg-white rounded-3xl border border-neutral-100">
              <p className="text-neutral-300 font-black uppercase tracking-[0.2em] text-xs">{t('home.no_featured')}</p>
            </div>
          )}
        </div>

        {/* Explore CTA for logged-out */}
        {!currentUser && (
          <Link to="/courses" className="flex items-center justify-center gap-2 w-full py-5 bg-black text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl">
            {t('home.app_explore')}
            <span className="material-symbols-outlined">arrow_forward</span>
          </Link>
        )}
      </div>

      <style>{`
        .theone-hide-scrollbar::-webkit-scrollbar { display: none; }
        .theone-hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default Homepage;
