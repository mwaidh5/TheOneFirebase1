import React, { useState, useEffect } from 'react';
import { useT } from '../i18n/I18nContext';
import type { TranslationKey } from '../i18n/translations';

// ── The daily plans ──────────────────────────────────────────────────────────
// Each day is one of three modes, chosen on the day itself (not scheduled):
//   training — the full plan
//   off      — rest day: fewer calories (less carbs, one snack dropped) while
//              protein stays high, since recovery is what rest days are for
//   cheat    — no plan, no tracking
interface Meal {
  id: string;
  label: string;
  title: string;
  items: string[];
  kcal: number;
  protein: number;
}

const TRAINING_PLAN: Meal[] = [
  { id: 'breakfast', label: 'Breakfast', title: 'Protein pancakes', items: ['Protein pancakes'], kcal: 400, protein: 40 },
  { id: 'lunch', label: 'Lunch', title: 'Chicken + rice + salad', items: ['Chicken 200g', 'Rice', 'Salad'], kcal: 650, protein: 55 },
  { id: 'snack1', label: 'Snack 1', title: 'Protein bar', items: ['Protein bar'], kcal: 220, protein: 18 },
  { id: 'snack2', label: 'Snack 2', title: 'Laban', items: ['Laban 250g'], kcal: 150, protein: 15 },
  { id: 'dinner', label: 'Dinner', title: 'Fish / beef / chicken + lentils + salad', items: ['Fish, beef or chicken 200g', 'Lentils', 'Salad'], kcal: 600, protein: 50 },
];

const OFF_PLAN: Meal[] = [
  { id: 'off_breakfast', label: 'Breakfast', title: 'Protein pancakes (lighter)', items: ['Protein pancakes — smaller portion'], kcal: 320, protein: 35 },
  { id: 'off_lunch', label: 'Lunch', title: 'Chicken + salad + half rice', items: ['Chicken 200g', 'Rice — half portion', 'Salad'], kcal: 520, protein: 55 },
  { id: 'off_snack', label: 'Snack', title: 'Laban', items: ['Laban 250g'], kcal: 150, protein: 15 },
  { id: 'off_dinner', label: 'Dinner', title: 'Fish / beef / chicken + lentils + salad', items: ['Fish, beef or chicken 200g', 'Lentils — small portion', 'Salad'], kcal: 520, protein: 50 },
];

type DayMode = 'training' | 'off' | 'cheat';

const planFor = (mode: DayMode): Meal[] => (mode === 'off' ? OFF_PLAN : TRAINING_PLAN);
const sumKcal = (p: Meal[]) => p.reduce((s, m) => s + m.kcal, 0);
const sumProtein = (p: Meal[]) => p.reduce((s, m) => s + m.protein, 0);

const dateKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const eatenKey = (d: Date) => `theone_meals_${dateKey(d)}`;
const modeStoreKey = (d: Date) => `theone_daymode_${dateKey(d)}`;
const legacyCheatKey = (d: Date) => `theone_cheat_${dateKey(d)}`;

const readSet = (k: string): Set<string> => {
  try {
    const raw = localStorage.getItem(k);
    return raw ? new Set<string>(JSON.parse(raw) as string[]) : new Set<string>();
  } catch { return new Set<string>(); }
};

const readMode = (d: Date): DayMode => {
  try {
    const m = localStorage.getItem(modeStoreKey(d));
    if (m === 'training' || m === 'off' || m === 'cheat') return m;
    // Days marked cheat before the mode switch existed.
    if (localStorage.getItem(legacyCheatKey(d)) === '1') return 'cheat';
  } catch {}
  return 'training';
};

const MealPlan: React.FC = () => {
  const { t, lang } = useT();
  const ar = lang === 'ar';

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
  const [mode, setMode] = useState<DayMode>(() => readMode(weekDays[today.getDay()]));
  const [showGrocery, setShowGrocery] = useState(false);

  // Reload the log + the day's mode whenever the selected day changes.
  useEffect(() => {
    setEaten(readSet(eatenKey(selectedDate)));
    setMode(readMode(selectedDate));
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

  const chooseMode = (m: DayMode) => {
    setMode(m);
    try { localStorage.setItem(modeStoreKey(selectedDate), m); } catch {}
  };

  const plan = planFor(mode);
  const targetKcal = sumKcal(plan);
  const targetProtein = sumProtein(plan);
  const kcal = plan.filter(m => eaten.has(m.id)).reduce((s, m) => s + m.kcal, 0);
  const protein = plan.filter(m => eaten.has(m.id)).reduce((s, m) => s + m.protein, 0);
  const pct = (v: number, target: number) => (target > 0 ? Math.min(100, Math.round((v / target) * 100)) : 0);

  const dayKeys: TranslationKey[] = ['meal.day_sun', 'meal.day_mon', 'meal.day_tue', 'meal.day_wed', 'meal.day_thu', 'meal.day_fri', 'meal.day_sat'];
  const isToday = dateKey(selectedDate) === dateKey(today);

  const MODES: { id: DayMode; icon: string; label: string; on: string }[] = [
    { id: 'training', icon: 'exercise', label: ar ? 'يوم تمرين' : 'Training', on: 'bg-black text-white border-black' },
    { id: 'off', icon: 'self_improvement', label: ar ? 'يوم راحة' : 'Off day', on: 'bg-blue-600 text-white border-blue-600' },
    { id: 'cheat', icon: 'celebration', label: ar ? 'يوم حر' : 'Cheat', on: 'bg-pink-500 text-white border-pink-500' },
  ];

  return (
    <div className="w-full max-w-3xl mx-auto px-4 md:px-6 py-6 md:py-10 text-start overflow-x-clip">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-neutral-500 text-xs font-medium mb-1">
            <span className="material-symbols-outlined text-[16px]">restaurant_menu</span>
            {mode === 'cheat'
              ? <span>{ar ? 'يوم حر' : 'Cheat day'}</span>
              : <span dir="ltr">{targetKcal} kcal · {targetProtein}g protein</span>}
          </div>
          <h1 className="text-3xl md:text-4xl font-black font-display tracking-tight text-black uppercase">{t('meal.my_nutrition')}</h1>
        </div>
        <button onClick={() => setShowGrocery(true)} className="shrink-0 flex items-center gap-2 px-4 py-3 bg-black text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-lg">
          <span className="material-symbols-outlined text-[18px]">shopping_basket</span>
          <span className="hidden sm:inline">{t('meal.grocery_list')}</span>
        </button>
      </div>

      {/* Day tabs — real dates, so the log is per calendar day */}
      <div className="mb-4 -mx-4 px-4 overflow-x-auto no-scrollbar">
        <div className="flex gap-2 min-w-max">
          {weekDays.map((d, i) => {
            const sel = selectedIdx === i;
            const isD = dateKey(d) === dateKey(today);
            return (
              <button
                key={i}
                onClick={() => setSelectedIdx(i)}
                className={`flex flex-col items-center px-4 py-2.5 rounded-2xl border transition min-w-[60px] ${
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

      {/* Day mode — decided on the day itself, switchable any time */}
      <div className="mb-5">
        <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-2 ms-1">
          {ar ? 'كيف هو هذا اليوم؟' : 'How is this day going?'}
        </p>
        <div className="grid grid-cols-3 gap-2">
          {MODES.map(m => (
            <button
              key={m.id}
              onClick={() => chooseMode(m.id)}
              className={`flex flex-col items-center gap-1 py-3 rounded-2xl border-2 transition ${
                mode === m.id ? m.on + ' shadow-lg' : 'bg-white border-neutral-100 text-neutral-400 hover:border-black'
              }`}
            >
              <span className="material-symbols-outlined text-[22px]">{m.icon}</span>
              <span className="text-[10px] font-black uppercase tracking-widest">{m.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Daily totals */}
      <div className="bg-white border border-neutral-100 rounded-3xl p-5 shadow-sm mb-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
            {isToday
              ? (ar ? 'اليوم' : 'Today')
              : selectedDate.toLocaleDateString(ar ? 'ar' : 'en-US', { weekday: 'long', day: 'numeric', month: 'short' })}
          </p>
          {mode === 'off' && (
            <span className="text-[9px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
              {ar ? 'سعرات أقل' : 'Lighter day'}
            </span>
          )}
        </div>

        {mode === 'cheat' ? (
          <div className="text-center py-4">
            <span className="material-symbols-outlined text-4xl text-pink-500">celebration</span>
            <p className="text-sm font-black uppercase tracking-tight text-black mt-2">{ar ? 'يوم حر — استمتع' : 'Cheat day — enjoy it'}</p>
            <p className="text-xs font-medium text-neutral-400 mt-1">{ar ? 'عُد للخطة غداً.' : 'Back on the plan tomorrow.'}</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <div className="flex justify-between items-end">
                <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">{t('meal.calories')}</span>
                <span className="text-sm font-black text-black tabular-nums" dir="ltr">{kcal} / {targetKcal}</span>
              </div>
              <div className="h-2.5 bg-neutral-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-[width] duration-500 ${mode === 'off' ? 'bg-blue-600' : 'bg-black'}`} style={{ width: `${pct(kcal, targetKcal)}%` }} />
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between items-end">
                <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">{t('meal.protein')}</span>
                <span className="text-sm font-black text-black tabular-nums" dir="ltr">{protein}g / {targetProtein}g</span>
              </div>
              <div className="h-2.5 bg-neutral-100 rounded-full overflow-hidden">
                <div className="h-full bg-accent rounded-full transition-[width] duration-500" style={{ width: `${pct(protein, targetProtein)}%` }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Meals — tap to log */}
      {mode !== 'cheat' && (
        <div className="space-y-3">
          {plan.map(meal => {
            const done = eaten.has(meal.id);
            return (
              <button
                key={meal.id}
                onClick={() => toggleMeal(meal.id)}
                className={`w-full text-start flex items-start gap-3 p-4 rounded-3xl border-2 transition ${
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

      {/* Grocery list — for whichever plan this day is on */}
      {showGrocery && (
        <div className="fixed inset-0 z-[9999] flex items-end md:items-center justify-center md:p-6 bg-black/70 backdrop-blur-sm" onClick={() => setShowGrocery(false)}>
          <div className="bg-white w-full md:max-w-md rounded-t-[2rem] md:rounded-3xl shadow-2xl flex flex-col max-h-[80vh]" onClick={(e) => e.stopPropagation()} style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
            <div className="p-5 border-b border-neutral-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-accent">shopping_basket</span>
                <h3 className="text-lg font-black font-display uppercase">{t('meal.grocery_list')}</h3>
              </div>
              <button onClick={() => setShowGrocery(false)} className="w-9 h-9 rounded-xl bg-neutral-50 flex items-center justify-center hover:bg-black hover:text-white transition"><span className="material-symbols-outlined">close</span></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2 no-scrollbar">
              {mode === 'cheat' ? (
                <p className="text-center text-neutral-400 text-xs font-black uppercase tracking-widest py-8">
                  {ar ? 'يوم حر — لا قائمة مشتريات' : 'Cheat day — no grocery list'}
                </p>
              ) : Array.from(new Set(plan.flatMap(m => m.items))).map((name, i) => (
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
