
import React, { useState, useMemo } from 'react';
import { MEAL_PLAN_LIBRARY } from '../../constants';
import { MealPlan, Meal, FoodItem, User, UserRole } from '../../types';

interface MealLibraryProps {
  currentUser: User;
}

const CoachMealLibrary: React.FC<MealLibraryProps> = ({ currentUser }) => {
  const [plans, setPlans] = useState<MealPlan[]>(MEAL_PLAN_LIBRARY);
  const [isAdding, setIsAdding] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const displayPlans = useMemo(() => {
    return plans.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           p.creatorName?.toLowerCase().includes(searchQuery.toLowerCase());
      const hasPermission = currentUser.role === UserRole.ADMIN || p.isPublic || p.creatorId === currentUser.id;
      return matchesSearch && hasPermission;
    });
  }, [plans, currentUser, searchQuery]);

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

  const handleSave = () => {
    if (!activePlan.name) return;
    const completePlan: MealPlan = {
      id: activePlan.id || 'mp-' + Math.random().toString(36).substr(2, 9),
      name: activePlan.name!,
      description: activePlan.description || '',
      totalCalories: activePlan.totalCalories || 0,
      meals: activePlan.meals || [],
      isPublic: activePlan.isPublic ?? true,
      creatorId: activePlan.creatorId || currentUser.id,
      creatorName: activePlan.creatorName || `${currentUser.firstName} ${currentUser.lastName}`
    };

    if (activePlan.id) {
      setPlans(plans.map(p => p.id === completePlan.id ? completePlan : p));
    } else {
      setPlans([completePlan, ...plans]);
    }
    setIsAdding(false);
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

  const removePlan = (id: string) => {
    if (window.confirm("Delete this master meal plan?")) {
      setPlans(plans.filter(p => p.id !== id));
    }
  };

  return (
    <div className="space-y-12 text-left animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-black font-display tracking-tight text-black uppercase">Meal Plan Library</h1>
          <p className="text-neutral-400 font-medium">Architect global nutrition blueprints for performance fueling.</p>
        </div>
        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-64 min-w-[200px]">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-neutral-300">search</span>
            <input 
              type="text" 
              placeholder="Search nutrition..." 
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
        {displayPlans.map((plan) => {
          const isOwner = currentUser.role === UserRole.ADMIN || plan.creatorId === currentUser.id;
          return (
            <div key={plan.id} className="bg-white rounded-[2.5rem] p-10 border border-neutral-100 shadow-sm hover:shadow-2xl transition-all group relative overflow-hidden flex flex-col h-full">
              <div className="flex justify-between items-start mb-8 z-10 relative text-left">
                <div className="space-y-2">
                  <span className="text-[10px] font-black text-accent uppercase tracking-widest block">{plan.totalCalories} kcal Plan</span>
                  <h3 className="text-2xl font-black text-black uppercase tracking-tight leading-none">{plan.name}</h3>
                </div>
                {isOwner && (
                  <div className="flex gap-2">
                    <button onClick={() => startEditing(plan)} className="p-3 bg-neutral-50 rounded-xl text-neutral-400 hover:bg-black hover:text-white transition-all shadow-sm">
                      <span className="material-symbols-outlined text-xl">edit</span>
                    </button>
                    <button onClick={() => removePlan(plan.id)} className="p-3 bg-neutral-50 rounded-xl text-neutral-400 hover:bg-red-500 hover:text-white transition-all shadow-sm">
                      <span className="material-symbols-outlined text-xl">delete</span>
                    </button>
                  </div>
                )}
              </div>
              <p className="text-sm text-neutral-400 font-medium leading-relaxed mb-10 italic flex-grow relative z-10 text-left">"{plan.description || 'No summary.'}"</p>
              
              <div className="flex items-center justify-between pt-6 border-t border-neutral-50 relative z-10">
                <div className="flex items-center gap-2 overflow-hidden mr-4">
                  <div className="flex items-center gap-1.5 px-2 py-0.5 bg-neutral-50 rounded-lg border border-neutral-100 shrink-0">
                    <span className={`material-symbols-outlined text-[14px] ${plan.isPublic ? 'text-green-500' : 'text-neutral-300'}`}>
                      {plan.isPublic ? 'public' : 'lock_person'}
                    </span>
                    <p className="text-[8px] font-black text-neutral-400 uppercase truncate max-w-[80px]">{plan.creatorName || 'System'}</p>
                  </div>
                  <span className="text-neutral-200 text-xs font-bold shrink-0">•</span>
                  <div className="flex items-center gap-2 text-neutral-300 shrink-0">
                    <span className="material-symbols-outlined text-[18px]">restaurant</span>
                    <span className="text-[10px] font-black uppercase tracking-widest">{plan.meals.length} Blocks</span>
                  </div>
                </div>
              </div>
              <span className="material-symbols-outlined text-[140px] absolute -bottom-10 -right-10 text-neutral-50 select-none -rotate-12 group-hover:rotate-0 transition-transform duration-700">nutrition</span>
            </div>
          );
        })}
        {displayPlans.length === 0 && (
          <div className="col-span-full py-20 text-center space-y-4">
            <span className="material-symbols-outlined text-6xl text-neutral-100">search_off</span>
            <p className="text-neutral-300 font-black uppercase tracking-[0.2em]">No matching meal plans found</p>
          </div>
        )}
      </div>

      {/* Builder Modal */}
      {isAdding && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-black/95 backdrop-blur-xl animate-in fade-in duration-300 overflow-hidden">
           <div className="bg-neutral-50 w-full max-w-6xl rounded-[4rem] shadow-2xl overflow-hidden relative flex flex-col h-[90vh]">
              <div className="p-12 border-b border-neutral-100 flex justify-between items-center bg-white shrink-0">
                 <div className="space-y-1 text-left">
                    <h3 className="text-3xl font-black font-display uppercase tracking-tight text-left">Nutrition Architect</h3>
                    <div className="flex gap-8 items-center mt-4">
                       <input 
                         type="text" value={activePlan.name} onChange={e => setActivePlan({...activePlan, name: e.target.value})}
                         placeholder="Blueprint Name..." className="text-lg font-black uppercase text-black bg-transparent outline-none focus:text-accent border-b-2 border-neutral-100 w-80" 
                       />
                       <div className="flex items-center gap-3">
                         <span className="material-symbols-outlined text-neutral-300">bolt</span>
                         <input 
                           type="number" value={activePlan.totalCalories} onChange={e => setActivePlan({...activePlan, totalCalories: parseInt(e.target.value)})}
                           placeholder="Kcal Goal" className="text-lg font-black text-accent bg-transparent outline-none border-b-2 border-neutral-100 w-32" 
                         />
                       </div>
                       <div className="flex items-center gap-3 px-4 py-2 bg-neutral-50 rounded-xl border border-neutral-100">
                          <p className="text-[9px] font-black uppercase text-neutral-400">Public for all coaches?</p>
                          <div 
                             onClick={() => setActivePlan({...activePlan, isPublic: !activePlan.isPublic})}
                             className={`w-11 h-6 rounded-full relative transition-colors cursor-pointer ${activePlan.isPublic ? 'bg-accent' : 'bg-neutral-200'}`}
                           >
                             <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 ${activePlan.isPublic ? 'translate-x-6' : 'translate-x-1'}`}></div>
                          </div>
                       </div>
                    </div>
                 </div>
                 <div className="flex gap-4">
                    <button onClick={handleSave} className="px-10 py-5 bg-black text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-neutral-800 transition-all shadow-xl">Commit Blueprint</button>
                    <button onClick={() => setIsAdding(false)} className="w-14 h-14 rounded-2xl bg-white border border-neutral-100 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-sm">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                 </div>
              </div>

              <div className="flex-1 overflow-y-auto p-12 no-scrollbar space-y-12">
                 <div className="flex justify-between items-center text-left">
                    <h2 className="text-sm font-black uppercase tracking-[0.3em] text-neutral-400 border-l-4 border-accent pl-4">Meal Block Layout</h2>
                    <button onClick={addMealBlock} className="px-6 py-3 bg-black text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-accent transition-all">+ Add Meal Block</button>
                 </div>

                 <div className="space-y-8">
                    {activePlan.meals?.map((meal, mIdx) => (
                       <div key={meal.id} className="p-8 bg-white rounded-[3rem] border border-neutral-100 shadow-sm space-y-8 animate-in slide-in-from-bottom-4 text-left">
                          <div className="flex justify-between items-center border-b border-neutral-50 pb-6 text-left">
                             <input 
                                type="text" value={meal.label} onChange={e => {
                                  const n = [...activePlan.meals!]; n[mIdx].label = e.target.value; setActivePlan({...activePlan, meals: n});
                                }}
                                className="text-xl font-black uppercase text-black bg-transparent outline-none focus:text-accent"
                             />
                             <div className="flex gap-4">
                                <button onClick={() => addFoodToMeal(mIdx)} className="text-[10px] font-black text-accent uppercase tracking-widest hover:underline">+ Add Element</button>
                                <button onClick={() => removeMeal(mIdx)} className="text-neutral-300 hover:text-red-500 transition-colors"><span className="material-symbols-outlined text-lg">delete</span></button>
                             </div>
                          </div>

                          <div className="grid gap-3">
                             {meal.items.map((food, fIdx) => (
                                <div key={food.id} className="grid grid-cols-12 gap-4 items-center bg-neutral-50 p-4 rounded-2xl border border-neutral-100 text-left">
                                   <div className="col-span-4">
                                      <label className="text-[8px] font-black uppercase text-neutral-300 ml-1">Food Element</label>
                                      <input type="text" value={food.name} onChange={e => updateFoodItem(mIdx, fIdx, 'name', e.target.value)} className="w-full bg-white p-3 rounded-xl text-sm font-bold border-none outline-none" />
                                   </div>
                                   <div className="col-span-2">
                                      <label className="text-[8px] font-black uppercase text-neutral-300 ml-1">Amount</label>
                                      <input type="text" value={food.amount} onChange={e => updateFoodItem(mIdx, fIdx, 'amount', e.target.value)} className="w-full bg-white p-3 rounded-xl text-sm font-bold border-none outline-none" />
                                   </div>
                                   {['calories', 'protein', 'carbs', 'fat'].map(m => (
                                     <div key={m} className="col-span-1 text-center">
                                       <label className="text-[8px] font-black uppercase text-neutral-300">{m.substr(0,1)}</label>
                                       <input type="number" value={(food as any)[m]} onChange={e => updateFoodItem(mIdx, fIdx, m as any, parseInt(e.target.value))} className="w-full bg-white p-3 rounded-xl text-xs font-black text-center border-none outline-none" />
                                     </div>
                                   ))}
                                   <div className="col-span-2 flex justify-end">
                                      <button onClick={() => {
                                        const n = [...activePlan.meals!]; n[mIdx].items.splice(fIdx, 1); setActivePlan({...activePlan, meals: n});
                                      }} className="text-neutral-300 hover:text-red-500 transition-colors"><span className="material-symbols-outlined text-lg">remove_circle</span></button>
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
