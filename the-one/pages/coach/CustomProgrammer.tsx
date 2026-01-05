
import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Exercise, ExerciseFormat, MediaAsset, WeekProgram, DayProgram, Meal, MealPlan, FoodItem, WorkoutTemplate, DiagnosticTest, CourseLevel } from '../../types';
import { EXERCISE_LIBRARY, WORKOUT_LIBRARY, MOCK_CUSTOM_REQUESTS, MEAL_PLAN_LIBRARY } from '../../constants';

const PremiumSelect: React.FC<{
  value: string;
  options: { label: string; value: string; icon: string }[];
  onChange: (val: string) => void;
  label: string;
}> = ({ value, options, onChange, label }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeOption = options.find((o) => o.value === value) || options[0];

  return (
    <div className="space-y-1 relative" ref={dropdownRef}>
      <label className="text-[9px] font-black text-neutral-300 uppercase ml-1">{label}</label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full bg-white border rounded-xl p-3 flex items-center justify-between transition-all hover:border-black ${
          isOpen ? 'border-black shadow-sm ring-2 ring-black/5' : 'border-neutral-100'
        }`}
      >
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-neutral-400 text-[18px]">{activeOption.icon}</span>
          <span className="text-[10px] font-black uppercase tracking-widest text-black">{activeOption.label}</span>
        </div>
        <span className={`material-symbols-outlined text-neutral-300 text-sm transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
          expand_more
        </span>
      </button>

      {isOpen && (
        <div className="absolute z-[100] top-full mt-2 w-full bg-white border border-neutral-100 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] py-2 animate-in fade-in slide-in-from-top-2 duration-200">
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
              className={`w-full text-left px-4 py-2.5 flex items-center gap-3 hover:bg-neutral-50 transition-colors ${
                value === opt.value ? 'bg-neutral-50' : ''
              }`}
            >
              <span className={`material-symbols-outlined text-[18px] ${value === opt.value ? 'text-accent' : 'text-neutral-300'}`}>
                {opt.icon}
              </span>
              <span className={`text-[9px] font-black uppercase tracking-widest ${value === opt.value ? 'text-accent' : 'text-neutral-500'}`}>
                {opt.label}
              </span>
              {value === opt.value && <span className="material-symbols-outlined ml-auto text-accent text-sm">check</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

interface CustomProgrammerProps {
  library: MediaAsset[];
  setLibrary: React.Dispatch<React.SetStateAction<MediaAsset[]>>;
}

const CoachCustomProgrammer: React.FC<CustomProgrammerProps> = ({ library, setLibrary }) => {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const request = MOCK_CUSTOM_REQUESTS.find(r => r.id === requestId) || MOCK_CUSTOM_REQUESTS[0];
  const [currentStatus, setCurrentStatus] = useState(request.status);
  const [hasMealPlan, setHasMealPlan] = useState(request.hasMealPlan || false);
  const lockedCount = request?.durationWeeks || 1;

  const [activeTab, setActiveTab] = useState<'submissions' | 'workout' | 'meal'>('submissions');
  
  // Assessment results (what the athlete sent back)
  const [diagnostics, setDiagnostics] = useState<DiagnosticTest[]>(request.diagnostics || []);

  // Workout Editor State (Standard format)
  const [weeks, setWeeks] = useState<WeekProgram[]>(() => {
    const initialWeeks: WeekProgram[] = [];
    for (let i = 1; i <= lockedCount; i++) {
      initialWeeks.push({
        id: `w${i}`,
        weekNumber: i,
        days: [{ id: `d${i}-1`, dayNumber: 1, title: 'Session A', exercises: [] }]
      });
    }
    return initialWeeks;
  });

  const [activeWeekIdx, setActiveWeekIdx] = useState(0);
  const [activeDayIdx, setActiveDayIdx] = useState(0);
  const [isPickerOpen, setIsPickerOpen] = useState<{ type: 'exercise' | 'workout' | 'meal' | 'media', activeIndex: number | null, activeField?: 'imageUrl' | 'videoUrl' }>({ type: 'exercise', activeIndex: null });

  // Workout Functions
  const addDay = () => {
    const updatedWeeks = [...weeks];
    const currentWeek = updatedWeeks[activeWeekIdx];
    currentWeek.days.push({ id: Math.random().toString(), dayNumber: currentWeek.days.length + 1, title: 'New Day', exercises: [] });
    setWeeks(updatedWeeks);
    setActiveDayIdx(currentWeek.days.length - 1);
  };
  const addExercise = () => {
    const updatedWeeks = [...weeks];
    updatedWeeks[activeWeekIdx].days[activeDayIdx].exercises.push({ id: Math.random().toString(), name: '', format: 'REGULAR' });
    setWeeks(updatedWeeks);
  };
  const updateExercise = (exIdx: number, field: keyof Exercise, val: any) => {
    const updatedWeeks = [...weeks];
    updatedWeeks[activeWeekIdx].days[activeDayIdx].exercises[exIdx] = { ...updatedWeeks[activeWeekIdx].days[activeDayIdx].exercises[exIdx], [field]: val };
    setWeeks(updatedWeeks);
  };
  const removeExercise = (exIdx: number) => {
    const updatedWeeks = [...weeks];
    updatedWeeks[activeWeekIdx].days[activeDayIdx].exercises.splice(exIdx, 1);
    setWeeks(updatedWeeks);
  };

  const handlePublish = () => {
    // Simulate updating the mock object status
    request.status = 'COMPLETED'; 
    
    // TRIGGER AUTOMATED MESSAGE FLAG
    localStorage.setItem('automated_msg_ready', 'true');
    
    alert(`Success: The workout for ${request.athleteName} is live. Stage changed to COMPLETED.`);
    navigate('/coach/custom-cycles');
  };

  const toggleMealPlan = () => {
    setHasMealPlan(!hasMealPlan);
    if (hasMealPlan && activeTab === 'meal') {
      setActiveTab('submissions');
    }
  };

  const activeDay = weeks[activeWeekIdx]?.days[activeDayIdx];

  const formatOptions = [
    { label: 'Regular Sets', value: 'REGULAR', icon: 'reorder' },
    { label: 'EMOM', value: 'EMOM', icon: 'timer' },
    { label: 'Super Set', value: 'SUPER_SET', icon: 'layers' },
    { label: 'Drop Set', value: 'DROP_SET', icon: 'keyboard_double_arrow_down' }
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-24 text-left animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-4">
          <button onClick={() => navigate('/coach/custom-cycles')} className="flex items-center gap-2 text-neutral-400 hover:text-black text-xs font-black uppercase tracking-widest mb-2 transition-colors">
            <span className="material-symbols-outlined text-lg">arrow_back</span> Back
          </button>
          <div className="space-y-1">
            <h1 className="text-4xl font-black font-display tracking-tight text-black uppercase leading-none">Workout Builder</h1>
            <p className="text-neutral-400 font-medium">Bespoke cycle for <span className="text-black font-bold">{request.athleteName}</span></p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
           {/* Stage/Status Badge */}
           <div className="px-6 py-4 bg-white border border-neutral-100 rounded-2xl shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Current Stage</p>
              <p className="text-sm font-black text-accent uppercase">{currentStatus === 'DIAGNOSTIC' ? 'Reviewing' : currentStatus}</p>
           </div>

           {/* Meal Plan Toggle */}
           <div className="flex items-center gap-3 px-6 py-4 bg-white border border-neutral-100 rounded-2xl shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Meal Plan</p>
              <div 
                onClick={toggleMealPlan}
                className={`w-12 h-6 rounded-full relative transition-colors cursor-pointer ${hasMealPlan ? 'bg-accent' : 'bg-neutral-200'}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 ${hasMealPlan ? 'translate-x-7' : 'translate-x-1'}`}></div>
              </div>
           </div>

           <button 
            onClick={handlePublish}
            className="px-10 py-5 bg-black text-white font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-neutral-800 transition-all shadow-xl flex items-center gap-2"
           >
            <span className="material-symbols-outlined text-[18px]">done_all</span>
            Finish & Notify Athlete
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Menu */}
        <div className="lg:col-span-3 space-y-6">
           <div className="bg-white rounded-[2.5rem] p-8 border border-neutral-100 shadow-sm space-y-3 flex flex-col">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-300 mb-4 ml-1">Builder Menu</p>
              
              <button 
                onClick={() => setActiveTab('submissions')}
                className={`w-full text-left px-5 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-3 ${activeTab === 'submissions' ? 'bg-black text-white shadow-xl' : 'text-neutral-400 hover:bg-neutral-50'}`}
              >
                <span className="material-symbols-outlined text-xl">reviews</span>
                Athlete Answers
              </button>

              <div className="py-2"><hr className="border-neutral-50" /></div>

              <button 
                onClick={() => setActiveTab('workout')}
                className={`w-full text-left px-5 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-3 ${activeTab === 'workout' ? 'bg-black text-white shadow-xl' : 'text-neutral-400 hover:bg-neutral-50'}`}
              >
                <span className="material-symbols-outlined text-xl">fitness_center</span>
                Build Workout
              </button>

              {hasMealPlan && (
                <button 
                  onClick={() => setActiveTab('meal')}
                  className={`w-full text-left px-5 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-3 ${activeTab === 'meal' ? 'bg-black text-white shadow-xl' : 'text-neutral-400 hover:bg-neutral-50'}`}
                >
                  <span className="material-symbols-outlined text-xl">restaurant</span>
                  Meal Plan
                </button>
              )}
           </div>

           {activeTab === 'workout' && (
              <div className="bg-white rounded-[2.5rem] p-8 border border-neutral-100 shadow-sm space-y-4 animate-in slide-in-from-bottom-4">
                 <p className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-300 ml-1">Timeline</p>
                 {weeks.map((week, wIdx) => (
                    <div key={week.id} className="space-y-2 text-left">
                       <button 
                          onClick={() => { setActiveWeekIdx(wIdx); setActiveDayIdx(0); }}
                          className={`w-full text-left px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeWeekIdx === wIdx ? 'bg-neutral-900 text-white shadow-md' : 'text-neutral-400 hover:bg-neutral-50'}`}
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
                             <button onClick={addDay} className="w-full text-left px-4 py-2 text-[10px] font-black uppercase tracking-widest text-neutral-300 hover:text-accent">+ New Day</button>
                          </div>
                       )}
                    </div>
                 ))}
              </div>
           )}
        </div>

        {/* Content Area */}
        <div className="lg:col-span-9">
           {activeTab === 'submissions' ? (
              /* --- REVIEW ATHLETE INPUT --- */
              <div className="bg-white rounded-[3rem] p-12 border border-neutral-100 shadow-2xl space-y-12 animate-in fade-in duration-500">
                <div className="space-y-2 border-b border-neutral-100 pb-8 text-left">
                   <span className="px-3 py-1 bg-accent text-white rounded-lg text-[10px] font-black uppercase tracking-widest">Review Answers</span>
                   <h2 className="text-4xl font-black text-black font-display uppercase tracking-tight">Athlete Assessment</h2>
                   <p className="text-neutral-400 font-medium">Check the athlete's answers and videos to build a better workout.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                   {diagnostics.map((test, i) => (
                      <div key={test.id} className="p-8 bg-neutral-50 rounded-[3rem] border border-neutral-100 space-y-6 text-left">
                         <div className="flex justify-between items-start">
                            <h4 className="text-lg font-black uppercase text-black">{test.title}</h4>
                            <span className="material-symbols-outlined text-green-500 filled">check_circle</span>
                         </div>
                         {test.inputType === 'TEXT' ? (
                            <div className="p-6 bg-white rounded-3xl border border-neutral-100 italic text-neutral-500 text-sm">
                               "This is where the athlete's written answer would show."
                            </div>
                         ) : (
                            <div className="aspect-video bg-neutral-900 rounded-3xl overflow-hidden shadow-xl flex items-center justify-center relative">
                               <p className="text-white text-[10px] font-black uppercase tracking-widest">Athlete Video / Photo</p>
                               <span className="material-symbols-outlined text-white text-5xl absolute">play_circle</span>
                            </div>
                         )}
                         <div className="p-4 bg-white rounded-2xl border border-neutral-100">
                            <p className="text-[10px] font-black text-neutral-300 uppercase mb-2">Coach Reflection</p>
                            <textarea placeholder="Write notes for yourself here..." className="w-full bg-transparent text-sm font-medium outline-none resize-none" rows={2} />
                         </div>
                      </div>
                   ))}
                </div>
              </div>
           ) : activeTab === 'workout' ? (
              /* --- UNIFIED WORKOUT BUILDER --- */
              <div className="bg-white rounded-[3rem] p-10 border border-neutral-100 shadow-2xl space-y-10 min-h-[700px] animate-in fade-in duration-500">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-neutral-100 pb-8 text-left">
                   <div className="space-y-4">
                      <span className="px-3 py-1 bg-accent/10 text-accent rounded-lg text-[10px] font-black uppercase tracking-widest">W{activeWeekIdx+1}D{activeDay.dayNumber}</span>
                      <input 
                        type="text" 
                        value={activeDay.title}
                        onChange={(e) => {
                           const n = [...weeks];
                           n[activeWeekIdx].days[activeDayIdx].title = e.target.value;
                           setWeeks(n);
                        }}
                        className="text-4xl font-black uppercase tracking-tight text-black bg-transparent outline-none focus:text-accent transition-colors w-full"
                        placeholder="Day Name..."
                      />
                   </div>
                   <div className="flex gap-4">
                      <button 
                         onClick={() => setIsPickerOpen({ type: 'workout', activeIndex: 0 })}
                         className="px-6 py-4 bg-neutral-50 text-neutral-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black hover:text-white transition-all shadow-sm flex items-center gap-2"
                      >
                         <span className="material-symbols-outlined text-sm">auto_stories</span>
                         Blueprint
                      </button>
                      <button onClick={addExercise} className="px-8 py-4 bg-black text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-accent transition-all shadow-xl flex items-center gap-2">
                        <span className="material-symbols-outlined text-lg">add</span>
                        Add Exercise
                      </button>
                   </div>
                </div>
                <div className="space-y-6">
                   {activeDay.exercises.map((ex, exIdx) => (
                      <div key={ex.id} className="p-8 rounded-[2.5rem] border border-neutral-100 bg-neutral-50 hover:border-black transition-all relative group text-left space-y-8">
                         <div className="absolute top-6 right-6 flex items-center gap-4">
                            <button onClick={() => setIsPickerOpen({ type: 'exercise', activeIndex: exIdx })} className="text-[10px] font-black uppercase text-accent hover:underline">Select From Library</button>
                            <button onClick={() => removeExercise(exIdx)} className="text-neutral-300 hover:text-red-500 transition-colors">
                               <span className="material-symbols-outlined">delete</span>
                            </button>
                         </div>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                               <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-1">
                                     <label className="text-[9px] font-black text-neutral-300 uppercase ml-1">Exercise Name</label>
                                     <input type="text" value={ex.name} onChange={e => updateExercise(exIdx, 'name', e.target.value)} className="w-full bg-white border border-neutral-100 rounded-xl p-3 font-bold text-sm outline-none focus:border-black" />
                                  </div>
                                  <PremiumSelect 
                                    label="Loading style"
                                    value={ex.format}
                                    options={formatOptions}
                                    onChange={(val) => updateExercise(exIdx, 'format', val as ExerciseFormat)}
                                  />
                               </div>
                               <div className="grid grid-cols-3 gap-4">
                                  {['sets', 'reps', 'rest'].map(f => (
                                    <div key={f} className="text-center">
                                       <label className="text-[9px] font-black text-neutral-300 uppercase">{f}</label>
                                       <input type="text" value={(ex as any)[f]} onChange={e => updateExercise(exIdx, f as any, e.target.value)} className="w-full bg-white border border-neutral-100 rounded-xl p-2 text-center font-black outline-none focus:border-black" />
                                    </div>
                                  ))}
                               </div>
                            </div>
                            <div className="flex flex-col justify-center">
                               <textarea rows={2} value={ex.description} onChange={e => updateExercise(exIdx, 'description', e.target.value)} placeholder="Personal tips for this athlete..." className="w-full bg-white border border-neutral-100 rounded-2xl p-4 text-xs font-medium resize-none outline-none shadow-sm focus:border-black" />
                            </div>
                         </div>
                      </div>
                   ))}
                   {activeDay.exercises.length === 0 && (
                     <div className="py-32 text-center text-neutral-200 border-2 border-dashed border-neutral-100 rounded-[3rem] font-black uppercase tracking-widest">No moves added yet</div>
                   )}
                </div>
              </div>
           ) : (
              <div className="bg-white rounded-[3rem] p-12 border border-neutral-100 shadow-2xl space-y-10 min-h-[700px] flex flex-col items-center justify-center text-center animate-in fade-in duration-500">
                 <div className="w-20 h-20 bg-neutral-50 rounded-[2.5rem] flex items-center justify-center text-neutral-200 mb-6">
                    <span className="material-symbols-outlined text-4xl">restaurant_menu</span>
                 </div>
                 <h2 className="text-2xl font-black uppercase tracking-tight text-neutral-300">Meal Plan Builder</h2>
                 <p className="text-neutral-400 font-medium max-w-sm">Build a custom nutrition plan based on the client's weight and goal.</p>
                 <button className="mt-8 px-8 py-4 bg-black text-white rounded-2xl text-[10px] font-black uppercase tracking-widest">Select Plan Template</button>
              </div>
           )}
        </div>
      </div>

      {/* Pickers (Lib) */}
      {isPickerOpen.activeIndex !== null && isPickerOpen.type === 'exercise' && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-6 bg-black/95 backdrop-blur-xl animate-in fade-in duration-300 overflow-hidden text-left">
           <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden relative flex flex-col max-h-[80vh]">
              <div className="p-10 border-b border-neutral-100 flex justify-between items-center bg-neutral-50/50">
                 <h3 className="text-2xl font-black font-display uppercase text-black">Exercise Library</h3>
                 <button onClick={() => setIsPickerOpen({ ...isPickerOpen, activeIndex: null })} className="w-12 h-12 bg-white border border-neutral-100 rounded-xl flex items-center justify-center hover:bg-black hover:text-white transition-all shadow-sm">
                   <span className="material-symbols-outlined">close</span>
                 </button>
              </div>
              <div className="flex-1 overflow-y-auto p-10 no-scrollbar space-y-4">
                 {EXERCISE_LIBRARY.map(item => (
                    <button key={item.id} onClick={() => {
                        updateExercise(isPickerOpen.activeIndex!, 'name', item.name);
                        updateExercise(isPickerOpen.activeIndex!, 'format', item.defaultFormat);
                        updateExercise(isPickerOpen.activeIndex!, 'description', item.description);
                        setIsPickerOpen({ ...isPickerOpen, activeIndex: null });
                    }} className="w-full flex items-center justify-between p-6 bg-neutral-50 rounded-[2rem] border border-neutral-100 hover:border-black transition-all group">
                       <div className="text-left space-y-1"><p className="text-lg font-black text-black uppercase tracking-tight">{item.name}</p><p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">{item.defaultFormat}</p></div>
                       <span className="material-symbols-outlined text-neutral-300 group-hover:text-black">playlist_add</span>
                    </button>
                 ))}
              </div>
           </div>
        </div>
      )}

      {isPickerOpen.activeIndex !== null && isPickerOpen.type === 'workout' && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-6 bg-black/95 backdrop-blur-xl animate-in fade-in duration-300 overflow-hidden text-left">
           <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden relative flex flex-col max-h-[80vh]">
              <div className="p-10 border-b border-neutral-100 flex justify-between items-center bg-neutral-50/50">
                 <h3 className="text-2xl font-black font-display uppercase text-black">Workout Blueprints</h3>
                 <button onClick={() => setIsPickerOpen({ ...isPickerOpen, activeIndex: null })} className="w-12 h-12 bg-white border border-neutral-100 rounded-xl flex items-center justify-center hover:bg-black hover:text-white transition-all shadow-sm">
                   <span className="material-symbols-outlined">close</span>
                 </button>
              </div>
              <div className="flex-1 overflow-y-auto p-10 no-scrollbar space-y-4">
                 {WORKOUT_LIBRARY.map(wo => (
                    <button key={wo.id} onClick={() => {
                        const templateExs = (wo.weeks[0]?.days[0]?.exercises || []).map((ex: any) => ({ ...ex, id: Math.random().toString() }));
                        const updatedWeeks = [...weeks];
                        updatedWeeks[activeWeekIdx].days[activeDayIdx].exercises = [...updatedWeeks[activeWeekIdx].days[activeDayIdx].exercises, ...templateExs];
                        setWeeks(updatedWeeks);
                        setIsPickerOpen({ ...isPickerOpen, activeIndex: null });
                    }} className="w-full flex items-center justify-between p-8 bg-neutral-50 rounded-[2rem] border border-neutral-100 hover:border-black transition-all group text-left">
                       <div><p className="text-xl font-black text-black uppercase tracking-tight">{wo.name}</p><p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">{wo.category} Cycle</p></div>
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

export default CoachCustomProgrammer;
