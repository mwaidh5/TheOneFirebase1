import React, { useState } from 'react';
import { useT } from '../i18n/I18nContext';
import type { TranslationKey } from '../i18n/translations';

// Using mock data for now to represent the new structure where a meal has options
const MOCK_MEAL_PLAN = {
  id: 'mp1',
  name: 'Performance Plan',
  totalCalories: 2800,
  meals: [
    {
      id: 'm1',
      label: 'Breakfast',
      items: [
        {
          id: 'i1',
          name: 'Carbohydrates',
          options: [
            { id: 'o1', name: 'Oatmeal', items: [{ name: 'Oats', amount: '100g' }, { name: 'Berries', amount: '50g' }] },
            { id: 'o2', name: 'Toast', items: [{ name: 'Whole Wheat Bread', amount: '2 slices' }, { name: 'Jam', amount: '1 tbsp' }] }
          ]
        },
        {
          id: 'i2',
          name: 'Protein',
          options: [
            { id: 'o3', name: 'Eggs', items: [{ name: 'Whole Eggs', amount: '3' }] },
            { id: 'o4', name: 'Protein Shake', items: [{ name: 'Whey Protein', amount: '1 scoop' }, { name: 'Milk', amount: '250ml' }] }
          ]
        }
      ]
    },
    {
      id: 'm2',
      label: 'Lunch',
      items: [
        {
          id: 'i3',
          name: 'Base',
          options: [
            { id: 'o5', name: 'Rice Bowl', items: [{ name: 'White Rice', amount: '150g' }] },
            { id: 'o6', name: 'Sweet Potato', items: [{ name: 'Roasted Sweet Potato', amount: '200g' }] }
          ]
        },
        {
          id: 'i4',
          name: 'Protein',
          options: [
            { id: 'o7', name: 'Chicken', items: [{ name: 'Chicken Breast', amount: '150g' }] },
            { id: 'o8', name: 'Beef', items: [{ name: 'Lean Ground Beef', amount: '150g' }] }
          ]
        }
      ]
    }
  ]
};

const MealPlan: React.FC = () => {
  const { t } = useT();
  // Store the selected option for each item (mealId_itemId -> optionId)
  const [selections, setSelections] = useState<Record<string, string>>({});

  const handleSelectOption = (mealId: string, itemId: string, optionId: string) => {
    setSelections(prev => ({
      ...prev,
      [`${mealId}_${itemId}`]: optionId
    }));
  };

  // Grocery list = every ingredient from the selected option of each meal item
  // (falls back to the first option when nothing is selected yet).
  const [showGrocery, setShowGrocery] = useState(false);
  const buildGroceryList = () => {
    const map: Record<string, string[]> = {};
    MOCK_MEAL_PLAN.meals.forEach(meal => {
      meal.items.forEach(item => {
        const selId = selections[`${meal.id}_${item.id}`] || item.options[0]?.id;
        const opt = item.options.find(o => o.id === selId) || item.options[0];
        opt?.items.forEach(fi => {
          (map[fi.name] ||= []).push(fi.amount);
        });
      });
    });
    return Object.entries(map).map(([name, amounts]) => ({ name, amounts: amounts.join(' + ') }));
  };

  const dayKeys: TranslationKey[] = ['meal.day_mon', 'meal.day_tue', 'meal.day_wed', 'meal.day_thu', 'meal.day_fri', 'meal.day_sat', 'meal.day_sun'];

  const targets: Array<{ labelKey: TranslationKey; val: string; subKey: TranslationKey }> = [
    { labelKey: 'meal.calories', val: '2,800', subKey: 'meal.kcal' },
    { labelKey: 'meal.protein', val: '220', subKey: 'meal.grams' },
    { labelKey: 'meal.carbs', val: '300', subKey: 'meal.grams' },
    { labelKey: 'meal.fat', val: '85', subKey: 'meal.grams' },
  ];

  const macros: Array<{ labelKey: TranslationKey; val: string; pct: number; color: string }> = [
    { labelKey: 'meal.protein', val: '176g / 220g', pct: 80, color: 'bg-black' },
    { labelKey: 'meal.carbohydrates', val: '150g / 300g', pct: 50, color: 'bg-black/60' },
    { labelKey: 'meal.fat', val: '45g / 85g', pct: 53, color: 'bg-black/30' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 md:px-6 md:py-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 mb-8 md:mb-12">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-neutral-500 text-sm font-medium mb-1">
            <span className="material-symbols-outlined text-[18px]">restaurant_menu</span>
            <span>{t('meal.meal_plan')}</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black font-display tracking-tight text-black uppercase">{t('meal.my_nutrition')}</h1>
          <p className="text-neutral-500 text-sm md:text-lg max-w-xl">{t('meal.tagline')}</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowGrocery(true)} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 md:px-6 py-3 border border-neutral-200 rounded-full bg-white text-xs md:text-sm font-bold hover:bg-neutral-50 shadow-sm transition-all">
            <span className="material-symbols-outlined text-[18px]">shopping_basket</span>
            {t('meal.grocery_list')}
          </button>
          <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 md:px-6 py-3 bg-black text-white rounded-full text-xs md:text-sm font-bold hover:bg-neutral-800 shadow-xl transition-all">
            <span className="material-symbols-outlined text-[18px]">download</span>
            {t('meal.download_pdf')}
          </button>
        </div>
      </div>

      {/* Week Selector */}
      <div className="mb-8 md:mb-12 overflow-x-auto no-scrollbar border-b border-neutral-100">
        <div className="flex min-w-max">
          {dayKeys.map((dayKey, i) => (
            <button key={dayKey} className={`flex flex-col items-center px-6 md:px-10 py-3 md:py-4 transition-all border-b-[3px] ${i === 0 ? 'border-black' : 'border-transparent text-gray-400 hover:text-black'}`}>
              <span className="text-[10px] font-bold uppercase tracking-widest mb-1">{t(dayKey)}</span>
              <span className={`text-xl font-black ${i === 0 ? 'text-black' : ''}`}>{12 + i}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 md:gap-12">
        {/* Targets Column */}
        <div className="lg:col-span-4 space-y-5 md:space-y-8">
          <div className="bg-neutral-50 rounded-3xl p-5 md:p-8 border border-neutral-100">
            <h3 className="text-xl font-bold font-display uppercase mb-8 flex items-center gap-2">
              <span className="material-symbols-outlined">monitoring</span>
              {t('meal.daily_targets')}
            </h3>
            <div className="grid grid-cols-2 gap-3 md:gap-4">
              {targets.map((stat) => (
                <div key={stat.labelKey} className="bg-white p-4 md:p-6 rounded-2xl border border-black/5 shadow-sm">
                  <p className="text-neutral-400 text-[10px] font-bold uppercase tracking-widest mb-1">{t(stat.labelKey)}</p>
                  <p className="text-xl md:text-2xl font-black text-black">{stat.val}</p>
                  <p className="text-[10px] text-neutral-300 font-bold uppercase mt-1">{t(stat.subKey)}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-neutral-100 rounded-3xl p-5 md:p-8 shadow-sm">
            <h3 className="text-xl font-bold font-display uppercase mb-6 md:mb-8">{t('meal.todays_consumption')}</h3>
            <div className="space-y-8">
              {macros.map((macro) => (
                <div key={macro.labelKey} className="space-y-2">
                  <div className="flex justify-between items-end">
                    <span className="text-sm font-bold text-black uppercase tracking-wider">{t(macro.labelKey)}</span>
                    <span className="text-xs font-medium text-neutral-400">{macro.val}</span>
                  </div>
                  <div className="h-2.5 w-full bg-neutral-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${macro.pct}%`, backgroundColor: macro.pct === 80 ? '#137fec' : '#000' }}></div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-10 p-5 bg-green-50 rounded-2xl border border-green-100 flex gap-4 items-start">
              <span className="material-symbols-outlined text-green-700">check_circle</span>
              <div className="space-y-1">
                <p className="text-sm font-bold text-green-800">{t('meal.on_track')}</p>
                <p className="text-xs text-green-700 leading-relaxed">{t('meal.on_track_msg')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Meals Column */}
        <div className="lg:col-span-8 space-y-5 md:space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
            <h2 className="text-xl md:text-2xl font-bold font-display uppercase">{t('meal.scheduled_meals')}</h2>
            <span className="text-[11px] md:text-sm text-neutral-400 font-bold uppercase tracking-widest">{t('meal.meals_kcal', { meals: MOCK_MEAL_PLAN.meals.length, kcal: MOCK_MEAL_PLAN.totalCalories })}</span>
          </div>

          <div className="grid gap-5 md:gap-8">
            {MOCK_MEAL_PLAN.meals.map(meal => (
              <div key={meal.id} className="group flex flex-col gap-5 md:gap-6 p-5 md:p-8 rounded-3xl md:rounded-[2rem] border border-neutral-100 bg-white shadow-sm hover:shadow-xl transition-all">
                <div className="flex justify-between items-center border-b border-neutral-100 pb-3 md:pb-4">
                  <h3 className="text-xl md:text-2xl font-black text-black font-display uppercase tracking-tight">{meal.label}</h3>
                </div>

                <div className="space-y-6 md:space-y-8">
                  {meal.items.map((item) => (
                    <div key={item.id} className="space-y-4">
                      <div className="flex items-center gap-2">
                         <span className="w-1.5 h-1.5 rounded-full bg-accent"></span>
                         <h4 className="text-xs font-black text-neutral-400 uppercase tracking-widest">{item.name}</h4>
                      </div>
                      <div className="grid grid-cols-1 gap-3 md:flex md:gap-4 md:overflow-x-auto md:pb-2 no-scrollbar">
                        {item.options.map((option) => {
                          const isSelected = selections[`${meal.id}_${item.id}`] === option.id;
                          return (
                            <label
                              key={option.id}
                              className={`
                                flex flex-col gap-3 p-4 md:p-5 rounded-2xl border-2 cursor-pointer transition-all w-full md:w-auto md:min-w-[240px] md:shrink-0
                                ${isSelected
                                  ? 'border-black bg-black text-white shadow-lg md:scale-[1.02]'
                                  : 'border-neutral-100 bg-neutral-50 hover:border-neutral-300 text-black'}
                              `}
                            >
                              <div className="flex justify-between items-start">
                                <span className="font-black uppercase tracking-tight text-lg">{option.name}</span>
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? 'border-white bg-white' : 'border-neutral-300 bg-white'}`}>
                                  {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-black"></div>}
                                </div>
                                <input 
                                  type="radio" 
                                  name={`meal-${meal.id}-item-${item.id}`} 
                                  className="hidden"
                                  checked={isSelected}
                                  onChange={() => handleSelectOption(meal.id, item.id, option.id)}
                                />
                              </div>
                              <div className={`text-sm font-medium space-y-1 ${isSelected ? 'text-neutral-300' : 'text-neutral-500'}`}>
                                {option.items.map((fi, idx) => (
                                  <div key={idx} className="flex justify-between">
                                    <span>{fi.name}</span>
                                    <span className="font-bold">{fi.amount}</span>
                                  </div>
                                ))}
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 md:mt-12 rounded-3xl bg-black text-white p-6 md:p-10 overflow-hidden relative shadow-2xl">
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
              <div className="max-w-md space-y-3">
                <h4 className="text-2xl font-bold font-display uppercase tracking-tight">{t('meal.custom_plan_q')}</h4>
                <p className="text-neutral-400 text-base leading-relaxed">{t('meal.custom_plan_desc')}</p>
              </div>
              <button className="shrink-0 bg-white text-black px-8 py-4 rounded-full font-bold text-base hover:bg-neutral-100 transition-all shadow-xl">
                {t('meal.explore_coaching')}
              </button>
            </div>
            <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-white/10 rounded-full blur-[80px]"></div>
          </div>
        </div>
      </div>

      {/* Grocery list modal */}
      {showGrocery && (
        <div className="fixed inset-0 z-[9999] flex items-end md:items-center justify-center md:p-6 bg-black/70 backdrop-blur-sm" onClick={() => setShowGrocery(false)}>
          <div className="bg-white w-full md:max-w-md rounded-t-[2rem] md:rounded-3xl shadow-2xl flex flex-col max-h-[80vh]" onClick={(e) => e.stopPropagation()} style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
            <div className="p-5 border-b border-neutral-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-accent">shopping_basket</span>
                <h3 className="text-lg font-black font-display uppercase">{t('meal.grocery_list')}</h3>
              </div>
              <button onClick={() => setShowGrocery(false)} className="w-9 h-9 rounded-xl bg-neutral-50 flex items-center justify-center hover:bg-black hover:text-white transition-all"><span className="material-symbols-outlined">close</span></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2 no-scrollbar">
              {buildGroceryList().map((g, i) => (
                <label key={i} className="flex items-center gap-3 p-3 rounded-xl bg-neutral-50 border border-neutral-100">
                  <input type="checkbox" className="w-5 h-5 rounded-md accent-black shrink-0" />
                  <span className="flex-1 text-sm font-black uppercase text-black">{g.name}</span>
                  <span className="text-xs font-bold text-neutral-400">{g.amounts}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MealPlan;
