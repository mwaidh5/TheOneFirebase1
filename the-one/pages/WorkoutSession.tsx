
import React, { useState, useMemo, useEffect } from 'react';
import { Link, useParams, useLocation, useNavigate } from 'react-router-dom';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Course, Exercise, WeekProgram, DayProgram, User } from '../types';

interface WorkoutSessionProps {
  courses?: Course[];
  currentUser: User;
}

const WorkoutSession: React.FC<WorkoutSessionProps> = ({ courses = [], currentUser }) => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  const course = useMemo(() => courses.find(c => c.id === id), [id, courses]);
  
  // Navigation State
  const [view, setView] = useState<'weeks' | 'days' | 'exercises' | 'meal'>('weeks');
  const [selectedWeek, setSelectedWeek] = useState<WeekProgram | null>(null);
  const [selectedDay, setSelectedDay] = useState<DayProgram | null>(null);

  // UI States
  const [expandedMediaId, setExpandedMediaId] = useState<string | null>(null);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Tracking State
  const [completedExercises, setCompletedExercises] = useState<Set<string>>(new Set());
  const [completedDays, setCompletedDays] = useState<Set<string>>(new Set());
  const [completedWeeks, setCompletedWeeks] = useState<Set<string>>(new Set());
  
  // Log Data State
  const [logData, setLogData] = useState<{
    results: Record<string, string>;
    notes: string;
    rpe: number;
  }>({
    results: {},
    notes: '',
    rpe: 7
  });

  // Load Progress
  useEffect(() => {
      if (!currentUser || !course) return;
      const progressRef = doc(db, 'users', currentUser.id, 'progress', course.id);
      
      const unsub = onSnapshot(progressRef, (docSnap) => {
          if (docSnap.exists()) {
              const data = docSnap.data();
              if (data.completedExercises) setCompletedExercises(new Set(data.completedExercises));
              if (data.completedDays) setCompletedDays(new Set(data.completedDays));
              if (data.completedWeeks) setCompletedWeeks(new Set(data.completedWeeks));
          }
      });
      return () => unsub();
  }, [currentUser, course]);

  const saveProgress = async (type: 'exercises' | 'days' | 'weeks', newSet: Set<string>) => {
      if (!currentUser || !course) return;
      const progressRef = doc(db, 'users', currentUser.id, 'progress', course.id);
      
      const updateData: any = {};
      if (type === 'exercises') updateData.completedExercises = Array.from(newSet);
      if (type === 'days') updateData.completedDays = Array.from(newSet);
      if (type === 'weeks') updateData.completedWeeks = Array.from(newSet);
      
      try {
          await setDoc(progressRef, updateData, { merge: true });
      } catch (e) {
          console.error("Error saving progress", e);
      }
  };

  // Handle direct navigation from Curriculum links
  useEffect(() => {
    if (!course) return;

    const params = new URLSearchParams(location.search);
    const weekNum = params.get('week');
    if (weekNum && course.weeks) {
      const week = course.weeks.find(w => w.weekNumber === parseInt(weekNum));
      if (week) {
        setSelectedWeek(week);
        setView('days');
      }
    }
  }, [location.search, course]);

  if (!course) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-neutral-50">
            <div className="text-center space-y-4">
                <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="font-bold text-neutral-400 uppercase tracking-widest text-xs">Loading Course Data...</p>
                <Link to="/profile/courses" className="text-xs font-black uppercase underline">Return to Dashboard</Link>
            </div>
        </div>
      );
  }

  const toggleExercise = (exId: string) => {
    const next = new Set(completedExercises);
    if (next.has(exId)) next.delete(exId);
    else next.add(exId);
    setCompletedExercises(next);
    saveProgress('exercises', next);
  };

  const toggleDayFinished = (dayId: string) => {
    const next = new Set(completedDays);
    if (next.has(dayId)) next.delete(dayId);
    else next.add(dayId);
    setCompletedDays(next);
    saveProgress('days', next);
  };

  const toggleWeekFinished = (weekId: string) => {
    const next = new Set(completedWeeks);
    if (next.has(weekId)) next.delete(weekId);
    else next.add(weekId);
    setCompletedWeeks(next);
    saveProgress('weeks', next);
  };

  const toggleMedia = (exId: string) => {
    setExpandedMediaId(expandedMediaId === exId ? null : exId);
  };

  const handleLogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Save log logic (could be another collection 'workout_logs')
    // For now, just mark day as complete
    if (selectedDay) {
        const nextEx = new Set(completedExercises);
        selectedDay.exercises.forEach(ex => nextEx.add(ex.id));
        setCompletedExercises(nextEx);
        saveProgress('exercises', nextEx);
        
        const nextDay = new Set(completedDays);
        nextDay.add(selectedDay.id);
        setCompletedDays(nextDay);
        saveProgress('days', nextDay);
    }
    
    setIsSubmitting(false);
    setIsLogModalOpen(false);
    alert(`Workout Log committed.`);
  };

  // Helper logic for automatic completion detection
  const isDayNaturallyDone = (day: DayProgram) => {
    return day.exercises.length > 0 && day.exercises.every(ex => completedExercises.has(ex.id));
  };

  const isDayMarkedDone = (day: DayProgram) => {
    return completedDays.has(day.id) || isDayNaturallyDone(day);
  };

  const isWeekNaturallyDone = (week: WeekProgram) => {
    return week.days.every(day => isDayMarkedDone(day));
  };

  return (
    <div className="bg-white min-h-screen text-left animate-in fade-in duration-500">
      {/* Header */}
      <div className="bg-neutral-50/50 border-b border-neutral-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
            <div className="space-y-4 max-w-2xl">
              <nav className="flex items-center gap-2 text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em]">
                <Link to="/profile/courses" className="hover:text-black transition-colors">Courses</Link>
                <span className="material-symbols-outlined text-sm">chevron_right</span>
                <button onClick={() => setView('weeks')} className="hover:text-black transition-colors truncate">{course.title}</button>
                {view !== 'weeks' && view !== 'meal' && selectedWeek && (
                   <>
                     <span className="material-symbols-outlined text-sm">chevron_right</span>
                     <button onClick={() => setView('days')} className="hover:text-black transition-colors">Wk {selectedWeek.weekNumber}</button>
                   </>
                )}
                {view === 'exercises' && selectedDay && (
                   <>
                     <span className="material-symbols-outlined text-sm">chevron_right</span>
                     <span className="text-black truncate">{selectedDay.title}</span>
                   </>
                )}
                {view === 'meal' && (
                    <>
                     <span className="material-symbols-outlined text-sm">chevron_right</span>
                     <span className="text-black">Nutrition</span>
                    </>
                )}
              </nav>
              <div className="flex items-center gap-4">
                <h1 className="text-3xl md:text-5xl font-black font-display tracking-tight text-black uppercase leading-tight">
                  {view === 'weeks' ? 'Training Hub' : view === 'meal' ? 'Nutrition Plan' : view === 'days' ? `Week ${selectedWeek?.weekNumber} Overview` : selectedDay?.title}
                </h1>
                {view === 'exercises' && selectedDay && isDayMarkedDone(selectedDay) && (
                  <span className="bg-green-500 text-white px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest shadow-lg flex items-center gap-1 shrink-0 h-fit">
                    <span className="material-symbols-outlined text-xs filled">check</span> Done
                  </span>
                )}
              </div>
              <p className="text-neutral-500 text-base md:text-lg leading-relaxed font-medium">
                {view === 'weeks' ? "Select a phase to continue your progression." : view === 'meal' ? "Fuel your performance." : "Track your intensity and log every successful set."}
              </p>
            </div>
            {course.hasMealPlan && view === 'weeks' && (
                <button 
                    onClick={() => setView('meal')}
                    className="px-6 py-4 bg-white border border-neutral-200 rounded-2xl flex items-center gap-3 hover:border-black transition-all shadow-sm group"
                >
                    <div className="w-10 h-10 bg-neutral-900 rounded-xl flex items-center justify-center text-white group-hover:bg-accent transition-colors">
                        <span className="material-symbols-outlined">restaurant</span>
                    </div>
                    <div className="text-left">
                        <p className="text-[9px] font-black uppercase tracking-widest text-neutral-400">Nutrition</p>
                        <p className="text-sm font-black text-black uppercase">View Meal Plan</p>
                    </div>
                </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* WEEKS VIEW */}
        {view === 'weeks' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(course.weeks || []).map((week) => {
              const isFinished = completedWeeks.has(week.id) || isWeekNaturallyDone(week);
              return (
                <div 
                  key={week.id}
                  onClick={() => { setSelectedWeek(week); setView('days'); }}
                  className={`p-8 rounded-3xl border transition-all cursor-pointer group relative overflow-hidden flex flex-col gap-6 ${isFinished ? 'bg-green-50/30 border-green-200' : 'bg-white border-neutral-100 hover:border-black shadow-sm hover:shadow-xl'}`}
                >
                  <div className="flex justify-between items-start">
                    <span className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-black shadow-lg transition-colors ${isFinished ? 'bg-green-500 text-white' : 'bg-black text-white'}`}>
                      {week.weekNumber}
                    </span>
                    {isFinished && (
                      <div className="w-9 h-9 bg-green-500 text-white rounded-full flex items-center justify-center shadow-lg">
                        <span className="material-symbols-outlined text-base filled">check</span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-1 text-left">
                    <h3 className="text-xl font-black uppercase text-black font-display tracking-tight">Week {week.weekNumber}</h3>
                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">{week.days.length} Training Sessions</p>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); toggleWeekFinished(week.id); }}
                    className={`mt-auto px-5 py-2.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${isFinished ? 'bg-green-100 text-green-700' : 'bg-neutral-50 text-neutral-400 hover:bg-black hover:text-white'}`}
                  >
                    <span className="material-symbols-outlined text-sm">{isFinished ? 'check_circle' : 'circle'}</span>
                    {isFinished ? 'Week Finished' : 'Mark as Finished'}
                  </button>
                  <span className={`material-symbols-outlined text-[120px] absolute -bottom-8 -right-8 select-none opacity-30 group-hover:rotate-12 transition-transform ${isFinished ? 'text-green-500/10' : 'text-neutral-50'}`}>event_available</span>
                </div>
              );
            })}
          </div>
        )}

        {/* MEAL PLAN VIEW */}
        {view === 'meal' && course.mealPlan && (
            <div className="space-y-10 animate-in slide-in-from-right-4 duration-500">
                <div className="bg-white rounded-[3rem] border border-neutral-100 p-10 shadow-xl relative overflow-hidden">
                    <div className="relative z-10 space-y-6">
                        <h2 className="text-3xl font-black uppercase font-display tracking-tight">{course.mealPlan.name}</h2>
                        <div className="flex gap-4">
                            <span className="px-4 py-2 bg-neutral-900 text-white rounded-xl text-xs font-bold uppercase tracking-widest">{course.mealPlan.totalCalories} kcal</span>
                        </div>
                        <p className="text-neutral-500 font-medium max-w-2xl">{course.mealPlan.description || "A balanced nutrition plan designed to support your training volume."}</p>
                    </div>
                    <span className="material-symbols-outlined text-[200px] absolute -bottom-10 -right-10 text-neutral-50 rotate-12 select-none">restaurant</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {course.mealPlan.meals.map((meal, i) => (
                        <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-neutral-100 shadow-sm space-y-6">
                            <h3 className="text-xl font-black uppercase">{meal.label}</h3>
                            <div className="space-y-4">
                                {meal.items.map((item, ii) => (
                                    <div key={ii} className="flex justify-between items-center p-4 bg-neutral-50 rounded-2xl border border-neutral-100">
                                        <div>
                                            <p className="font-bold text-black text-sm">{item.name}</p>
                                            <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">{item.amount}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-black text-black text-sm">{item.calories}</p>
                                            <p className="text-[8px] font-black text-neutral-300 uppercase tracking-widest">kcal</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* DAYS VIEW */}
        {view === 'days' && selectedWeek && (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
            <div className="flex items-center gap-3">
               <button onClick={() => setView('weeks')} className="w-10 h-10 rounded-lg bg-neutral-50 border border-neutral-100 flex items-center justify-center text-neutral-400 hover:text-black hover:bg-white transition-all">
                  <span className="material-symbols-outlined">arrow_back</span>
               </button>
               <h2 className="text-xl font-black uppercase text-black font-display tracking-tight">Select Training Day</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {selectedWeek.days.map((day) => {
                const isDayDone = isDayMarkedDone(day);
                return (
                  <div 
                    key={day.id}
                    onClick={() => { setSelectedDay(day); setView('exercises'); }}
                    className={`flex items-center justify-between p-6 rounded-2xl border transition-all cursor-pointer group relative overflow-hidden ${isDayDone ? 'bg-green-50/50 border-green-200' : 'bg-white border-neutral-100 hover:border-black shadow-sm'}`}
                  >
                    <div className="flex items-center gap-4 relative z-10">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-black shadow-md transition-colors ${isDayDone ? 'bg-green-500 text-white' : 'bg-neutral-900 text-white'}`}>
                        {day.dayNumber}
                      </div>
                      <div className="text-left">
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-black uppercase text-black leading-none">{day.title}</h4>
                          {isDayDone && <span className="bg-green-500 text-white px-1.5 py-0.5 rounded text-[7px] font-black uppercase tracking-widest">Done</span>}
                        </div>
                        <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest mt-1">{day.exercises.length} Movements</p>
                      </div>
                    </div>
                    {isDayDone ? (
                       <span className="material-symbols-outlined text-green-500 filled text-2xl relative z-10">check_circle</span>
                    ) : (
                       <span className="material-symbols-outlined text-neutral-300 group-hover:text-black transition-colors text-2xl relative z-10">arrow_circle_right</span>
                    )}
                    {isDayDone && (
                      <span className="material-symbols-outlined text-8xl absolute -bottom-2 -right-2 text-green-500/5 select-none -rotate-12">task_alt</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* EXERCISES VIEW */}
        {view === 'exercises' && selectedDay && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in slide-in-from-right-4 duration-500">
            <div className="lg:col-span-8 space-y-6">
               <div className="flex items-center justify-between">
                  <button onClick={() => setView('days')} className="flex items-center gap-2 text-[10px] font-black text-neutral-400 uppercase tracking-widest hover:text-black">
                     <span className="material-symbols-outlined text-sm">arrow_back</span> Back to Week
                  </button>
               </div>

               {selectedDay.exercises.map((item) => {
                 const isDone = completedExercises.has(item.id);
                 const isExpanded = expandedMediaId === item.id;
                 const isSuperSet = item.format === 'SUPER_SET';
                 const isEmom = item.format === 'EMOM';
                 
                 return (
                   <div key={item.id} className={`bg-white rounded-3xl border transition-all overflow-hidden ${isDone ? 'border-green-300 bg-green-50/10' : isSuperSet ? 'border-purple-200 bg-purple-50/10' : isEmom ? 'border-orange-200 bg-orange-50/10' : 'border-neutral-100 shadow-sm'}`}>
                     <div className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                       <div className="flex items-center gap-6 flex-1">
                          <button 
                            onClick={() => toggleExercise(item.id)}
                            className={`w-14 h-14 rounded-xl flex items-center justify-center transition-all shadow-lg shrink-0 border ${isDone ? 'bg-green-500 border-green-500 text-white' : 'bg-white border-neutral-100 text-neutral-200 hover:border-black'}`}
                          >
                             <div className={`w-7 h-7 rounded-full border-4 ${isDone ? 'bg-white border-white' : 'border-neutral-100'}`}></div>
                          </button>

                          <div className="space-y-3">
                            <div className="space-y-1 text-left">
                              <p className={`text-[9px] font-black uppercase tracking-[0.2em] ${isSuperSet ? 'text-purple-500' : isEmom ? 'text-orange-500' : 'text-neutral-300'}`}>{item.format.replace('_', ' ')} SESSION</p>
                              <h3 className={`text-2xl md:text-3xl font-black uppercase leading-none font-display ${isDone ? 'text-green-800' : 'text-black'}`}>{item.name}</h3>
                            </div>
                            
                            <div className="flex flex-wrap gap-2">
                              {[
                                {label: 'SETS', val: item.sets || '1'}, 
                                {label: 'REPS', val: item.reps || '-'}, 
                                {label: 'REST', val: item.rest || 'N/A'}
                              ].map(stat => (
                                <div key={stat.label} className="bg-neutral-50/50 rounded-lg py-2 px-4 text-center border border-neutral-50">
                                  <p className="text-[7px] uppercase font-black text-neutral-300 tracking-[0.2em] mb-0.5">{stat.label}</p>
                                  <p className="text-base font-black text-black leading-none">{stat.val}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                       </div>

                       <div className="flex flex-col justify-center self-end sm:self-center">
                          <button 
                            onClick={() => toggleMedia(item.id)}
                            className={`w-14 h-14 rounded-xl transition-all shadow-xl flex items-center justify-center ${isExpanded ? 'bg-accent text-white' : 'bg-neutral-900 text-white hover:bg-black'}`}
                          >
                             <span className="material-symbols-outlined text-xl">{isExpanded ? 'close' : 'play_circle'}</span>
                          </button>
                       </div>
                     </div>

                     {isExpanded && (
                        <div className="border-t border-neutral-100 bg-neutral-50/50 p-6 animate-in slide-in-from-top-4 duration-500">
                          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                             <div className="lg:col-span-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                   {item.videoUrl && (
                                      <div className="aspect-video bg-neutral-900 rounded-2xl overflow-hidden shadow-xl ring-4 ring-white relative group">
                                         <video src={item.videoUrl} autoPlay loop muted controls className="w-full h-full object-cover" />
                                         <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-md text-[7px] font-black text-white uppercase tracking-widest">Video Demo</div>
                                      </div>
                                   )}
                                   {item.imageUrl && (
                                      <div className="aspect-video bg-neutral-200 rounded-2xl overflow-hidden shadow-xl ring-4 ring-white relative group">
                                         <img src={item.imageUrl} className="w-full h-full object-cover" alt="" />
                                         <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-md text-[7px] font-black text-white uppercase tracking-widest">Visual Reference</div>
                                      </div>
                                   )}
                                </div>
                             </div>
                             <div className="lg:col-span-4 flex flex-col justify-center space-y-4 text-left">
                                <div className="space-y-3">
                                   <div className="flex items-center gap-2">
                                      <span className="material-symbols-outlined text-accent filled text-base">tips_and_updates</span>
                                      <p className="text-[9px] font-black text-accent uppercase tracking-widest">Coach's Cue</p>
                                   </div>
                                   <p className="text-sm font-medium text-neutral-500 leading-relaxed italic border-l-2 border-accent pl-4">
                                      {item.description || "Focus on explosive power and maintaining a neutral spine."}
                                   </p>
                                </div>
                                <button onClick={() => toggleMedia(item.id)} className="w-fit text-[9px] font-black uppercase text-neutral-400 hover:text-black flex items-center gap-1 transition-colors">
                                   <span className="material-symbols-outlined text-sm">close</span> Close Viewer
                                </button>
                             </div>
                          </div>
                        </div>
                     )}
                   </div>
                 );
               })}
            </div>

            <div className="lg:col-span-4 space-y-6">
               <div className={`p-8 rounded-3xl text-white shadow-2xl relative overflow-hidden transition-colors duration-500 ${isDayMarkedDone(selectedDay) ? 'bg-green-600' : 'bg-black'}`}>
                 <div className="relative z-10 space-y-5">
                    <h3 className="text-xl font-black uppercase font-display leading-tight">Session Summary</h3>
                    <div className="space-y-3">
                       <div className="flex justify-between items-end">
                          <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">Movements Done</span>
                          <span className="text-lg font-black text-white">{selectedDay.exercises.filter(ex => completedExercises.has(ex.id)).length} / {selectedDay.exercises.length}</span>
                       </div>
                       <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-white transition-all duration-1000" 
                            style={{ width: `${(selectedDay.exercises.filter(ex => completedExercises.has(ex.id)).length / (selectedDay.exercises.length || 1)) * 100}%` }}
                          ></div>
                       </div>
                    </div>
                 </div>
                 <span className="material-symbols-outlined text-9xl absolute -bottom-6 -right-6 text-white/5 rotate-12">checklist</span>
               </div>

               <div className="bg-white p-6 rounded-3xl border border-neutral-100 shadow-sm space-y-4 text-left">
                  <h4 className="text-[9px] font-black uppercase tracking-widest text-neutral-300">Hub Actions</h4>
                  <div className="grid gap-2">
                     <button 
                        onClick={() => navigate(`/profile/messages?coachId=c1`)}
                        className="w-full py-3 px-4 bg-neutral-50 rounded-xl flex items-center justify-between group hover:bg-black transition-all text-left"
                     >
                        <span className="text-[9px] font-black uppercase tracking-widest text-neutral-400 group-hover:text-white">Message Coach</span>
                        <span className="material-symbols-outlined text-neutral-300 text-base group-hover:text-accent">chat</span>
                     </button>
                     
                     <button 
                        onClick={() => toggleDayFinished(selectedDay.id)}
                        className={`w-full py-3 px-4 rounded-xl flex items-center justify-between group transition-all text-left border ${isDayMarkedDone(selectedDay) ? 'bg-green-50 border-green-200 text-green-700' : 'bg-neutral-50 border-transparent hover:bg-black'}`}
                     >
                        <span className={`text-[9px] font-black uppercase tracking-widest ${isDayMarkedDone(selectedDay) ? 'text-green-700' : 'text-neutral-400 group-hover:text-white'}`}>
                          {isDayMarkedDone(selectedDay) ? 'Day Completed' : 'Finish Training Day'}
                        </span>
                        <span className={`material-symbols-outlined text-base ${isDayMarkedDone(selectedDay) ? 'text-green-500 filled' : 'text-neutral-300 group-hover:text-green-500'}`}>
                          {isDayMarkedDone(selectedDay) ? 'check_circle' : 'task_alt'}
                        </span>
                     </button>

                     <button 
                        onClick={() => setIsLogModalOpen(true)}
                        className="w-full py-4 px-4 bg-accent text-white rounded-xl flex items-center justify-between group hover:bg-blue-600 transition-all text-left shadow-lg shadow-accent/20"
                     >
                        <span className="text-[9px] font-black uppercase tracking-widest">Commit Workout Log</span>
                        <span className="material-symbols-outlined text-white text-base">edit_note</span>
                     </button>
                  </div>
               </div>
            </div>
          </div>
        )}
      </div>

      {/* Workout Log Modal */}
      {isLogModalOpen && selectedDay && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden relative flex flex-col max-h-[95vh]">
              <div className="p-6 border-b border-neutral-100 flex justify-between items-center bg-neutral-50/50 shrink-0">
                 <div className="text-left space-y-1">
                    <p className="text-[9px] font-black text-accent uppercase tracking-[0.2em]">Finalizing Architecture</p>
                    <h3 className="text-xl md:text-2xl font-black font-display uppercase text-black leading-none">Commit: {selectedDay.title}</h3>
                 </div>
                 <button 
                  onClick={() => setIsLogModalOpen(false)} 
                  className="w-10 h-10 bg-white border border-neutral-100 rounded-lg flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-sm group"
                 >
                    <span className="material-symbols-outlined group-hover:rotate-90 transition-transform text-base">close</span>
                 </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-8 no-scrollbar text-left">
                 <form onSubmit={handleLogSubmit} className="space-y-8">
                    {/* Performance Metrics */}
                    <div className="space-y-6">
                       <h4 className="text-xs font-black uppercase tracking-widest text-neutral-400 border-l-2 border-black pl-3">Movement Intelligence</h4>
                       <div className="grid gap-3">
                          {selectedDay.exercises.map((ex) => (
                             <div key={ex.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center p-4 bg-neutral-50 rounded-2xl border border-neutral-100">
                                <div className="md:col-span-4">
                                   <p className="text-[9px] font-black text-neutral-300 uppercase tracking-widest mb-0.5">{ex.format}</p>
                                   <p className="text-base font-black text-black uppercase leading-none">{ex.name}</p>
                                </div>
                                <div className="md:col-span-3">
                                   <p className="text-[8px] font-black text-neutral-400 uppercase tracking-widest mb-1">Prescribed</p>
                                   <p className="text-xs font-bold text-neutral-500 uppercase">{ex.sets} Sets x {ex.reps}</p>
                                </div>
                                <div className="md:col-span-5">
                                   <label className="text-[8px] font-black text-accent uppercase tracking-widest mb-1 block">Actual Result</label>
                                   <input 
                                      type="text" 
                                      required
                                      placeholder="e.g. 245 lbs / 18:42"
                                      className="w-full bg-white border border-neutral-200 rounded-lg p-3 text-sm font-black uppercase outline-none focus:border-accent transition-all"
                                      value={logData.results[ex.id] || ''}
                                      onChange={(e) => setLogData({
                                        ...logData, 
                                        results: {...logData.results, [ex.id]: e.target.value}
                                      })}
                                   />
                                </div>
                             </div>
                          ))}
                       </div>
                    </div>

                    {/* Subjective Data */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-neutral-100">
                       <div className="space-y-3">
                          <label className="text-xs font-black uppercase tracking-widest text-neutral-400">Intensity (RPE {logData.rpe})</label>
                          <div className="space-y-4">
                             <input 
                                type="range" min="1" max="10" step="1" 
                                className="w-full h-1.5 bg-neutral-100 rounded-lg appearance-none cursor-pointer accent-accent"
                                value={logData.rpe}
                                onChange={(e) => setLogData({...logData, rpe: parseInt(e.target.value)})}
                             />
                             <div className="flex justify-between text-[9px] font-black uppercase text-neutral-300">
                                <span>Recovery</span>
                                <span>Max Effort</span>
                             </div>
                          </div>
                       </div>
                       <div className="space-y-3">
                          <label className="text-xs font-black uppercase tracking-widest text-neutral-400">Coach Notes</label>
                          <textarea 
                             rows={2}
                             placeholder="Session notes..."
                             className="w-full bg-neutral-50 border border-neutral-100 rounded-xl p-4 text-sm font-medium focus:border-black outline-none transition-all resize-none"
                             value={logData.notes}
                             onChange={(e) => setLogData({...logData, notes: e.target.value})}
                          />
                       </div>
                    </div>

                    <div className="pt-6">
                       <button 
                          type="submit"
                          disabled={isSubmitting}
                          className="w-full py-4 bg-black text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs hover:bg-neutral-800 transition-all shadow-2xl flex items-center justify-center gap-3 disabled:opacity-50"
                       >
                          {isSubmitting ? (
                             <><div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div> Submitting...</>
                          ) : (
                             <><span className="material-symbols-outlined text-base">cloud_upload</span> Commit to Database</>
                          )}
                       </button>
                    </div>
                 </form>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default WorkoutSession;
