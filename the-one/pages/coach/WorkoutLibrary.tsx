
import React, { useState, useRef, useMemo } from 'react';
import { WORKOUT_LIBRARY, EXERCISE_LIBRARY } from '../../constants';
import { WorkoutTemplate, Exercise, ExerciseFormat, MediaAsset, WeekProgram, DayProgram, User, UserRole } from '../../types';

interface WorkoutLibraryProps {
  library: MediaAsset[];
  setLibrary: React.Dispatch<React.SetStateAction<MediaAsset[]>>;
  currentUser: User;
}

const CoachWorkoutLibrary: React.FC<WorkoutLibraryProps> = ({ library, setLibrary, currentUser }) => {
  const [workouts, setWorkouts] = useState<WorkoutTemplate[]>(WORKOUT_LIBRARY);
  const [editingWorkout, setEditingWorkout] = useState<WorkoutTemplate | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const displayWorkouts = useMemo(() => {
    return workouts.filter(wo => {
      const matchesSearch = wo.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           wo.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           wo.creatorName?.toLowerCase().includes(searchQuery.toLowerCase());
      const hasPermission = currentUser.role === UserRole.ADMIN || wo.isPublic || wo.creatorId === currentUser.id;
      return matchesSearch && hasPermission;
    });
  }, [workouts, currentUser, searchQuery]);

  const [activeWo, setActiveWo] = useState<Partial<WorkoutTemplate>>({ 
    name: '', description: '', category: 'Strength', isPublic: true,
    weeks: [{ id: 'w1', weekNumber: 1, days: [{ id: 'd1', dayNumber: 1, title: 'Session A', exercises: [] }] }] 
  });
  
  const [activeWeekIdx, setActiveWeekIdx] = useState(0);
  const [activeDayIdx, setActiveDayIdx] = useState(0);
  const [isPickerOpen, setIsPickerOpen] = useState<{ type: 'exercise' | 'media', activeIndex: number | null, activeField?: 'imageUrl' | 'videoUrl' }>({ type: 'exercise', activeIndex: null });

  const startAdding = () => {
    setActiveWo({ 
      name: '', description: '', category: 'Strength', isPublic: true,
      weeks: [{ id: 'w1', weekNumber: 1, days: [{ id: 'd1', dayNumber: 1, title: 'Session A', exercises: [] }] }] 
  });
    setActiveWeekIdx(0);
    setActiveDayIdx(0);
    setIsAdding(true);
  };

  const startEditing = (wo: WorkoutTemplate) => {
    setActiveWo({ ...wo });
    setActiveWeekIdx(0);
    setActiveDayIdx(0);
    setEditingWorkout(wo);
    setIsAdding(true);
  };

  const addWeek = () => {
    const nextNum = (activeWo.weeks?.length || 0) + 1;
    setActiveWo({
      ...activeWo,
      weeks: [...(activeWo.weeks || []), { id: Math.random().toString(), weekNumber: nextNum, days: [{ id: Math.random().toString(), dayNumber: 1, title: 'Session A', exercises: [] }] }]
    });
  };

  const addDay = () => {
    const currentWeeks = [...(activeWo.weeks || [])];
    const currentWeek = currentWeeks[activeWeekIdx];
    const nextNum = currentWeek.days.length + 1;
    currentWeek.days.push({ id: Math.random().toString(), dayNumber: nextNum, title: 'New Training Day', exercises: [] });
    setActiveWo({ ...activeWo, weeks: currentWeeks });
    setActiveDayIdx(currentWeek.days.length - 1);
  };

  const handleSave = () => {
    if (!activeWo.name) return;
    const completeWo: WorkoutTemplate = {
      id: activeWo.id || Math.random().toString(36).substr(2, 9),
      name: activeWo.name!,
      description: activeWo.description || '',
      category: activeWo.category || 'Strength',
      weeks: activeWo.weeks || [],
      isPublic: activeWo.isPublic ?? true,
      creatorId: activeWo.creatorId || currentUser.id,
      creatorName: activeWo.creatorName || `${currentUser.firstName} ${currentUser.lastName}`
    };

    if (editingWorkout) {
      setWorkouts(workouts.map(w => w.id === completeWo.id ? completeWo : w));
    } else {
      setWorkouts([completeWo, ...workouts]);
    }
    setIsAdding(false);
    setEditingWorkout(null);
  };

  const addExercise = () => {
    const currentWeeks = [...(activeWo.weeks || [])];
    currentWeeks[activeWeekIdx].days[activeDayIdx].exercises.push({
      id: Math.random().toString(),
      name: '',
      format: 'REGULAR'
    });
    setActiveWo({ ...activeWo, weeks: currentWeeks });
  };

  const updateExercise = (idx: number, field: keyof Exercise, val: any) => {
    const currentWeeks = [...(activeWo.weeks || [])];
    currentWeeks[activeWeekIdx].days[activeDayIdx].exercises[idx] = {
      ...currentWeeks[activeWeekIdx].days[activeDayIdx].exercises[idx],
      [field]: val
    };
    setActiveWo({ ...activeWo, weeks: currentWeeks });
  };

  const removeExercise = (idx: number) => {
    const currentWeeks = [...(activeWo.weeks || [])];
    currentWeeks[activeWeekIdx].days[activeDayIdx].exercises.splice(idx, 1);
    setActiveWo({ ...activeWo, weeks: currentWeeks });
  };

  const selectFromExerciseLibrary = (libItem: typeof EXERCISE_LIBRARY[0]) => {
    if (isPickerOpen.activeIndex !== null) {
      updateExercise(isPickerOpen.activeIndex, 'name', libItem.name);
      updateExercise(isPickerOpen.activeIndex, 'format', libItem.defaultFormat);
      updateExercise(isPickerOpen.activeIndex, 'description', libItem.description);
      updateExercise(isPickerOpen.activeIndex, 'imageUrl', libItem.imageUrl);
      updateExercise(isPickerOpen.activeIndex, 'videoUrl', libItem.videoUrl);
      setIsPickerOpen({ type: 'exercise', activeIndex: null });
    }
  };

  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || isPickerOpen.activeIndex === null || !isPickerOpen.activeField) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const data = reader.result as string;
      const newAsset: MediaAsset = { 
        id: Math.random().toString(), 
        type: file.type.startsWith('video') ? 'video' : 'image', 
        data, 
        name: file.name,
        category: 'WORKOUT',
        createdAt: Date.now(),
        creatorId: currentUser.id,
        creatorName: `${currentUser.firstName} ${currentUser.lastName}`
      };
      setLibrary([newAsset, ...library]);
      updateExercise(isPickerOpen.activeIndex!, isPickerOpen.activeField!, data);
      setIsPickerOpen({ type: 'exercise', activeIndex: null });
    };
    reader.readAsDataURL(file);
  };

  const activeDay = activeWo.weeks?.[activeWeekIdx]?.days[activeDayIdx];

  return (
    <div className="space-y-12 text-left animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-black font-display tracking-tight text-black uppercase">Workout Library</h1>
          <p className="text-neutral-400 font-medium">Architect multi-week training blueprints for reuse.</p>
        </div>
        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-64 min-w-[200px]">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-neutral-300">search</span>
            <input 
              type="text" 
              placeholder="Search blueprints..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-neutral-100 rounded-2xl py-3.5 pl-12 pr-6 text-sm font-bold shadow-sm outline-none focus:border-black transition-all"
            />
          </div>
          <button 
            onClick={startAdding}
            className="px-8 py-4 bg-black text-white font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-neutral-800 transition-all shadow-xl flex items-center gap-2"
          >
            <span className="material-symbols-outlined">add</span>
            New Blueprint
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {displayWorkouts.map((wo) => {
          const isOwner = currentUser.role === UserRole.ADMIN || wo.creatorId === currentUser.id;
          return (
            <div key={wo.id} className="bg-white rounded-[2.5rem] p-10 border border-neutral-100 shadow-sm hover:shadow-2xl transition-all group relative overflow-hidden flex flex-col h-full">
              <div className="flex justify-between items-start mb-8 relative z-10">
                <div className="space-y-2">
                  <span className="text-[10px] font-black text-accent uppercase tracking-widest block">{wo.category} Cycle</span>
                  <h3 className="text-2xl font-black text-black uppercase tracking-tight leading-none">{wo.name}</h3>
                </div>
                {isOwner && (
                  <div className="flex gap-2">
                    <button onClick={() => startEditing(wo)} className="p-3 bg-neutral-50 rounded-xl text-neutral-400 hover:bg-black hover:text-white transition-all shadow-sm">
                      <span className="material-symbols-outlined text-xl">edit</span>
                    </button>
                    <button onClick={() => setWorkouts(workouts.filter(w => w.id !== wo.id))} className="p-3 bg-neutral-50 rounded-xl text-neutral-400 hover:bg-red-500 hover:text-white transition-all shadow-sm">
                      <span className="material-symbols-outlined text-xl">delete</span>
                    </button>
                  </div>
                )}
              </div>
              <p className="text-sm text-neutral-400 font-medium leading-relaxed mb-10 italic flex-grow relative z-10">"{wo.description || 'No description provided.'}"</p>
              
              <div className="flex items-center justify-between pt-6 border-t border-neutral-50 relative z-10">
                <div className="flex items-center gap-2 overflow-hidden mr-4">
                  <div className="flex items-center gap-1.5 px-2 py-0.5 bg-neutral-50 rounded-lg border border-neutral-100 shrink-0">
                    <span className={`material-symbols-outlined text-[14px] ${wo.isPublic ? 'text-green-500' : 'text-neutral-300'}`}>
                      {wo.isPublic ? 'public' : 'lock_person'}
                    </span>
                    <p className="text-[8px] font-black text-neutral-400 uppercase truncate max-w-[80px]">{wo.creatorName || 'System'}</p>
                  </div>
                  <span className="text-neutral-200 text-xs font-bold shrink-0">•</span>
                  <div className="flex items-center gap-2 text-neutral-300 shrink-0">
                    <span className="material-symbols-outlined text-[18px]">calendar_month</span>
                    <span className="text-[10px] font-black uppercase tracking-widest">{wo.weeks.length} Weeks</span>
                  </div>
                </div>
              </div>
              <span className="material-symbols-outlined text-[140px] absolute -bottom-10 -right-10 text-neutral-50 select-none -rotate-12 group-hover:rotate-0 transition-transform duration-700">library_books</span>
            </div>
          );
        })}
        {displayWorkouts.length === 0 && (
          <div className="col-span-full py-20 text-center space-y-4">
            <span className="material-symbols-outlined text-6xl text-neutral-100">search_off</span>
            <p className="text-neutral-300 font-black uppercase tracking-[0.2em]">No matching blueprints found</p>
          </div>
        )}
      </div>

      {/* Full Screen Builder Modal */}
      {isAdding && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-black/95 backdrop-blur-xl animate-in fade-in duration-300 overflow-hidden">
           <div className="bg-neutral-50 w-full max-w-[95%] rounded-[4rem] shadow-2xl overflow-hidden relative flex flex-col h-[95vh]">
              <div className="p-10 border-b border-neutral-100 flex justify-between items-center bg-white shrink-0">
                 <div className="text-left">
                    <h3 className="text-3xl font-black font-display uppercase tracking-tight">{editingWorkout ? 'Refine' : 'Architect'} Blueprint</h3>
                    <div className="flex gap-6 mt-4 items-center">
                       <input 
                          type="text" 
                          value={activeWo.name}
                          onChange={e => setActiveWo({ ...activeWo, name: e.target.value })}
                          placeholder="Blueprint Name..."
                          className="text-lg font-black uppercase tracking-tight text-black bg-transparent outline-none focus:text-accent border-b-2 border-neutral-100 w-80" 
                       />
                       <select 
                          value={activeWo.category}
                          onChange={e => setActiveWo({ ...activeWo, category: e.target.value })}
                          className="bg-neutral-50 border border-neutral-100 rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest outline-none"
                       >
                          <option>Strength</option>
                          <option>Metcon</option>
                          <option>Gymnastics</option>
                       </select>
                       <div className="flex items-center gap-3 px-4 py-2 bg-neutral-50 rounded-xl border border-neutral-100">
                          <p className="text-[9px] font-black uppercase text-neutral-400">Share with other coaches?</p>
                          <div 
                             onClick={() => setActiveWo({...activeWo, isPublic: !activeWo.isPublic})}
                             className={`w-11 h-6 rounded-full relative transition-colors cursor-pointer ${activeWo.isPublic ? 'bg-accent' : 'bg-neutral-200'}`}
                           >
                             <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 ${activeWo.isPublic ? 'translate-x-6' : 'translate-x-1'}`}></div>
                          </div>
                       </div>
                    </div>
                 </div>
                 <div className="flex gap-4">
                    <button 
                      onClick={handleSave}
                      className="px-10 py-5 bg-black text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-neutral-800 transition-all shadow-xl"
                    >
                      Save Blueprint to Library
                    </button>
                    <button onClick={() => setIsAdding(false)} className="w-14 h-14 rounded-2xl bg-white border border-neutral-100 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-sm">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                 </div>
              </div>

              <div className="flex-1 overflow-hidden grid grid-cols-12">
                 {/* Navigation Panel */}
                 <div className="col-span-3 border-r border-neutral-100 p-8 space-y-6 bg-white overflow-y-auto no-scrollbar">
                    <div className="flex items-center justify-between">
                       <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">Timeline Structure</h2>
                       <button onClick={addWeek} className="text-accent hover:scale-110 transition-transform"><span className="material-symbols-outlined">add_circle</span></button>
                    </div>
                    <div className="space-y-4">
                       {activeWo.weeks?.map((week, wIdx) => (
                          <div key={week.id} className="space-y-2 text-left">
                             <button 
                                onClick={() => { setActiveWeekIdx(wIdx); setActiveDayIdx(0); }}
                                className={`w-full text-left px-5 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeWeekIdx === wIdx ? 'bg-black text-white shadow-lg' : 'text-neutral-400 hover:bg-neutral-50'}`}
                             >
                                Week {week.weekNumber}
                             </button>
                             {activeWeekIdx === wIdx && (
                                <div className="ml-4 border-l-2 border-neutral-100 pl-4 space-y-1 py-1">
                                   {week.days.map((day, dIdx) => (
                                      <button 
                                        key={day.id} 
                                        onClick={() => setActiveDayIdx(dIdx)}
                                        className={`w-full text-left px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-tight transition-all ${activeDayIdx === dIdx ? 'text-accent bg-accent/5' : 'text-neutral-400 hover:text-black'}`}
                                      >
                                         Day {day.dayNumber}: {day.title}
                                      </button>
                                   ))}
                                   <button onClick={addDay} className="w-full text-left px-4 py-2 text-[10px] font-black uppercase tracking-widest text-neutral-300 hover:text-accent">+ Add Day</button>
                                </div>
                             )}
                          </div>
                       ))}
                    </div>
                 </div>

                 {/* Builder Panel */}
                 <div className="col-span-9 p-12 overflow-y-auto no-scrollbar space-y-10 bg-neutral-50">
                    {activeDay ? (
                       <>
                          <div className="flex items-center justify-between border-b border-neutral-100 pb-8 text-left">
                             <div className="space-y-2">
                                <span className="text-[10px] font-black uppercase tracking-widest text-accent">Structuring: W{activeWeekIdx+1}D{activeDayIdx+1}</span>
                                <input 
                                   type="text" 
                                   value={activeDay.title}
                                   onChange={e => {
                                      const nextWeeks = [...activeWo.weeks!];
                                      nextWeeks[activeWeekIdx].days[activeDayIdx].title = e.target.value;
                                      setActiveWo({...activeWo, weeks: nextWeeks});
                                   }}
                                   className="text-4xl font-black uppercase tracking-tight text-black bg-transparent outline-none w-full"
                                   placeholder="Day Focus Objectives..."
                                />
                             </div>
                             <button 
                               onClick={addExercise}
                               className="px-8 py-4 bg-black text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-accent transition-all shadow-xl flex items-center gap-2"
                             >
                               <span className="material-symbols-outlined text-lg">add</span>
                               Add Exercise Block
                             </button>
                          </div>
                          <div className="space-y-6">
                             {activeDay.exercises.map((ex, exIdx) => {
                                const isSuperSet = ex.format === 'SUPER_SET';
                                const nextIsSS = activeDay.exercises[exIdx+1]?.format === 'SUPER_SET';
                                const prevIsSS = activeDay.exercises[exIdx-1]?.format === 'SUPER_SET';
                                const inSS = isSuperSet && (nextIsSS || prevIsSS);

                                return (
                                  <div key={ex.id} className={`p-8 rounded-[2.5rem] border transition-all relative group space-y-8 text-left ${inSS ? 'bg-blue-50/50 border-blue-300 border-l-[16px] border-l-blue-500' : 'bg-white border-neutral-100 shadow-sm'}`}>
                                     <div className="absolute top-6 right-6 flex items-center gap-4">
                                        <button onClick={() => setIsPickerOpen({ type: 'exercise', activeIndex: exIdx })} className="text-[10px] font-black uppercase text-accent hover:underline">Exercise Master</button>
                                        <button onClick={() => removeExercise(exIdx)} className="text-neutral-300 hover:text-red-500 transition-colors">
                                           <span className="material-symbols-outlined">delete</span>
                                        </button>
                                     </div>
                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                        <div className="space-y-6">
                                           <div className="grid grid-cols-2 gap-4">
                                              <div className="space-y-1">
                                                 <label className="text-[9px] font-black text-neutral-300 uppercase ml-1">Exercise</label>
                                                 <input type="text" value={ex.name} onChange={e => updateExercise(exIdx, 'name', e.target.value)} className="w-full bg-neutral-50 border border-neutral-100 rounded-xl p-3 font-bold text-sm outline-none" />
                                              </div>
                                              <div className="space-y-1">
                                                 <label className="text-[9px] font-black text-neutral-300 uppercase ml-1">Format</label>
                                                 <select value={ex.format} onChange={e => updateExercise(exIdx, 'format', e.target.value as any)} className="w-full bg-neutral-50 border border-neutral-100 rounded-xl p-3 font-black text-[10px] uppercase outline-none">
                                                    <option value="REGULAR">Regular</option>
                                                    <option value="SUPER_SET">Super Set</option>
                                                    <option value="EMOM">EMOM</option>
                                                 </select>
                                              </div>
                                           </div>
                                           <div className="grid grid-cols-3 gap-4">
                                              {['sets', 'reps', 'rest'].map(f => (
                                                <div key={f} className="text-center">
                                                   <label className="text-[9px] font-black text-neutral-300 uppercase">{f}</label>
                                                   <input type="text" value={(ex as any)[f]} onChange={e => updateExercise(exIdx, f as any, e.target.value)} className="w-full bg-neutral-50 border border-neutral-100 rounded-xl p-2 text-center font-black outline-none" />
                                                </div>
                                              ))}
                                           </div>
                                        </div>
                                        <div className="space-y-4">
                                           <div className="grid grid-cols-2 gap-4">
                                              <button onClick={() => setIsPickerOpen({ type: 'media', activeIndex: exIdx, activeField: 'imageUrl' })} className={`flex flex-col items-center justify-center p-4 rounded-xl transition-all ${ex.imageUrl ? 'bg-accent text-white' : 'bg-neutral-50 text-neutral-300'}`}>
                                                 <span className="material-symbols-outlined text-[20px]">{ex.imageUrl ? 'check_circle' : 'image'}</span>
                                                 <span className="text-[8px] font-black uppercase">Photo Ref</span>
                                              </button>
                                              <button onClick={() => setIsPickerOpen({ type: 'media', activeIndex: exIdx, activeField: 'videoUrl' })} className={`flex flex-col items-center justify-center p-4 rounded-xl transition-all ${ex.videoUrl ? 'bg-accent text-white' : 'bg-neutral-50 text-neutral-300'}`}>
                                                 <span className="material-symbols-outlined text-[20px]">{ex.videoUrl ? 'check_circle' : 'videocam'}</span>
                                                 <span className="text-[8px] font-black uppercase">Video Demo</span>
                                              </button>
                                           </div>
                                           <textarea rows={2} value={ex.description} onChange={e => updateExercise(exIdx, 'description', e.target.value)} placeholder="Blueprint Guidance..." className="w-full bg-neutral-50 border border-neutral-100 rounded-xl p-3 text-[11px] font-medium resize-none outline-none" />
                                        </div>
                                     </div>
                                  </div>
                                );
                             })}
                          </div>
                       </>
                    ) : (
                       <div className="h-full flex flex-col items-center justify-center text-neutral-200">
                          <span className="material-symbols-outlined text-8xl mb-4">architecture</span>
                          <p className="font-black uppercase tracking-widest text-sm">Select a timeline entry to begin structuring</p>
                       </div>
                    )}
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Shared Pickers */}
      {isPickerOpen.activeIndex !== null && isPickerOpen.type === 'exercise' && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-6 bg-black/95 backdrop-blur-xl animate-in fade-in duration-300 overflow-hidden">
           <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden relative flex flex-col max-h-[80vh]">
              <div className="p-10 border-b border-neutral-100 flex justify-between items-center bg-neutral-50/50 text-left">
                 <h3 className="text-2xl font-black font-display uppercase text-black text-left">Exercise Master Source</h3>
                 <button onClick={() => setIsPickerOpen({ type: 'exercise', activeIndex: null })} className="w-12 h-12 bg-white border border-neutral-100 rounded-xl flex items-center justify-center hover:bg-black hover:text-white transition-all shadow-sm">
                   <span className="material-symbols-outlined">close</span>
                 </button>
              </div>
              <div className="flex-1 overflow-y-auto p-10 no-scrollbar space-y-4">
                 {EXERCISE_LIBRARY.map(item => (
                    <button key={item.id} onClick={() => selectFromExerciseLibrary(item)} className="w-full flex items-center justify-between p-6 bg-neutral-50 rounded-[2rem] border border-neutral-100 hover:border-black transition-all group">
                       <div className="text-left space-y-1"><p className="text-lg font-black text-black uppercase tracking-tight">{item.name}</p><p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">{item.defaultFormat}</p></div>
                       <span className="material-symbols-outlined text-neutral-300 group-hover:text-black">playlist_add</span>
                    </button>
                 ))}
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default CoachWorkoutLibrary;
