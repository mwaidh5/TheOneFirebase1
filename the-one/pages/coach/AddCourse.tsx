
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { setDoc, doc } from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { Course, Exercise, WeekProgram, MealPlan, CourseLevel, MediaAsset, ExerciseTemplate, WorkoutTemplate, User } from '../../types';
import AICourseGenerator from '../../components/AICourseGenerator';

interface AddCourseProps {
  library: MediaAsset[];
  courses: Course[];
  exerciseLibrary: ExerciseTemplate[];
  workoutLibrary: WorkoutTemplate[];
  mealPlanLibrary: MealPlan[];
  currentUser: User;
}

const CoachAddCourse: React.FC<AddCourseProps> = ({ library, courses, exerciseLibrary, workoutLibrary, mealPlanLibrary, currentUser }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [courseData, setCourseData] = useState({
    id: isEdit ? id : String(Date.now()),
    title: '',
    description: '',
    category: 'CrossFit',
    level: 'Intermediate' as CourseLevel,
    price: 149,
    duration: '6 Weeks',
    image: '',
    hasMealPlan: false,
    instructor: '', // Will be set on save if empty
    enrollmentCount: 0,
    rating: 0
  });

  const [weeks, setWeeks] = useState<WeekProgram[]>([
    { id: 'w1', weekNumber: 1, days: [{ id: 'd1', dayNumber: 1, title: 'Session A', exercises: [] }] }
  ]);

  const [attachedMealPlan, setAttachedMealPlan] = useState<MealPlan | null>(null);
  const [activeWeekIdx, setActiveWeekIdx] = useState(0);
  const [activeDayIdx, setActiveDayIdx] = useState(0);
  const [activeTab, setActiveTab] = useState<'settings' | 'workouts' | 'nutrition'>('workouts');
  const [isPickerOpen, setIsPickerOpen] = useState<{ type: 'exercise' | 'workout' | 'meal' | 'media', activeExIdx: number | null, activeField?: 'imageUrl' | 'videoUrl' }>({ type: 'exercise', activeExIdx: null });
  const [isAIOpen, setIsAIOpen] = useState(false);

  useEffect(() => {
    if (isEdit) {
      const existing = courses.find(c => c.id === id);
      if (existing) {
        setCourseData({
          id: existing.id,
          title: existing.title,
          description: existing.description,
          category: existing.category || 'CrossFit',
          level: existing.level || 'Intermediate',
          price: existing.price,
          duration: existing.duration,
          image: existing.image,
          hasMealPlan: existing.hasMealPlan || false,
          instructor: existing.instructor || '',
          enrollmentCount: existing.enrollmentCount || 0,
          rating: existing.rating || 0
        });
        if (existing.weeks) setWeeks(existing.weeks);
        if (existing.mealPlan) setAttachedMealPlan(existing.mealPlan);
      }
    }
  }, [id, isEdit, courses]);

  const addWeek = () => {
    const nextNum = weeks.length + 1;
    setWeeks([...weeks, { id: Math.random().toString(), weekNumber: nextNum, days: [{ id: Math.random().toString(), dayNumber: 1, title: 'Session', exercises: [] }] }]);
  };

  const duplicateWeek = (weekIdx: number) => {
    const weekToCopy = weeks[weekIdx];
    const nextNum = weeks.length + 1;
    
    // Deep copy week with new IDs for everything to avoid reference issues
    const duplicatedWeek: WeekProgram = {
      ...weekToCopy,
      id: Math.random().toString(),
      weekNumber: nextNum,
      days: weekToCopy.days.map(day => ({
        ...day,
        id: Math.random().toString(),
        exercises: day.exercises.map(ex => ({
          ...ex,
          id: Math.random().toString()
        }))
      }))
    };
    
    setWeeks([...weeks, duplicatedWeek]);
    setActiveWeekIdx(weeks.length); // Switch to the new duplicated week
    setActiveDayIdx(0);
  };

  const deleteWeek = (weekIdx: number) => {
    if (weeks.length <= 1) return alert("You must have at least one week.");
    if (window.confirm(`Delete Week ${weeks[weekIdx].weekNumber}?`)) {
        const updated = weeks.filter((_, i) => i !== weekIdx).map((w, i) => ({ ...w, weekNumber: i + 1 }));
        setWeeks(updated);
        setActiveWeekIdx(0);
        setActiveDayIdx(0);
    }
  };

  const moveWeek = (idx: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && idx === 0) || (direction === 'down' && idx === weeks.length - 1)) return;
    const newIdx = direction === 'up' ? idx - 1 : idx + 1;
    const updated = [...weeks];
    const [moved] = updated.splice(idx, 1);
    updated.splice(newIdx, 0, moved);
    setWeeks(updated.map((w, i) => ({ ...w, weekNumber: i + 1 })));
    setActiveWeekIdx(newIdx);
  };

  const moveDay = (idx: number, direction: 'up' | 'down') => {
    const dayList = weeks[activeWeekIdx].days;
    if ((direction === 'up' && idx === 0) || (direction === 'down' && idx === dayList.length - 1)) return;
    const newIdx = direction === 'up' ? idx - 1 : idx + 1;
    const updatedDays = [...dayList];
    const [moved] = updatedDays.splice(idx, 1);
    updatedDays.splice(newIdx, 0, moved);
    
    const updatedWeeks = weeks.map((w, i) => i === activeWeekIdx ? { ...w, days: updatedDays.map((d, j) => ({ ...d, dayNumber: j + 1 })) } : w);
    setWeeks(updatedWeeks);
    setActiveDayIdx(newIdx);
  };

  const addDay = () => {
    const updatedWeeks = weeks.map((week, idx) => {
        if (idx !== activeWeekIdx) return week;
        const nextNum = week.days.length + 1;
        return {
            ...week,
            days: [...week.days, { id: Math.random().toString(), dayNumber: nextNum, title: 'New Day', exercises: [] }]
        };
    });
    setWeeks(updatedWeeks);
    setActiveDayIdx(updatedWeeks[activeWeekIdx].days.length - 1);
  };

  const addExercise = () => {
    const updatedWeeks = weeks.map((week, idx) => {
        if (idx !== activeWeekIdx) return week;
        return {
            ...week,
            days: week.days.map((day, dIdx) => {
                if (dIdx !== activeDayIdx) return day;
                return {
                    ...day,
                    exercises: [...day.exercises, { id: Math.random().toString(), name: '', format: 'REGULAR', sets: 3, reps: '10', rest: '60s' }]
                };
            })
        };
    });
    setWeeks(updatedWeeks);
  };

  const updateExercise = (exIdx: number, field: keyof Exercise, val: any) => {
    const updatedWeeks = weeks.map((week, idx) => {
        if (idx !== activeWeekIdx) return week;
        return {
            ...week,
            days: week.days.map((day, dIdx) => {
                if (dIdx !== activeDayIdx) return day;
                return {
                    ...day,
                    exercises: day.exercises.map((ex, eIdx) => {
                        if (eIdx !== exIdx) return ex;
                        return { ...ex, [field]: val };
                    })
                };
            })
        };
    });
    setWeeks(updatedWeeks);
  };

  const applyWorkoutBlueprint = (template: WorkoutTemplate) => {
    const templateExs = (template.weeks[0]?.days[0]?.exercises || []).map((ex: any) => ({
      ...ex,
      id: Math.random().toString()
    }));
    
    const updatedWeeks = weeks.map((week, idx) => {
        if (idx !== activeWeekIdx) return week;
        return {
            ...week,
            days: week.days.map((day, dIdx) => {
                if (dIdx !== activeDayIdx) return day;
                return {
                    ...day,
                    exercises: [...day.exercises, ...templateExs]
                };
            })
        };
    });
    setWeeks(updatedWeeks);
    setIsPickerOpen({ type: 'exercise', activeExIdx: null });
  };

  const handleMealPlanToggle = () => {
    const newState = !courseData.hasMealPlan;
    setCourseData({...courseData, hasMealPlan: newState});
    if (newState && !attachedMealPlan) setAttachedMealPlan({ id: 'mp-'+Math.random(), name: 'Plan', description: '', totalCalories: 2000, meals: [{ id: 'm1', label: 'Meal 1', items: [] }], isPublic: false });
    if (!newState && activeTab === 'nutrition') setActiveTab('workouts');
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

  const handlePublish = async () => {
    console.log("Publishing course...");
    if (!courseData.title) return alert("Title required");
    
    // Check if user is actually authenticated with Firebase (for real writes)
    // Note: If impersonating, auth.currentUser is Admin, so writes succeed.
    if (!auth.currentUser) {
        const confirm = window.confirm("You are not signed in to Firebase. This save will likely fail if Security Rules are active. Continue anyway?");
        if (!confirm) return;
    }

    // Sanitize weeks to ensure numbers are numbers and undefined values are handled
    const sanitizedWeeks = weeks.map(week => ({
        ...week,
        days: week.days.map(day => ({
            ...day,
            exercises: day.exercises.map(ex => ({
                ...ex,
                sets: Number(ex.sets) || 0,
                reps: String(ex.reps || ''),
                rest: String(ex.rest || ''),
                description: ex.description || '',
                imageUrl: ex.imageUrl || undefined,
                videoUrl: ex.videoUrl || undefined
            }))
        }))
    }));

    const sanitizedMealPlan = attachedMealPlan ? {
        ...attachedMealPlan,
        meals: attachedMealPlan.meals.map(m => ({
            ...m,
            items: m.items.map(i => ({
                ...i,
                calories: Number(i.calories) || 0,
                protein: Number(i.protein) || 0,
                carbs: Number(i.carbs) || 0,
                fat: Number(i.fat) || 0
            }))
        }))
    } : undefined;

    // Use passed currentUser for identity (handles impersonation correctly)
    const creatorId = currentUser.id;
    const instructorName = courseData.instructor || (`${currentUser.firstName} ${currentUser.lastName}`.trim() || 'Coach');

    const newCourse: any = {
        ...courseData,
        creatorId: creatorId,
        instructor: instructorName,
        weeks: sanitizedWeeks,
        mealPlan: sanitizedMealPlan,
        updatedAt: Date.now()
    };
    
    // Deep clean undefined values
    const finalCourse = cleanObject(newCourse);

    try {
        console.log("Attempting to save course to Firestore:", finalCourse);
        await setDoc(doc(db, 'courses', finalCourse.id), finalCourse);
        navigate(-1);
    } catch (error: any) {
        console.error("CRITICAL ERROR: Failed to save course to Firebase:", error);
        alert(`Failed to publish track: ${error.code || 'Unknown Error'} - ${error.message}`);
    }
  };

  const activeDay = weeks[activeWeekIdx]?.days[activeDayIdx];

  return (
    <div className="max-w-7xl mx-auto space-y-6 md:space-y-12 pb-24 text-left animate-in fade-in duration-500 px-4 md:px-0">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-4">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-neutral-400 hover:text-black text-[10px] md:text-xs font-black uppercase tracking-widest transition-colors"><span className="material-symbols-outlined text-base">arrow_back</span> Back</button>
          <h1 className="text-2xl md:text-4xl font-black font-display tracking-tight text-black uppercase leading-none">{isEdit ? 'Edit Track' : 'New Track'}</h1>
        </div>
        <div className="flex items-center gap-4">
           <div className="flex items-center gap-3 px-4 md:px-6 py-3 md:py-4 bg-white border border-neutral-100 rounded-2xl shadow-sm">
              <p className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-neutral-400">Meal Plan</p>
              <div onClick={handleMealPlanToggle} className={`w-10 md:w-12 h-5 md:h-6 rounded-full relative transition-colors cursor-pointer ${courseData.hasMealPlan ? 'bg-accent' : 'bg-neutral-200'}`}><div className={`absolute top-0.5 md:top-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 ${courseData.hasMealPlan ? 'translate-x-5 md:translate-x-7' : 'translate-x-1'}`}></div></div>
           </div>
           <button onClick={handlePublish} className="flex-1 md:flex-none px-6 md:px-10 py-4 md:py-5 bg-black text-white rounded-2xl font-black uppercase tracking-widest text-[10px] md:text-xs shadow-xl transition-all active:scale-95">Publish to Database</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-10">
        <div className="lg:col-span-3">
           <div className="bg-white rounded-[2rem] p-4 md:p-8 border border-neutral-100 shadow-sm flex flex-col">
              <div className="flex overflow-x-auto no-scrollbar gap-2 mb-4 md:flex-col md:overflow-visible">
                 <button onClick={() => setActiveTab('settings')} className={`whitespace-nowrap flex items-center gap-3 px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'settings' ? 'bg-black text-white shadow-lg' : 'text-neutral-400 bg-neutral-50 md:bg-transparent'}`}><span className="material-symbols-outlined text-base">settings</span> Settings</button>
                 
                  {weeks.map((week, wIdx) => (
                    <div key={week.id} className="relative group/week-btn">
                      <button 
                        onClick={() => { setActiveWeekIdx(wIdx); setActiveDayIdx(0); setActiveTab('workouts'); }} 
                        className={`w-full text-left whitespace-nowrap px-4 md:px-5 py-2.5 md:py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeWeekIdx === wIdx && activeTab === 'workouts' ? 'bg-black text-white shadow-lg' : 'text-neutral-400 bg-neutral-50 md:bg-transparent'}`}
                      >
                        Week {week.weekNumber}
                      </button>
                      <div className="md:absolute right-2 top-1/2 md:-translate-y-1/2 flex gap-1 opacity-0 group-hover/week-btn:opacity-100 transition-opacity">
                         <div className="flex flex-col gap-0.5">
                            <button onClick={(e) => { e.stopPropagation(); moveWeek(wIdx, 'up'); }} disabled={wIdx === 0} className="w-5 h-5 rounded-md bg-neutral-50 text-neutral-400 flex items-center justify-center hover:bg-black hover:text-white transition-all disabled:opacity-30 disabled:hover:bg-neutral-50 disabled:hover:text-neutral-400" title="Move Up">
                               <span className="material-symbols-outlined text-[10px]">keyboard_arrow_up</span>
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); moveWeek(wIdx, 'down'); }} disabled={wIdx === weeks.length - 1} className="w-5 h-5 rounded-md bg-neutral-50 text-neutral-400 flex items-center justify-center hover:bg-black hover:text-white transition-all disabled:opacity-30 disabled:hover:bg-neutral-50 disabled:hover:text-neutral-400" title="Move Down">
                               <span className="material-symbols-outlined text-[10px]">keyboard_arrow_down</span>
                            </button>
                         </div>
                         <button onClick={(e) => { e.stopPropagation(); duplicateWeek(wIdx); }} className="w-6 h-6 rounded-lg bg-accent/10 text-accent flex items-center justify-center hover:bg-accent hover:text-white transition-all shadow-sm" title="Duplicate Week">
                            <span className="material-symbols-outlined text-xs">content_copy</span>
                         </button>
                         <button onClick={(e) => { e.stopPropagation(); deleteWeek(wIdx); }} className="w-6 h-6 rounded-lg bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-sm" title="Delete Week">
                            <span className="material-symbols-outlined text-xs">delete</span>
                         </button>
                      </div>
                    </div>
                 ))}
                 
                 <button onClick={addWeek} className={`whitespace-nowrap px-4 py-2.5 bg-accent/5 text-accent rounded-xl border border-accent/20 text-[10px] font-black uppercase flex items-center justify-center gap-2 hover:bg-accent hover:text-white transition-all`}><span className="material-symbols-outlined text-xs">add</span> Week</button>
                 
                 {courseData.hasMealPlan && (
                    <button onClick={() => setActiveTab('nutrition')} className={`whitespace-nowrap flex items-center gap-3 px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'nutrition' ? 'bg-accent text-white shadow-lg' : 'text-neutral-400 bg-neutral-50 md:bg-transparent'}`}><span className="material-symbols-outlined text-base">restaurant</span> Plan</button>
                 )}
              </div>
              
              {activeTab === 'workouts' && (
                 <div className="flex flex-col gap-1 pt-4 border-t border-neutral-100 mt-4 max-h-[250px] overflow-y-auto no-scrollbar">
                    <p className="text-[8px] font-black text-neutral-300 uppercase tracking-widest mb-2 px-2">Days in Week {weeks[activeWeekIdx].weekNumber}</p>
                    {weeks[activeWeekIdx].days.map((day, dIdx) => (
                        <div key={day.id} className="relative group/day-btn">
                          <button onClick={() => setActiveDayIdx(dIdx)} className={`w-full text-left px-4 py-2 rounded-lg text-[10px] font-bold uppercase transition-all ${activeDayIdx === dIdx ? 'text-accent bg-accent/5' : 'text-neutral-400 hover:text-black'}`}>
                            Day {day.dayNumber}
                          </button>
                          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1 items-center opacity-0 group-hover/day-btn:opacity-100 transition-opacity">
                            <div className="flex flex-col gap-0.5">
                              <button onClick={(e) => { e.stopPropagation(); moveDay(dIdx, 'up'); }} disabled={dIdx === 0} className="w-4 h-4 rounded bg-neutral-50 text-neutral-400 flex items-center justify-center hover:bg-black hover:text-white transition-all disabled:opacity-30" title="Move Up">
                                <span className="material-symbols-outlined text-[8px]">keyboard_arrow_up</span>
                              </button>
                              <button onClick={(e) => { e.stopPropagation(); moveDay(dIdx, 'down'); }} disabled={dIdx === weeks[activeWeekIdx].days.length - 1} className="w-4 h-4 rounded bg-neutral-50 text-neutral-400 flex items-center justify-center hover:bg-black hover:text-white transition-all disabled:opacity-30" title="Move Down">
                                <span className="material-symbols-outlined text-[8px]">keyboard_arrow_down</span>
                              </button>
                            </div>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                if(weeks[activeWeekIdx].days.length <= 1) return;
                                const updated = weeks.map((w, i) => i === activeWeekIdx ? { ...w, days: w.days.filter((_, j) => j !== dIdx).map((d, k) => ({...d, dayNumber: k+1})) } : w);
                                setWeeks(updated);
                                setActiveDayIdx(0);
                              }} 
                              className="text-neutral-300 hover:text-red-500 transition-opacity"
                            >
                              <span className="material-symbols-outlined text-xs">close</span>
                            </button>
                          </div>
                        </div>
                    ))}
                    <button onClick={addDay} className="w-full text-left px-4 py-2 text-[10px] font-black uppercase text-neutral-300 hover:text-accent">+ Add Day</button>
                 </div>
              )}
           </div>
        </div>

        <div className="lg:col-span-9 space-y-6">
           {activeTab === 'settings' && (
              <div className="bg-white rounded-[2.5rem] p-6 md:p-12 border border-neutral-100 shadow-xl space-y-8 animate-in fade-in">
                 <h2 className="text-xl md:text-3xl font-black font-display uppercase tracking-tight">Track Identity</h2>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                       <div className="space-y-1"><label className="text-[9px] font-black uppercase text-neutral-400 ml-1">Title</label><input type="text" value={courseData.title} onChange={e => setCourseData({...courseData, title: e.target.value})} className="w-full bg-neutral-50 border border-neutral-100 rounded-xl p-3 md:p-4 font-black text-sm md:text-lg outline-none" /></div>
                       <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1"><label className="text-[9px] font-black uppercase text-neutral-400 ml-1">Category</label><select value={courseData.category} onChange={e => setCourseData({...courseData, category: e.target.value})} className="w-full bg-neutral-50 border border-neutral-100 rounded-xl p-3 md:p-4 font-black uppercase text-xs outline-none"><option>CrossFit</option><option>Weightlifting</option></select></div>
                            <div className="space-y-1"><label className="text-[9px] font-black uppercase text-neutral-400 ml-1">Price</label><input type="number" value={courseData.price} onChange={e => setCourseData({...courseData, price: parseInt(e.target.value)})} className="w-full bg-neutral-50 border border-neutral-100 rounded-xl p-3 md:p-4 font-black text-sm outline-none" /></div>
                       </div>
                    </div>
                    <div className="space-y-4">
                       <div className="space-y-1"><label className="text-[9px] font-black uppercase text-neutral-400 ml-1">Cover Asset</label><button onClick={() => setIsPickerOpen({ type: 'media', activeExIdx: 999 })} className={`w-full aspect-video rounded-2xl border-2 border-dashed flex flex-col items-center justify-center transition-all ${courseData.image ? 'border-transparent' : 'border-neutral-200 bg-neutral-50'}`}>{courseData.image ? <img src={courseData.image} className="w-full h-full object-cover rounded-2xl" /> : <span className="material-symbols-outlined text-3xl text-neutral-200">image</span>}</button></div>
                    </div>
                 </div>
              </div>
           )}

           {activeTab === 'workouts' && (
              <div className="bg-white rounded-[2.5rem] p-6 md:p-10 border border-neutral-100 shadow-xl space-y-8 animate-in fade-in">
                 <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-100 pb-6">
                    <div className="space-y-1">
                       <span className="text-[9px] font-black uppercase text-accent">W{weeks[activeWeekIdx].weekNumber}D{activeDay?.dayNumber}</span>
                       <input type="text" value={activeDay?.title || ''} onChange={e => {
                           const updatedWeeks = weeks.map((w, i) => i === activeWeekIdx ? { ...w, days: w.days.map((d, j) => j === activeDayIdx ? { ...d, title: e.target.value } : d) } : w);
                           setWeeks(updatedWeeks);
                       }} className="text-xl md:text-3xl font-black uppercase text-black bg-transparent outline-none w-full" />
                    </div>
                    <div className="flex gap-2">
                       <button onClick={() => setIsPickerOpen({ type: 'workout', activeExIdx: null })} className="px-4 py-2 bg-neutral-50 rounded-xl text-[9px] font-black uppercase border border-neutral-100 flex items-center gap-2"><span className="material-symbols-outlined text-base">library_add</span> Blueprint</button>
                       <button onClick={addExercise} className="px-4 py-2 bg-black text-white rounded-xl text-[9px] font-black uppercase flex items-center gap-2"><span className="material-symbols-outlined text-base">add</span> Exercise</button>
                    </div>
                 </div>
                 
                 <div className="space-y-6">
                    {activeDay?.exercises.map((ex, exIdx) => (
                       <div key={ex.id} className="p-5 md:p-8 bg-neutral-50 rounded-2xl md:rounded-[2.5rem] border border-neutral-100 relative group space-y-6">
                          <div className="absolute top-4 md:top-6 right-4 md:right-6 flex gap-3">
                             <button onClick={() => setIsPickerOpen({ type: 'exercise', activeExIdx: exIdx })} className="text-[9px] font-black text-accent uppercase flex items-center gap-1"><span className="material-symbols-outlined text-base">menu_book</span> Exercises Library</button>
                             <button onClick={() => {
                                 const updatedWeeks = weeks.map((w, i) => i === activeWeekIdx ? { ...w, days: w.days.map((d, j) => j === activeDayIdx ? { ...d, exercises: d.exercises.filter((_, k) => k !== exIdx) } : d) } : w);
                                 setWeeks(updatedWeeks);
                             }} className="text-neutral-300 hover:text-red-500"><span className="material-symbols-outlined text-lg">delete</span></button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                             <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1"><label className="text-[8px] font-black text-neutral-300 ml-1">Name</label><input type="text" value={ex.name} onChange={e => updateExercise(exIdx, 'name', e.target.value)} className="w-full bg-white border border-neutral-100 rounded-xl p-3 font-bold text-xs" /></div>
                                    <div className="space-y-1"><label className="text-[8px] font-black text-neutral-300 ml-1">Type</label><select value={ex.format} onChange={e => updateExercise(exIdx, 'format', e.target.value as any)} className="w-full bg-white border border-neutral-100 rounded-xl p-3 text-[9px] font-black uppercase outline-none">
                                      <option value="REGULAR">Standard (Straight Sets)</option>
                                      <option value="SUPER_SET">Superset / Circuit</option>
                                      <option value="EMOM">EMOM</option>
                                      <option value="AMRAP">AMRAP</option>
                                      <option value="HIIT">HIIT (Intervals)</option>
                                      <option value="CARDIO">Cardio (Monostructural)</option>
                                      <option value="MAX_EFFORT">Max Effort (1RM/3RM)</option>
                                      <option value="FOR_TIME">For Time</option>
                                    </select></div>
                                </div>
                                <div className="space-y-4">
                                   {/* Standard / Max Effort / Drop Set / Superset */}
                                   {(ex.format === 'REGULAR' || ex.format === 'MAX_EFFORT' || ex.format === 'DROP_SET' || ex.format === 'SUPER_SET') && (
                                      <div className="grid grid-cols-3 gap-2">
                                         <div className="text-center"><label className="text-[8px] font-black text-neutral-300 uppercase">Sets</label><input type="number" value={ex.sets} onChange={e => updateExercise(exIdx, 'sets', parseInt(e.target.value))} className="w-full bg-white border border-neutral-100 rounded-xl p-2.5 text-center font-black text-[10px]" /></div>
                                         <div className="text-center"><label className="text-[8px] font-black text-neutral-300 uppercase">Reps</label><input type="text" value={ex.reps} onChange={e => updateExercise(exIdx, 'reps', e.target.value)} className="w-full bg-white border border-neutral-100 rounded-xl p-2.5 text-center font-black text-[10px]" /></div>
                                         <div className="text-center"><label className="text-[8px] font-black text-neutral-300 uppercase">Rest</label><input type="text" value={ex.rest} onChange={e => updateExercise(exIdx, 'rest', e.target.value)} className="w-full bg-white border border-neutral-100 rounded-xl p-2.5 text-center font-black text-[10px]" /></div>
                                      </div>
                                   )}

                                   {/* Cardio / Monostructural */}
                                   {(ex.format === 'CARDIO' || ex.format === 'FOR_TIME') && (
                                      <div className="grid grid-cols-3 gap-2">
                                         <div className="text-center"><label className="text-[8px] font-black text-neutral-300 uppercase">Distance</label><input type="text" value={ex.distance || ''} onChange={e => updateExercise(exIdx, 'distance', e.target.value)} placeholder="5km" className="w-full bg-white border border-neutral-100 rounded-xl p-2.5 text-center font-black text-[10px]" /></div>
                                         <div className="text-center"><label className="text-[8px] font-black text-neutral-300 uppercase">Time Cap</label><input type="text" value={ex.time || ''} onChange={e => updateExercise(exIdx, 'time', e.target.value)} placeholder="20:00" className="w-full bg-white border border-neutral-100 rounded-xl p-2.5 text-center font-black text-[10px]" /></div>
                                         <div className="text-center"><label className="text-[8px] font-black text-neutral-300 uppercase">Pace/Cals</label><input type="text" value={ex.speed || ex.calories || ''} onChange={e => updateExercise(exIdx, 'speed', e.target.value)} placeholder="Zone 2" className="w-full bg-white border border-neutral-100 rounded-xl p-2.5 text-center font-black text-[10px]" /></div>
                                      </div>
                                   )}

                                   {/* EMOM / AMRAP / HIIT */}
                                   {(ex.format === 'EMOM' || ex.format === 'AMRAP' || ex.format === 'HIIT') && (
                                      <div className="space-y-2">
                                         <div className="grid grid-cols-2 gap-2">
                                            <div className="text-center"><label className="text-[8px] font-black text-neutral-300 uppercase">Total Time (Min)</label><input type="number" value={ex.durationMinutes || ''} onChange={e => updateExercise(exIdx, 'durationMinutes', parseInt(e.target.value))} className="w-full bg-white border border-neutral-100 rounded-xl p-2.5 text-center font-black text-[10px]" /></div>
                                            <div className="text-center"><label className="text-[8px] font-black text-neutral-300 uppercase">Rounds</label><input type="number" value={ex.rounds || ''} onChange={e => updateExercise(exIdx, 'rounds', parseInt(e.target.value))} className="w-full bg-white border border-neutral-100 rounded-xl p-2.5 text-center font-black text-[10px]" /></div>
                                         </div>
                                         {ex.format === 'HIIT' && (
                                            <div className="grid grid-cols-2 gap-2">
                                               <div className="text-center"><label className="text-[8px] font-black text-neutral-300 uppercase">Work</label><input type="text" value={ex.workInterval || ''} onChange={e => updateExercise(exIdx, 'workInterval', e.target.value)} placeholder="20s" className="w-full bg-white border border-neutral-100 rounded-xl p-2.5 text-center font-black text-[10px]" /></div>
                                               <div className="text-center"><label className="text-[8px] font-black text-neutral-300 uppercase">Rest</label><input type="text" value={ex.restInterval || ''} onChange={e => updateExercise(exIdx, 'restInterval', e.target.value)} placeholder="10s" className="w-full bg-white border border-neutral-100 rounded-xl p-2.5 text-center font-black text-[10px]" /></div>
                                            </div>
                                         )}
                                         {ex.format === 'EMOM' && (
                                            <div className="p-3 bg-orange-50 rounded-xl border border-orange-100 space-y-2">
                                               <p className="text-[8px] font-black uppercase text-orange-400">Exercises Per Round</p>
                                               {(ex.emomItems || []).map((item, itemIdx) => (
                                                  <div key={item.id} className="flex gap-2 items-center">
                                                     <input type="text" value={item.name} onChange={e => { const items = [...(ex.emomItems || [])]; items[itemIdx] = { ...items[itemIdx], name: e.target.value }; updateExercise(exIdx, 'emomItems', items); }} placeholder="Exercise name" className="flex-1 bg-white border border-orange-100 rounded-lg p-2 font-bold text-[10px] outline-none" />
                                                     <input type="text" value={item.time} onChange={e => { const items = [...(ex.emomItems || [])]; items[itemIdx] = { ...items[itemIdx], time: e.target.value }; updateExercise(exIdx, 'emomItems', items); }} placeholder="30s" className="w-16 bg-white border border-orange-100 rounded-lg p-2 text-center font-black text-[10px] outline-none" />
                                                     <button onClick={() => updateExercise(exIdx, 'emomItems', (ex.emomItems || []).filter((_, i) => i !== itemIdx))} className="text-orange-300 hover:text-red-500 transition-colors"><span className="material-symbols-outlined text-base">close</span></button>
                                                  </div>
                                               ))}
                                               <button onClick={() => updateExercise(exIdx, 'emomItems', [...(ex.emomItems || []), { id: String(Date.now()), name: '', time: '' }])} className="text-[8px] font-black uppercase text-orange-400 flex items-center gap-1 hover:text-orange-600 transition-colors">
                                                  <span className="material-symbols-outlined text-sm">add_circle</span> Add Exercise
                                               </button>
                                            </div>
                                         )}
                                      </div>
                                   )}

                                   {/* Superset Linker */}
                                   {ex.format === 'SUPER_SET' && (
                                       <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                                           <p className="text-[8px] font-black uppercase text-blue-400 mb-2">Circuit Grouping</p>
                                           <input type="text" value={ex.supersetId || ''} onChange={e => updateExercise(exIdx, 'supersetId', e.target.value)} placeholder="Group A" className="w-full bg-white border border-blue-100 rounded-lg p-2 text-[10px] font-bold" />
                                           <p className="text-[8px] text-blue-300 mt-1">Give consecutive exercises the same Group ID (e.g. "A") to link them.</p>
                                       </div>
                                   )}
                                </div>
                             </div>
                             <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-3">
                                    <button onClick={() => setIsPickerOpen({ type: 'media', activeExIdx: exIdx, activeField: 'imageUrl' })} className={`flex items-center justify-center gap-2 p-3 rounded-xl border transition-all ${ex.imageUrl ? 'bg-accent text-white border-accent' : 'bg-white border-neutral-100 text-neutral-300'}`}><span className="material-symbols-outlined text-base">image</span><span className="text-[8px] font-black uppercase">Photo</span></button>
                                    <button onClick={() => setIsPickerOpen({ type: 'media', activeExIdx: exIdx, activeField: 'videoUrl' })} className={`flex items-center justify-center gap-2 p-3 rounded-xl border transition-all ${ex.videoUrl ? 'bg-accent text-white border-accent' : 'bg-white border-neutral-100 text-neutral-300'}`}><span className="material-symbols-outlined text-base">videocam</span><span className="text-[8px] font-black uppercase">Video</span></button>
                                </div>
                                <textarea rows={1} value={ex.description} onChange={e => updateExercise(exIdx, 'description', e.target.value)} className="w-full bg-white border border-neutral-100 rounded-xl p-3 text-[10px] font-medium resize-none" placeholder="Coaching Notes..." />
                             </div>
                          </div>
                       </div>
                    ))}
                 </div>
              </div>
           )}

           {activeTab === 'nutrition' && attachedMealPlan && (
              <div className="bg-white rounded-[2.5rem] p-6 md:p-12 border border-neutral-100 shadow-xl space-y-10 animate-in fade-in">
                 <div className="flex justify-between items-center border-b border-neutral-100 pb-6">
                    <h2 className="text-xl md:text-3xl font-black font-display uppercase tracking-tight">Macro Strategy</h2>
                    <button onClick={() => setIsPickerOpen({ type: 'meal', activeExIdx: null })} className="px-4 py-2 bg-neutral-50 rounded-xl text-[9px] font-black uppercase flex items-center gap-2 border border-neutral-100"><span className="material-symbols-outlined text-base">library_add</span> Import</button>
                 </div>
                 <div className="space-y-8">
                    {attachedMealPlan.meals.map((meal, mIdx) => (
                       <div key={meal.id} className="p-6 bg-neutral-50 rounded-[2rem] border border-neutral-100 space-y-6 text-left">
                          <div className="flex justify-between items-center">
                             <input type="text" value={meal.label} onChange={e => { const n = {...attachedMealPlan}; n.meals[mIdx].label = e.target.value; setAttachedMealPlan(n); }} className="text-lg font-black uppercase bg-transparent outline-none w-full" />
                             <div className="flex gap-2">
                                <button onClick={() => { if(!attachedMealPlan)return; const n = {...attachedMealPlan}; n.meals[mIdx].items.push({ id: Math.random().toString(), name: '', amount: '', calories: 0, protein: 0, carbs: 0, fat: 0 }); setAttachedMealPlan(n); }} className="text-accent"><span className="material-symbols-outlined">add_circle</span></button>
                                <button onClick={() => { if(!attachedMealPlan)return; const n = {...attachedMealPlan}; n.meals.splice(mIdx, 1); setAttachedMealPlan(n); }} className="text-neutral-300"><span className="material-symbols-outlined">delete</span></button>
                             </div>
                          </div>
                          <div className="space-y-3">
                             {meal.items.map((food, fIdx) => (
                                <div key={food.id} className="flex flex-col md:grid md:grid-cols-12 gap-3 bg-white p-3 rounded-xl border border-neutral-50">
                                   <div className="md:col-span-4"><label className="text-[7px] font-black uppercase text-neutral-300">Food</label><input type="text" value={food.name} onChange={e => { if(!attachedMealPlan)return; const n = {...attachedMealPlan}; n.meals[mIdx].items[fIdx].name = e.target.value; setAttachedMealPlan(n); }} className="w-full bg-neutral-50 p-2 rounded-lg text-[10px] font-bold border-none outline-none" /></div>
                                   <div className="md:col-span-2"><label className="text-[7px] font-black uppercase text-neutral-300">Amount</label><input type="text" value={food.amount} onChange={e => { if(!attachedMealPlan)return; const n = {...attachedMealPlan}; n.meals[mIdx].items[fIdx].amount = e.target.value; setAttachedMealPlan(n); }} className="w-full bg-neutral-50 p-2 rounded-lg text-[10px] font-bold border-none outline-none" /></div>
                                   <div className="md:col-span-5 grid grid-cols-4 gap-2">
                                      {['calories', 'protein', 'carbs', 'fat'].map(m => (
                                        <div key={m} className="text-center"><label className="text-[7px] font-black uppercase text-neutral-300">{m.substr(0,1)}</label><input type="number" value={(food as any)[m]} onChange={e => { const n = {...attachedMealPlan}; (n.meals[mIdx].items[fIdx] as any)[m] = parseInt(e.target.value); setAttachedMealPlan(n); }} className="w-full bg-neutral-50 p-2 rounded-lg text-[9px] font-black text-center border-none outline-none" /></div>
                                      ))}
                                   </div>
                                   <div className="md:col-span-1 flex justify-end items-center"><button onClick={() => { const n = {...attachedMealPlan}; n.meals[mIdx].items.splice(fIdx, 1); setAttachedMealPlan(n); }} className="text-neutral-300 hover:text-red-500"><span className="material-symbols-outlined text-base">close</span></button></div>
                                </div>
                             ))}
                          </div>
                       </div>
                    ))}
                    <button onClick={() => { setAttachedMealPlan({...attachedMealPlan!, meals: [...attachedMealPlan!.meals, { id: Math.random().toString(), label: `Meal ${attachedMealPlan!.meals.length+1}`, items: [] }]}); }} className="w-full py-3 border-2 border-dashed border-neutral-200 rounded-2xl text-[10px] font-black uppercase text-neutral-400">+ Add Meal Block</button>
                 </div>
              </div>
           )}
        </div>
      </div>

      {/* Lib Picker */}
      {isPickerOpen.type !== 'media' && isPickerOpen.activeExIdx !== null && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl animate-in fade-in">
           <div className="bg-white w-full max-w-xl rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
              <div className="p-6 border-b border-neutral-100 flex justify-between items-center bg-neutral-50/50 text-left"><h3 className="text-xl font-black uppercase text-black">{isPickerOpen.type === 'exercise' ? 'Exercises' : isPickerOpen.type === 'workout' ? 'Workouts' : 'Meal Plans'}</h3><button onClick={() => setIsPickerOpen({ type: 'exercise', activeExIdx: null })} className="w-10 h-10 bg-white border border-neutral-100 rounded-xl flex items-center justify-center"><span className="material-symbols-outlined">close</span></button></div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
                 {isPickerOpen.type === 'exercise' ? exerciseLibrary.map(ex => (
                    <button key={ex.id} onClick={() => { updateExercise(isPickerOpen.activeExIdx!, 'name', ex.name); updateExercise(isPickerOpen.activeExIdx!, 'format', ex.defaultFormat); setIsPickerOpen({ type: 'exercise', activeExIdx: null }); }} className="w-full flex items-center justify-between p-4 bg-neutral-50 rounded-2xl border border-neutral-100 hover:border-black transition-all group text-left"><div><p className="text-sm font-black uppercase">{ex.name}</p><p className="text-[8px] font-bold text-neutral-400 uppercase">{ex.defaultFormat}</p></div><span className="material-symbols-outlined text-neutral-300 group-hover:text-black">add</span></button>
                )) : isPickerOpen.type === 'workout' ? workoutLibrary.map(wo => (
                    <button key={wo.id} onClick={() => applyWorkoutBlueprint(wo)} className="w-full flex items-center justify-between p-4 bg-neutral-50 rounded-2xl border border-neutral-100 hover:border-black transition-all group text-left"><div><p className="text-sm font-black uppercase">{wo.name}</p></div><span className="material-symbols-outlined text-neutral-300 group-hover:text-black">add</span></button>
                )) : mealPlanLibrary.map(plan => (
                    <button key={plan.id} onClick={() => { setAttachedMealPlan({...plan, id: 'mp-'+Math.random()}); setIsPickerOpen({ type: 'exercise', activeExIdx: null }); }} className="w-full flex items-center justify-between p-4 bg-neutral-50 rounded-2xl border border-neutral-100 hover:border-black transition-all group text-left"><div><p className="text-sm font-black uppercase">{plan.name}</p><p className="text-[8px] font-bold text-neutral-400 uppercase">{plan.totalCalories} kcal</p></div><span className="material-symbols-outlined text-neutral-300 group-hover:text-black">add</span></button>
                ))}
                {((isPickerOpen.type === 'exercise' && exerciseLibrary.length === 0) || (isPickerOpen.type === 'workout' && workoutLibrary.length === 0) || (isPickerOpen.type === 'meal' && mealPlanLibrary.length === 0)) && <p className="text-center text-xs text-neutral-400 py-10">Library is empty.</p>}
              </div>
           </div>
        </div>
      )}

      {isPickerOpen.type === 'media' && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl animate-in fade-in">
          <div className="bg-white w-full max-w-4xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-6 border-b border-neutral-100 flex justify-between items-center bg-neutral-50/50 text-left"><h3 className="text-xl font-black uppercase tracking-tight">Library Gallery</h3><button onClick={() => setIsPickerOpen({ type: 'exercise', activeExIdx: null })} className="w-10 h-10 rounded-xl bg-white border border-neutral-100 flex items-center justify-center shadow-sm"><span className="material-symbols-outlined">close</span></button></div>
            <div className="flex-1 overflow-y-auto p-6 grid grid-cols-2 md:grid-cols-4 gap-4 no-scrollbar">
              {library.filter(a => a.category === 'WORKOUT').map(asset => (
                <div key={asset.id} onClick={() => { if(isPickerOpen.activeExIdx === 999) setCourseData({...courseData, image: asset.data}); else updateExercise(isPickerOpen.activeExIdx!, isPickerOpen.activeField!, asset.data); setIsPickerOpen({ type: 'exercise', activeExIdx: null }); }} className="aspect-square rounded-2xl overflow-hidden border border-neutral-100 bg-neutral-50 cursor-pointer hover:ring-2 hover:ring-accent transition-all relative group">
                  <img src={asset.data} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"><span className="text-[8px] font-black uppercase text-white tracking-widest px-3 py-1.5 bg-accent rounded-full">Apply</span></div>
                </div>
              ))}
              {library.filter(a => a.category === 'WORKOUT').length === 0 && <p className="col-span-full text-center text-xs text-neutral-400 py-10">No workout media found.</p>}
            </div>
          </div>
        </div>
      )}
      {isAIOpen && (
        <AICourseGenerator
          context="course"
          currentWeeks={weeks}
          onGenerated={(generatedWeeks) => setWeeks(generatedWeeks)}
          onClose={() => setIsAIOpen(false)}
        />
      )}
    </div>
  );
};

export default CoachAddCourse;
