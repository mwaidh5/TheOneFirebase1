
import React, { useState, useRef, useMemo } from 'react';
import { setDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { WorkoutTemplate, Exercise, ExerciseFormat, MediaAsset, WeekProgram, DayProgram, User, UserRole, ExerciseTemplate as ExTemplate } from '../../types';
import { useT } from '../../i18n/I18nContext';
import type { TranslationKey } from '../../i18n/translations';

const CATEGORY_LABELS: Record<string, TranslationKey> = {
  Strength: 'coach.workouts.cat_strength',
  Metcon: 'coach.workouts.cat_metcon',
  Gymnastics: 'coach.workouts.cat_gymnastics',
};

const FORMAT_LABELS: Record<string, TranslationKey> = {
  REGULAR: 'coach.format.regular',
  EMOM: 'coach.format.emom',
  SUPER_SET: 'coach.format.super_set',
  CIRCUIT: 'coach.format.circuit',
  DROP_SET: 'coach.format.drop_set',
  AMRAP: 'coach.format.amrap',
  FOR_TIME: 'coach.format.for_time',
  HIIT: 'coach.format.hiit',
  CARDIO: 'coach.format.cardio',
  MAX_EFFORT: 'coach.format.max_effort',
  HOLD: 'coach.format.hold',
};

const FIELD_LABELS: Record<string, TranslationKey> = {
  sets: 'workout.sets',
  reps: 'workout.reps_short',
  rest: 'workout.rest',
};

interface WorkoutLibraryProps {
  library: MediaAsset[];
  currentUser: User;
  workoutLibrary: WorkoutTemplate[];
  exerciseLibrary: ExTemplate[];
}

const CoachWorkoutLibrary: React.FC<WorkoutLibraryProps> = ({ library, currentUser, workoutLibrary, exerciseLibrary }) => {
  const { t } = useT();
  const catLabel = (c?: string) => (c && CATEGORY_LABELS[c] ? t(CATEGORY_LABELS[c]) : c || '');
  const formatLabel = (f?: string) => (f && FORMAT_LABELS[f] ? t(FORMAT_LABELS[f]) : f || '');
  const [editingWorkout, setEditingWorkout] = useState<WorkoutTemplate | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const displayWorkouts = useMemo(() => {
    return workoutLibrary.filter(wo => {
      const matchesSearch = wo.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           wo.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           wo.creatorName?.toLowerCase().includes(searchQuery.toLowerCase());
      // Strict filtering: Only Admin sees all; Coach sees only their own.
      const hasPermission = currentUser.role === UserRole.ADMIN || wo.creatorId === currentUser.id || wo.isPublic === true;
      return matchesSearch && hasPermission;
    });
  }, [workoutLibrary, currentUser, searchQuery]);

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

  const cleanObject = (obj: any): any => {
    if (Array.isArray(obj)) return obj.map(cleanObject);
    if (typeof obj === 'object' && obj !== null) {
      const res: any = {};
      Object.keys(obj).forEach(key => {
        const val = obj[key];
        if (val !== undefined) {
          res[key] = cleanObject(val);
        }
      });
      return res;
    }
    return obj;
  };

  const handleSave = async () => {
    if (!activeWo.name) return;
    const id = activeWo.id || Math.random().toString(36).substr(2, 9);
    
    // Explicitly handle all fields and map weeks/days/exercises
    const completeWo: WorkoutTemplate = {
      id,
      name: activeWo.name || '',
      description: activeWo.description || '',
      category: activeWo.category || 'Strength',
      isPublic: activeWo.isPublic ?? true,
      creatorId: activeWo.creatorId || currentUser.id,
      creatorName: activeWo.creatorName || `${currentUser.firstName} ${currentUser.lastName}`,
      weeks: (activeWo.weeks || []).map(w => ({
        id: w.id,
        weekNumber: Number(w.weekNumber) || 1,
        days: (w.days || []).map(d => ({
          id: d.id,
          dayNumber: Number(d.dayNumber) || 1,
          title: d.title || '',
          exercises: (d.exercises || []).map(e => ({
            id: e.id,
            name: e.name || '',
            format: e.format || 'REGULAR',
            description: e.description || '',
            sets: Number(e.sets) || 0,
            reps: String(e.reps || ''),
            rest: String(e.rest || ''),
            imageUrl: e.imageUrl || undefined,
            videoUrl: e.videoUrl || undefined
          }))
        }))
      }))
    };

    const finalWo = cleanObject(completeWo);

    try {
      await setDoc(doc(db, 'workouts', id), finalWo);
      // Alert removed
      setIsAdding(false);
      setEditingWorkout(null);
    } catch (error) {
      console.error("Error saving workout:", error);
      alert(t('coach.workouts.save_failed'));
    }
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

  const selectFromExerciseLibrary = (libItem: ExTemplate) => {
    if (isPickerOpen.activeIndex !== null) {
      updateExercise(isPickerOpen.activeIndex, 'name', libItem.name);
      updateExercise(isPickerOpen.activeIndex, 'format', libItem.defaultFormat);
      updateExercise(isPickerOpen.activeIndex, 'description', libItem.description);
      updateExercise(isPickerOpen.activeIndex, 'imageUrl', libItem.imageUrl);
      updateExercise(isPickerOpen.activeIndex, 'videoUrl', libItem.videoUrl);
      setIsPickerOpen({ type: 'exercise', activeIndex: null });
    }
  };

  const removeWo = async (id: string) => {
    if (window.confirm(t('coach.workouts.confirm_delete'))) {
      try {
        await deleteDoc(doc(db, 'workouts', id));
        // Alert removed
      } catch (error) {
        console.error("Error removing workout:", error);
        alert(t('coach.workouts.remove_failed'));
      }
    }
  };

  const activeDay = activeWo.weeks?.[activeWeekIdx]?.days[activeDayIdx];

  return (
    <div className="space-y-12 text-start animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-black font-display tracking-tight text-black uppercase">{t('coach.workouts.title')}</h1>
          <p className="text-neutral-400 font-medium">{t('coach.workouts.subtitle')}</p>
        </div>
        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-64 min-w-[200px]">
            <span className="material-symbols-outlined absolute start-4 top-1/2 -translate-y-1/2 text-neutral-300">search</span>
            <input 
              type="text" 
              placeholder={t('coach.workouts.search_placeholder')} 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-neutral-100 rounded-2xl py-3.5 ps-12 pe-6 text-sm font-bold shadow-sm outline-none focus:border-black transition"
            />
          </div>
          <button 
            onClick={startAdding}
            className="px-8 py-4 bg-black text-white font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-neutral-800 transition shadow-xl flex items-center gap-2"
          >
            <span className="material-symbols-outlined">add</span>
            {t('coach.workouts.new')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {displayWorkouts.map((wo) => {
          const isOwner = currentUser.role === UserRole.ADMIN || wo.creatorId === currentUser.id;
          return (
            <div key={wo.id} className="bg-white rounded-[2.5rem] p-10 border border-neutral-100 shadow-sm hover:shadow-2xl transition group relative overflow-hidden flex flex-col h-full">
              <div className="flex justify-between items-start mb-8 relative z-10">
                <div className="space-y-2">
                  <span className="text-[10px] font-black text-accent uppercase tracking-widest block">{t('coach.workouts.category_cycle', { category: catLabel(wo.category) })}</span>
                  <h3 className="text-2xl font-black text-black uppercase tracking-tight leading-none">{wo.name}</h3>
                </div>
                {isOwner && (
                  <div className="flex gap-2">
                    <button onClick={() => startEditing(wo)} aria-label={t('common.edit')} title={t('common.edit')} className="p-3 bg-neutral-50 rounded-xl text-neutral-400 hover:bg-black hover:text-white transition shadow-sm">
                      <span className="material-symbols-outlined text-xl">edit</span>
                    </button>
                    <button onClick={() => removeWo(wo.id)} aria-label={t('common.delete')} title={t('common.delete')} className="p-3 bg-neutral-50 rounded-xl text-neutral-400 hover:bg-red-500 hover:text-white transition shadow-sm">
                      <span className="material-symbols-outlined text-xl">delete</span>
                    </button>
                  </div>
                )}
              </div>
              <p className="text-sm text-neutral-400 font-medium leading-relaxed mb-10 italic flex-grow relative z-10">"{wo.description || t('coach.workouts.no_description')}"</p>
              
              <div className="flex items-center justify-between pt-6 border-t border-neutral-50 relative z-10">
                <div className="flex items-center gap-2 overflow-hidden me-4">
                  <div className="flex items-center gap-1.5 px-2 py-0.5 bg-neutral-50 rounded-lg border border-neutral-100 shrink-0">
                    <span className={`material-symbols-outlined text-[14px] ${wo.isPublic ? 'text-green-500' : 'text-neutral-300'}`}>
                      {wo.isPublic ? 'public' : 'lock_person'}
                    </span>
                    <p className="text-[8px] font-black text-neutral-400 uppercase truncate max-w-[80px]">{wo.creatorName || t('coach.meals.system')}</p>
                  </div>
                  <span className="text-neutral-200 text-xs font-bold shrink-0">•</span>
                  <div className="flex items-center gap-2 text-neutral-300 shrink-0">
                    <span className="material-symbols-outlined text-[18px]">calendar_month</span>
                    <span className="text-[10px] font-black uppercase tracking-widest">{t('coach.workouts.week_count', { n: wo.weeks.length })}</span>
                  </div>
                </div>
              </div>
              <span className="material-symbols-outlined text-[140px] absolute -bottom-10 -end-10 text-neutral-50 select-none -rotate-12 group-hover:rotate-0 transition-transform duration-700">library_books</span>
            </div>
          );
        })}
        {displayWorkouts.length === 0 && (
          <div className="col-span-full py-20 text-center space-y-4">
            <span className="material-symbols-outlined text-6xl text-neutral-100">search_off</span>
            <p className="text-neutral-300 font-black uppercase tracking-[0.2em]">{t('coach.workouts.empty')}</p>
          </div>
        )}
      </div>

      {/* Full Screen Builder Modal */}
      {isAdding && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-0 md:p-6 bg-black/95 backdrop-blur-xl animate-in fade-in duration-300 overflow-hidden">
           <div className="bg-neutral-50 w-full max-w-[100%] md:max-w-[95%] rounded-none md:rounded-[4rem] shadow-2xl overflow-hidden relative flex flex-col h-full md:h-[95vh]">
              {/* COMPACT HEADER */}
              <div className="p-3 md:p-10 border-b border-neutral-100 flex justify-between items-center bg-white shrink-0 gap-4">
                 <div className="text-start flex-1">
                    <h3 className="hidden md:block text-2xl font-black font-display uppercase tracking-tight">{editingWorkout ? t('coach.workouts.refine') : t('coach.workouts.architect')}</h3>
                    <div className="flex gap-2 md:gap-6 items-center">
                       <input 
                          type="text" 
                          value={activeWo.name}
                          onChange={e => setActiveWo({ ...activeWo, name: e.target.value })}
                          placeholder={t('coach.workouts.name_placeholder')}
                          className="text-sm md:text-lg font-black uppercase tracking-tight text-black bg-transparent outline-none focus:text-accent border-b border-neutral-100 w-full md:w-80" 
                       />
                       <div className="hidden md:flex gap-4 items-center">
                          <select 
                             value={activeWo.category}
                             onChange={e => setActiveWo({ ...activeWo, category: e.target.value })}
                             className="bg-neutral-50 border border-neutral-100 rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest outline-none"
                          >
                             <option value="Strength">{t('coach.workouts.cat_strength')}</option>
                             <option value="Metcon">{t('coach.workouts.cat_metcon')}</option>
                             <option value="Gymnastics">{t('coach.workouts.cat_gymnastics')}</option>
                          </select>
                          <div className="flex items-center gap-3 px-4 py-2 bg-neutral-50 rounded-xl border border-neutral-100">
                             <p className="text-[9px] font-black uppercase text-neutral-400">{t('coach.meals.public')}</p>
                             <div 
                                onClick={() => setActiveWo({...activeWo, isPublic: !activeWo.isPublic})}
                                className={`w-11 h-6 rounded-full relative transition-colors cursor-pointer shrink-0 ${activeWo.isPublic ? 'bg-accent' : 'bg-neutral-200'}`}
                              >
                                <div className={`absolute top-1 start-0 w-4 h-4 bg-white rounded-full transition-transform duration-200 ${activeWo.isPublic ? 'translate-x-6 rtl:-translate-x-6' : 'translate-x-1 rtl:-translate-x-1'}`}></div>
                             </div>
                          </div>
                       </div>
                    </div>
                 </div>
                 <div className="flex gap-2 shrink-0">
                    <button 
                      onClick={handleSave}
                      aria-label={t('coach.workouts.save')}
                      className="px-4 md:px-10 py-3 md:py-5 bg-black text-white rounded-xl md:rounded-2xl font-black uppercase tracking-widest text-[10px] md:text-xs hover:bg-neutral-800 transition shadow-xl flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-sm md:text-base">save</span>
                      <span className="hidden md:inline">{t('coach.workouts.save')}</span>
                    </button>
                    <button onClick={() => setIsAdding(false)} aria-label={t('common.close')} className="w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-white border border-neutral-100 flex items-center justify-center hover:bg-red-500 hover:text-white transition shadow-sm">
                        <span className="material-symbols-outlined text-sm md:text-base">close</span>
                    </button>
                 </div>
              </div>

              <div className="flex-1 overflow-hidden flex flex-col md:grid md:grid-cols-12">
                 {/* NAVIGATION (Weeks & Days) */}
                 <div className="md:col-span-2 border-e border-neutral-100 bg-white overflow-hidden flex flex-col shrink-0">
                    <div className="p-3 md:p-6 flex md:flex-col overflow-x-auto md:overflow-y-auto no-scrollbar gap-2 border-b md:border-b-0 border-neutral-100">
                       <button onClick={addWeek} aria-label={t('coach.workouts.add_week')} title={t('coach.workouts.add_week')} className="hidden md:flex items-center justify-center p-2 mb-4 bg-accent/5 text-accent rounded-xl border border-accent/20 hover:bg-accent hover:text-white transition">
                          <span className="material-symbols-outlined">add_circle</span>
                       </button>
                       {activeWo.weeks?.map((week, wIdx) => (
                          <button 
                            key={week.id} 
                            onClick={() => { setActiveWeekIdx(wIdx); setActiveDayIdx(0); }}
                            className={`whitespace-nowrap px-3 md:px-4 py-2 rounded-lg text-[9px] md:text-[10px] font-black uppercase tracking-widest transition shrink-0 ${activeWeekIdx === wIdx ? 'bg-black text-white shadow-md' : 'text-neutral-400 bg-neutral-50 hover:bg-neutral-100'}`}
                          >
                            {t('coach.workouts.week_short', { n: week.weekNumber })}
                          </button>
                       ))}
                       <button onClick={addWeek} aria-label={t('coach.workouts.add_week')} className="md:hidden flex items-center justify-center px-3 py-2 bg-accent/5 text-accent rounded-lg border border-accent/20">
                          <span className="material-symbols-outlined text-sm">add</span>
                       </button>
                    </div>
                    
                    {/* Days within active week (Mobile Only row) */}
                    <div className="md:hidden flex overflow-x-auto no-scrollbar px-3 py-2 bg-neutral-50/50 gap-2 border-b border-neutral-100">
                        {activeWo.weeks?.[activeWeekIdx]?.days.map((day, dIdx) => (
                            <button 
                              key={day.id} 
                              onClick={() => setActiveDayIdx(dIdx)}
                              className={`whitespace-nowrap px-3 py-1.5 rounded-md text-[8px] font-black uppercase tracking-tight transition shrink-0 ${activeDayIdx === dIdx ? 'text-white bg-accent shadow-sm' : 'text-neutral-400 bg-white border border-neutral-100'}`}
                            >
                                {t('coach.workouts.day_short', { n: day.dayNumber })}
                            </button>
                        ))}
                        <button onClick={addDay} className="whitespace-nowrap px-3 py-1.5 rounded-md text-[8px] font-black uppercase tracking-tight text-accent bg-accent/5 border border-accent/20 shrink-0">{t('coach.workouts.add_day_short')}</button>
                    </div>

                    {/* Desktop Days List */}
                    <div className="hidden md:block flex-1 overflow-y-auto p-4 space-y-1">
                        {activeWo.weeks?.[activeWeekIdx]?.days.map((day, dIdx) => (
                            <button 
                                key={day.id} 
                                onClick={() => setActiveDayIdx(dIdx)}
                                className={`w-full text-start px-3 py-2 rounded-lg text-[10px] font-bold uppercase transition ${activeDayIdx === dIdx ? 'text-accent bg-accent/5' : 'text-neutral-400 hover:bg-neutral-50'}`}
                            >
                                {t('coach.workouts.day_n', { n: day.dayNumber })}
                            </button>
                        ))}
                        <button onClick={addDay} className="w-full text-start px-3 py-2 text-[10px] font-black uppercase text-neutral-300 hover:text-accent">+ {t('coach.workouts.add_day')}</button>
                    </div>
                 </div>

                 {/* BUILDER PANEL */}
                 <div className="md:col-span-10 p-4 md:p-10 overflow-y-auto no-scrollbar space-y-6 md:space-y-10 bg-neutral-50 flex-1">
                    {activeDay ? (
                       <>
                          <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-neutral-100 pb-4 md:pb-8 text-start gap-4">
                             <div className="space-y-1 flex-1">
                                <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-accent">{t('coach.workouts.structuring', { w: activeWeekIdx + 1, d: activeDayIdx + 1 })}</span>
                                <input 
                                   type="text" 
                                   value={activeDay.title}
                                   onChange={e => {
                                      const nextWeeks = [...activeWo.weeks!];
                                      nextWeeks[activeWeekIdx].days[activeDayIdx].title = e.target.value;
                                      setActiveWo({...activeWo, weeks: nextWeeks});
                                   }}
                                   className="text-lg md:text-4xl font-black uppercase tracking-tight text-black bg-transparent outline-none w-full"
                                   placeholder={t('coach.workouts.day_title_placeholder')}
                                />
                             </div>
                             <button 
                               onClick={addExercise}
                               className="w-full md:w-auto px-6 md:px-8 py-3 md:py-4 bg-black text-white rounded-xl md:rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-widest hover:bg-accent transition shadow-xl flex items-center justify-center gap-2"
                             >
                               <span className="material-symbols-outlined text-base md:text-lg">add</span>
                               {t('coach.workouts.add_exercise')}
                             </button>
                          </div>
                          <div className="space-y-4 md:space-y-6">
                             {activeDay.exercises.map((ex, exIdx) => (
                                <div key={ex.id} className="p-5 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] bg-white border border-neutral-100 shadow-sm relative group space-y-6 text-start transition hover:shadow-md">
                                     <div className="absolute top-4 md:top-6 end-4 md:end-6 flex items-center gap-2">
                                        <button onClick={() => setIsPickerOpen({ type: 'exercise', activeIndex: exIdx })} aria-label={t('coach.workouts.pick_from_library')} title={t('coach.workouts.pick_from_library')} className="p-2 text-accent hover:bg-accent/5 rounded-lg transition">
                                           <span className="material-symbols-outlined text-lg">category</span>
                                        </button>
                                        <button onClick={() => removeExercise(exIdx)} aria-label={t('common.delete')} title={t('common.delete')} className="p-2 text-neutral-300 hover:text-red-500 rounded-lg transition">
                                           <span className="material-symbols-outlined text-lg">delete</span>
                                        </button>
                                     </div>
                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-4">
                                           <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                              <div className="space-y-1">
                                                 <label className="text-[8px] font-black text-neutral-300 uppercase ms-1">{t('coach.workouts.field_name')}</label>
                                                 <input type="text" value={ex.name} onChange={e => updateExercise(exIdx, 'name', e.target.value)} className="w-full bg-neutral-50 border border-neutral-100 rounded-xl p-2.5 font-bold text-xs outline-none" />
                                              </div>
                                              <div className="space-y-1">
                                                 <label className="text-[8px] font-black text-neutral-300 uppercase ms-1">{t('coach.workouts.field_format')}</label>
                                                 <select value={ex.format} onChange={e => updateExercise(exIdx, 'format', e.target.value as any)} className="w-full bg-neutral-50 border border-neutral-100 rounded-xl p-2.5 font-black text-[9px] uppercase outline-none">
                                                    <option value="REGULAR">{t('coach.workouts.format_regular')}</option>
                                                    <option value="SUPER_SET">{t('coach.format.super_set')}</option>
                                                    <option value="EMOM">{t('coach.format.emom')}</option>
                                                 </select>
                                              </div>
                                           </div>
                                           {/* Conditionally show sets/reps/rest for all formats including SUPER_SET */}
                                           <div className="grid grid-cols-3 gap-2">
                                              {['sets', 'reps', 'rest'].map(f => (
                                                <div key={f} className="text-center">
                                                   <label className="text-[8px] font-black text-neutral-300 uppercase">{t(FIELD_LABELS[f])}</label>
                                                   <input type="text" value={(ex as any)[f]} onChange={e => updateExercise(exIdx, f as any, e.target.value)} className="w-full bg-neutral-50 border border-neutral-100 rounded-xl p-2 text-center font-black text-[10px] outline-none" />
                                                </div>
                                              ))}
                                           </div>
                                        </div>
                                        <div className="space-y-4">
                                           <div className="grid grid-cols-2 gap-3">
                                              <button onClick={() => setIsPickerOpen({ type: 'media', activeIndex: exIdx, activeField: 'imageUrl' })} className={`flex items-center justify-center gap-2 p-2.5 rounded-xl transition ${ex.imageUrl ? 'bg-accent text-white' : 'bg-neutral-50 text-neutral-300'}`}>
                                                 <span className="material-symbols-outlined text-base">{ex.imageUrl ? 'check' : 'image'}</span>
                                                 <span className="text-[8px] font-black uppercase">{t('coach.workouts.photo')}</span>
                                              </button>
                                              <button onClick={() => setIsPickerOpen({ type: 'media', activeIndex: exIdx, activeField: 'videoUrl' })} className={`flex items-center justify-center gap-2 p-2.5 rounded-xl transition ${ex.videoUrl ? 'bg-accent text-white' : 'bg-neutral-50 text-neutral-300'}`}>
                                                 <span className="material-symbols-outlined text-base">{ex.videoUrl ? 'check' : 'videocam'}</span>
                                                 <span className="text-[8px] font-black uppercase">{t('coach.workouts.video')}</span>
                                              </button>
                                           </div>
                                           <textarea rows={1} value={ex.description} onChange={e => updateExercise(exIdx, 'description', e.target.value)} placeholder={t('coach.workouts.guidance_placeholder')} className="w-full bg-neutral-50 border border-neutral-100 rounded-xl p-2.5 text-[10px] font-medium resize-none outline-none" />
                                        </div>
                                     </div>
                                  </div>
                             ))}
                          </div>
                       </>
                    ) : (
                       <div className="h-full flex flex-col items-center justify-center text-neutral-200 py-10">
                          <span className="material-symbols-outlined text-5xl md:text-8xl mb-4">architecture</span>
                          <p className="font-black uppercase tracking-widest text-[9px] md:text-sm text-center">{t('coach.workouts.select_week_day')}</p>
                       </div>
                    )}
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Shared Pickers */}
      {isPickerOpen.activeIndex !== null && isPickerOpen.type === 'exercise' && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl animate-in fade-in duration-300 overflow-hidden">
           <div className="bg-white w-full max-w-xl rounded-[2rem] shadow-2xl overflow-hidden relative flex flex-col max-h-[80vh]">
              <div className="p-6 border-b border-neutral-100 flex justify-between items-center bg-neutral-50/50 text-start">
                 <h3 className="text-xl font-black font-display uppercase text-black">{t('coach.workouts.master_library')}</h3>
                 <button onClick={() => setIsPickerOpen({ type: 'exercise', activeIndex: null })} aria-label={t('common.close')} className="w-10 h-10 bg-white border border-neutral-100 rounded-xl flex items-center justify-center hover:bg-black hover:text-white transition shadow-sm">
                   <span className="material-symbols-outlined">close</span>
                 </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 md:p-8 no-scrollbar space-y-3">
                 {exerciseLibrary.map(item => (
                    <button key={item.id} onClick={() => selectFromExerciseLibrary(item)} className="w-full flex items-center justify-between p-4 bg-neutral-50 rounded-2xl border border-neutral-100 hover:border-black transition group">
                       <div className="text-start"><p className="text-sm font-black text-black uppercase tracking-tight">{item.name}</p><p className="text-[8px] font-bold text-neutral-400 uppercase tracking-widest">{formatLabel(item.defaultFormat)}</p></div>
                       <span className="material-symbols-outlined text-neutral-300 group-hover:text-black">add</span>
                    </button>
                 ))}
                 {exerciseLibrary.length === 0 && <p className="text-center text-xs text-neutral-400 py-10">{t('coach.workouts.library_empty')}</p>}
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default CoachWorkoutLibrary;
