
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { Course, User, UserRole, Coach, CustomCourseRequest } from '../types';
import { COACHES } from '../constants';
import LazyImage from '../components/LazyImage';

interface MyCoursesProps {
  currentUser?: User | null;
  courses?: Course[];
}

const MyCourses: React.FC<MyCoursesProps> = ({ currentUser, courses = [] }) => {
  const navigate = useNavigate();
  const [customRequests, setCustomRequests] = useState<CustomCourseRequest[]>([]);
  const [courseProgress, setCourseProgress] = useState<Record<string, string[]>>({});

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
      const map: Record<string, string[]> = {};
      snap.docs.forEach(d => { map[d.id] = (d.data().completedDays as string[]) || []; });
      setCourseProgress(map);
    });
    return () => unsub();
  }, [currentUser]);

  // Filter courses based on user's enrollment
  const ownedCourses = courses.filter(course => 
    currentUser?.enrolledCourseIds?.includes(course.id)
  );

  const handleMessageCoach = (instructorName: string) => {
    const coach = COACHES.find(c => c.name.includes(instructorName.split(' ')[0]));
    if (coach) {
      navigate(`/profile/messages?coachId=${coach.id}`);
    }
  };

  const pendingRequests = customRequests.filter(r => r.status === 'DIAGNOSTIC' || r.status === 'BUILDING');
  const actionRequired = customRequests.some(r => r.status === 'DIAGNOSTIC');

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 text-left animate-in fade-in duration-500 min-h-[80vh]">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
        <div className="space-y-2">
          <span className="text-[10px] font-black text-accent uppercase tracking-[0.3em]">Athlete Headquarters</span>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-black font-display uppercase">My Enrolled Tracks</h1>
          <p className="text-neutral-400 font-medium max-w-xl">Continue your progression across your personalized training and educational cycles.</p>
        </div>
        <Link to="/courses" className="w-fit px-8 py-4 bg-neutral-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl flex items-center gap-2">
          <span className="material-symbols-outlined text-lg">explore</span>
          Browse All Programs
        </Link>
      </div>

      {/* Action Required Banner for MyCourses */}
      {actionRequired && (
        <div className="mb-12 bg-red-50 border border-red-100 p-8 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-6 animate-in slide-in-from-top-4 duration-500">
           <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-red-500 text-white rounded-2xl flex items-center justify-center shrink-0">
                 <span className="material-symbols-outlined text-3xl animate-pulse">priority_high</span>
              </div>
              <div className="space-y-1 text-left">
                 <h3 className="text-lg font-black text-black uppercase tracking-tight">Diagnostic Intake Required</h3>
                 <p className="text-xs text-neutral-500 font-medium leading-relaxed">Please complete the required questions so our coaches can start building your program.</p>
              </div>
           </div>
           <Link to="/profile/courses" className="whitespace-nowrap px-8 py-4 bg-red-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 transition-all shadow-lg">
              View Requests
           </Link>
        </div>
      )}

      {/* Pending Custom Requests Section */}
      {pendingRequests.length > 0 && (
          <div className="mb-16">
              <h2 className="text-2xl font-black text-black uppercase tracking-tight mb-8">Pending Customizations</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
                  {pendingRequests.map(req => (
                      <div key={req.id} className="bg-neutral-50 rounded-[2.5rem] overflow-hidden border border-neutral-100 p-8 flex flex-col justify-between h-full relative group shadow-sm hover:shadow-xl transition-all">
                          <div className="space-y-4">
                              <div className="flex justify-between items-start">
                                  <span className="bg-purple-600 text-white text-[8px] font-black px-3 py-1.5 rounded-lg uppercase tracking-widest shadow-sm">Bespoke</span>
                                  {req.status === 'DIAGNOSTIC' ? (
                                      <span className="text-red-500 text-[10px] font-black uppercase tracking-widest animate-pulse flex items-center gap-1">
                                          <span className="material-symbols-outlined text-xs">warning</span> Action Required
                                      </span>
                                  ) : (
                                      <span className="text-orange-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                                          <span className="material-symbols-outlined text-xs">construction</span> In Production
                                      </span>
                                  )}
                              </div>
                              <div className="text-left">
                                  <h3 className="text-xl font-black text-black uppercase tracking-tight">{req.goal}</h3>
                                  <p className="text-xs text-neutral-400 font-medium mt-1">Sport: {req.sport.toUpperCase()}</p>
                              </div>
                          </div>
                          
                          <div className="mt-8 pt-6 border-t border-neutral-200/50">
                              {req.status === 'DIAGNOSTIC' ? (
                                  <Link to={`/athlete/diagnostic/${req.id}`} className="w-full bg-black text-white py-4 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-accent transition-all text-center shadow-lg block">
                                      Resume Intake
                                  </Link>
                              ) : (
                                  <div className="w-full bg-neutral-200 text-neutral-500 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest text-center flex items-center justify-center gap-2">
                                      <span className="material-symbols-outlined text-sm animate-spin">autorenew</span>
                                      Coach Building...
                                  </div>
                              )}
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      )}

      {ownedCourses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
          {ownedCourses.map(course => {
            const totalDays = (course.weeks || []).reduce((sum: number, w: { days: unknown[] }) => sum + w.days.length, 0);
            const completedDays = (courseProgress[course.id] || []).length;
            const pct = totalDays > 0 ? Math.min(Math.round((completedDays / totalDays) * 100), 100) : 0;
            return (
            <div key={course.id} className="bg-white rounded-[2.5rem] overflow-hidden border border-neutral-100 shadow-sm group hover:shadow-2xl transition-all duration-500 flex flex-col relative">
              <div className="relative h-56 md:h-64 overflow-hidden shrink-0">
                <LazyImage src={course.image} alt={course.title} className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-1000" displayWidth={600} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                <div className="absolute top-4 left-4 md:top-6 md:left-6 flex gap-2">
                  <span className="bg-white/90 backdrop-blur-md text-black text-[8px] font-black px-3 py-1.5 rounded-lg uppercase tracking-widest shadow-sm">{course.category}</span>
                  <span className="bg-green-500 text-white text-[8px] font-black px-3 py-1.5 rounded-lg uppercase tracking-widest shadow-lg">Enrolled</span>
                </div>
                <div className="absolute bottom-4 left-4 md:bottom-6 md:left-6 flex items-center gap-3">
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-white overflow-hidden shadow-lg shrink-0">
                    <img src={COACHES.find(c => c.name.includes(course.instructor.split(' ')[0]))?.avatar || 'https://picsum.photos/100'} alt="Coach" className="w-full h-full object-cover" />
                  </div>
                  <span className="text-[9px] md:text-[10px] font-black text-white uppercase tracking-widest truncate">Lead: {course.instructor}</span>
                </div>
              </div>

              <div className="p-6 md:p-8 lg:p-10 space-y-6 md:space-y-8 flex-grow flex flex-col">
                <div className="space-y-4 text-left">
                  <h3 className="text-xl md:text-2xl font-black text-black uppercase tracking-tight font-display leading-tight line-clamp-2">{course.title}</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-end">
                      <span className="text-[9px] font-black text-neutral-300 uppercase tracking-widest">{completedDays}/{totalDays} days done</span>
                      <span className="text-xs md:text-sm font-black text-black">{pct}%</span>
                    </div>
                    <div className="w-full bg-neutral-50 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-black h-full rounded-full transition-all duration-1000" style={{ width: `${pct}%` }}></div>
                    </div>
                  </div>
                </div>

                <div className="mt-auto pt-4 md:pt-6 flex gap-3">
                   <Link to={`/workout/${course.id}`} className="flex-1 bg-black text-white py-3.5 md:py-4 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-neutral-800 transition-all text-center shadow-lg">
                      Resume Training
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
      ) : pendingRequests.length === 0 && (
        <div className="py-24 md:py-32 flex flex-col items-center justify-center text-center space-y-6">
          <div className="w-20 h-20 bg-neutral-50 rounded-[2rem] flex items-center justify-center text-neutral-200">
            <span className="material-symbols-outlined text-4xl">school</span>
          </div>
          <div className="space-y-2">
            <h2 className="text-xl md:text-2xl font-black uppercase text-neutral-400 tracking-tight">No active enrollments</h2>
            <p className="text-neutral-400 font-medium max-w-sm px-6">Browse our training tracks to start your path to elite performance.</p>
          </div>
          <Link to="/courses" className="px-10 py-4 bg-black text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl hover:bg-neutral-800 transition-all">
            Explore Programs
          </Link>
        </div>
      )}
    </div>
  );
};

export default MyCourses;
