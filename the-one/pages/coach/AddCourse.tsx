
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { COURSES, EXERCISE_LIBRARY, WORKOUT_LIBRARY, MEAL_PLAN_LIBRARY } from '../../constants';
import { Exercise, ExerciseFormat, MediaAsset, WeekProgram, DayProgram, MealPlan, User, UserRole, FoodItem, Meal, CourseLevel } from '../../types';

interface AddCourseProps {
  library: MediaAsset[];
  setLibrary: React.Dispatch<React.SetStateAction<MediaAsset[]>>;
}

const CoachAddCourse: React.FC<AddCourseProps> = ({ library, setLibrary }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [courseData, setCourseData] = useState({
    title: '',
    description: '',
    category: 'CrossFit', // Default to CrossFit
    level: 'Intermediate' as CourseLevel,
    price: 149,
    duration: '6 Weeks',
    image: '',
    hasMealPlan: false,
    saveAsWorkoutBlueprint: false,
    saveAsMealBlueprint: false
  });

  const [weeks, setWeeks] = useState<WeekProgram[]>([
    {
      id: 'w1',
      weekNumber: 1,
      days: [
        { id: 'd1', dayNumber: 1, title: 'Session A', exercises: [] }
      ]
    }
  ]);

  const [attachedMealPlan, setAttachedMealPlan] = useState<MealPlan | null>(null);
  const [activeWeekIdx, setActiveWeekIdx] = useState(0);
  const [activeDayIdx, setActiveDayIdx] = useState(0);
  const [activeTab, setActiveTab] = useState<'settings' | 'workouts' | 'nutrition'>('workouts');
  const [isPickerOpen, setIsPickerOpen] = useState<{ type: 'exercise' | 'workout' | 'meal' | 'media', activeExIdx: number | null, activeField?: 'imageUrl' | 'videoUrl' }>({ type: 'exercise', activeExIdx: null });

  useEffect(() => {
    if (isEdit) {
      const existing = COURSES.find(c => c.id === id);
      if (existing) {
        setCourseData({
          title: existing.title,
          description: existing.description,
          category: existing.category || 'CrossFit',
          level: existing.level || 'Intermediate',
          price: existing.price,
          duration: existing.duration,
          image: existing.image,
          hasMealPlan: existing.hasMealPlan || false,
          saveAsWorkoutBlueprint: false,
          saveAsMealBlueprint: false
        });
        if (existing.weeks) setWeeks(existing.weeks);
        if (existing.mealPlan) setAttachedMealPlan(existing.mealPlan);
      }
    }
  }, [id, isEdit]);

  const addWeek = () => {
    const nextNum = weeks.length + 1;
    setWeeks([...weeks, { id: Math.random().toString(), weekNumber: nextNum, days: [{ id: Math.random().toString(), dayNumber: 1, title: 'Intro Session', exercises: [] }] }]);
    setActiveWeekIdx(weeks.length);
    setActiveDayIdx(0);
    setActiveTab('workouts');
  };

  const addDay = () => {
    const currentWeek = weeks[activeWeekIdx];
    const nextNum = currentWeek.days.length + 1;
    const updatedWeek = {
      ...currentWeek,
      days: [...currentWeek.days, { id: Math.random().toString(), dayNumber: nextNum, title: 'New Training Day', exercises: [] }]
    };
    const updatedWeeks = [...weeks];
    updatedWeeks[activeWeekIdx] = updatedWeek;
    setWeeks(updatedWeeks);
    setActiveDayIdx(currentWeek.days.length);
  };

  const addExercise = () => {
    const updatedWeeks = [...weeks];
    updatedWeeks[activeWeekIdx].days[activeDayIdx].exercises.push({
      id: Math.random().toString(),
      name: '',
      format: 'REGULAR',
      collaboratorId: 'false' // Used as "Save to Library" toggle
    });
    setWeeks(updatedWeeks);
  };

  const updateExercise = (exIdx: number, field: keyof Exercise, val: any) => {
    const updatedWeeks = [...weeks];
    updatedWeeks[activeWeekIdx].days[activeDayIdx].exercises[exIdx] = {
      ...updatedWeeks[activeWeekIdx].days[activeDayIdx].exercises[exIdx],
      [field]: val
    };
    setWeeks(updatedWeeks);
  };

  const removeExercise = (exIdx: number) => {
    const updatedWeeks = [...weeks];
    updatedWeeks[activeWeekIdx].days[activeDayIdx].exercises.splice(exIdx, 1);
    setWeeks(updatedWeeks);
  };

  const applyWorkoutBlueprint = (template: any) => {
    const templateExs = (template.weeks[0]?.days[0]?.exercises || []).map((ex: any) => ({
      ...ex,
      id: Math.random().toString(),
      collaboratorId: 'false'
    }));
    
    const updatedWeeks = [...weeks];
    updatedWeeks[activeWeekIdx].days[activeDayIdx].exercises = [...updatedWeeks[activeWeekIdx].days[activeDayIdx].exercises, ...templateExs];
    setWeeks(updatedWeeks);
    setIsPickerOpen({ type: 'exercise', activeExIdx: null });
  };

  const initNewMealPlan = () => {
    setAttachedMealPlan({
      id: 'mp-' + Math.random().toString(36).substr(2, 9),
      name: 'Custom Course Plan',
      description: 'Program-specific nourishment strategy.',
      totalCalories: 0,
      meals: [{ id: 'm1', label: 'Meal 1', items: [] }],
      isPublic: false
    });
    setCourseData({ ...courseData, hasMealPlan: true });
  };

  const addMealBlock = () => {
    if (!attachedMealPlan) return;
    const nextNum = attachedMealPlan.meals.length + 1;
    setAttachedMealPlan({
      ...attachedMealPlan,
      meals: [...attachedMealPlan.meals, { id: Math.random().toString(), label: `Meal ${nextNum}`, items: [] }]
    });
  };

  const addFoodToMeal = (mealIdx: number) => {
    if (!attachedMealPlan) return;
    const nextMeals = [...attachedMealPlan.meals];
    nextMeals[mealIdx].items.push({ id: Math.random().toString(), name: '', amount: '', calories: 0, protein: 0, carbs: 0, fat: 0 });
    setAttachedMealPlan({ ...attachedMealPlan, meals: nextMeals });
  };

  const updateFoodItem = (mealIdx: number, foodIdx: number, field: keyof FoodItem, val: any) => {
    if (!attachedMealPlan) return;
    const nextMeals = [...attachedMealPlan.meals];
    nextMeals[mealIdx].items[foodIdx] = { ...nextMeals[mealIdx].items[foodIdx], [field]: val };
    setAttachedMealPlan({ ...attachedMealPlan, meals: nextMeals });
  };

  const removeMealBlock = (mIdx: number) => {
    if (!attachedMealPlan) return;
    const nextMeals = [...attachedMealPlan.meals];
    nextMeals.splice(mIdx, 1);
    setAttachedMealPlan({ ...attachedMealPlan, meals: nextMeals });
  };

  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || isPickerOpen.activeExIdx === null || !isPickerOpen.activeField) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const data = reader.result as string;
      const newAsset: MediaAsset = { 
        id: Math.random().toString(), 
        type: file.type.startsWith('video') ? 'video' : 'image', 
        data, 
        name: file.name,
        category: 'WORKOUT',
        createdAt: Date.now()
      };
      setLibrary([newAsset, ...library]);
      updateExercise(isPickerOpen.activeExIdx!, isPickerOpen.activeField!, data);
      setIsPickerOpen({ type: 'exercise', activeExIdx: null });
    };
    reader.readAsDataURL(file);
  };

  const handleMealPlanToggle = () => {
    const newState = !courseData.hasMealPlan;
    setCourseData({...courseData, hasMealPlan: newState});
    if (!newState && activeTab === 'nutrition') {
      setActiveTab('workouts');
    }
  };

  const handlePublish = () => {
    if (!courseData.title) {
        setActiveTab('settings');
        alert("Please set a Course Title in the Settings tab.");
        return;
    }
    let message = `Publishing Course: ${courseData.title}`;
    if (courseData.saveAsWorkoutBlueprint) message += "\n- Cloning structure to Workout Library (Private)";
    if (courseData.saveAsMealBlueprint && attachedMealPlan) message += "\n- Saving Meal Plan to Library (Private)";
    
    const exercisesToSave = weeks.flatMap(w => w.days.flatMap(d => d.exercises)).filter(ex => ex.collaboratorId === 'true');
    if (exercisesToSave.length > 0) message += `\n- Saving ${exercisesToSave.length} exercises to Master Library (Private)`;

    alert(message);
    navigate(-1);
  };

  const activeDay = weeks[activeWeekIdx]?.days[activeDayIdx];

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-24 text-left animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-4">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-neutral-400 hover:text-black text-xs font-black uppercase tracking-widest mb-2 transition-colors">
            <span className="material-symbols-outlined text-lg">arrow_back</span> Back
          </button>
          <div className="space-y-1">
            <h1 className="text-4xl font-black font-display tracking-tight text-black uppercase leading-none">{isEdit ? 'Refine Course' : 'Architect New Course'}</h1>
            <p className="text-neutral-400 font-medium">Define discipline, weeks, days, and nourishment logic.</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
           <div className="flex items-center gap-3 px-6 py-4 bg-white border border-neutral-100 rounded-2xl shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Meal Plan Add-on</p>
              <div 
                onClick={handleMealPlanToggle}
                className={`w-12 h-6 rounded-full relative transition-colors cursor-pointer ${courseData.hasMealPlan ? 'bg-accent' : 'bg-neutral-200'}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 ${courseData.hasMealPlan ? 'translate-x-7' : 'translate-x-1'}`}></div>
              </div>
           </div>
           <button 
            onClick={handlePublish}
            className="px-10 py-5 bg-black text-white font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-neutral-800 transition-all shadow-xl flex items-center gap-2"
           >
            <span className="material-symbols-outlined text-[18px]">publish</span>
            Publish Course
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-3 space-y-8">
           <div className="bg-white rounded-[2.5rem] p-8 border border-neutral-100 shadow-sm space-y-8 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                 <h2 className="text-sm font-black uppercase tracking-widest text-black">Structure</h2>
                 <button onClick={addWeek} className="text-accent hover:text-blue-700 transition-colors shadow-sm"><span className="material-symbols-outlined">add_circle</span></button>
              </div>

              <div className="space-y-2">
                 <button 
                   onClick={() => setActiveTab('settings')}
                   className={`w-full text-left px-5 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-3 ${activeTab === 'settings' ? 'bg-black text-white shadow-lg' : 'text-neutral-400 hover:bg-neutral-50'}`}
                 >
                    <span className="material-symbols-outlined text-lg">settings_suggest</span>
                    Course Settings
                 </button>
                 
                 <div className="py-2"><hr className="border-neutral-100" /></div>

                 {weeks.map((week, wIdx) => (
                    <div key={week.id} className="space-y-2">
                       <button 
                         onClick={() => { setActiveWeekIdx(wIdx); setActiveDayIdx(0); setActiveTab('workouts'); }}
                         className={`w-full text-left px-5 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeWeekIdx === wIdx && activeTab === 'workouts' ? 'bg-black text-white shadow-lg' : 'text-neutral-400 hover:bg-neutral-50'}`}
                       >
                          Week {week.weekNumber}
                       </button>
                       {activeWeekIdx === wIdx && activeTab === 'workouts' && (
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
                             <button onClick={addDay} className="w-full text-left px-4 py-2 text-[10px] font-black uppercase tracking-widest text-neutral-300 hover:text-accent">+ New Day</button>
                          </div>
                       )}
                    </div>
                 ))}

                 {courseData.hasMealPlan && (
                   <div className="pt-6 border-t border-neutral-100">
                     <button 
                       onClick={() => setActiveTab('nutrition')}
                       className={`w-full flex items-center gap-3 p-4 rounded-xl transition-all ${activeTab === 'nutrition' ? 'bg-accent text-white shadow-lg' : 'bg-neutral-50 text-neutral-400 hover:text-black'}`}
                     >
                       <span className="material-symbols-outlined text-xl">restaurant_menu</span>
                       <span className="text-xs font-black uppercase tracking-widest">Meal Plan</span>
                     </button>
                   </div>
                 )}
              </div>
           </div>

           <div className="bg-neutral-50 rounded-[2.5rem] p-8 border border-neutral-100 space-y-6">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">Library Snapshot</h3>
              <div className="space-y-4">
                 <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-neutral-100 shadow-sm">
                    <p className="text-[9px] font-black uppercase text-black">Clone Workout</p>
                    <div 
                      onClick={() => setCourseData({...courseData, saveAsWorkoutBlueprint: !courseData.saveAsWorkoutBlueprint})}
                      className={`w-10 h-5 rounded-full relative transition-colors cursor-pointer ${courseData.saveAsWorkoutBlueprint ? 'bg-black' : 'bg-neutral-200'}`}
                    >
                      <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform duration-200 ${courseData.saveAsWorkoutBlueprint ? 'translate-x-5' : 'translate-x-1'}`}></div>
                    </div>
                 </div>
                 {courseData.hasMealPlan && (
                    <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-neutral-100 shadow-sm">
                        <p className="text-[9px] font-black uppercase text-black">Clone Nutrition</p>
                        <div 
                          onClick={() => setCourseData({...courseData, saveAsMealBlueprint: !courseData.saveAsMealBlueprint})}
                          className={`w-10 h-5 rounded-full relative transition-colors cursor-pointer ${courseData.saveAsMealBlueprint ? 'bg-black' : 'bg-neutral-200'}`}
                        >
                          <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform duration-200 ${courseData.saveAsMealBlueprint ? 'translate-x-5' : 'translate-x-1'}`}></div>
                        </div>
                    </div>
                 )}
              </div>
              <p className="text-[8px] font-bold text-neutral-300 uppercase leading-relaxed">Saved blueprints are private by default. Toggle sharing in master library.</p>
           </div>
        </div>

        <div className="lg:col-span-9 space-y-8">
           {activeTab === 'settings' ? (
              /* --- COURSE IDENTITY SETTINGS --- */
              <div className="bg-white rounded-[3rem] p-12 border border-neutral-100 shadow-2xl space-y-12 min-h-[700px] animate-in fade-in duration-500">
                <div className="space-y-2 border-b border-neutral-100 pb-8">
                    <span className="px-3 py-1 bg-black text-white rounded-lg text-[10px] font-black uppercase tracking-widest">Platform Core Identity</span>
                    <h2 className="text-4xl font-black text-black font-display uppercase tracking-tight leading-none">Course Blueprint</h2>
                    <p className="text-neutral-400 font-medium">Define the high-level metadata for this training track.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-6">
                        <div className="space-y-2">
                           <label className="text-[10px] font-black uppercase text-neutral-400 tracking-widest ml-1">Program Discipline</label>
                           <select 
                             value={courseData.category}
                             onChange={(e) => setCourseData({...courseData, category: e.target.value})}
                             className="w-full bg-neutral-50 border border-neutral-100 rounded-2xl p-5 font-black uppercase text-lg focus:border-black outline-none appearance-none"
                           >
                              <option>CrossFit</option>
                              <option>Bodybuilding</option>
                              <option>Muay Thai</option>
                              <option>Endurance</option>
                              <option>Weightlifting</option>
                              <option>Gymnastics</option>
                           </select>
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] font-black uppercase text-neutral-400 tracking-widest ml-1">Course Title</label>
                           <input 
                             type="text" 
                             value={courseData.title}
                             onChange={e => setCourseData({...courseData, title: e.target.value})}
                             placeholder="e.g. Engine Builder 2.0"
                             className="w-full bg-neutral-50 border border-neutral-100 rounded-2xl p-5 font-black uppercase text-lg focus:border-black outline-none"
                           />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                           <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase text-neutral-400 tracking-widest ml-1">Pricing (USD)</label>
                              <input 
                                type="number" value={courseData.price} 
                                onChange={e => setCourseData({...courseData, price: parseInt(e.target.value)})}
                                className="w-full bg-neutral-50 border border-neutral-100 rounded-2xl p-5 font-black text-xl focus:border-black outline-none"
                              />
                           </div>
                           <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase text-neutral-400 tracking-widest ml-1">Difficulty Level</label>
                              <select 
                                value={courseData.level}
                                onChange={e => setCourseData({...courseData, level: e.target.value as any})}
                                className="w-full bg-neutral-50 border border-neutral-100 rounded-2xl p-5 font-black uppercase tracking-widest text-xs focus:border-black outline-none appearance-none"
                              >
                                 <option value="Beginner">Beginner</option>
                                 <option value="Intermediate">Intermediate / RX</option>
                                 <option value="Advanced">Advanced</option>
                                 <option value="Elite">Elite / Competitive</option>
                              </select>
                           </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-2">
                           <label className="text-[10px] font-black uppercase text-neutral-400 tracking-widest ml-1">Track Description</label>
                           <textarea 
                             rows={6}
                             value={courseData.description}
                             onChange={e => setCourseData({...courseData, description: e.target.value})}
                             placeholder="Summary of training objectives..."
                             className="w-full bg-neutral-50 border border-neutral-100 rounded-[2rem] p-6 text-sm font-medium resize-none focus:border-black outline-none"
                           />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] font-black uppercase text-neutral-400 tracking-widest ml-1">Course Cover</label>
                           <button 
                             onClick={() => setIsPickerOpen({ type: 'media', activeExIdx: 999, activeField: 'imageUrl' })}
                             className={`w-full aspect-video rounded-[2rem] border-2 border-dashed flex flex-col items-center justify-center gap-2 overflow-hidden relative group transition-all ${courseData.image ? 'border-transparent' : 'border-neutral-200 bg-neutral-50 hover:border-black'}`}
                           >
                              {courseData.image ? (
                                <>
                                  <img src={courseData.image} className="w-full h-full object-cover" alt="Cover" />
                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                     <span className="text-[10px] font-black uppercase text-white tracking-widest px-4 py-2 bg-black rounded-full">Change Asset</span>
                                  </div>
                                </>
                              ) : (
                                <>
                                   <span className="material-symbols-outlined text-neutral-300 text-3xl">image</span>
                                   <span className="text-[10px] font-black uppercase text-neutral-300">Select Track Asset</span>
                                </>
                              )}
                           </button>
                        </div>
                    </div>
                </div>
              </div>
           ) : activeTab === 'workouts' ? (
              <div className="bg-white rounded-[3rem] p-10 border border-neutral-100 shadow-2xl space-y-10 min-h-[700px]">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-neutral-100 pb-8">
                   <div className="space-y-4">
                      <span className="px-3 py-1 bg-accent/10 text-accent rounded-lg text-[10px] font-black uppercase tracking-widest">Programming Active: W{weeks[activeWeekIdx].weekNumber}D{activeDay.dayNumber}</span>
                      <input 
                        type="text" 
                        value={activeDay.title}
                        onChange={(e) => {
                           const n = [...weeks];
                           n[activeWeekIdx].days[activeDayIdx].title = e.target.value;
                           setWeeks(n);
                        }}
                        className="text-4xl font-black uppercase tracking-tight text-black bg-transparent outline-none focus:text-accent transition-colors w-full"
                        placeholder="Session Title..."
                      />
                   </div>
                   <div className="flex gap-4">
                      <button 
                        onClick={() => setIsPickerOpen({ type: 'workout', activeExIdx: null })}
                        className="px-6 py-4 bg-neutral-50 text-neutral-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black hover:text-white transition-all shadow-sm flex items-center gap-2"
                      >
                        <span className="material-symbols-outlined text-sm">auto_stories</span>
                        Blueprints
                      </button>
                      <button 
                        onClick={addExercise}
                        className="px-6 py-4 bg-black text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-accent transition-all shadow-xl flex items-center gap-2"
                      >
                        <span className="material-symbols-outlined text-sm">add</span>
                        Add Exercise
                      </button>
                   </div>
                </div>

                <div className="space-y-6">
                   {activeDay.exercises.map((ex, exIdx) => {
                      const inSuperSet = ex.format === 'SUPER_SET' && (activeDay.exercises[exIdx+1]?.format === 'SUPER_SET' || activeDay.exercises[exIdx-1]?.format === 'SUPER_SET');
                      return (
                         <div key={ex.id} className={`p-8 rounded-[2.5rem] border transition-all relative group space-y-8 ${inSuperSet ? 'bg-blue-50/50 border-blue-300 border-l-[16px] border-l-blue-500' : 'bg-neutral-50 border-neutral-100 hover:border-black shadow-sm'}`}>
                            <div className="absolute top-6 right-6 flex items-center gap-4">
                               <div className="flex items-center gap-2 bg-white/50 px-3 py-1 rounded-full border border-neutral-100">
                                  <span className="text-[8px] font-black uppercase text-neutral-400">Save to Library</span>
                                  <div 
                                    onClick={() => updateExercise(exIdx, 'collaboratorId', ex.collaboratorId === 'true' ? 'false' : 'true')}
                                    className={`w-8 h-4 rounded-full relative transition-colors cursor-pointer ${ex.collaboratorId === 'true' ? 'bg-accent' : 'bg-neutral-200'}`}
                                  >
                                    <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-transform duration-200 ${ex.collaboratorId === 'true' ? 'translate-x-4' : 'translate-x-0.5'}`}></div>
                                  </div>
                               </div>
                               <button onClick={() => setIsPickerOpen({ type: 'exercise', activeExIdx: exIdx })} className="text-[9px] font-black uppercase text-accent hover:underline flex items-center gap-1">
                                  <span className="material-symbols-outlined text-sm">menu_book</span> Exercise Lib
                               </button>
                               <button onClick={() => removeExercise(exIdx)} className="text-neutral-300 hover:text-red-500 transition-colors">
                                  <span className="material-symbols-outlined">delete</span>
                               </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 text-left">
                               <div className="space-y-6">
                                  <div className="grid grid-cols-2 gap-4">
                                     <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 ml-1">Exercise</label>
                                        <input 
                                           type="text" value={ex.name} 
                                           onChange={e => updateExercise(exIdx, 'name', e.target.value)}
                                           className="w-full bg-white border border-neutral-100 rounded-xl p-4 font-black uppercase text-sm outline-none"
                                        />
                                     </div>
                                     <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 ml-1">Format</label>
                                        <select 
                                           value={ex.format} 
                                           onChange={e => updateExercise(exIdx, 'format', e.target.value as ExerciseFormat)}
                                           className="w-full bg-white border border-neutral-100 rounded-xl p-4 font-black uppercase text-[10px] tracking-widest outline-none"
                                        >
                                           <option value="REGULAR">Regular Sets</option>
                                           <option value="EMOM">EMOM</option>
                                           <option value="SUPER_SET">Super Set</option>
                                           <option value="DROP_SET">Drop Set</option>
                                        </select>
                                     </div>
                                  </div>
                                  <div className="grid grid-cols-3 gap-4">
                                     <div className="space-y-1 text-center">
                                        <label className="text-[9px] font-black text-neutral-300 uppercase">Sets</label>
                                        <input type="number" value={ex.sets} onChange={e => updateExercise(exIdx, 'sets', parseInt(e.target.value))} className="w-full bg-white border border-neutral-100 rounded-xl p-3 text-center font-black outline-none" />
                                     </div>
                                     <div className="space-y-1 text-center">
                                        <label className="text-[9px] font-black text-neutral-300 uppercase">Reps</label>
                                        <input type="text" value={ex.reps} onChange={e => updateExercise(exIdx, 'reps', e.target.value)} className="w-full bg-white border border-neutral-100 rounded-xl p-3 text-center font-black outline-none" />
                                     </div>
                                     <div className="space-y-1 text-center">
                                        <label className="text-[9px] font-black text-neutral-300 uppercase">Rest</label>
                                        <input type="text" value={ex.rest} onChange={e => updateExercise(exIdx, 'rest', e.target.value)} className="w-full bg-white border border-neutral-100 rounded-xl p-3 text-center font-black outline-none" />
                                     </div>
                                  </div>
                               </div>

                               <div className="space-y-6">
                                  <div className="space-y-2">
                                     <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 ml-1">Program Media</label>
                                     <div className="grid grid-cols-2 gap-4">
                                        <button 
                                          onClick={() => setIsPickerOpen({ type: 'media', activeExIdx: exIdx, activeField: 'imageUrl' })}
                                          className={`flex flex-col items-center justify-center gap-1 p-4 rounded-xl transition-all shadow-sm ${ex.imageUrl ? 'bg-accent text-white' : 'bg-white border border-neutral-100 text-neutral-300 hover:text-black'}`}
                                        >
                                           <span className="material-symbols-outlined text-[20px]">{ex.imageUrl ? 'check_circle' : 'image'}</span>
                                           <span className="text-[8px] font-black uppercase">Photo</span>
                                        </button>
                                        <button 
                                          onClick={() => setIsPickerOpen({ type: 'media', activeExIdx: exIdx, activeField: 'videoUrl' })}
                                          className={`flex flex-col items-center justify-center gap-1 p-4 rounded-xl transition-all shadow-sm ${ex.videoUrl ? 'bg-accent text-white' : 'bg-white border border-neutral-100 text-neutral-300 hover:text-black'}`}
                                        >
                                           <span className="material-symbols-outlined text-[20px]">{ex.videoUrl ? 'check_circle' : 'videocam'}</span>
                                           <span className="text-[8px] font-black uppercase">Video</span>
                                        </button>
                                     </div>
                                  </div>
                                  <div className="space-y-2">
                                     <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 ml-1">Stimulus Notes</label>
                                     <textarea 
                                        rows={2} value={ex.description} 
                                        onChange={e => updateExercise(exIdx, 'description', e.target.value)}
                                        className="w-full bg-white border border-neutral-100 rounded-xl p-4 text-xs font-medium resize-none focus:border-black outline-none"
                                     />
                                  </div>
                               </div>
                            </div>
                         </div>
                      );
                   })}
                   {activeDay.exercises.length === 0 && (
                      <div className="py-20 text-center border-2 border-dashed border-neutral-100 rounded-[2.5rem] text-neutral-300 font-black uppercase tracking-widest text-xs">
                        Empty Day Logic — Add Exercises or Apply Blueprint
                      </div>
                   )}
                </div>
              </div>
           ) : (
              /* --- REFINED NUTRITION TAB --- */
              <div className="bg-white rounded-[3rem] p-12 border border-neutral-100 shadow-2xl space-y-10 min-h-[700px] animate-in fade-in duration-500">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-neutral-100 pb-8 text-left">
                  <div className="space-y-1">
                    <span className="px-3 py-1 bg-green-50 text-green-600 rounded-lg text-[10px] font-black uppercase tracking-widest">Nourishment Strategy</span>
                    <h2 className="text-4xl font-black text-black font-display uppercase tracking-tight leading-none">Macro Intelligence</h2>
                    <p className="text-neutral-400 font-medium">Build a custom plan or select an authorized blueprint.</p>
                  </div>
                  <div className="flex gap-4">
                    <button 
                      onClick={() => setIsPickerOpen({ type: 'meal', activeExIdx: null })}
                      className="px-6 py-4 bg-neutral-50 text-neutral-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black hover:text-white transition-all shadow-sm flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-sm">library_add</span>
                      Pick from Library
                    </button>
                    {!attachedMealPlan && (
                      <button 
                        onClick={initNewMealPlan}
                        className="px-8 py-4 bg-black text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-accent transition-all shadow-xl flex items-center gap-2"
                      >
                        <span className="material-symbols-outlined text-sm">add</span>
                        Start Custom Plan
                      </button>
                    )}
                  </div>
                </div>

                {attachedMealPlan ? (
                  <div className="space-y-10 animate-in slide-in-from-bottom-4 text-left">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
                       <div className="space-y-3">
                          <label className="text-[10px] font-black text-neutral-300 uppercase tracking-widest ml-1">Plan Reference Name</label>
                          <input 
                            type="text" value={attachedMealPlan.name} onChange={e => setAttachedMealPlan({...attachedMealPlan, name: e.target.value})}
                            className="w-full bg-neutral-50 border border-neutral-100 rounded-2xl p-5 font-black uppercase text-lg focus:border-black outline-none"
                          />
                       </div>
                       <div className="space-y-3">
                          <label className="text-[10px] font-black text-neutral-300 uppercase tracking-widest ml-1">Target Daily kcal</label>
                          <input 
                            type="number" value={attachedMealPlan.totalCalories} onChange={e => setAttachedMealPlan({...attachedMealPlan, totalCalories: parseInt(e.target.value)})}
                            className="w-full bg-neutral-50 border border-neutral-100 rounded-2xl p-5 font-black text-accent text-lg focus:border-accent outline-none"
                          />
                       </div>
                    </div>

                    <div className="flex justify-between items-center">
                       <h3 className="text-sm font-black uppercase tracking-[0.2em] text-neutral-400 border-l-4 border-accent pl-4">Meal Block Logic</h3>
                       <button onClick={addMealBlock} className="text-[10px] font-black uppercase tracking-widest text-accent hover:bg-accent/5 px-4 py-2 rounded-xl transition-all">+ Add Meal Block</button>
                    </div>

                    <div className="space-y-8">
                       {attachedMealPlan.meals.map((meal, mIdx) => (
                          <div key={meal.id} className="p-8 bg-neutral-50 rounded-[3rem] border border-neutral-100 shadow-sm space-y-8 relative animate-in zoom-in-95">
                             <div className="flex justify-between items-center border-b border-neutral-100 pb-6">
                                <input 
                                   type="text" value={meal.label} onChange={e => {
                                     const n = {...attachedMealPlan}; n.meals[mIdx].label = e.target.value; setAttachedMealPlan(n);
                                   }}
                                   className="text-xl font-black uppercase text-black bg-transparent outline-none focus:text-accent"
                                />
                                <div className="flex gap-4">
                                   <button onClick={() => addFoodToMeal(mIdx)} className="text-[10px] font-black text-accent uppercase tracking-widest hover:underline">+ Add Element</button>
                                   <button onClick={() => removeMealBlock(mIdx)} className="text-neutral-300 hover:text-red-500 transition-colors"><span className="material-symbols-outlined text-lg">delete</span></button>
                                </div>
                             </div>

                             <div className="grid gap-3">
                                {meal.items.map((food, fIdx) => (
                                   <div key={food.id} className="grid grid-cols-12 gap-4 items-center bg-white p-4 rounded-2xl border border-neutral-50">
                                      <div className="col-span-4">
                                         <label className="text-[8px] font-black uppercase text-neutral-300 ml-1">Element</label>
                                         <input type="text" value={food.name} onChange={e => updateFoodItem(mIdx, fIdx, 'name', e.target.value)} className="w-full bg-neutral-50 p-2 rounded-lg text-sm font-bold border-none outline-none" />
                                      </div>
                                      <div className="col-span-2">
                                         <label className="text-[8px] font-black uppercase text-neutral-300 ml-1">Amt</label>
                                         <input type="text" value={food.amount} onChange={e => updateFoodItem(mIdx, fIdx, 'amount', e.target.value)} className="w-full bg-neutral-50 p-2 rounded-lg text-sm font-bold border-none outline-none" />
                                      </div>
                                      {['calories', 'protein', 'carbs', 'fat'].map(m => (
                                        <div key={m} className="col-span-1 text-center">
                                          <label className="text-[8px] font-black uppercase text-neutral-300">{m.substr(0,1)}</label>
                                          <input type="number" value={(food as any)[m]} onChange={e => updateFoodItem(mIdx, fIdx, m as any, parseInt(e.target.value))} className="w-full bg-neutral-50 p-2 rounded-lg text-xs font-black text-center border-none outline-none" />
                                        </div>
                                      ))}
                                      <div className="col-span-2 flex justify-end">
                                         <button onClick={() => {
                                           const n = {...attachedMealPlan}; n.meals[mIdx].items.splice(fIdx, 1); setAttachedMealPlan(n);
                                         }} className="text-neutral-300 hover:text-red-500 transition-colors"><span className="material-symbols-outlined text-lg">remove_circle</span></button>
                                      </div>
                                   </div>
                                ))}
                             </div>
                          </div>
                       ))}
                    </div>

                    <div className="pt-10 border-t border-neutral-100 flex justify-center">
                       <button onClick={() => setAttachedMealPlan(null)} className="text-red-500 text-[10px] font-black uppercase tracking-widest hover:underline flex items-center gap-2">
                          <span className="material-symbols-outlined text-sm">cancel</span> Discard Logic & Unlink Plan
                       </button>
                    </div>
                  </div>
                ) : (
                  <div className="py-32 text-center space-y-8">
                    <div className="w-24 h-24 bg-neutral-50 rounded-[2rem] mx-auto flex items-center justify-center text-neutral-200">
                      <span className="material-symbols-outlined text-5xl">restaurant</span>
                    </div>
                    <div className="space-y-2">
                      <p className="text-neutral-300 font-black uppercase tracking-[0.3em] text-sm">No meal plan attached to this Course</p>
                      <p className="text-neutral-400 text-xs font-medium max-w-xs mx-auto">Create a program-specific strategy or pick a starting blueprint from your library.</p>
                    </div>
                  </div>
                )}
              </div>
           )}
        </div>
      </div>

      {/* Picker Modals */}
      {isPickerOpen.type === 'exercise' && isPickerOpen.activeExIdx !== null && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-black/95 backdrop-blur-xl animate-in fade-in duration-300 overflow-hidden">
           <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden relative flex flex-col max-h-[80vh]">
              <div className="p-10 border-b border-neutral-100 flex justify-between items-center bg-neutral-50/50 text-left">
                 <h3 className="text-2xl font-black font-display uppercase text-black">Exercise Master Library</h3>
                 <button onClick={() => setIsPickerOpen({ type: 'exercise', activeExIdx: null })} className="w-12 h-12 bg-white border border-neutral-100 rounded-xl flex items-center justify-center hover:bg-black hover:text-white transition-all shadow-sm">
                   <span className="material-symbols-outlined">close</span>
                 </button>
              </div>
              <div className="flex-1 overflow-y-auto p-10 no-scrollbar space-y-4">
                 {EXERCISE_LIBRARY.map(item => (
                    <button key={item.id} onClick={() => {
                        updateExercise(isPickerOpen.activeExIdx!, 'name', item.name);
                        updateExercise(isPickerOpen.activeExIdx!, 'format', item.defaultFormat);
                        updateExercise(isPickerOpen.activeExIdx!, 'imageUrl', item.imageUrl);
                        updateExercise(isPickerOpen.activeExIdx!, 'videoUrl', item.videoUrl);
                        setIsPickerOpen({ type: 'exercise', activeExIdx: null });
                    }} className="w-full flex items-center justify-between p-6 bg-neutral-50 rounded-[2rem] border border-neutral-100 hover:border-black transition-all group">
                       <div className="text-left"><p className="text-lg font-black text-black uppercase tracking-tight">{item.name}</p><p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">{item.defaultFormat}</p></div>
                       <span className="material-symbols-outlined text-neutral-300 group-hover:text-black transition-colors">playlist_add</span>
                    </button>
                 ))}
              </div>
           </div>
        </div>
      )}

      {isPickerOpen.type === 'workout' && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-black/95 backdrop-blur-xl animate-in fade-in duration-300 overflow-hidden">
           <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden relative flex flex-col max-h-[80vh]">
              <div className="p-10 border-b border-neutral-100 flex justify-between items-center bg-neutral-50/50 text-left text-left">
                 <h3 className="text-2xl font-black font-display uppercase text-black">Workout Blueprints</h3>
                 <button onClick={() => setIsPickerOpen({ type: 'exercise', activeExIdx: null })} className="w-12 h-12 bg-white border border-neutral-100 rounded-xl flex items-center justify-center hover:bg-black hover:text-white transition-all shadow-sm">
                   <span className="material-symbols-outlined">close</span>
                 </button>
              </div>
              <div className="flex-1 overflow-y-auto p-10 no-scrollbar space-y-4">
                 {WORKOUT_LIBRARY.map(wo => (
                    <button key={wo.id} onClick={() => applyWorkoutBlueprint(wo)} className="w-full flex items-center justify-between p-8 bg-neutral-50 rounded-[2rem] border border-neutral-100 hover:border-black transition-all group text-left">
                       <div><p className="text-xl font-black text-black uppercase tracking-tight">{wo.name}</p><p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">{wo.category} Structure • Day 1 Import</p></div>
                       <span className="material-symbols-outlined text-neutral-300 group-hover:text-black transition-colors">playlist_add</span>
                    </button>
                 ))}
              </div>
           </div>
        </div>
      )}

      {isPickerOpen.type === 'meal' && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-black/95 backdrop-blur-xl animate-in fade-in duration-300 overflow-hidden">
           <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden relative flex flex-col max-h-[80vh]">
              <div className="p-10 border-b border-neutral-100 flex justify-between items-center bg-neutral-50/50 text-left">
                 <h3 className="text-2xl font-black font-display uppercase text-black">Meal Plan Library</h3>
                 <button onClick={() => setIsPickerOpen({ type: 'exercise', activeExIdx: null })} className="w-12 h-12 bg-white border border-neutral-100 rounded-xl flex items-center justify-center hover:bg-black hover:text-white transition-all shadow-sm">
                   <span className="material-symbols-outlined">close</span>
                 </button>
              </div>
              <div className="flex-1 overflow-y-auto p-10 no-scrollbar space-y-4">
                 {MEAL_PLAN_LIBRARY.map(plan => (
                    <button key={plan.id} onClick={() => { setAttachedMealPlan({...plan, id: 'mp-'+Math.random()}); setIsPickerOpen({ type: 'exercise', activeExIdx: null }); }} className="w-full flex items-center justify-between p-8 bg-neutral-50 rounded-[2rem] border border-neutral-100 hover:border-black transition-all group text-left">
                       <div><p className="text-xl font-black text-black uppercase tracking-tight">{plan.name}</p><p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">{plan.totalCalories} kcal • {plan.meals.length} Meals</p></div>
                       <span className="material-symbols-outlined text-neutral-300 group-hover:text-black transition-colors">playlist_add</span>
                    </button>
                 ))}
              </div>
           </div>
        </div>
      )}

      {isPickerOpen.type === 'media' && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-6 bg-black/95 backdrop-blur-xl animate-in fade-in duration-300 overflow-hidden">
          <div className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl overflow-hidden relative flex flex-col max-h-[85vh]">
            <div className="p-8 border-b border-neutral-100 flex justify-between items-center bg-neutral-50/50 text-left">
              <h3 className="text-2xl font-black font-display uppercase tracking-tight">Gallery Selection</h3>
              <div className="flex gap-4">
                <button onClick={() => fileInputRef.current?.click()} className="px-6 py-3 bg-black text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-accent transition-all flex items-center gap-2 shadow-lg">
                  <span className="material-symbols-outlined text-[18px]">upload</span> New Upload
                  <input type="file" ref={fileInputRef} className="hidden" onChange={handleMediaUpload} accept="image/*,video/mp4" />
                </button>
                <button onClick={() => setIsPickerOpen({ type: 'exercise', activeExIdx: null })} className="w-12 h-12 rounded-xl bg-white border border-neutral-100 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-sm">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-10 grid grid-cols-2 sm:grid-cols-4 gap-6 no-scrollbar text-center">
              {library.filter(a => a.category === 'WORKOUT').map(asset => (
                <div key={asset.id} onClick={() => { 
                    if(isPickerOpen.activeExIdx === 999) {
                        setCourseData({...courseData, image: asset.data});
                    } else {
                        updateExercise(isPickerOpen.activeExIdx!, isPickerOpen.activeField!, asset.data); 
                    }
                    setIsPickerOpen({ type: 'exercise', activeExIdx: null }); 
                }} className="group relative aspect-square rounded-[2rem] overflow-hidden border border-neutral-100 bg-neutral-50 cursor-pointer hover:ring-4 hover:ring-accent transition-all shadow-sm">
                  {asset.type === 'image' ? <img src={asset.data} className="w-full h-full object-cover group-hover:scale-110 transition-transform" /> : <div className="w-full h-full flex items-center justify-center bg-neutral-900 text-white"><span className="material-symbols-outlined text-4xl">video_file</span></div>}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"><span className="text-[10px] font-black uppercase text-white tracking-widest px-4 py-2 bg-accent rounded-full">Apply To Cycle</span></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoachAddCourse;
