import React, { useState } from 'react';
import { useT } from '../i18n/I18nContext';
import type { TranslationKey } from '../i18n/translations';

// ── Mock per-day plan (until plans are wired to purchased courses) ───────────
// The diet is defined PER DAY of the week. A day can reuse another day's meals
// (how "duplicate this diet" looks in practice) or be flagged as a cheat day.
interface FoodLine { name: string; amount: string; }
interface MealOption { id: string; name: string; items: FoodLine[]; }
interface MealItem { id: string; name: string; options: MealOption[]; }
interface Meal { id: string; label: string; items: MealItem[]; }
interface DayPlan { isCheat?: boolean; meals: Meal[]; }

const BASE_MEALS: Meal[] = [
  {
    id: 'm1',
    label: 'Breakfast',
    items: [
      {
        id: 'i1',
        name: 'Carbohydrates',
        options: [
          { id: 'o1', name: 'Oatmeal', items: [{ name: 'Oats', amount: '100g' }, { name: 'Berries', amount: '50g' }] },
          { id: 'o2', name: 'Toast', items: [{ name: 'Whole Wheat Bread', amount: '2 slices' }, { name: 'Jam', amount: '1 tbsp' }] },
        ],
      },
      {
        id: 'i2',
        name: 'Protein',
        options: [
          { id: 'o3', name: 'Eggs', items: [{ name: 'Whole Eggs', amount: '3' }] },
          { id: 'o4', name: 'Protein Shake', items: [{ name: 'Whey Protein', amount: '1 scoop' }, { name: 'Milk', amount: '250ml' }] },
        ],
      },
    ],
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
          { id: 'o6', name: 'Sweet Potato', items: [{ name: 'Roasted Sweet Potato', amount: '200g' }] },
        ],
      },
      {
        id: 'i4',
        name: 'Protein',
        options: [
          { id: 'o7', name: 'Chicken', items: [{ name: 'Chicken Breast', amount: '150g' }] },
          { id: 'o8', name: 'Beef', items: [{ name: 'Lean Ground Beef', amount: '150g' }] },
        ],
      },
    ],
  },
  {
    id: 'm3',
    label: 'Dinner',
    items: [
      {
        id: 'i5',
        name: 'Light meal',
        options: [
          { id: 'o9', name: 'Tuna Salad', items: [{ name: 'Tuna', amount: '1 can' }, { name: 'Greens', amount: '1 bowl' }] },
          { id: 'o10', name: 'Greek Yogurt', items: [{ name: 'Yogurt', amount: '250g' }, { name: 'Honey', amount: '1 tsp' }] },
        ],
      },
    ],
  },
];

const LIGHT_MEALS: Meal[] = [
  BASE_MEALS[0],
  {
    id: 'm2l',
    label: 'Lunch',
    items: [
      {
        id: 'i3l',
        name: 'Light base',
        options: [
          { id: 'o5l', name: 'Quinoa Bowl', items: [{ name: 'Quinoa', amount: '120g' }, { name: 'Veggies', amount: '1 bowl' }] },
          { id: 'o6l', name: 'Lentil Soup', items: [{ name: 'Lentils', amount: '200g' }] },
        ],
      },
    ],
  },
  BASE_MEALS[2],
];

// Sunday(0) → Saturday(6). Sun–Thu share the training diet (duplicated),
// Friday is the cheat day (Iraqi weekend), Saturday is a lighter day.
const WEEK_PLAN: DayPlan[] = [
  { meals: BASE_MEALS },
  { meals: BASE_MEALS },
  { meals: BASE_MEALS },
  { meals: BASE_MEALS },
  { meals: BASE_MEALS },
  { isCheat: true, meals: [] },
  { meals: LIGHT_MEALS },
];

const PLAN_NAME = 'Performance Plan';
const PLAN_KCAL = 2800;

const MealPlan: React.FC = () => {
  const { t, lang } = useT();
  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDay());
  // Option selections keyed per day: `${day}_${mealId}_${itemId}` -> optionId
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [showGrocery, setShowGrocery] = useState(false);

  const dayPlan = WEEK_PLAN[selectedDay];
  const selKey = (mealId: string, itemId: string) => `${selectedDay}_${mealId}_${itemId}`;

  const handleSelectOption = (mealId: string, itemId: string, optionId: string) => {
    setSelections(prev => ({ ...prev, [selKey(mealId, itemId)]: optionId }));
  };

  // Grocery list for the SELECTED day — derived from the chosen options only
  // (no custom items; the plan is the single source of truth).
  const buildGroceryList = () => {
    const map: Record<string, string[]> = {};
    dayPlan.meals.forEach(meal => {
      meal.items.forEach(item => {
        const selId = selections[selKey(meal.id, item.id)] || item.options[0]?.id;
        const opt = item.options.find(o => o.id === selId) || item.options[0];
        opt?.items.forEach(fi => { (map[fi.name] ||= []).push(fi.amount); });
      });
    });
    return Object.entries(map).map(([name, amounts]) => ({ name, amounts: amounts.join(' + ') }));
  };

  // Sunday-first day tabs to match the Iraqi week.
  const dayKeys: TranslationKey[] = ['meal.day_sun', 'meal.day_mon', 'meal.day_tue', 'meal.day_wed', 'meal.day_thu', 'meal.day_fri', 'meal.day_sat'];

  const targets: Array<{ labelKey: TranslationKey; val: string; subKey: TranslationKey }> = [
    { labelKey: 'meal.calories', val: '2,800', subKey: 'meal.kcal' },
    { labelKey: 'meal.protein', val: '220', subKey: 'meal.grams' },
    { labelKey: 'meal.carbs', val: '300', subKey: 'meal.grams' },
    { labelKey: 'meal.fat', val: '85', subKey: 'meal.grams' },
  ];

  return (
    <div className="w-full max-w-3xl mx-auto px-4 md:px-6 py-6 md:py-10 text-start overflow-x-clip">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-neutral-500 text-xs font-medium mb-1">
            <span className="material-symbols-outlined text-[16px]">restaurant_menu</span>
            <span>{PLAN_NAME} · {PLAN_KCAL} {t('meal.kcal')}</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black font-display tracking-tight text-black uppercase">{t('meal.my_nutrition')}</h1>
        </div>
        <button onClick={() => setShowGrocery(true)} className="shrink-0 flex items-center gap-2 px-4 py-3 bg-black text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-lg">
          <span className="material-symbols-outlined text-[18px]">shopping_basket</span>
          <span className="hidden sm:inline">{t('meal.grocery_list')}</span>
        </button>
      </div>

      {/* Day selector — the diet is per day */}
      <div className="mb-6 -mx-4 px-4 overflow-x-auto no-scrollbar">
        <div className="flex gap-2 min-w-max">
          {dayKeys.map((dayKey, i) => {
            const isSel = selectedDay === i;
            const cheat = WEEK_PLAN[i].isCheat;
            return (
              <button
                key={dayKey}
                onClick={() => setSelectedDay(i)}
                className={`flex flex-col items-center px-4 py-2.5 rounded-2xl border transition-all min-w-[64px] ${
                  isSel ? (cheat ? 'bg-pink-500 border-pink-500 text-white shadow-lg' : 'bg-black border-black text-white shadow-lg')
                       : (cheat ? 'bg-pink-50 border-pink-100 text-pink-500' : 'bg-white border-neutral-100 text-neutral-400')
                }`}
              >
                <span className="text-[10px] font-black uppercase tracking-widest">{t(dayKey)}</span>
                <span className="material-symbols-outlined text-[16px] mt-0.5">{cheat ? 'celebration' : 'restaurant'}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Daily targets — compact strip */}
      {!dayPlan.isCheat && (
        <div className="grid grid-cols-4 gap-2 mb-6">
          {targets.map(stat => (
            <div key={stat.labelKey} className="bg-white p-3 rounded-2xl border border-neutral-100 text-center">
              <p className="text-base font-black text-black leading-none">{stat.val}</p>
              <p className="text-[8px] text-neutral-400 font-black uppercase tracking-widest mt-1">{t(stat.labelKey)}</p>
            </div>
          ))}
        </div>
      )}

      {/* Cheat day */}
      {dayPlan.isCheat ? (
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-pink-500 to-rose-600 text-white p-8 text-center shadow-2xl">
          <span className="material-symbols-outlined text-6xl">celebration</span>
          <h2 className="text-3xl font-black font-display uppercase tracking-tight mt-3">
            {lang === 'ar' ? 'يوم حر!' : 'Cheat Day!'}
          </h2>
          <p className="text-sm font-medium text-white/80 mt-2 max-w-sm mx-auto leading-relaxed">
            {lang === 'ar'
              ? 'استمتع بوجباتك المفضلة اليوم — باعتدال. عُد للخطة غداً.'
              : 'Enjoy your favourite meals today — keep it reasonable. Back on the plan tomorrow.'}
          </p>
          <span className="material-symbols-outlined absolute -bottom-8 -right-6 text-[140px] text-white/10 select-none">icecream</span>
        </div>
      ) : (
        <div className="space-y-4">
          {dayPlan.meals.map(meal => (
            <div key={meal.id} className="bg-white rounded-3xl border border-neutral-100 shadow-sm p-4 md:p-6 space-y-4">
              <h3 className="text-lg font-black text-black font-display uppercase tracking-tight border-b border-neutral-50 pb-2">{meal.label}</h3>
              {meal.items.map(item => (
                <div key={item.id} className="space-y-2.5">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                    <h4 className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">{item.name}</h4>
                  </div>
                  <div className="grid grid-cols-1 gap-2.5">
                    {item.options.map(option => {
                      const isSelected = (selections[selKey(meal.id, item.id)] || item.options[0]?.id) === option.id;
                      return (
                        <button
                          key={option.id}
                          onClick={() => handleSelectOption(meal.id, item.id, option.id)}
                          className={`w-full text-start flex flex-col gap-2 p-4 rounded-2xl border-2 transition-all ${
                            isSelected ? 'border-black bg-black text-white shadow-md' : 'border-neutral-100 bg-neutral-50 text-black'
                          }`}
                        >
                          <div className="flex justify-between items-center gap-2">
                            <span className="font-black uppercase tracking-tight text-sm">{option.name}</span>
                            <span className={`material-symbols-outlined text-[18px] ${isSelected ? 'text-white filled' : 'text-neutral-300'}`}>
                              {isSelected ? 'check_circle' : 'radio_button_unchecked'}
                            </span>
                          </div>
                          <div className={`text-xs font-medium space-y-0.5 ${isSelected ? 'text-neutral-300' : 'text-neutral-500'}`}>
                            {option.items.map((fi, idx) => (
                              <div key={idx} className="flex justify-between gap-2">
                                <span>{fi.name}</span>
                                <span className="font-bold">{fi.amount}</span>
                              </div>
                            ))}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Grocery list modal — derived from the selected day's plan */}
      {showGrocery && (
        <div className="fixed inset-0 z-[9999] flex items-end md:items-center justify-center md:p-6 bg-black/70 backdrop-blur-sm" onClick={() => setShowGrocery(false)}>
          <div className="bg-white w-full md:max-w-md rounded-t-[2rem] md:rounded-3xl shadow-2xl flex flex-col max-h-[80vh]" onClick={(e) => e.stopPropagation()} style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
            <div className="p-5 border-b border-neutral-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-accent">shopping_basket</span>
                <h3 className="text-lg font-black font-display uppercase">{t('meal.grocery_list')} · {t(dayKeys[selectedDay])}</h3>
              </div>
              <button onClick={() => setShowGrocery(false)} className="w-9 h-9 rounded-xl bg-neutral-50 flex items-center justify-center hover:bg-black hover:text-white transition-all"><span className="material-symbols-outlined">close</span></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2 no-scrollbar">
              {dayPlan.isCheat ? (
                <p className="text-center text-neutral-400 text-xs font-black uppercase tracking-widest py-8">
                  {lang === 'ar' ? 'يوم حر — لا قائمة مشتريات' : 'Cheat day — no grocery list'}
                </p>
              ) : buildGroceryList().map((g, i) => (
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
