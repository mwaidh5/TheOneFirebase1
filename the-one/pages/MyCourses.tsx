
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { Course, User, UserRole, Coach, CustomCourseRequest } from '../types';
import { COACHES } from '../constants';
import LazyImage from '../components/LazyImage';
import { useT } from '../i18n/I18nContext';

interface MyCoursesProps {
  currentUser?: User | null;
  courses?: Course[];
}

const MyCourses: React.FC<MyCoursesProps> = ({ currentUser, courses = [] }) => {
  const navigate = useNavigate();
  const { t } = useT();
  const [customRequests, setCustomRequests] = useState<CustomCourseRequest[]>([]);
  const [courseProgress, setCourseProgress] = useState<Record<string, { days: string[]; weeks: string[]; exercises: string[] }>>({});

  useEffect(() => {
    if (!currentUser) {
      setCustomRequests([]);
      return;
    }

    const q = query(collection(db, 'custom_requests'), where('athleteId', '==', currentUser.id));

    const unsub = onSnapshot(q, (snapshot) => {
      setCustomRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CustomCourseRequest)));
    });

    return () => unsub();
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser?.id) return;
    const progressRef = collection(db, 'users', currentUser.id, 'progress');
    const unsub = onSnapshot(progressRef, (snap) => {
      const map: Record<string, { days: string[]; weeks: string[]; exercises: string[] }> = {};
      snap.docs.forEach(d => {
        const data = d.data();
        map[d.id] = {
          days: (data.completedDays as string[]) || [],
          weeks: (data.completedWeeks as string[]) || [],
          exercises: (data.completedExercises as string[]) || [],
        };
      });
      setCourseProgress(map);
    });
    return () => unsub();
  }, [currentUser]);

  // Filter courses based on user's enrollment
  const ownedCourses = courses.filter(course =>
    currentUser?.enrolledCourseIds?.includes(course.id)
  );

  // Per-course progress. A day counts as done when the day itself was marked
  // finished, OR its whole week was marked, OR every exercise in it is ticked —
  // the last rule fixes courses stuck below 100% when day-finish events were
  // missed but all the work was actually completed.
  const courseStats = (course: Course) => {
    const progress = courseProgress[course.id] || { days: [], weeks: [], exercises: [] };
    const dayIds = new Set(progress.days);
    const weekIds = new Set(progress.weeks);
    const exIds = new Set(progress.exercises);
    const weeks = course.weeks || [];
    const isDayDone = (w: { id: string }, d: { id: string; exercises: { id: string }[] }) =>
      weekIds.has(w.id) || dayIds.has(d.id) || (d.exercises.length > 0 && d.exercises.every(ex => exIds.has(ex.id)));

    let totalDays = 0, completedDays = 0;
    let nextSession: { weekNumber: number; dayId: string; dayNumber: number; dayTitle: string } | null = null;
    weeks.forEach(w => {
      w.days.forEach(d => {
        totalDays++;
        if (isDayDone(w, d)) completedDays++;
        else if (!nextSession) nextSession = { weekNumber: w.weekNumber, dayId: d.id, dayNumber: d.dayNumber, dayTitle: d.title };
      });
    });
    const pct = totalDays > 0 ? Math.min(Math.round((completedDays / totalDays) * 100), 100) : 0;
    const finished = totalDays > 0 && completedDays >= totalDays;
    return { totalDays, completedDays, pct, finished, nextSession };
  };

  const activeCourses = ownedCourses.filter(c => !courseStats(c).finished);
  const finishedCourses = ownedCourses.filter(c => courseStats(c).finished);

  // The "next session" hero — from the most-progressed active course.
  const heroCourse = [...activeCourses].sort((a, b) => courseStats(b).pct - courseStats(a).pct)[0] || null;
  const heroNext = heroCourse ? courseStats(heroCourse).nextSession : null;

  const handleMessageCoach = (instructorName: string) => {
    const coach = COACHES.find(c => c.name.includes(instructorName.split(' ')[0]));
    if (coach) {
      navigate(`/profile/messages?coachId=${coach.id}`);
    }
  };

  const pendingRequests = customRequests.filter(r => r.status === 'DIAGNOSTIC' || r.status === 'BUILDING');
  const actionRequired = customRequests.some(r => r.status === 'DIAGNOSTIC');

  return (
    <div className="w-full max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12 text-start animate-in fade-in duration-500 min-h-[80vh] overflow-x-clip">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
        <div className="space-y-2">
          <span className="text-[10px] font-black text-accent uppercase tracking-[0.3em]">{t('mycourses.header_label')}</span>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-black font-display uppercase">{t('mycourses.title')}</h1>
          <p className="text-neutral-400 font-medium max-w-xl">{t('mycourses.subtitle')}</p>
        </div>
        <Link to="/courses" className="w-fit px-8 py-4 bg-neutral-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl flex items-center gap-2">
          <span className="material-symbols-outlined text-lg">explore</span>
          {t('mycourses.browse_all')}
        </Link>
      </div>

      {/* Next session — continue straight into the upcoming workout */}
      {heroCourse && heroNext && (
        <div className="mb-12 relative overflow-hidden rounded-[2rem] bg-gradient-to-r from-neutral-900 to-black text-white p-6 md:p-8 shadow-2xl">
          <div className="absolute -top-10 -right-10 w-48 h-48 bg-accent/20 rounded-full blur-3xl" />
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center gap-5">
            <span className="flex items-center justify-center w-14 h-14 rounded-2xl bg-accent text-white shrink-0 shadow-lg shadow-accent/30">
              <span className="material-symbols-outlined text-3xl filled">event_upcoming</span>
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-white/50">{t('mycourses.next_session')}</p>
              <p className="text-xl md:text-2xl font-black uppercase tracking-tight truncate mt-0.5">{heroNext.dayTitle || `Day ${heroNext.dayNumber}`}</p>
              <p className="text-[11px] font-bold text-white/50 uppercase tracking-widest mt-1 truncate">
                {heroCourse.title} · {t('mycourses.week_day', { week: heroNext.weekNumber, day: heroNext.dayNumber })}
              </p>
            </div>
            <Link
              to={`/workout/${heroCourse.id}?week=${heroNext.weekNumber}&day=${heroNext.dayId}`}
              className="shrink-0 px-8 py-4 bg-accent text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-blue-500 transition-all shadow-lg shadow-accent/30 flex items-center justify-center gap-2"
            >
              {t('mycourses.continue')}
              <span className="material-symbols-outlined text-lg">arrow_forward</span>
            </Link>
          </div>
        </div>
      )}

      {/* Action Required Banner for MyCourses */}
      {actionRequired && (
        <div className="mb-12 bg-red-50 border border-red-100 p-8 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-6 animate-in slide-in-from-top-4 duration-500">
           <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-red-500 text-white rounded-2xl flex items-center justify-center shrink-0">
                 <span className="material-symbols-outlined text-3xl animate-pulse">priority_high</span>
              </div>
              <div className="space-y-1 text-start">
                 <h3 className="text-lg font-black text-black uppercase tracking-tight">{t('mycourses.diag_required_title')}</h3>
                 <p className="text-xs text-neutral-500 font-medium leading-relaxed">{t('mycourses.diag_required_sub')}</p>
              </div>
           </div>
           <Link to="/profile/courses" className="whitespace-nowrap px-8 py-4 bg-red-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 transition-all shadow-lg">
              {t('mycourses.view_requests')}
           </Link>
        </div>
      )}

      {/* Pending Custom Requests Section */}
      {pendingRequests.length > 0 && (
          <div className="mb-16">
              <h2 className="text-2xl font-black text-black uppercase tracking-tight mb-8">{t('mycourses.pending_custom')}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
                  {pendingRequests.map(req => (
                      <div key={req.id} className="bg-neutral-50 rounded-[2.5rem] overflow-hidden border border-neutral-100 p-8 flex flex-col justify-between h-full relative group shadow-sm hover:shadow-xl transition-all">
                          <div className="space-y-4">
                              <div className="flex justify-between items-start">
                                  <span className="bg-purple-600 text-white text-[8px] font-black px-3 py-1.5 rounded-lg uppercase tracking-widest shadow-sm">{t('mycourses.bespoke')}</span>
                                  {req.status === 'DIAGNOSTIC' ? (
                                      <span className="text-red-500 text-[10px] font-black uppercase tracking-widest animate-pulse flex items-center gap-1">
                                          <span className="material-symbols-outlined text-xs">warning</span> {t('mycourses.action_required')}
                                      </span>
                                  ) : (
                                      <span className="text-orange-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                                          <span className="material-symbols-outlined text-xs">construction</span> {t('mycourses.in_production')}
                                      </span>
                                  )}
                              </div>
                              <div className="text-start">
                                  <h3 className="text-xl font-black text-black uppercase tracking-tight">{req.goal}</h3>
                                  <p className="text-xs text-neutral-400 font-medium mt-1">{t('mycourses.sport')} {req.sport.toUpperCase()}</p>
                              </div>
                          </div>

                          <div className="mt-8 pt-6 border-t border-neutral-200/50">
                              {req.status === 'DIAGNOSTIC' ? (
                                  <Link to={`/athlete/diagnostic/${req.id}`} className="w-full bg-black text-white py-4 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-accent transition-all text-center shadow-lg block">
                                      {t('mycourses.resume_intake')}
                                  </Link>
                              ) : (
                                  <div className="w-full bg-neutral-200 text-neutral-500 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest text-center flex items-center justify-center gap-2">
                                      <span className="material-symbols-outlined text-sm animate-spin">autorenew</span>
                                      {t('mycourses.coach_building')}
                                  </div>
                              )}
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      )}

      {activeCourses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
          {activeCourses.map(course => {
            const { totalDays, completedDays, pct, nextSession } = courseStats(course);
            return (
            <div key={course.id} className="bg-white rounded-[2.5rem] overflow-hidden border border-neutral-100 shadow-sm group hover:shadow-2xl transition-all duration-500 flex flex-col relative">
              <div className="relative h-56 md:h-64 overflow-hidden shrink-0">
                <LazyImage src={course.image} alt={course.title} className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-1000" displayWidth={600} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                <div className="absolute top-4 left-4 md:top-6 md:left-6 flex gap-2">
                  <span className="bg-white/90 backdrop-blur-md text-black text-[8px] font-black px-3 py-1.5 rounded-lg uppercase tracking-widest shadow-sm">{course.category}</span>
                  <span className="bg-green-500 text-white text-[8px] font-black px-3 py-1.5 rounded-lg uppercase tracking-widest shadow-lg">{t('courses.enrolled')}</span>
                </div>
                <div className="absolute bottom-4 left-4 md:bottom-6 md:left-6 flex items-center gap-3">
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-white overflow-hidden shadow-lg shrink-0">
                    <img src={COACHES.find(c => c.name.includes(course.instructor.split(' ')[0]))?.avatar || 'https://picsum.photos/100'} alt="Coach" className="w-full h-full object-cover" />
                  </div>
                  <span className="text-[9px] md:text-[10px] font-black text-white uppercase tracking-widest truncate">{t('mycourses.lead')} {course.instructor}</span>
                </div>
              </div>

              <div className="p-6 md:p-8 lg:p-10 space-y-6 md:space-y-8 flex-grow flex flex-col">
                <div className="space-y-4 text-start">
                  <h3 className="text-xl md:text-2xl font-black text-black uppercase tracking-tight font-display leading-tight line-clamp-2">{course.title}</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-end">
                      <span className="text-[9px] font-black text-neutral-300 uppercase tracking-widest">{t('mycourses.days_done', { done: completedDays, total: totalDays })}</span>
                      <span className="text-xs md:text-sm font-black text-black">{pct}%</span>
                    </div>
                    <div className="w-full bg-neutral-50 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-black h-full rounded-full transition-all duration-1000" style={{ width: `${pct}%` }}></div>
                    </div>
                  </div>
                </div>

                <div className="mt-auto pt-4 md:pt-6 flex gap-3">
                   <Link
                     to={nextSession ? `/workout/${course.id}?week=${nextSession.weekNumber}&day=${nextSession.dayId}` : `/workout/${course.id}`}
                     className="flex-1 bg-black text-white py-3.5 md:py-4 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-neutral-800 transition-all text-center shadow-lg"
                   >
                      {t('mycourses.resume')}
                   </Link>
                   <button 
                     onClick={() => handleMessageCoach(course.instructor)}
                     className="px-4 py-3.5 md:py-4 bg-neutral-50 text-neutral-400 rounded-xl hover:bg-accent hover:text-white transition-all border border-neutral-100 flex items-center justify-center group"
                   >
                     <span className="material-symbols-outlined text-[18px] filled">chat</span>
                   </button>
                </div>
              </div>
            </div>
          );
          })}
        </div>
      ) : (finishedCourses.length === 0 && pendingRequests.length === 0) && (
        <div className="py-24 md:py-32 flex flex-col items-center justify-center text-center space-y-6">
          <div className="w-20 h-20 bg-neutral-50 rounded-[2rem] flex items-center justify-center text-neutral-200">
            <span className="material-symbols-outlined text-4xl">school</span>
          </div>
          <div className="space-y-2">
            <h2 className="text-xl md:text-2xl font-black uppercase text-neutral-400 tracking-tight">{t('mycourses.no_enrollments')}</h2>
            <p className="text-neutral-400 font-medium max-w-sm px-6">{t('mycourses.empty_explain')}</p>
          </div>
          <Link to="/courses" className="px-10 py-4 bg-black text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl hover:bg-neutral-800 transition-all">
            {t('mycourses.empty_cta')}
          </Link>
        </div>
      )}

      {/* Finished training — completed courses live here, out of the active list */}
      {finishedCourses.length > 0 && (
        <div className="mt-16">
          <div className="flex items-center gap-3 mb-8">
            <span className="material-symbols-outlined text-green-500 filled">verified</span>
            <h2 className="text-2xl font-black text-black uppercase tracking-tight">{t('mycourses.finished_section')}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {finishedCourses.map(course => {
              const { totalDays } = courseStats(course);
              return (
                <Link key={course.id} to={`/workout/${course.id}`} className="group bg-white rounded-3xl overflow-hidden border border-neutral-100 shadow-sm hover:shadow-xl transition-all flex items-center gap-4 p-4">
                  <div className="w-20 h-20 rounded-2xl overflow-hidden shrink-0 relative">
                    <LazyImage src={course.image} alt={course.title} className="w-full h-full object-cover" displayWidth={160} />
                    <div className="absolute inset-0 bg-green-600/30" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 text-[8px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest">
                      <span className="material-symbols-outlined text-[12px] filled">check_circle</span>
                      {t('mycourses.completed')} · 100%
                    </span>
                    <h3 className="text-base font-black text-black uppercase tracking-tight leading-tight truncate mt-1.5">{course.title}</h3>
                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mt-0.5">{t('mycourses.days_done', { done: totalDays, total: totalDays })}</p>
                  </div>
                  <span className="material-symbols-outlined text-neutral-300 group-hover:text-black transition-colors shrink-0">chevron_right</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default MyCourses;
