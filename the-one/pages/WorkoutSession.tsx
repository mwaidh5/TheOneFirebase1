
import React, { useState, useMemo, useEffect } from 'react';
import { Link, useParams, useLocation, useNavigate } from 'react-router-dom';
import { COURSES } from '../constants';
import { Course, Exercise, WeekProgram, DayProgram } from '../types';

const WorkoutSession: React.FC = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const course = useMemo(() => COURSES.find(c => c.id === id) || COURSES[0], [id]);
  
  // Navigation State
  const [view, setView] = useState<'weeks' | 'days' | 'exercises'>('weeks');
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

  // Handle direct navigation from Curriculum links
  useEffect(() => {
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

  const toggleExercise = (exId: string) => {
    setCompletedExercises(prev => {
      const next = new Set(prev);
      if (next.has(exId)) next.delete(exId);
      else next.add(exId);
      return next;
    });
  };

  const toggleDayFinished = (dayId: string) => {
    setCompletedDays(prev => {
      const next = new Set(prev);
      if (next.has(dayId)) next.delete(dayId);
      else next.add(dayId);
      return next;
    });
  };

  const toggleWeekFinished = (weekId: string) => {
    setCompletedWeeks(prev => {
      const next = new Set(prev);
      if (next.has(weekId)) next.delete(weekId);
      else next.add(weekId);
      return next;
    });
  };

  const toggleMedia = (exId: string) => {
    setExpandedMediaId(expandedMediaId === exId ? null : exId);
  };

  const handleLogSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API delay
    setTimeout(() => {
      alert(`Workout Log for "${selectedDay?.title}" committed to platform. Coach Mercer has been notified.`);
      setIsSubmitting(false);
      setIsLogModalOpen(false);
      // Mark day as complete by checking all boxes for visual satisfaction
      if (selectedDay) {
        const nextEx = new Set(completedExercises);
        selectedDay.exercises.forEach(ex => nextEx.add(ex.id));
        setCompletedExercises(nextEx);
        
        const nextDay = new Set(completedDays);
        nextDay.add(selectedDay.id);
        setCompletedDays(nextDay);
      }
    }, 1500);
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
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-8">
            <div className="space-y-4 max-w-2xl">
              <nav className="flex items-center gap-2 text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em]">
                <Link to="/courses" className="hover:text-black transition-colors">Courses</Link>
                <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                <button onClick={() => setView('weeks')} className="hover:text-black transition-colors">{course.title}</button>
                {view !== 'weeks' && selectedWeek && (
                   <>
                     <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                     <button onClick={() => setView('days')} className="hover:text-black transition-colors">Week {selectedWeek.weekNumber}</button>
                   </>
                )}
                {view === 'exercises' && selectedDay && (
                   <>
                     <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                     <span className="text-black">{selectedDay.title}</span>
                   </>
                )}
              </nav>
              <div className="flex items-center gap-6">
                <h1 className="text-4xl md:text-5xl font-black font-display tracking-tight text-black uppercase leading-tight">
                  {view === 'weeks' ? 'Training Hub' : view === 'days' ? `Week ${selectedWeek?.weekNumber} Overview` : selectedDay?.title}
                </h1>
                {view === 'exercises' && selectedDay && isDayMarkedDone(selectedDay) && (
                  <span className="bg-green-500 text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-lg flex items-center gap-1 shrink-0 h-fit mt-1">
                    <span className="material-symbols-outlined text-xs filled">check</span> Finished
                  </span>
                )}
              </div>
              <p className="text-neutral-500 text-lg leading-relaxed font-medium">
                {view === 'weeks' ? "Select a phase to continue your progression." : "Track your intensity and log every successful set."}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* WEEKS VIEW */}
        {view === 'weeks' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {course.weeks?.map((week) => {
              const isFinished = completedWeeks.has(week.id) || isWeekNaturallyDone(week);
              return (
                <div 
                  key={week.id}
                  onClick={() => { setSelectedWeek(week); setView('days'); }}
                  className={`p-10 rounded-[3rem] border transition-all cursor-pointer group relative overflow-hidden flex flex-col gap-8 ${isFinished ? 'bg-green-50/30 border-green-200' : 'bg-white border-neutral-100 hover:border-black shadow-sm hover:shadow-xl'}`}
                >
                  <div className="flex justify-between items-start">
                    <span className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black shadow-lg transition-colors ${isFinished ? 'bg-green-500 text-white' : 'bg-black text-white'}`}>
                      {week.weekNumber}
                    </span>
                    {isFinished && (
                      <div className="w-10 h-10 bg-green-500 text-white rounded-full flex items-center justify-center shadow-lg">
                        <span className="material-symbols-outlined text-lg filled">check</span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2 text-left">
                    <h3 className="text-2xl font-black uppercase text-black font-display tracking-tight">Week {week.weekNumber}</h3>
                    <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest">{week.days.length} Training Sessions</p>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); toggleWeekFinished(week.id); }}
                    className={`mt-auto px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${isFinished ? 'bg-green-100 text-green-700' : 'bg-neutral-50 text-neutral-400 hover:bg-black hover:text-white'}`}
                  >
                    <span className="material-symbols-outlined text-sm">{isFinished ? 'check_circle' : 'circle'}</span>
                    {isFinished ? 'Week Finished' : 'Mark as Finished'}
                  </button>
                  <span className={`material-symbols-outlined text-[140px] absolute -bottom-10 -right-10 select-none opacity-40 group-hover:rotate-12 transition-transform ${isFinished ? 'text-green-500/10' : 'text-neutral-50'}`}>event_available</span>
                </div>
              );
            })}
          </div>
        )}

        {/* DAYS VIEW */}
        {view === 'days' && selectedWeek && (
          <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
            <div className="flex items-center gap-4">
               <button onClick={() => setView('weeks')} className="w-12 h-12 rounded-xl bg-neutral-50 border border-neutral-100 flex items-center justify-center text-neutral-400 hover:text-black hover:bg-white transition-all">
                  <span className="material-symbols-outlined">arrow_back</span>
               </button>
               <h2 className="text-2xl font-black uppercase text-black font-display tracking-tight">Select Training Day</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {selectedWeek.days.map((day) => {
                const isDayDone = isDayMarkedDone(day);
                return (
                  <div 
                    key={day.id}
                    onClick={() => { setSelectedDay(day); setView('exercises'); }}
                    className={`flex items-center justify-between p-8 rounded-[2.5rem] border transition-all cursor-pointer group relative overflow-hidden ${isDayDone ? 'bg-green-50/50 border-green-200' : 'bg-white border-neutral-100 hover:border-black shadow-sm'}`}
                  >
                    <div className="flex items-center gap-6 relative z-10">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-sm font-black shadow-md transition-colors ${isDayDone ? 'bg-green-500 text-white' : 'bg-neutral-900 text-white'}`}>
                        {day.dayNumber}
                      </div>
                      <div className="text-left">
                        <div className="flex items-center gap-3">
                          <h4 className="text-lg font-black uppercase text-black leading-none">{day.title}</h4>
                          {isDayDone && <span className="bg-green-500 text-white px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest">Finished</span>}
                        </div>
                        <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mt-1">{day.exercises.length} Movements</p>
                      </div>
                    </div>
                    {isDayDone ? (
                       <span className="material-symbols-outlined text-green-500 filled text-3xl relative z-10">check_circle</span>
                    ) : (
                       <span className="material-symbols-outlined text-neutral-300 group-hover:text-black transition-colors text-3xl relative z-10">arrow_circle_right</span>
                    )}
                    {isDayDone && (
                      <span className="material-symbols-outlined text-[100px] absolute -bottom-4 -right-4 text-green-500/5 select-none -rotate-12">task_alt</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* EXERCISES VIEW */}
        {view === 'exercises' && selectedDay && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 animate-in slide-in-from-right-4 duration-500">
            <div className="lg:col-span-8 space-y-8">
               <div className="flex items-center justify-between mb-2">
                  <button onClick={() => setView('days')} className="flex items-center gap-2 text-[10px] font-black text-neutral-400 uppercase tracking-widest hover:text-black">
                     <span className="material-symbols-outlined text-sm">arrow_back</span> Back to Week
                  </button>
               </div>

               {selectedDay.exercises.map((item) => {
                 const isDone = completedExercises.has(item.id);
                 const isExpanded = expandedMediaId === item.id;
                 
                 return (
                   <div key={item.id} className={`bg-white rounded-[2.5rem] border transition-all overflow-hidden ${isDone ? 'border-green-300 bg-green-50/10' : 'border-neutral-100 shadow-sm'}`}>
                     <div className="p-10 flex items-center justify-between">
                       <div className="flex items-center gap-10 flex-1">
                          <button 
                            onClick={() => toggleExercise(item.id)}
                            className={`w-16 h-16 rounded-[1.2rem] flex items-center justify-center transition-all shadow-lg shrink-0 border ${isDone ? 'bg-green-500 border-green-500 text-white' : 'bg-white border-neutral-100 text-neutral-200 hover:border-black'}`}
                          >
                             <div className={`w-8 h-8 rounded-full border-4 ${isDone ? 'bg-white border-white' : 'border-neutral-100'}`}></div>
                          </button>

                          <div className="space-y-4">
                            <div className="space-y-1 text-left">
                              <p className="text-[10px] font-black text-neutral-300 uppercase tracking-[0.2em]">{item.format} SESSION</p>
                              <h3 className={`text-4xl font-black uppercase leading-none font-display ${isDone ? 'text-green-800' : 'text-black'}`}>{item.name}</h3>
                            </div>
                            
                            <div className="flex gap-4">
                              {[
                                {label: 'SETS', val: item.sets || '1'}, 
                                {label: 'REPS', val: item.reps || '-'}, 
                                {label: 'REST', val: item.rest || 'N/A'}
                              ].map(stat => (
                                <div key={stat.label} className="bg-neutral-50/50 rounded-2xl p-4 px-8 text-center border border-neutral-50 min-w-[120px]">
                                  <p className="text-[8px] uppercase font-black text-neutral-300 tracking-[0.2em] mb-1">{stat.label}</p>
                                  <p className="text-xl font-black text-black leading-none">{stat.val}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                       </div>

                       <div className="flex flex-col justify-center">
                          <button 
                            onClick={() => toggleMedia(item.id)}
                            className={`w-16 h-16 rounded-[1.2rem] transition-all shadow-xl flex items-center justify-center ${isExpanded ? 'bg-accent text-white' : 'bg-neutral-900 text-white hover:bg-black'}`}
                          >
                             <span className="material-symbols-outlined text-2xl">{isExpanded ? 'close' : 'play_circle'}</span>
                          </button>
                       </div>
                     </div>

                     {isExpanded && (
                        <div className="border-t border-neutral-100 bg-neutral-50/50 p-10 animate-in slide-in-from-top-4 duration-500">
                          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                             <div className="lg:col-span-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                   {item.videoUrl && (
                                      <div className="aspect-video bg-neutral-900 rounded-[1.5rem] overflow-hidden shadow-xl ring-4 ring-white relative group">
                                         <video src={item.videoUrl} autoPlay loop muted controls className="w-full h-full object-cover" />
                                         <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-lg text-[8px] font-black text-white uppercase tracking-widest">Video Demo</div>
                                      </div>
                                   )}
                                   {item.imageUrl && (
                                      <div className="aspect-video bg-neutral-200 rounded-[1.5rem] overflow-hidden shadow-xl ring-4 ring-white relative group">
                                         <img src={item.imageUrl} className="w-full h-full object-cover" alt="" />
                                         <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-lg text-[8px] font-black text-white uppercase tracking-widest">Visual Reference</div>
                                      </div>
                                   )}
                                </div>
                             </div>
                             <div className="lg:col-span-4 flex flex-col justify-center space-y-6 text-left">
                                <div className="space-y-4">
                                   <div className="flex items-center gap-2">
                                      <span className="material-symbols-outlined text-accent filled">tips_and_updates</span>
                                      <p className="text-[10px] font-black text-accent uppercase tracking-widest">Coach Mercer's Cue</p>
                                   </div>
                                   <p className="text-sm font-medium text-neutral-500 leading-relaxed italic border-l-4 border-accent pl-6">
                                      {item.description || "Focus on explosive power and maintaining a neutral spine throughout the movement."}
                                   </p>
                                </div>
                                <button onClick={() => toggleMedia(item.id)} className="w-fit text-[10px] font-black uppercase text-neutral-400 hover:text-black flex items-center gap-2 transition-colors">
                                   <span className="material-symbols-outlined text-[16px]">close</span> Close Viewer
                                </button>
                             </div>
                          </div>
                        </div>
                     )}
                   </div>
                 );
               })}
            </div>

            <div className="lg:col-span-4 space-y-8">
               <div className={`p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden transition-colors duration-500 ${isDayMarkedDone(selectedDay) ? 'bg-green-600' : 'bg-black'}`}>
                 <div className="relative z-10 space-y-6">
                    <h3 className="text-2xl font-black uppercase font-display leading-tight">Session Summary</h3>
                    <div className="space-y-4">
                       <div className="flex justify-between items-end">
                          <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Movements Completed</span>
                          <span className="text-xl font-black text-white">{selectedDay.exercises.filter(ex => completedExercises.has(ex.id)).length} / {selectedDay.exercises.length}</span>
                       </div>
                       <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-white transition-all duration-1000" 
                            style={{ width: `${(selectedDay.exercises.filter(ex => completedExercises.has(ex.id)).length / (selectedDay.exercises.length || 1)) * 100}%` }}
                          ></div>
                       </div>
                    </div>
                 </div>
                 <span className="material-symbols-outlined text-[120px] absolute -bottom-10 -right-10 text-white/5 rotate-12">checklist</span>
               </div>

               <div className="bg-white p-8 rounded-[2.5rem] border border-neutral-100 shadow-sm space-y-6 text-left">
                  <h4 className="text-xs font-black uppercase tracking-widest text-neutral-300">Hub Actions</h4>
                  <div className="grid gap-3">
                     <button 
                        onClick={() => navigate(`/profile/messages?coachId=c1`)}
                        className="w-full py-4 px-6 bg-neutral-50 rounded-2xl flex items-center justify-between group hover:bg-black transition-all text-left"
                     >
                        <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400 group-hover:text-white">Message Coach</span>
                        <span className="material-symbols-outlined text-neutral-300 text-lg group-hover:text-accent">chat</span>
                     </button>
                     
                     <button 
                        onClick={() => toggleDayFinished(selectedDay.id)}
                        className={`w-full py-4 px-6 rounded-2xl flex items-center justify-between group transition-all text-left border ${isDayMarkedDone(selectedDay) ? 'bg-green-50 border-green-200 text-green-700' : 'bg-neutral-50 border-transparent hover:bg-black'}`}
                     >
                        <span className={`text-[10px] font-black uppercase tracking-widest ${isDayMarkedDone(selectedDay) ? 'text-green-700' : 'text-neutral-400 group-hover:text-white'}`}>
                          {isDayMarkedDone(selectedDay) ? 'Day Completed' : 'Finish Training Day'}
                        </span>
                        <span className={`material-symbols-outlined text-lg ${isDayMarkedDone(selectedDay) ? 'text-green-500 filled' : 'text-neutral-300 group-hover:text-green-500'}`}>
                          {isDayMarkedDone(selectedDay) ? 'check_circle' : 'task_alt'}
                        </span>
                     </button>

                     <button 
                        onClick={() => setIsLogModalOpen(true)}
                        className="w-full py-5 px-6 bg-accent text-white rounded-2xl flex items-center justify-between group hover:bg-blue-600 transition-all text-left shadow-lg shadow-accent/20"
                     >
                        <span className="text-[10px] font-black uppercase tracking-widest">Commit Workout Log</span>
                        <span className="material-symbols-outlined text-white text-lg">edit_note</span>
                     </button>
                  </div>
               </div>
            </div>
          </div>
        )}
      </div>

      {/* Workout Log Modal */}
      {isLogModalOpen && selectedDay && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-6 bg-black/95 backdrop-blur-2xl animate-in fade-in duration-300 overflow-hidden">
           <div className="bg-white w-full max-w-4xl rounded-[4rem] shadow-[0_0_100px_rgba(0,0,0,0.5)] overflow-hidden relative flex flex-col max-h-[90vh]">
              <div className="p-12 border-b border-neutral-100 flex justify-between items-center bg-neutral-50/50 shrink-0">
                 <div className="text-left space-y-1">
                    <p className="text-[10px] font-black text-accent uppercase tracking-[0.3em]">Finalizing Architecture</p>
                    <h3 className="text-4xl font-black font-display uppercase text-black leading-none">Commit Logic: {selectedDay.title}</h3>
                 </div>
                 <button 
                  onClick={() => setIsLogModalOpen(false)} 
                  className="w-14 h-14 bg-white border border-neutral-100 rounded-2xl flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-sm group"
                 >
                    <span className="material-symbols-outlined group-hover:rotate-90 transition-transform">close</span>
                 </button>
              </div>

              <div className="flex-1 overflow-y-auto p-12 space-y-12 no-scrollbar text-left">
                 <form onSubmit={handleLogSubmit} className="space-y-12">
                    {/* Performance Metrics */}
                    <div className="space-y-8">
                       <h4 className="text-sm font-black uppercase tracking-widest text-neutral-400 border-l-4 border-black pl-4">Movement Intelligence</h4>
                       <div className="grid gap-4">
                          {selectedDay.exercises.map((ex) => (
                             <div key={ex.id} className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center p-6 bg-neutral-50 rounded-3xl border border-neutral-100 transition-all hover:bg-white hover:shadow-xl">
                                <div className="md:col-span-4">
                                   <p className="text-[10px] font-black text-neutral-300 uppercase tracking-widest mb-1">{ex.format}</p>
                                   <p className="text-xl font-black text-black uppercase leading-none">{ex.name}</p>
                                </div>
                                <div className="md:col-span-3">
                                   <p className="text-[9px] font-black text-neutral-400 uppercase tracking-widest mb-2">Prescribed</p>
                                   <p className="text-xs font-bold text-neutral-500 uppercase">{ex.sets} Sets x {ex.reps}</p>
                                </div>
                                <div className="md:col-span-5">
                                   <label className="text-[9px] font-black text-accent uppercase tracking-widest mb-2 block">Actual Result</label>
                                   <input 
                                      type="text" 
                                      required
                                      placeholder="e.g. 245 lbs / 18:42"
                                      className="w-full bg-white border border-neutral-200 rounded-xl p-4 text-sm font-black uppercase outline-none focus:border-accent transition-all"
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-8 border-t border-neutral-100">
                       <div className="space-y-4">
                          <label className="text-sm font-black uppercase tracking-widest text-neutral-400">Intensity (RPE {logData.rpe})</label>
                          <div className="space-y-6">
                             <input 
                                type="range" min="1" max="10" step="1" 
                                className="w-full h-2 bg-neutral-100 rounded-lg appearance-none cursor-pointer accent-accent"
                                value={logData.rpe}
                                onChange={(e) => setLogData({...logData, rpe: parseInt(e.target.value)})}
                             />
                             <div className="flex justify-between text-[10px] font-black uppercase text-neutral-300">
                                <span>Recovery Pace</span>
                                <span>Maximum Effort</span>
                             </div>
                          </div>
                       </div>
                       <div className="space-y-4">
                          <label className="text-sm font-black uppercase tracking-widest text-neutral-400">Coach Communication</label>
                          <textarea 
                             rows={3}
                             placeholder="How did this session feel? Any pain or wins?"
                             className="w-full bg-neutral-50 border border-neutral-100 rounded-[2rem] p-6 text-sm font-medium focus:border-black outline-none transition-all resize-none"
                             value={logData.notes}
                             onChange={(e) => setLogData({...logData, notes: e.target.value})}
                          />
                       </div>
                    </div>

                    <div className="pt-8">
                       <button 
                          type="submit"
                          disabled={isSubmitting}
                          className="w-full py-6 bg-black text-white rounded-[2rem] font-black uppercase tracking-[0.2em] text-sm hover:bg-neutral-800 transition-all shadow-2xl flex items-center justify-center gap-4 disabled:opacity-50"
                       >
                          {isSubmitting ? (
                             <><div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div> Authorizing Submission...</>
                          ) : (
                             <><span className="material-symbols-outlined text-xl">cloud_upload</span> Commit Session to Database</>
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
