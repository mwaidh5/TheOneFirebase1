
import React, { useState, useMemo } from 'react';
import { setDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { MealPlan, Meal, FoodItem, User, UserRole } from '../../types';

interface MealLibraryProps {
  currentUser: User;
  mealPlanLibrary: MealPlan[];
}

const CoachMealLibrary: React.FC<MealLibraryProps> = ({ currentUser, mealPlanLibrary }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const displayPlans = useMemo(() => {
    return mealPlanLibrary.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           p.creatorName?.toLowerCase().includes(searchQuery.toLowerCase());
      const hasPermission = currentUser.role === UserRole.ADMIN || p.isPublic || p.creatorId === currentUser.id;
      return matchesSearch && hasPermission;
    });
  }, [mealPlanLibrary, currentUser, searchQuery]);

  const [activePlan, setActivePlan] = useState<Partial<MealPlan>>({
    name: '',
    description: '',
    totalCalories: 0,
    isPublic: true,
    meals: [{ id: 'm1', label: 'Meal 1', items: [] }]
  });

  const startAdding = () => {
    setActivePlan({
      name: '',
      description: '',
      totalCalories: 0,
      isPublic: true,
      meals: [{ id: 'm1', label: 'Meal 1', items: [] }]
    });
    setIsAdding(true);
  };

  const startEditing = (plan: MealPlan) => {
    setActivePlan({ ...plan });
    setIsAdding(true);
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
    if (!activePlan.name) return;
    const id = activePlan.id || 'mp-' + Math.random().toString(36).substr(2, 9);
    
    // Explicitly construct the object with default values
    const completePlan: MealPlan = {
      id,
      name: activePlan.name || '',
      description: activePlan.description || '',
      totalCalories: Number(activePlan.totalCalories) || 0,
      isPublic: activePlan.isPublic ?? true,
      creatorId: activePlan.creatorId || currentUser.id,
      creatorName: activePlan.creatorName || `${currentUser.firstName} ${currentUser.lastName}`,
      meals: (activePlan.meals || []).map(m => ({
        id: m.id,
        label: m.label || '',
        items: (m.items || []).map(i => ({
          id: i.id,
          name: i.name || '',
          amount: i.amount || '',
          calories: Number(i.calories) || 0,
          protein: Number(i.protein) || 0,
          carbs: Number(i.carbs) || 0,
          fat: Number(i.fat) || 0
        }))
      }))
    };

    const finalPlan = cleanObject(completePlan);

    try {
      await setDoc(doc(db, 'mealplans', id), finalPlan);
      // Alert removed
      setIsAdding(false);
    } catch (error) {
      console.error("Error saving meal plan:", error);
      alert("Failed to save meal plan.");
    }
  };

  const addMealBlock = () => {
    const nextNum = (activePlan.meals?.length || 0) + 1;
    setActivePlan({
      ...activePlan,
      meals: [...(activePlan.meals || []), { id: Math.random().toString(), label: `Meal ${nextNum}`, items: [] }]
    });
  };

  const addFoodToMeal = (mealIdx: number) => {
    const nextMeals = [...(activePlan.meals || [])];
    nextMeals[mealIdx].items.push({ id: Math.random().toString(), name: '', amount: '', calories: 0, protein: 0, carbs: 0, fat: 0 });
    setActivePlan({ ...activePlan, meals: nextMeals });
  };

  const updateFoodItem = (mealIdx: number, foodIdx: number, field: keyof FoodItem, val: any) => {
    const nextMeals = [...(activePlan.meals || [])];
    nextMeals[mealIdx].items[foodIdx] = { ...nextMeals[mealIdx].items[foodIdx], [field]: val };
    setActivePlan({ ...activePlan, meals: nextMeals });
  };

  const removeMeal = (idx: number) => {
    const nextMeals = [...(activePlan.meals || [])];
    nextMeals.splice(idx, 1);
    setActivePlan({ ...activePlan, meals: nextMeals });
  };

  const removePlan = async (id: string) => {
    if (window.confirm("Delete this master meal plan?")) {
      try {
        await deleteDoc(doc(db, 'mealplans', id));
        // Alert removed
      } catch (error) {
        console.error("Error removing meal plan:", error);
        alert("Failed to remove meal plan.");
      }
    }
  };

  return (
    <div className="space-y-12 text-left animate-in fade-in duration-500 pb-20 px-4 md:px-0">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-4xl font-black font-display tracking-tight text-black uppercase text-left">Meal Library</h1>
          <p className="text-neutral-400 text-sm md:text-base font-medium">Architect nutrition blueprints.</p>
        </div>
        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-64 min-w-[200px]">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-neutral-300">search</span>
            <input 
              type="text" 
              placeholder="Search..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-neutral-100 rounded-2xl py-3 md:py-3.5 pl-12 pr-6 text-sm font-bold shadow-sm outline-none"
            />
          </div>
          <button 
            onClick={startAdding}
            className="w-full md:w-auto px-8 py-4 bg-black text-white font-black uppercase tracking-widest text-[10px] md:text-xs rounded-2xl shadow-xl flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined">add</span>
            New Plan
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
        {displayPlans.map((plan) => {
          const isOwner = currentUser.role === UserRole.ADMIN || plan.creatorId === currentUser.id;
          return (
            <div key={plan.id} className="bg-white rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 border border-neutral-100 shadow-sm hover:shadow-2xl transition-all group relative overflow-hidden flex flex-col h-full">
              <div className="flex justify-between items-start mb-6 md:mb-8 z-10 relative">
                <div className="space-y-2">
                  <span className="text-[10px] font-black text-accent uppercase tracking-widest block">{plan.totalCalories} kcal</span>
                  <h3 className="text-xl md:text-2xl font-black text-black uppercase tracking-tight leading-none truncate max-w-[200px]">{plan.name}</h3>
                </div>
                {isOwner && (
                  <div className="flex gap-2">
                    <button onClick={() => startEditing(plan)} className="p-2 md:p-3 bg-neutral-50 rounded-xl text-neutral-400 hover:text-black">
                      <span className="material-symbols-outlined text-lg md:text-xl">edit</span>
                    </button>
                    <button onClick={() => removePlan(plan.id)} className="p-2 md:p-3 bg-neutral-50 rounded-xl text-neutral-400 hover:text-red-500">
                      <span className="material-symbols-outlined text-lg md:text-xl">delete</span>
                    </button>
                  </div>
                )}
              </div>
              <p className="text-sm text-neutral-400 font-medium leading-relaxed mb-6 md:mb-10 italic flex-grow relative z-10">"{plan.description || 'No summary.'}"</p>
              
              <div className="flex items-center justify-between pt-6 border-t border-neutral-50 relative z-10">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 px-2 py-0.5 bg-neutral-50 rounded-lg border border-neutral-100 shrink-0">
                    <span className={`material-symbols-outlined text-[14px] ${plan.isPublic ? 'text-green-500' : 'text-neutral-300'}`}>
                      {plan.isPublic ? 'public' : 'lock_person'}
                    </span>
                    <p className="text-[8px] font-black text-neutral-400 uppercase truncate max-w-[60px] md:max-w-[80px]">{plan.creatorName || 'System'}</p>
                  </div>
                  <div className="flex items-center gap-2 text-neutral-300 shrink-0">
                    <span className="material-symbols-outlined text-[18px]">restaurant</span>
                    <span className="text-[10px] font-black uppercase tracking-widest">{plan.meals.length} Meals</span>
                  </div>
                </div>
              </div>
              <span className="material-symbols-outlined text-[100px] md:text-[140px] absolute -bottom-5 md:-bottom-10 -right-5 md:-right-10 text-neutral-50 select-none -rotate-12 group-hover:rotate-0 transition-transform duration-700">nutrition</span>
            </div>
          );
        })}
        {displayPlans.length === 0 && (
          <div className="col-span-full py-20 text-center space-y-4">
            <span className="material-symbols-outlined text-6xl text-neutral-100">search_off</span>
            <p className="text-neutral-300 font-black uppercase tracking-[0.2em]">No matching plans found</p>
          </div>
        )}
      </div>

      {/* Builder Modal (Responsive) */}
      {isAdding && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-0 md:p-6 bg-black/95 backdrop-blur-xl animate-in fade-in duration-300 overflow-hidden">
           <div className="bg-neutral-50 w-full max-w-[100%] md:max-w-6xl rounded-none md:rounded-[4rem] shadow-2xl overflow-hidden relative flex flex-col h-full md:h-[90vh]">
              {/* COMPACT HEADER */}
              <div className="p-4 md:p-10 border-b border-neutral-100 flex justify-between items-center bg-white shrink-0 gap-4">
                 <div className="space-y-1 text-left flex-1">
                    <h3 className="hidden md:block text-2xl font-black font-display uppercase tracking-tight">Nutrition Architect</h3>
                    <div className="flex flex-col md:flex-row gap-2 md:gap-8 items-start md:items-center">
                       <input 
                         type="text" value={activePlan.name} onChange={e => setActivePlan({...activePlan, name: e.target.value})}
                         placeholder="Plan Name..." className="text-sm md:text-lg font-black uppercase text-black bg-transparent outline-none focus:text-accent border-b border-neutral-100 w-full md:w-80" 
                       />
                       <div className="flex items-center gap-4 w-full md:w-auto">
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-accent text-sm md:text-base">bolt</span>
                            <input 
                              type="number" value={activePlan.totalCalories} onChange={e => setActivePlan({...activePlan, totalCalories: parseInt(e.target.value)})}
                              placeholder="Kcal" className="text-sm md:text-lg font-black text-accent bg-transparent outline-none border-b border-neutral-100 w-16 md:w-24" 
                            />
                          </div>
                          <div className="flex items-center gap-2 px-3 py-1.5 bg-neutral-50 rounded-lg border border-neutral-100 ml-auto md:ml-0">
                             <p className="text-[8px] md:text-[9px] font-black uppercase text-neutral-400">Public</p>
                             <div 
                                onClick={() => setActivePlan({...activePlan, isPublic: !activePlan.isPublic})}
                                className={`w-8 md:w-11 h-4 md:h-6 rounded-full relative transition-colors cursor-pointer shrink-0 ${activePlan.isPublic ? 'bg-accent' : 'bg-neutral-200'}`}
                              >
                                <div className={`absolute top-0.5 md:top-1 w-3 md:w-4 h-3 md:h-4 bg-white rounded-full transition-transform duration-200 ${activePlan.isPublic ? 'translate-x-4 md:translate-x-6' : 'translate-x-1'}`}></div>
                             </div>
                          </div>
                       </div>
                    </div>
                 </div>
                 <div className="flex gap-2 shrink-0">
                    <button onClick={handleSave} className="px-4 md:px-8 py-3 md:py-4 bg-black text-white rounded-xl md:rounded-2xl font-black uppercase tracking-widest text-[10px] md:text-xs flex items-center gap-2">
                       <span className="material-symbols-outlined text-sm md:text-base">save</span>
                       <span className="hidden md:inline">Save Plan</span>
                    </button>
                    <button onClick={() => setIsAdding(false)} className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-white border border-neutral-100 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all">
                        <span className="material-symbols-outlined text-sm md:text-base">close</span>
                    </button>
                 </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 md:p-10 no-scrollbar space-y-8 md:space-y-12">
                 <div className="flex justify-between items-center">
                    <h2 className="text-[10px] md:text-sm font-black uppercase tracking-[0.2em] text-neutral-400 border-l-4 border-accent pl-3 md:pl-4">Meal Blocks</h2>
                    <button onClick={addMealBlock} className="px-4 py-2 bg-black text-white rounded-lg text-[9px] md:text-[10px] font-black uppercase tracking-widest">+ Add Meal</button>
                 </div>

                 <div className="space-y-6 md:space-y-8 pb-10">
                    {activePlan.meals?.map((meal, mIdx) => (
                       <div key={meal.id} className="p-4 md:p-8 bg-white rounded-[2rem] md:rounded-[3rem] border border-neutral-100 shadow-sm space-y-4 md:space-y-6 text-left">
                          <div className="flex justify-between items-center border-b border-neutral-50 pb-4">
                             <input 
                                type="text" value={meal.label} onChange={e => {
                                  const n = [...activePlan.meals!]; n[mIdx].label = e.target.value; setActivePlan({...activePlan, meals: n});
                                }}
                                className="text-lg md:text-xl font-black uppercase text-black bg-transparent outline-none focus:text-accent w-full"
                             />
                             <div className="flex gap-2 shrink-0 ml-4">
                                <button onClick={() => addFoodToMeal(mIdx)} className="p-2 text-accent hover:bg-accent/5 rounded-lg"><span className="material-symbols-outlined text-xl">add_circle</span></button>
                                <button onClick={() => removeMeal(mIdx)} className="p-2 text-neutral-300 hover:text-red-500"><span className="material-symbols-outlined text-xl">delete</span></button>
                             </div>
                          </div>

                          <div className="space-y-3">
                             {meal.items.map((food, fIdx) => (
                                <div key={food.id} className="flex flex-col md:grid md:grid-cols-12 gap-3 md:gap-4 bg-neutral-50 p-3 md:p-4 rounded-xl md:rounded-2xl border border-neutral-100 relative">
                                   <button 
                                     onClick={() => { const n = [...activePlan.meals!]; n[mIdx].items.splice(fIdx, 1); setActivePlan({...activePlan, meals: n}); }}
                                     className="md:hidden absolute top-2 right-2 text-neutral-300 hover:text-red-500"
                                   >
                                      <span className="material-symbols-outlined text-base">close</span>
                                   </button>

                                   <div className="md:col-span-5 grid grid-cols-2 gap-2">
                                      <div className="space-y-0.5">
                                         <label className="text-[7px] md:text-[8px] font-black uppercase text-neutral-300 ml-1">Element</label>
                                         <input type="text" value={food.name} onChange={e => updateFoodItem(mIdx, fIdx, 'name', e.target.value)} className="w-full bg-white p-2 md:p-3 rounded-lg md:rounded-xl text-[10px] md:text-sm font-bold outline-none" placeholder="e.g. Chicken" />
                                      </div>
                                      <div className="space-y-0.5">
                                         <label className="text-[7px] md:text-[8px] font-black uppercase text-neutral-300 ml-1">Amount</label>
                                         <input type="text" value={food.amount} onChange={e => updateFoodItem(mIdx, fIdx, 'amount', e.target.value)} className="w-full bg-white p-2 md:p-3 rounded-lg md:rounded-xl text-[10px] md:text-sm font-bold outline-none" placeholder="100g" />
                                      </div>
                                   </div>
                                   <div className="md:col-span-6 grid grid-cols-4 gap-2">
                                      {['calories', 'protein', 'carbs', 'fat'].map(m => (
                                        <div key={m} className="space-y-0.5 text-center">
                                          <label className="text-[7px] md:text-[8px] font-black uppercase text-neutral-300">{m.substr(0,1)}</label>
                                          <input type="number" value={(food as any)[m]} onChange={e => updateFoodItem(mIdx, fIdx, m as any, parseInt(e.target.value))} className="w-full bg-white p-2 md:p-3 rounded-lg md:rounded-xl text-[9px] md:text-xs font-black text-center outline-none" />
                                        </div>
                                      ))}
                                   </div>
                                   <div className="hidden md:flex md:col-span-1 justify-end items-center">
                                      <button onClick={() => {
                                        const n = [...activePlan.meals!]; n[mIdx].items.splice(fIdx, 1); setActivePlan({...activePlan, meals: n});
                                      }} className="text-neutral-300 hover:text-red-500 transition-colors"><span className="material-symbols-outlined text-xl">remove_circle</span></button>
                                   </div>
                                </div>
                             ))}
                          </div>
                       </div>
                    ))}
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default CoachMealLibrary;
