import React, { useState, useEffect } from 'react';
import { useT } from '../i18n/I18nContext';
import type { TranslationKey } from '../i18n/translations';

// ── The daily plan ───────────────────────────────────────────────────────────
// Same meals every day (the "duplicate the diet" case), tracked per calendar
// day. Any day can be flipped to a cheat day, which pauses tracking for it.
interface Meal {
  id: string;
  label: string;
  title: string;
  items: string[];
  kcal: number;
  protein: number;
}

const PLAN: Meal[] = [
  { id: 'breakfast', label: 'Breakfast', title: 'Protein pancakes', items: ['Protein pancakes'], kcal: 400, protein: 40 },
  { id: 'lunch', label: 'Lunch', title: 'Chicken + rice + salad', items: ['Chicken 200g', 'Rice', 'Salad'], kcal: 650, protein: 55 },
  { id: 'snack1', label: 'Snack 1', title: 'Protein bar', items: ['Protein bar'], kcal: 220, protein: 18 },
  { id: 'snack2', label: 'Snack 2', title: 'Laban', items: ['Laban 250g'], kcal: 150, protein: 15 },
  { id: 'dinner', label: 'Dinner', title: 'Fish / beef / chicken + lentils + salad', items: ['Fish, beef or chicken 200g', 'Lentils', 'Salad'], kcal: 600, protein: 50 },
];

const TARGET_KCAL = PLAN.reduce((s, m) => s + m.kcal, 0);       // 2020
const TARGET_PROTEIN = PLAN.reduce((s, m) => s + m.protein, 0); // 178

const dateKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const eatenKey = (d: Date) => `theone_meals_${dateKey(d)}`;
const cheatKey = (d: Date) => `theone_cheat_${dateKey(d)}`;

const readSet = (k: string): Set<string> => {
  try {
    const raw = localStorage.getItem(k);
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
  } catch { return new Set(); }
};

const MealPlan: React.FC = () => {
  const { t, lang } = useT();

  // Sunday-first week (the Iraqi week) so the tabs line up with real dates.
  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());
  weekStart.setHours(0, 0, 0, 0);
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  });

  const [selectedIdx, setSelectedIdx] = useState(today.getDay());
  const selectedDate = weekDays[selectedIdx];

  const [eaten, setEaten] = useState<Set<string>>(() => readSet(eatenKey(weekDays[today.getDay()])));
  const [isCheat, setIsCheat] = useState(false);
  const [showGrocery, setShowGrocery] = useState(false);

  // Reload the log whenever the selected day changes.
  useEffect(() => {
    setEaten(readSet(eatenKey(selectedDate)));
    try { setIsCheat(localStorage.getItem(cheatKey(selectedDate)) === '1'); } catch { setIsCheat(false); }
  }, [selectedIdx]);

  const persist = (next: Set<string>) => {
    setEaten(next);
    try { localStorage.setItem(eatenKey(selectedDate), JSON.stringify(Array.from(next))); } catch {}
  };

  const toggleMeal = (id: string) => {
    const next = new Set<string>(eaten);
    if (next.has(id)) next.delete(id); else next.add(id);
    persist(next);
  };

  const toggleCheat = () => {
    const next = !isCheat;
    setIsCheat(next);
    try { localStorage.setItem(cheatKey(selectedDate), next ? '1' : '0'); } catch {}
  };

  const kcal = PLAN.filter(m => eaten.has(m.id)).reduce((s, m) => s + m.kcal, 0);
  const protein = PLAN.filter(m => eaten.has(m.id)).reduce((s, m) => s + m.protein, 0);
  const pct = (v: number, target: number) => Math.min(100, Math.round((v / target) * 100));

  const dayKeys: TranslationKey[] = ['meal.day_sun', 'meal.day_mon', 'meal.day_tue', 'meal.day_wed', 'meal.day_thu', 'meal.day_fri', 'meal.day_sat'];
  const isToday = dateKey(selectedDate) === dateKey(today);

  return (
    <div className="w-full max-w-3xl mx-auto px-4 md:px-6 py-6 md:py-10 text-start overflow-x-clip">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-neutral-500 text-xs font-medium mb-1">
            <span className="material-symbols-outlined text-[16px]">restaurant_menu</span>
            <span dir="ltr">{TARGET_KCAL} kcal · {TARGET_PROTEIN}g protein</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black font-display tracking-tight text-black uppercase">{t('meal.my_nutrition')}</h1>
        </div>
        <button onClick={() => setShowGrocery(true)} className="shrink-0 flex items-center gap-2 px-4 py-3 bg-black text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-lg">
          <span className="material-symbols-outlined text-[18px]">shopping_basket</span>
          <span className="hidden sm:inline">{t('meal.grocery_list')}</span>
        </button>
      </div>

      {/* Day tabs — real dates, so the log is per calendar day */}
      <div className="mb-5 -mx-4 px-4 overflow-x-auto no-scrollbar">
        <div className="flex gap-2 min-w-max">
          {weekDays.map((d, i) => {
            const sel = selectedIdx === i;
            const isD = dateKey(d) === dateKey(today);
            return (
              <button
                key={i}
                onClick={() => setSelectedIdx(i)}
                className={`flex flex-col items-center px-4 py-2.5 rounded-2xl border transition-all min-w-[60px] ${
                  sel ? 'bg-black border-black text-white shadow-lg' : 'bg-white border-neutral-100 text-neutral-400'
                }`}
              >
                <span className="text-[10px] font-black uppercase tracking-widest">{t(dayKeys[i])}</span>
                <span className={`text-base font-black mt-0.5 ${!sel && isD ? 'text-accent' : ''}`}>{d.getDate()}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Daily totals */}
      <div className="bg-white border border-neutral-100 rounded-3xl p-5 shadow-sm mb-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
            {isToday
              ? (lang === 'ar' ? 'اليوم' : 'Today')
              : selectedDate.toLocaleDateString(lang === 'ar' ? 'ar' : 'en-US', { weekday: 'long', day: 'numeric', month: 'short' })}
          </p>
          <button
            onClick={toggleCheat}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${
              isCheat ? 'bg-pink-500 text-white shadow' : 'bg-neutral-50 text-neutral-400 hover:text-pink-500'
            }`}
          >
            <span className="material-symbols-outlined text-[14px]">celebration</span>
            {lang === 'ar' ? 'يوم حر' : 'Cheat day'}
          </button>
        </div>

        {isCheat ? (
          <div className="text-center py-4">
            <span className="material-symbols-outlined text-4xl text-pink-500">celebration</span>
            <p className="text-sm font-black uppercase tracking-tight text-black mt-2">{lang === 'ar' ? 'يوم حر — استمتع' : 'Cheat day — enjoy it'}</p>
            <p className="text-xs font-medium text-neutral-400 mt-1">{lang === 'ar' ? 'عُد للخطة غداً.' : 'Back on the plan tomorrow.'}</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <div className="flex justify-between items-end">
                <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">{t('meal.calories')}</span>
                <span className="text-sm font-black text-black tabular-nums" dir="ltr">{kcal} / {TARGET_KCAL}</span>
              </div>
              <div className="h-2.5 bg-neutral-100 rounded-full overflow-hidden">
                <div className="h-full bg-black rounded-full transition-all duration-500" style={{ width: `${pct(kcal, TARGET_KCAL)}%` }} />
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between items-end">
                <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">{t('meal.protein')}</span>
                <span className="text-sm font-black text-black tabular-nums" dir="ltr">{protein}g / {TARGET_PROTEIN}g</span>
              </div>
              <div className="h-2.5 bg-neutral-100 rounded-full overflow-hidden">
                <div className="h-full bg-accent rounded-full transition-all duration-500" style={{ width: `${pct(protein, TARGET_PROTEIN)}%` }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Meals — tap to log */}
      {!isCheat && (
        <div className="space-y-3">
          {PLAN.map(meal => {
            const done = eaten.has(meal.id);
            return (
              <button
                key={meal.id}
                onClick={() => toggleMeal(meal.id)}
                className={`w-full text-start flex items-start gap-3 p-4 rounded-3xl border-2 transition-all ${
                  done ? 'border-green-500 bg-green-50' : 'border-neutral-100 bg-white hover:border-black'
                }`}
              >
                <span className={`material-symbols-outlined text-[24px] mt-0.5 shrink-0 ${done ? 'text-green-600 filled' : 'text-neutral-300'}`}>
                  {done ? 'check_circle' : 'radio_button_unchecked'}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[9px] font-black uppercase tracking-widest text-neutral-400">{meal.label}</p>
                    <div className="flex gap-1.5 shrink-0">
                      <span className="bg-neutral-100 text-neutral-600 text-[9px] font-black px-2 py-0.5 rounded-full tabular-nums" dir="ltr">{meal.kcal} kcal</span>
                      <span className="bg-accent/10 text-accent text-[9px] font-black px-2 py-0.5 rounded-full tabular-nums" dir="ltr">{meal.protein}g P</span>
                    </div>
                  </div>
                  <p className={`text-sm font-black uppercase tracking-tight mt-0.5 ${done ? 'text-green-800' : 'text-black'}`}>{meal.title}</p>
                  <p className="text-[11px] font-medium text-neutral-400 mt-0.5">{meal.items.join(' · ')}</p>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Grocery list */}
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
              {Array.from(new Set(PLAN.flatMap(m => m.items))).map((name, i) => (
                <label key={i} className="flex items-center gap-3 p-3 rounded-xl bg-neutral-50 border border-neutral-100">
                  <input type="checkbox" className="w-5 h-5 rounded-md accent-black shrink-0" />
                  <span className="flex-1 text-sm font-bold text-black">{name}</span>
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
