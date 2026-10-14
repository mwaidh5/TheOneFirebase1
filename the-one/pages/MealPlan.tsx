import React, { useEffect, useRef, useState } from 'react';
import { useT } from '../i18n/I18nContext';
import type { TranslationKey } from '../i18n/translations';
import type { User } from '../types';
import FoodLogSheet, { type RecommendedMeal } from '../components/FoodLogSheet';
import {
  useNutritionLog, useCustomFoods, SLOTS, dateKey,
  type DayMode, type MealSlot, type LogEntry,
} from '../hooks/useNutritionLog';
import { useGroceryList, planItemKey, customItemKey } from '../hooks/useGroceryList';

// ── The daily plans ──────────────────────────────────────────────────────────
// Each day is one of three modes, chosen on the day itself (not scheduled):
//   training — the full plan
//   off      — rest day: fewer calories (less carbs, one snack dropped) while
//              protein stays high, since recovery is what rest days are for
//   cheat    — no plan, no tracking
// kcal and protein are the plan as written. carbs / fat / fibre are estimates
// worked out from each meal's ingredients so the daily totals can show every
// macro; they are rounded so the meal still adds up to its stated calories.
interface Meal {
  id: string;
  slot: MealSlot;
  label: string;
  title: string;
  items: string[];
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

const TRAINING_PLAN: Meal[] = [
  { id: 'breakfast', slot: 'breakfast', label: 'Breakfast', title: 'Protein pancakes', items: ['Protein pancakes'], kcal: 400, protein: 40, carbs: 40, fat: 8, fiber: 3 },
  { id: 'lunch', slot: 'lunch', label: 'Lunch', title: 'Chicken + rice + salad', items: ['Chicken 200g', 'Rice', 'Salad'], kcal: 650, protein: 55, carbs: 80, fat: 10, fiber: 3 },
  { id: 'snack1', slot: 'snack', label: 'Snack 1', title: 'Protein bar', items: ['Protein bar'], kcal: 220, protein: 18, carbs: 22, fat: 7, fiber: 5 },
  { id: 'snack2', slot: 'snack', label: 'Snack 2', title: 'Laban', items: ['Laban 250g'], kcal: 150, protein: 15, carbs: 12, fat: 4, fiber: 0 },
  { id: 'dinner', slot: 'dinner', label: 'Dinner', title: 'Fish / beef / chicken + lentils + salad', items: ['Fish, beef or chicken 200g', 'Lentils', 'Salad'], kcal: 600, protein: 50, carbs: 50, fat: 20, fiber: 12 },
];

const OFF_PLAN: Meal[] = [
  { id: 'off_breakfast', slot: 'breakfast', label: 'Breakfast', title: 'Protein pancakes (lighter)', items: ['Protein pancakes — smaller portion'], kcal: 320, protein: 35, carbs: 28, fat: 7, fiber: 2 },
  { id: 'off_lunch', slot: 'lunch', label: 'Lunch', title: 'Chicken + salad + half rice', items: ['Chicken 200g', 'Rice — half portion', 'Salad'], kcal: 520, protein: 55, carbs: 48, fat: 12, fiber: 3 },
  { id: 'off_snack', slot: 'snack', label: 'Snack', title: 'Laban', items: ['Laban 250g'], kcal: 150, protein: 15, carbs: 12, fat: 4, fiber: 0 },
  { id: 'off_dinner', slot: 'dinner', label: 'Dinner', title: 'Fish / beef / chicken + lentils + salad', items: ['Fish, beef or chicken 200g', 'Lentils — small portion', 'Salad'], kcal: 520, protein: 50, carbs: 40, fat: 18, fiber: 9 },
];

// Fibre target is a health target (adults: roughly 25–38 g), not the plan's sum.
const FIBER_TARGET = 30;

const planFor = (mode: DayMode): Meal[] => (mode === 'off' ? OFF_PLAN : TRAINING_PLAN);
const sumOf = (p: Meal[], k: 'kcal' | 'protein' | 'carbs' | 'fat') => p.reduce((s, m) => s + m[k], 0);

// Open the logger on the meal that fits the time of day.
const slotForNow = (): MealSlot => {
  const h = new Date().getHours();
  return h < 11 ? 'breakfast' : h < 16 ? 'lunch' : h < 19 ? 'snack' : 'dinner';
};

const r1 = (n: number) => Math.round(n * 10) / 10;

// Last few foods logged on any day — handy for the things eaten daily.
const RECENTS_KEY = 'theone_recent_foods';
const readRecents = (): LogEntry[] => {
  try { return JSON.parse(localStorage.getItem(RECENTS_KEY) || '[]') as LogEntry[]; } catch { return []; }
};
const pushRecent = (e: LogEntry) => {
  try {
    const next = [e, ...readRecents().filter(r => r.name !== e.name)].slice(0, 20);
    localStorage.setItem(RECENTS_KEY, JSON.stringify(next));
  } catch {}
};

const MealPlan: React.FC<{ currentUser?: User | null }> = ({ currentUser }) => {
  const { t, lang } = useT();
  const ar = lang === 'ar';
  const uid = currentUser?.id;

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

  const { mode, setMode, planEaten, entries, addEntry, removeEntry, updateEntry, absorbPlanTicks, loading } = useNutritionLog(uid, selectedDate);
  const { foods: customFoods, saveFood } = useCustomFoods(uid);

  const [showGrocery, setShowGrocery] = useState(false);
  const grocery = useGroceryList(uid);
  const [newGrocery, setNewGrocery] = useState('');
  const [logSlot, setLogSlot] = useState<MealSlot | null>(null);
  const [recents, setRecents] = useState<LogEntry[]>(() => readRecents());

  const plan = planFor(mode);
  const target = {
    kcal: sumOf(plan, 'kcal'),
    protein: sumOf(plan, 'protein'),
    carbs: sumOf(plan, 'carbs'),
    fat: sumOf(plan, 'fat'),
    fiber: FIBER_TARGET,
  };
  const targetKcal = target.kcal;
  const targetProtein = target.protein;

  // Plan meals ticked before they could be logged: turn them into ordinary
  // entries once the day has loaded, so everything eaten is one editable list.
  // Waiting for `loading` matters: converting the device's cached ticks before
  // Firestore answers would overwrite the day's real entries.
  const absorbedFor = useRef('');
  useEffect(() => {
    const key = dateKey(selectedDate);
    if (loading || planEaten.size === 0 || absorbedFor.current === key) return;
    absorbedFor.current = key;
    const all = [...TRAINING_PLAN, ...OFF_PLAN];
    const converted: LogEntry[] = Array.from(planEaten)
      .map(id => all.find(m => m.id === id))
      .filter((m): m is Meal => !!m)
      .map((m, i) => ({
        id: `p${Date.now()}${i}`, foodId: `plan:${m.id}`, name: m.title, brand: ar ? 'الخطة' : 'Plan',
        slot: m.slot, grams: 0, kcal: m.kcal, protein: m.protein, carbs: m.carbs, fat: m.fat, fiber: m.fiber,
        qty: 1, unitLabel: ar ? 'وجبة' : 'meal', loggedAt: Date.now(),
      }));
    absorbPlanTicks(converted);
  }, [loading, planEaten, selectedIdx]);

  const eaten = {
    kcal: Math.round(entries.reduce((s, e) => s + (e.kcal || 0), 0)),
    protein: Math.round(entries.reduce((s, e) => s + (e.protein || 0), 0)),
    carbs: Math.round(entries.reduce((s, e) => s + (e.carbs || 0), 0)),
    fat: Math.round(entries.reduce((s, e) => s + (e.fat || 0), 0)),
    fiber: Math.round(entries.reduce((s, e) => s + (e.fiber || 0), 0)),
  };
  const pct = (v: number, t: number) => (t > 0 ? Math.min(100, Math.round((v / t) * 100)) : 0);

  const recommended: RecommendedMeal[] = mode === 'cheat' ? [] : plan.map(m => ({
    id: m.id, title: m.title, detail: m.items.join(' · '), slot: m.slot,
    kcal: m.kcal, protein: m.protein, carbs: m.carbs, fat: m.fat, fiber: m.fiber,
  }));
  const loggedFoodIds = new Set(entries.map(e => e.foodId));

  // ── Editing a logged food: its meal and its portion ────────────────────────
  const [editing, setEditing] = useState<LogEntry | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editSlot, setEditSlot] = useState<MealSlot>('snack');
  // Portions scale from whatever the entry was logged in: its quantity (2 eggs,
  // 1 meal) when it has one, otherwise its grams.
  const editBase = (e: LogEntry) => (e.qty && e.qty > 0 ? e.qty : e.grams > 0 ? e.grams : 1);
  const openEdit = (e: LogEntry) => {
    setEditing(e);
    setEditSlot(e.slot);
    setEditAmount(String(e.qty && e.qty > 0 ? e.qty : e.grams));
  };
  const scaled = (e: LogEntry, amount: number) => {
    const f = amount / editBase(e);
    return {
      grams: Math.round(e.grams * f),
      kcal: Math.round(e.kcal * f),
      protein: r1(e.protein * f),
      carbs: r1(e.carbs * f),
      fat: r1(e.fat * f),
      fiber: typeof e.fiber === 'number' ? r1(e.fiber * f) : undefined,
    };
  };
  const saveEdit = () => {
    if (!editing) return;
    const amount = Math.max(0.01, parseFloat(editAmount) || 0);
    updateEntry(editing.id, {
      slot: editSlot,
      ...scaled(editing, amount),
      ...(editing.qty && editing.qty > 0 ? { qty: amount } : {}),
    });
    setEditing(null);
  };

  // Grocery list: the day's plan items (none on cheat days) + the athlete's own.
  const planGrocery = mode === 'cheat' ? [] : Array.from(new Set(plan.flatMap(m => m.items)));
  const groceryTicked = planGrocery.filter(n => grocery.checked.has(planItemKey(n))).length
    + grocery.custom.filter(i => grocery.checked.has(customItemKey(i.id))).length;
  const submitGrocery = () => {
    if (!newGrocery.trim()) return;
    grocery.addItem(newGrocery);
    setNewGrocery('');
  };

  const handleAdd = (e: LogEntry) => { addEntry(e); pushRecent(e); setRecents(readRecents()); };

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
              onClick={() => setMode(m.id)}
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
                <span className="text-sm font-black text-black tabular-nums" dir="ltr">
                  {eaten.kcal} / {target.kcal}
                  <span className="text-[10px] text-neutral-400 font-bold ms-1.5">
                    {target.kcal - eaten.kcal >= 0
                      ? `${target.kcal - eaten.kcal} ${ar ? 'متبقي' : 'left'}`
                      : `${eaten.kcal - target.kcal} ${ar ? 'زيادة' : 'over'}`}
                  </span>
                </span>
              </div>
              <div className="h-3 bg-neutral-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-[width] duration-500 ${eaten.kcal > target.kcal ? 'bg-red-500' : mode === 'off' ? 'bg-blue-600' : 'bg-black'}`} style={{ width: `${pct(eaten.kcal, target.kcal)}%` }} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              {([
                { k: 'protein', l: t('meal.protein'), c: 'bg-accent' },
                { k: 'carbs', l: ar ? 'كارب' : 'Carbs', c: 'bg-amber-500' },
                { k: 'fiber', l: ar ? 'ألياف' : 'Fibre', c: 'bg-green-600' },
                { k: 'fat', l: ar ? 'دهون' : 'Fat', c: 'bg-rose-500' },
              ] as const).map(x => (
                <div key={x.k} className="space-y-1">
                  <div className="flex justify-between items-end">
                    <span className="text-[9px] font-black uppercase tracking-widest text-neutral-400">{x.l}</span>
                    <span className="text-[11px] font-black text-black tabular-nums" dir="ltr">{eaten[x.k]}<span className="text-neutral-400">/{target[x.k]}g</span></span>
                  </div>
                  <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-[width] duration-500 ${x.c}`} style={{ width: `${pct(eaten[x.k], target[x.k])}%` }} />
                  </div>
                </div>
              ))}
            </div>
                    </div>
        )}
      </div>

      {/* Log anything — search, barcode, photo, or your own foods */}
      <button
        onClick={() => setLogSlot(slotForNow())}
        className="w-full mb-5 flex items-center justify-center gap-2 py-4 rounded-2xl bg-accent text-white text-[11px] font-black uppercase tracking-widest shadow-lg shadow-accent/20"
      >
        <span className="material-symbols-outlined text-[20px]">add</span>
        {ar ? 'سجّل طعاماً' : 'Log food'}
      </button>

      {/* What was actually logged today, grouped by meal */}
      {entries.length > 0 && (
        <div className="space-y-4 mb-6">
          {SLOTS.map(s => {
            const rows = entries.filter(e => e.slot === s.id);
            if (rows.length === 0) return null;
            const slotKcal = Math.round(rows.reduce((a, e) => a + e.kcal, 0));
            return (
              <div key={s.id} className="space-y-2">
                <div className="flex items-center justify-between ms-1">
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-neutral-400">{s.icon}</span>
                    <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400">{ar ? s.ar : s.en}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-neutral-400 tabular-nums" dir="ltr">{slotKcal} kcal</span>
                    <button onClick={() => setLogSlot(s.id)} className="w-6 h-6 rounded-lg bg-neutral-100 text-neutral-500 flex items-center justify-center">
                      <span className="material-symbols-outlined text-[15px]">add</span>
                    </button>
                  </div>
                </div>
                {rows.map(e => (
                  <div key={e.id} className="flex items-center gap-2 rounded-2xl bg-white border border-neutral-100">
                    <button onClick={() => openEdit(e)} className="flex-1 min-w-0 text-start p-3">
                      <p className="text-sm font-bold text-black truncate">{e.name}</p>
                      <p className="text-[11px] font-medium text-neutral-400 truncate" dir="ltr">
                        {e.qty && e.unitLabel && e.unitLabel !== 'g'
                          ? `${e.qty} ${e.unitLabel}${e.grams > 0 ? ` (${e.grams}g)` : ''}`
                          : `${e.grams}g`}
                        {' · '}{e.kcal} kcal · {e.protein}P · {e.carbs}C{typeof e.fiber === 'number' ? ` · ${e.fiber}fib` : ''}
                      </p>
                    </button>
                    <button
                      onClick={() => removeEntry(e.id)}
                      aria-label={ar ? 'احذف' : 'Remove'}
                      className="w-8 h-8 me-2 rounded-lg bg-neutral-50 text-neutral-400 flex items-center justify-center hover:bg-red-500 hover:text-white transition shrink-0"
                    >
                      <span className="material-symbols-outlined text-[17px]">delete</span>
                    </button>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}

      {/* Food logging sheet */}
      {logSlot && (
        <FoodLogSheet
          slot={logSlot}
          recommended={recommended}
          loggedFoodIds={loggedFoodIds}
          customFoods={customFoods}
          recents={recents}
          ar={ar}
          onAdd={handleAdd}
          onSaveCustom={saveFood}
          onClose={() => setLogSlot(null)}
        />
      )}

      {/* Edit a logged food — move it to another meal, change the portion */}
      {editing && (() => {
        const amount = Math.max(0.01, parseFloat(editAmount) || 0);
        const m = scaled(editing, amount);
        const byQty = !!(editing.qty && editing.qty > 0);
        return (
          <div className="fixed inset-0 z-[9999] flex items-end md:items-center justify-center md:p-6 bg-black/60 backdrop-blur-sm" onClick={() => setEditing(null)}>
            <div
              className="bg-white w-full md:max-w-sm rounded-t-[2rem] md:rounded-3xl shadow-2xl p-5 space-y-4"
              onClick={e => e.stopPropagation()}
              style={{ paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom))' }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[9px] font-black uppercase tracking-widest text-neutral-400">{ar ? 'تعديل' : 'Edit'}</p>
                  <p className="text-base font-black text-black leading-tight">{editing.name}</p>
                </div>
                <button onClick={() => setEditing(null)} className="w-8 h-8 rounded-lg bg-neutral-50 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>

              <div className="space-y-1.5">
                <p className="text-[9px] font-black uppercase tracking-widest text-neutral-400">{ar ? 'الوجبة' : 'Meal'}</p>
                <div className="grid grid-cols-4 gap-1.5">
                  {SLOTS.map(sl => (
                    <button
                      key={sl.id}
                      onClick={() => setEditSlot(sl.id)}
                      className={`flex flex-col items-center gap-0.5 py-2 rounded-xl border text-[9px] font-black uppercase tracking-widest transition ${
                        editSlot === sl.id ? 'bg-black text-white border-black' : 'bg-white text-neutral-400 border-neutral-200'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[17px]">{sl.icon}</span>
                      {ar ? sl.ar : sl.en}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <p className="text-[9px] font-black uppercase tracking-widest text-neutral-400">{ar ? 'الكمية' : 'Amount'}</p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEditAmount(String(Math.max(byQty ? 0.5 : 5, r1(amount - (byQty ? 0.5 : 10)))))}
                    className="w-11 h-11 rounded-xl bg-neutral-100 flex items-center justify-center"
                    aria-label={ar ? 'أقل' : 'Less'}
                  >
                    <span className="material-symbols-outlined">remove</span>
                  </button>
                  <input
                    value={editAmount}
                    onChange={e => setEditAmount(e.target.value)}
                    inputMode="decimal"
                    dir="ltr"
                    className="flex-1 min-w-0 bg-neutral-50 border border-neutral-100 rounded-xl px-3 py-2.5 text-center text-base font-black tabular-nums outline-none focus:border-black transition"
                  />
                  <button
                    onClick={() => setEditAmount(String(r1(amount + (byQty ? 0.5 : 10))))}
                    className="w-11 h-11 rounded-xl bg-neutral-100 flex items-center justify-center"
                    aria-label={ar ? 'أكثر' : 'More'}
                  >
                    <span className="material-symbols-outlined">add</span>
                  </button>
                  <span className="text-xs font-black text-neutral-400 shrink-0 min-w-[2.5rem]">{byQty ? editing.unitLabel : 'g'}</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-baseline justify-between bg-black text-white rounded-xl px-4 py-2.5">
                  <span className="text-[9px] font-black uppercase tracking-widest text-white/60">{ar ? 'السعرات' : 'Calories'}</span>
                  <span className="text-xl font-black tabular-nums" dir="ltr">{m.kcal} <span className="text-[10px] text-white/60">kcal</span></span>
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { l: ar ? 'بروتين' : 'Protein', v: `${m.protein}g` },
                    { l: ar ? 'كارب' : 'Carbs', v: `${m.carbs}g` },
                    { l: ar ? 'ألياف' : 'Fibre', v: typeof m.fiber === 'number' ? `${m.fiber}g` : '—' },
                    { l: ar ? 'دهون' : 'Fat', v: `${m.fat}g` },
                  ].map(x => (
                    <div key={x.l} className="bg-neutral-50 rounded-xl py-2.5 text-center">
                      <p className="text-sm font-black text-black tabular-nums" dir="ltr">{x.v}</p>
                      <p className="text-[8px] font-black uppercase tracking-widest text-neutral-400 mt-0.5">{x.l}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => { removeEntry(editing.id); setEditing(null); }}
                  className="px-4 py-4 rounded-2xl bg-red-50 text-red-600 text-[11px] font-black uppercase tracking-widest"
                >
                  {ar ? 'حذف' : 'Delete'}
                </button>
                <button onClick={saveEdit} className="flex-1 py-4 bg-black text-white rounded-2xl text-[11px] font-black uppercase tracking-widest">
                  {ar ? 'حفظ' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

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
            <div className="px-4 pt-4 flex items-center gap-2">
              <input
                value={newGrocery}
                onChange={(e) => setNewGrocery(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); submitGrocery(); } }}
                placeholder={ar ? 'أضف غرضاً… مثل موز' : 'Add an item… e.g. Bananas'}
                enterKeyHint="done"
                className="flex-1 min-w-0 px-4 py-3 rounded-xl bg-neutral-50 border border-neutral-100 text-sm font-bold text-black placeholder:text-neutral-400 placeholder:font-medium outline-none focus:border-black transition"
              />
              <button
                onClick={submitGrocery}
                disabled={!newGrocery.trim()}
                aria-label={ar ? 'إضافة' : 'Add'}
                className="shrink-0 w-12 h-12 rounded-xl bg-black text-white flex items-center justify-center disabled:opacity-30 transition"
              >
                <span className="material-symbols-outlined">add</span>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2 no-scrollbar">
              {mode === 'cheat' && (
                <p className="text-center text-neutral-400 text-xs font-black uppercase tracking-widest py-4">
                  {ar ? 'يوم حر — لا قائمة من الخطة' : 'Cheat day — no plan items'}
                </p>
              )}
              {planGrocery.map((name) => {
                const key = planItemKey(name);
                const on = grocery.checked.has(key);
                return (
                  <label key={key} className="flex items-center gap-3 p-3 rounded-xl bg-neutral-50 border border-neutral-100">
                    <input type="checkbox" checked={on} onChange={() => grocery.toggle(key)} className="w-5 h-5 rounded-md accent-black shrink-0" />
                    <span className={`flex-1 text-sm font-bold ${on ? 'text-neutral-400 line-through' : 'text-black'}`}>{name}</span>
                  </label>
                );
              })}
              {grocery.custom.length > 0 && (
                <p className="pt-3 px-1 text-[10px] font-black uppercase tracking-widest text-neutral-400">{ar ? 'أغراضي' : 'My items'}</p>
              )}
              {grocery.custom.map((item) => {
                const key = customItemKey(item.id);
                const on = grocery.checked.has(key);
                return (
                  <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl bg-white border border-neutral-200">
                    <label className="flex-1 min-w-0 flex items-center gap-3">
                      <input type="checkbox" checked={on} onChange={() => grocery.toggle(key)} className="w-5 h-5 rounded-md accent-black shrink-0" />
                      <span className={`flex-1 min-w-0 break-words text-sm font-bold ${on ? 'text-neutral-400 line-through' : 'text-black'}`}>{item.name}</span>
                    </label>
                    <button
                      onClick={() => grocery.removeItem(item.id)}
                      aria-label={ar ? 'حذف' : 'Remove'}
                      className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-neutral-400 hover:bg-red-50 hover:text-red-500 transition"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </div>
                );
              })}
              {mode === 'cheat' && grocery.custom.length === 0 && (
                <p className="text-center text-neutral-400 text-xs font-medium py-2">
                  {ar ? 'ما زال بإمكانك إضافة أغراضك أعلاه' : 'You can still add your own items above'}
                </p>
              )}
            </div>
            {groceryTicked > 0 && (
              <div className="px-4 pb-4 pt-2 border-t border-neutral-100">
                <button
                  onClick={grocery.clearTicked}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-neutral-50 text-[11px] font-black uppercase tracking-widest text-neutral-600 hover:bg-black hover:text-white transition"
                >
                  <span className="material-symbols-outlined text-[18px]">done_all</span>
                  {ar ? `مسح المشترى (${groceryTicked})` : `Clear ticked (${groceryTicked})`}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MealPlan;
