import React, { useEffect, useRef, useState } from 'react';
import { searchFoods, lookupBarcode, macrosFor, unitsFor, type Food, type Unit, type Macros } from '../utils/foodDb';
import { searchCommonFoods } from '../utils/commonFoods';
import { analyzePlate, fileToBase64, type GuessedFood } from '../utils/foodVision';
import { SLOTS, type DayLog, type LogEntry, type MealSlot } from '../hooks/useNutritionLog';
import BarcodeScanner from './BarcodeScanner';

type Tab = 'search' | 'barcode' | 'photo' | 'custom';

/** A meal from the day's plan, offered at the top of the sheet. */
export interface RecommendedMeal extends Macros {
  id: string;
  title: string;
  detail: string;
  /** Arabic title / detail, for display only — the entry is still logged under `title`. */
  titleAr?: string;
  detailAr?: string;
  slot: MealSlot;
}

interface Props {
  slot: MealSlot;
  /** The day's plan meals, shown as "Recommended" before anything is typed. */
  recommended?: RecommendedMeal[];
  /** foodIds already logged today, so a recommended meal shows as done. */
  loggedFoodIds?: Set<string>;
  customFoods: Food[];
  /** Foods logged lately, newest first, one per food. */
  recents: LogEntry[];
  /** How a logged entry's name is shown (plan meals are saved in English). */
  nameOf?: (e: LogEntry) => string;
  /** Logged days before the one being logged, newest first — for "same as yesterday's lunch". */
  previousDays?: DayLog[];
  /** YYYY-MM-DD of the day being logged. */
  dayKey?: string;
  ar: boolean;
  onAdd: (entry: LogEntry) => void;
  onSaveCustom: (food: Omit<Food, 'id' | 'source'>) => Promise<Food>;
  onClose: () => void;
}

const uid = () => `e${Date.now()}${Math.random().toString(36).slice(2, 6)}`;

const NO_PLURAL = ['g', 'ml', 'tbsp', 'tsp'];

/**
 * The portion a food is listed and quick-added in: its natural unit (1 date,
 * 1 scoop, 1 cup, 1 serving), else 100 ml for drinks that only have ml, else
 * 100 g. Grams and millilitres are measures, never a "natural" portion, so
 * laban opens on a cup rather than on 1 ml.
 */
function defaultPortion(food: Food): { idx: number; unit: Unit; qty: number; grams: number } {
  const units = unitsFor(food);
  let idx = units.findIndex(u => u.label !== 'g' && u.label !== 'ml');
  let qty = 1;
  if (idx < 0) {
    idx = units.findIndex(u => u.label === 'ml');
    if (idx < 0) idx = units.length - 1;
    qty = 100;
  }
  const unit = units[idx];
  return { idx, unit, qty, grams: Math.max(1, Math.round(qty * unit.grams)) };
}

/** "1 date", "2 dates", "100 g" — the label stored on the entry and shown in rows. */
function unitLabelFor(unit: Unit, qty: number, ar: boolean): string {
  if (ar) return unit.ar ?? unit.label;
  return qty !== 1 && !NO_PLURAL.includes(unit.label) && !unit.label.endsWith('s') ? `${unit.label}s` : unit.label;
}

/** The most recent earlier day that has something logged in this meal. */
function previousMeal(days: DayLog[], slot: MealSlot): { date: string; entries: LogEntry[] } | null {
  for (const d of days) {
    const entries = d.entries.filter(e => e.slot === slot);
    if (entries.length > 0) return { date: d.date, entries };
  }
  return null;
}

/** "yesterday" / "Monday" / "12 Oct", relative to the day being logged. */
function dayLabel(date: string, dayKey: string | undefined, ar: boolean): string {
  const [y, m, d] = date.split('-').map(Number);
  const then = new Date(y, m - 1, d);
  const base = dayKey ? (() => { const [by, bm, bd] = dayKey.split('-').map(Number); return new Date(by, bm - 1, bd); })() : new Date();
  const daysAgo = Math.round((base.getTime() - then.getTime()) / 86_400_000);
  if (daysAgo === 1) return ar ? 'أمس' : 'yesterday';
  const locale = ar ? 'ar-u-nu-latn' : 'en-GB';
  if (daysAgo > 1 && daysAgo < 7) {
    const wd = then.toLocaleDateString(locale, { weekday: 'long' });
    return ar ? `يوم ${wd}` : wd;
  }
  return then.toLocaleDateString(locale, { day: 'numeric', month: 'short' });
}

const blankCustom = { name: '', brand: '', barcode: '', kcal: '', protein: '', carbs: '', fat: '', fiber: '', unitName: '', unitGrams: '' };

const FoodLogSheet: React.FC<Props> = ({ slot, recommended = [], loggedFoodIds, customFoods, recents, nameOf, previousDays = [], dayKey, ar, onAdd, onSaveCustom, onClose }) => {
  // Units shown next to numbers (Arabic keeps a space before the unit).
  const KCAL = ar ? 'سعرة' : 'kcal';
  const G = ar ? ' غ' : 'g';
  const nm = (e: LogEntry) => (nameOf ? nameOf(e) : e.name);
  const [tab, setTab] = useState<Tab>('search');
  const [targetSlot, setTargetSlot] = useState<MealSlot>(slot);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // search
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Food[]>([]);
  // barcode
  const [code, setCode] = useState('');
  const [notFoundCode, setNotFoundCode] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  // photo
  const fileRef = useRef<HTMLInputElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [guesses, setGuesses] = useState<GuessedFood[] | null>(null);
  const [picked, setPicked] = useState<Set<number>>(new Set());
  // custom form
  const [form, setForm] = useState(blankCustom);
  // portion step
  const [chosen, setChosen] = useState<Food | null>(null);
  // The sheet stays open after adding so several foods go in one go.
  const [addedCount, setAddedCount] = useState(0);
  const [justAdded, setJustAdded] = useState<string | null>(null);
  const noteAdded = (key: string, n = 1) => {
    setAddedCount(c => c + n);
    setJustAdded(key);
    setTimeout(() => setJustAdded(k => (k === key ? null : k)), 1400);
  };
  const [qty, setQty] = useState('1');
  const [unitIdx, setUnitIdx] = useState(0);
  // How much of the history lists is showing; "Show more" grows them.
  const [recentShown, setRecentShown] = useState(6);
  const [mineShown, setMineShown] = useState(4);

  // Opening a food picks its most natural portion: 1 egg, 1 scoop, 1 serving —
  // and only falls back to 100 g when the food has no real unit of its own.
  const pick = (food: Food) => {
    const d = defaultPortion(food);
    setUnitIdx(d.idx);
    setQty(String(d.qty));
    setChosen(food);
  };

  // Debounced search; the in-flight request is aborted when the query moves on.
  useEffect(() => {
    if (tab !== 'search') return;
    const q = query.trim();
    if (q.length < 2) { setResults([]); return; }
    const ctrl = new AbortController();
    const id = setTimeout(async () => {
      setBusy(true); setError(null);
      try {
        setResults(await searchFoods(q, ctrl.signal));
      } catch (e) {
        if ((e as Error).name !== 'AbortError') setError(ar ? 'تعذّر البحث — تحقق من الاتصال.' : 'Search failed — check your connection.');
      } finally { setBusy(false); }
    }, 400);
    return () => { clearTimeout(id); ctrl.abort(); };
  }, [query, tab, ar]);

  const commonMatches = searchCommonFoods(query, ar);
  const localMatches = query.trim().length >= 2
    ? customFoods.filter(f => `${f.name} ${f.brand ?? ''}`.toLowerCase().includes(query.trim().toLowerCase()))
    : [];

  const commit = (
    name: string, brand: string | undefined, foodId: string, g: number,
    m: Macros,
    portion?: { qty: number; unitLabel: string },
  ) => {
    onAdd({ id: uid(), foodId, name, brand, slot: targetSlot, grams: g, ...m, ...portion, loggedAt: Date.now() });
  };

  const addChosen = () => {
    if (!chosen) return;
    const units = unitsFor(chosen);
    const unit = units[Math.min(unitIdx, units.length - 1)];
    const n = Math.max(0.01, parseFloat(qty) || 0);
    const g = Math.max(1, Math.round(n * unit.grams));
    commit(chosen.name, chosen.brand, chosen.id, g, macrosFor(chosen, g), { qty: n, unitLabel: unitLabelFor(unit, n, ar) });
    noteAdded(chosen.id);
    setChosen(null);
  };

  /** The + on a row: log the food's default portion without opening it. */
  const quickAdd = (food: Food) => {
    const d = defaultPortion(food);
    commit(food.name, food.brand, food.id, d.grams, macrosFor(food, d.grams), { qty: d.qty, unitLabel: unitLabelFor(d.unit, d.qty, ar) });
    noteAdded(food.id);
  };

  const runBarcode = async (raw?: string) => {
    const c = (raw ?? code).replace(/\D/g, '');
    if (!c) return;
    setBusy(true); setError(null); setNotFoundCode(null);
    try {
      const mine = customFoods.find(f => f.barcode === c);
      if (mine) { pick(mine); return; }
      const found = await lookupBarcode(c);
      if (found) { pick(found); }
      else setNotFoundCode(c);
    } catch {
      setError(ar ? 'تعذّر البحث عن الباركود.' : 'Barcode lookup failed.');
    } finally { setBusy(false); }
  };

  const onPhoto = async (file: File) => {
    setPhotoUrl(URL.createObjectURL(file));
    setGuesses(null); setPicked(new Set()); setError(null); setBusy(true);
    try {
      const { base64, mimeType } = await fileToBase64(file, ar);
      const found = await analyzePlate(base64, mimeType, ar);
      setGuesses(found);
      setPicked(new Set(found.map((_, i) => i)));   // everything on by default
      if (found.length === 0) setError(ar ? 'لم يتم التعرف على طعام في الصورة.' : 'No food recognised in that photo.');
    } catch (e) {
      setError((e as Error).message || (ar ? 'تعذّر تحليل الصورة.' : 'Could not analyse that photo.'));
    } finally { setBusy(false); }
  };

  const addPicked = () => {
    (guesses ?? []).forEach((g, i) => {
      if (!picked.has(i)) return;
      commit(g.name, ar ? 'من الصورة' : 'From photo', `photo:${i}`, g.grams, { kcal: g.kcal, protein: g.protein, carbs: g.carbs, fat: g.fat, fiber: (g as { fiber?: number }).fiber });
    });
    noteAdded('photo', picked.size);
    setGuesses(null); setPhotoUrl(null); setPicked(new Set());
  };

  const saveCustom = async () => {
    const name = form.name.trim();
    if (!name) { setError(ar ? 'أدخل اسم الطعام.' : 'Give the food a name.'); return; }
    setBusy(true); setError(null);
    try {
      // An optional portion of their own — "1 piece of my kubba = 80 g" — so it
      // can be logged by the piece instead of weighed every time.
      const unitGrams = parseFloat(form.unitGrams) || 0;
      const units = unitGrams > 0
        ? [{ label: form.unitName.trim() || (ar ? 'حبة' : 'piece'), grams: unitGrams }, { label: 'g', ar: 'غرام', grams: 1 }]
        : undefined;
      const food = await onSaveCustom({
        name,
        brand: form.brand.trim() || undefined,
        barcode: form.barcode.replace(/\D/g, '') || undefined,
        units,
        per100: {
          kcal: Math.round(parseFloat(form.kcal) || 0),
          protein: parseFloat(form.protein) || 0,
          carbs: parseFloat(form.carbs) || 0,
          fat: parseFloat(form.fat) || 0,
          // Left out (not 0) when blank, so "unknown" stays distinguishable from "none".
          ...(form.fiber.trim() !== '' ? { fiber: parseFloat(form.fiber) || 0 } : {}),
        },
      });
      setForm(blankCustom);
      pick(food);
    } catch {
      setError(ar ? 'تعذّر الحفظ.' : 'Could not save that food.');
    } finally { setBusy(false); }
  };

  const openCustomWithBarcode = (c: string) => {
    setForm({ ...blankCustom, barcode: c });
    setNotFoundCode(null);
    setTab('custom');
  };

  const Row: React.FC<{ food: Food; mine?: boolean }> = ({ food, mine }) => {
    const d = defaultPortion(food);
    const m = macrosFor(food, d.grams);
    const done = justAdded === food.id;
    const portion = d.unit.label === 'g' || d.unit.label === 'ml'
      ? `${d.qty} ${ar ? (d.unit.ar ?? d.unit.label) : d.unit.label}`
      : `${d.qty} ${unitLabelFor(d.unit, d.qty, ar)}`;
    const source = mine ? (ar ? 'طعامي' : 'My food') : food.source === 'common' ? '' : (food.brand || '');
    return (
      <div className="flex items-center rounded-2xl border border-neutral-100 bg-white">
        <button onClick={() => pick(food)} className="flex-1 min-w-0 flex items-center gap-3 p-3 text-start">
          {food.imageUrl
            ? <img src={food.imageUrl} alt="" className="w-11 h-11 rounded-xl object-cover bg-neutral-50 shrink-0" />
            : <span className="w-11 h-11 rounded-xl bg-neutral-50 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[20px] text-neutral-300">{mine ? 'bookmark' : 'nutrition'}</span>
              </span>}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-black truncate flex items-center gap-1">
              <span className="truncate">{food.name}</span>
              {food.source === 'common' && (
                <span className="material-symbols-outlined text-[15px] text-green-600 filled shrink-0" title={ar ? 'موثّق' : 'Verified'}>verified</span>
              )}
            </p>
            <p className="text-[12px] text-neutral-500 font-medium truncate">
              {ar ? <span>{m.kcal} سعرة</span> : <span dir="ltr">{m.kcal} kcal</span>}{ar ? '، ' : ', '}{portion}{source ? ` \u00b7 ${source}` : ''}
            </p>
          </div>
        </button>
        <button
          onClick={() => quickAdd(food)}
          aria-label={ar ? `أضف ${food.name}` : `Add ${food.name}`}
          className={`w-10 h-10 me-3 rounded-full flex items-center justify-center shrink-0 transition ${
            done ? 'bg-green-600 text-white' : 'bg-accent/10 text-accent'
          }`}
        >
          <span className="material-symbols-outlined text-[22px]">{done ? 'check' : 'add'}</span>
        </button>
      </div>
    );
  };

  const field = (label: string, key: keyof typeof form, placeholder: string, numeric = false) => (
    <div className="space-y-1">
      <label className="text-[9px] font-black uppercase tracking-widest rtl:tracking-normal text-neutral-400">{label}</label>
      <input
        value={form[key]}
        onChange={e => setForm({ ...form, [key]: e.target.value })}
        inputMode={numeric ? 'decimal' : 'text'}
        placeholder={placeholder}
        className="w-full bg-neutral-50 border border-neutral-100 rounded-xl px-3 py-2.5 text-sm font-bold outline-none focus:border-black transition"
      />
    </div>
  );

  const TABS: { id: Tab; icon: string; en: string; arLabel: string }[] = [
    { id: 'search', icon: 'search', en: 'Search', arLabel: 'بحث' },
    { id: 'barcode', icon: 'barcode_scanner', en: 'Barcode', arLabel: 'باركود' },
    { id: 'photo', icon: 'photo_camera', en: 'Photo', arLabel: 'صورة' },
    { id: 'custom', icon: 'add_circle', en: 'My food', arLabel: 'طعامي' },
  ];

  return (
    <div className="fixed inset-0 z-[9999] flex items-end md:items-center justify-center md:p-6 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white w-full md:max-w-lg rounded-t-[2rem] md:rounded-3xl shadow-2xl flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {/* Header */}
        <div className="p-5 pb-3 border-b border-neutral-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-black font-display uppercase">{ar ? 'سجّل طعاماً' : 'Log food'}</h3>
            <button onClick={onClose} className="w-9 h-9 rounded-xl bg-neutral-50 flex items-center justify-center hover:bg-black hover:text-white transition">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
          {/* Which meal */}
          <div className="flex gap-1.5 mb-3 overflow-x-auto no-scrollbar">
            {SLOTS.map(s => (
              <button
                key={s.id}
                onClick={() => setTargetSlot(s.id)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest rtl:tracking-normal border transition ${
                  targetSlot === s.id ? 'bg-black text-white border-black' : 'bg-white text-neutral-400 border-neutral-200'
                }`}
              >
                {ar ? s.ar : s.en}
              </button>
            ))}
          </div>
          {/* How to add */}
          <div className="grid grid-cols-4 gap-1.5">
            {TABS.map(x => (
              <button
                key={x.id}
                onClick={() => { setTab(x.id); setError(null); }}
                className={`flex flex-col items-center gap-0.5 py-2 rounded-xl border transition ${
                  tab === x.id ? 'bg-accent/10 border-accent text-accent' : 'bg-white border-neutral-100 text-neutral-400'
                }`}
              >
                <span className="material-symbols-outlined text-[19px]">{x.icon}</span>
                <span className="text-[8px] font-black uppercase tracking-widest rtl:tracking-normal">{ar ? x.arLabel : x.en}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
          {error && (
            <p className="text-[11px] font-bold text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{error}</p>
          )}

          {tab === 'search' && (
            <>
              {/* No autoFocus: focusing an input inside a fixed bottom sheet while iOS
                  opens the keyboard misplaces the caret. The user taps to type, and the
                  whole bar (icon + padding) is the tap target. */}
              <div
                onClick={() => searchRef.current?.focus()}
                className="flex items-center gap-2 bg-neutral-50 border border-neutral-100 rounded-2xl px-3 cursor-text focus-within:border-black transition"
              >
                <span className="material-symbols-outlined text-neutral-400 text-[20px] shrink-0">search</span>
                <input
                  ref={searchRef}
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder={ar ? 'ابحث عن طعام…' : 'Search foods…'}
                  className="flex-1 min-w-0 bg-transparent outline-none py-3 text-sm font-medium"
                />
                {busy && <span className="w-4 h-4 border-2 border-neutral-300 border-t-black rounded-full animate-spin shrink-0" />}
              </div>

              {query.trim().length < 2 && (() => {
                const prev = previousMeal(previousDays, targetSlot);
                if (!prev) return null;
                const done = justAdded === 'previous';
                const kcal = Math.round(prev.entries.reduce((s, e) => s + (e.kcal || 0), 0));
                const slotInfo = SLOTS.find(x => x.id === targetSlot)!;
                const when = dayLabel(prev.date, dayKey, ar);
                return (
                  <button
                    onClick={() => {
                      prev.entries.forEach(e => commit(e.name, e.brand, e.foodId, e.grams,
                        { kcal: e.kcal, protein: e.protein, carbs: e.carbs, fat: e.fat, fiber: e.fiber },
                        e.qty && e.unitLabel ? { qty: e.qty, unitLabel: e.unitLabel } : undefined));
                      noteAdded('previous', prev.entries.length);
                    }}
                    className={`w-full text-start flex items-center gap-3 p-3 rounded-2xl border-2 transition ${
                      done ? 'border-green-300 bg-green-50' : 'border-black bg-white'
                    }`}
                  >
                    <span className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${done ? 'bg-green-100' : 'bg-black'}`}>
                      <span className={`material-symbols-outlined text-[20px] ${done ? 'text-green-600 filled' : 'text-white'}`}>{done ? 'check_circle' : 'replay'}</span>
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black text-black truncate">
                        {ar ? `نفس ${slotInfo.ar} ${when}` : `Same as ${when}'s ${slotInfo.en.toLowerCase()}`}
                      </p>
                      <p className="text-[11px] text-neutral-500 font-medium truncate">
                        {prev.entries.map(nm).join(ar ? '، ' : ', ')}
                      </p>
                    </div>
                    <span className="text-[11px] font-black text-black tabular-nums shrink-0" dir={ar ? undefined : 'ltr'}>{kcal} {KCAL}</span>
                  </button>
                );
              })()}

              {query.trim().length < 2 && recommended.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[9px] font-black uppercase tracking-widest rtl:tracking-normal text-neutral-400 ms-1">{ar ? 'مقترح من خطتك' : 'Recommended from your plan'}</p>
                  {[...recommended]
                    .sort((a, b) => Number(b.slot === targetSlot) - Number(a.slot === targetSlot))
                    .map(r => {
                      const done = loggedFoodIds?.has(`plan:${r.id}`);
                      const slotInfo = SLOTS.find(x => x.id === r.slot);
                      return (
                        <button
                          key={r.id}
                          onClick={() => {
                            // A plan meal goes into its own meal slot, not whichever chip is selected.
                            onAdd({
                              id: uid(), foodId: `plan:${r.id}`, name: r.title, brand: ar ? 'الخطة' : 'Plan',
                              slot: r.slot, grams: 0,
                              kcal: r.kcal, protein: r.protein, carbs: r.carbs, fat: r.fat, fiber: r.fiber,
                              qty: 1, unitLabel: ar ? 'وجبة' : 'meal', loggedAt: Date.now(),
                            });
                            noteAdded(`plan:${r.id}`);
                          }}
                          className={`w-full text-start flex items-center gap-3 p-3 rounded-2xl border transition ${
                            done ? 'border-green-200 bg-green-50' : 'border-neutral-100 bg-white hover:border-black'
                          }`}
                        >
                          <span className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${done ? 'bg-green-100' : 'bg-accent/10'}`}>
                            <span className={`material-symbols-outlined text-[18px] ${done ? 'text-green-600 filled' : 'text-accent'}`}>
                              {done ? 'check_circle' : (slotInfo?.icon ?? 'restaurant')}
                            </span>
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-black truncate">{ar && r.titleAr ? r.titleAr : r.title}</p>
                            <p className="text-[11px] text-neutral-400 font-medium truncate" dir={ar ? undefined : 'ltr'}>
                              {ar
                                ? `${r.kcal} سعرة · بروتين ${r.protein} غ · كارب ${r.carbs} غ · ألياف ${r.fiber} غ`
                                : `${r.kcal} kcal · ${r.protein}g P · ${r.carbs}g C · ${r.fiber}g fib`}
                            </p>
                          </div>
                          <span className="text-[9px] font-black uppercase tracking-widest rtl:tracking-normal text-neutral-400 shrink-0">
                            {ar ? slotInfo?.ar : slotInfo?.en}
                          </span>
                        </button>
                      );
                    })}
                </div>
              )}

              {query.trim().length < 2 && recents.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[9px] font-black uppercase tracking-widest rtl:tracking-normal text-neutral-400 ms-1">{ar ? 'الأخيرة' : 'Recent'}</p>
                  {recents.slice(0, recentShown).map(r => (
                    <button
                      key={r.id}
                      onClick={() => { commit(r.name, r.brand, r.foodId, r.grams, { kcal: r.kcal, protein: r.protein, carbs: r.carbs, fat: r.fat, fiber: r.fiber }, r.qty && r.unitLabel ? { qty: r.qty, unitLabel: r.unitLabel } : undefined); noteAdded(`recent:${r.id}`); }}
                      className="w-full text-start flex items-center gap-3 p-3 rounded-2xl border border-neutral-100 bg-white hover:border-black transition"
                    >
                      <span className="w-9 h-9 rounded-xl bg-neutral-50 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-[18px] text-neutral-300">history</span>
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-black truncate">{nm(r)}</p>
                        <p className="text-[11px] text-neutral-400 font-medium" dir={ar ? undefined : 'ltr'}>{r.qty && r.unitLabel && r.unitLabel !== 'g' ? `${r.qty} ${r.unitLabel}` : `${r.grams}${G}`} · {r.kcal} {KCAL}</p>
                      </div>
                      <span className={`material-symbols-outlined text-[20px] ${justAdded === `recent:${r.id}` ? 'text-green-600 filled' : 'text-accent'}`}>{justAdded === `recent:${r.id}` ? 'check_circle' : 'add_circle'}</span>
                    </button>
                  ))}
                  {recents.length > recentShown && (
                    <button onClick={() => setRecentShown(n => n + 10)} className="w-full py-2.5 rounded-xl bg-neutral-50 text-[10px] font-black uppercase tracking-widest rtl:tracking-normal text-neutral-500">
                      {ar ? `عرض المزيد (${recents.length - recentShown})` : `Show more (${recents.length - recentShown})`}
                    </button>
                  )}
                </div>
              )}

              {query.trim().length < 2 && customFoods.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[9px] font-black uppercase tracking-widest rtl:tracking-normal text-neutral-400 ms-1">{ar ? 'أطعمتي المحفوظة' : 'My saved foods'}</p>
                  {[...customFoods]
                    .sort((a, b) => ((b as { createdAt?: number }).createdAt ?? 0) - ((a as { createdAt?: number }).createdAt ?? 0))
                    .slice(0, mineShown)
                    .map(f => <Row key={f.id} food={f} mine />)}
                  {customFoods.length > mineShown && (
                    <button onClick={() => setMineShown(customFoods.length)} className="w-full py-2.5 rounded-xl bg-neutral-50 text-[10px] font-black uppercase tracking-widest rtl:tracking-normal text-neutral-500">
                      {ar ? `عرض الكل (${customFoods.length})` : `Show all (${customFoods.length})`}
                    </button>
                  )}
                </div>
              )}

              {commonMatches.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[9px] font-black uppercase tracking-widest rtl:tracking-normal text-neutral-400 ms-1">{ar ? 'أطعمة شائعة' : 'Common foods'}</p>
                  {commonMatches.map(f => <Row key={f.id} food={f} />)}
                </div>
              )}

              {localMatches.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[9px] font-black uppercase tracking-widest rtl:tracking-normal text-neutral-400 ms-1">{ar ? 'أطعمتي' : 'My foods'}</p>
                  {localMatches.map(f => <Row key={f.id} food={f} mine />)}
                </div>
              )}

              {results.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[9px] font-black uppercase tracking-widest rtl:tracking-normal text-neutral-400 ms-1">{ar ? 'قاعدة البيانات' : 'Food database'}</p>
                  {results.map(f => <Row key={f.id} food={f} />)}
                </div>
              )}

              {!busy && query.trim().length >= 2 && results.length === 0 && localMatches.length === 0 && commonMatches.length === 0 && (
                <div className="text-center py-8 space-y-3">
                  <p className="text-xs font-bold text-neutral-400">{ar ? 'لا نتائج.' : 'Nothing found.'}</p>
                  <button onClick={() => { setForm({ ...blankCustom, name: query.trim() }); setTab('custom'); }} className="px-4 py-2.5 bg-black text-white rounded-xl text-[10px] font-black uppercase tracking-widest rtl:tracking-normal">
                    {ar ? 'أضفه بنفسك' : 'Add it yourself'}
                  </button>
                </div>
              )}
            </>
          )}

          {tab === 'barcode' && (
            <div className="space-y-3">
              <button
                onClick={() => { setNotFoundCode(null); setError(null); setScanning(true); }}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-black text-white text-[11px] font-black uppercase tracking-widest rtl:tracking-normal"
              >
                <span className="material-symbols-outlined text-[20px]">qr_code_scanner</span>
                {ar ? 'امسح بالكاميرا' : 'Scan with camera'}
              </button>
              <p className="text-[11px] font-medium text-neutral-500 text-center">
                {ar ? 'أو اكتب الرقم تحت الباركود.' : 'Or type the number printed under the barcode.'}
              </p>
              <div className="flex gap-2">
                <input
                  value={code}
                  onChange={e => setCode(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') runBarcode(); }}
                  inputMode="numeric"
                  placeholder={ar ? 'مثال: 3017624010701' : 'e.g. 3017624010701'}
                  dir="ltr"
                  className="flex-1 min-w-0 bg-neutral-50 border border-neutral-100 rounded-2xl px-4 py-3 text-sm font-bold tabular-nums outline-none focus:border-black transition"
                />
                <button onClick={() => runBarcode()} disabled={busy} className="px-5 bg-black text-white rounded-2xl text-[10px] font-black uppercase tracking-widest rtl:tracking-normal disabled:opacity-40">
                  {busy ? '…' : (ar ? 'ابحث' : 'Find')}
                </button>
              </div>
              {notFoundCode && (
                <div className="text-center py-6 space-y-3 border border-dashed border-neutral-200 rounded-2xl">
                  <p className="text-xs font-bold text-neutral-400">{ar ? 'غير موجود في قاعدة البيانات.' : 'Not in the database.'}</p>
                  <button onClick={() => openCustomWithBarcode(notFoundCode)} className="px-4 py-2.5 bg-black text-white rounded-xl text-[10px] font-black uppercase tracking-widest rtl:tracking-normal">
                    {ar ? 'احفظه بهذا الباركود' : 'Save it with this barcode'}
                  </button>
                </div>
              )}
              {customFoods.filter(f => f.barcode).length > 0 && (
                <div className="space-y-2 pt-2">
                  <p className="text-[9px] font-black uppercase tracking-widest rtl:tracking-normal text-neutral-400 ms-1">{ar ? 'أطعمتي بباركود' : 'My barcoded foods'}</p>
                  {customFoods.filter(f => f.barcode).map(f => <Row key={f.id} food={f} mine />)}
                </div>
              )}
            </div>
          )}

          {tab === 'photo' && (
            <div className="space-y-3">
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) onPhoto(f); }}
              />
              {!photoUrl && (
                <button
                  onClick={() => fileRef.current?.click()}
                  className="w-full py-10 rounded-3xl border-2 border-dashed border-neutral-200 flex flex-col items-center gap-2 hover:border-black transition"
                >
                  <span className="material-symbols-outlined text-4xl text-neutral-300">add_a_photo</span>
                  <span className="text-[11px] font-black uppercase tracking-widest rtl:tracking-normal text-neutral-400">
                    {ar ? 'صوّر طبقك' : 'Take a photo of your plate'}
                  </span>
                </button>
              )}

              {photoUrl && (
                <div className="relative rounded-2xl overflow-hidden">
                  <img src={photoUrl} alt="" className="w-full h-40 object-cover" />
                  <button
                    onClick={() => { setPhotoUrl(null); setGuesses(null); setError(null); }}
                    className="absolute top-2 end-2 w-8 h-8 rounded-xl bg-black/70 text-white flex items-center justify-center"
                  >
                    <span className="material-symbols-outlined text-[18px]">close</span>
                  </button>
                </div>
              )}

              {busy && (
                <div className="flex items-center justify-center gap-2 py-6">
                  <span className="w-4 h-4 border-2 border-neutral-300 border-t-black rounded-full animate-spin" />
                  <span className="text-[11px] font-black uppercase tracking-widest rtl:tracking-normal text-neutral-400">{ar ? 'يتم التحليل…' : 'Analysing…'}</span>
                </div>
              )}

              {guesses && guesses.length > 0 && (
                <>
                  <p className="text-[9px] font-black uppercase tracking-widest rtl:tracking-normal text-neutral-400 ms-1">
                    {ar ? 'اختر ما في الطبق' : 'Pick what is on the plate'}
                  </p>
                  {guesses.map((g, i) => {
                    const on = picked.has(i);
                    return (
                      <div key={i} className={`p-3 rounded-2xl border-2 transition ${on ? 'border-black bg-neutral-50' : 'border-neutral-100 bg-white'}`}>
                        <button
                          onClick={() => { const n = new Set(picked); n.has(i) ? n.delete(i) : n.add(i); setPicked(n); }}
                          className="w-full text-start flex items-center gap-3"
                        >
                          <span className={`material-symbols-outlined text-[22px] shrink-0 ${on ? 'text-black filled' : 'text-neutral-300'}`}>
                            {on ? 'check_circle' : 'radio_button_unchecked'}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-black truncate">{g.name}</p>
                            <p className="text-[11px] text-neutral-400 font-medium" dir={ar ? undefined : 'ltr'}>
                              {ar
                                ? `${g.kcal} سعرة · بروتين ${g.protein} غ · كارب ${g.carbs} غ · دهون ${g.fat} غ`
                                : `${g.kcal} kcal · ${g.protein}g P · ${g.carbs}g C · ${g.fat}g F`}
                            </p>
                          </div>
                          {g.confidence !== 'high' && (
                            <span className={`text-[8px] font-black uppercase tracking-widest rtl:tracking-normal px-2 py-1 rounded-full shrink-0 ${
                              g.confidence === 'low' ? 'bg-red-50 text-red-500' : 'bg-amber-50 text-amber-600'
                            }`}>
                              {g.confidence === 'low' ? (ar ? 'غير مؤكد' : 'unsure') : (ar ? 'تقريبي' : 'approx')}
                            </span>
                          )}
                        </button>
                        {on && (
                          <div className="flex items-center gap-2 mt-2 ps-8">
                            <span className="text-[9px] font-black uppercase tracking-widest rtl:tracking-normal text-neutral-400">{ar ? 'الكمية' : 'Portion'}</span>
                            <input
                              value={String(g.grams)}
                              onChange={e => {
                                const next = Math.max(1, parseFloat(e.target.value) || 0);
                                const k = next / (g.grams || 1);
                                setGuesses(gs => (gs ?? []).map((x, j) => j === i ? {
                                  ...x, grams: next,
                                  kcal: Math.round(x.kcal * k),
                                  protein: Math.round(x.protein * k * 10) / 10,
                                  carbs: Math.round(x.carbs * k * 10) / 10,
                                  fat: Math.round(x.fat * k * 10) / 10,
                                } : x));
                              }}
                              inputMode="decimal"
                              dir="ltr"
                              className="w-20 bg-white border border-neutral-200 rounded-lg px-2 py-1.5 text-xs font-black tabular-nums outline-none focus:border-black"
                            />
                            <span className="text-[10px] font-bold text-neutral-400">{ar ? 'غ' : 'g'}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  <p className="text-[10px] text-neutral-400 font-medium text-center pt-1">
                    {ar ? 'تقديرات تقريبية — عدّلها إذا لزم.' : 'These are estimates — adjust the portions if they look off.'}
                  </p>
                </>
              )}
            </div>
          )}

          {tab === 'custom' && (
            <div className="space-y-3">
              <p className="text-[11px] font-medium text-neutral-500">
                {ar ? 'احفظه مرة واحدة وسيظهر في البحث والباركود لاحقاً.' : 'Save it once and it shows up in search and barcode lookups from then on.'}
              </p>
              {field(ar ? 'الاسم' : 'Name', 'name', ar ? 'مثال: كبة أمي' : 'e.g. Mum’s kubba')}
              <div className="grid grid-cols-2 gap-2">
                {field(ar ? 'العلامة' : 'Brand', 'brand', ar ? 'اختياري' : 'optional')}
                {field(ar ? 'الباركود' : 'Barcode', 'barcode', ar ? 'اختياري' : 'optional', true)}
              </div>
              <p className="text-[9px] font-black uppercase tracking-widest rtl:tracking-normal text-neutral-400 pt-1">{ar ? 'لكل 100 غرام' : 'Per 100 g'}</p>
              <div className="grid grid-cols-4 gap-2">
                {field(ar ? 'سعرات' : 'kcal', 'kcal', '0', true)}
                {field(ar ? 'بروتين' : 'Protein', 'protein', '0', true)}
                {field(ar ? 'كارب' : 'Carbs', 'carbs', '0', true)}
                {field(ar ? 'دهون' : 'Fat', 'fat', '0', true)}
              </div>
              <div className="grid grid-cols-4 gap-2">
                {field(ar ? 'ألياف' : 'Fibre', 'fiber', '0', true)}
              </div>

              <p className="text-[9px] font-black uppercase tracking-widest rtl:tracking-normal text-neutral-400 pt-1">
                {ar ? 'وحدة خاصة (اختياري)' : 'Your own portion (optional)'}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {field(ar ? 'اسم الوحدة' : 'Portion name', 'unitName', ar ? 'حبة' : 'piece')}
                {field(ar ? 'وزنها بالغرام' : 'Weighs (g)', 'unitGrams', '80', true)}
              </div>
              <p className="text-[10px] font-medium text-neutral-400">
                {ar
                  ? 'لتسجّله كـ «١ حبة» بدل وزنه كل مرة.'
                  : 'Lets you log it as “1 piece” instead of weighing it every time.'}
              </p>
            </div>
          )}
        </div>

        {/* Footer action for the tabs that need one */}
        {addedCount > 0 && (
          <div className="px-4 pt-3 pb-1 border-t border-neutral-100 flex items-center gap-3">
            <span className="flex-1 flex items-center gap-1.5 text-[11px] font-black text-green-700">
              <span className="material-symbols-outlined text-[18px] filled">check_circle</span>
              {ar ? `أُضيف ${addedCount}` : `${addedCount} added`}
            </span>
            <button onClick={onClose} className="px-5 py-2.5 bg-black text-white rounded-xl text-[11px] font-black uppercase tracking-widest rtl:tracking-normal">
              {ar ? 'تم' : 'Done'}
            </button>
          </div>
        )}
        {tab === 'photo' && guesses && guesses.length > 0 && (
          <div className="p-4 border-t border-neutral-100">
            <button onClick={addPicked} disabled={picked.size === 0} className="w-full py-4 bg-black text-white rounded-2xl text-[11px] font-black uppercase tracking-widest rtl:tracking-normal disabled:opacity-40">
              {ar ? `أضف ${picked.size}` : `Add ${picked.size} item${picked.size === 1 ? '' : 's'}`}
            </button>
          </div>
        )}
        {tab === 'custom' && (
          <div className="p-4 border-t border-neutral-100">
            <button onClick={saveCustom} disabled={busy} className="w-full py-4 bg-black text-white rounded-2xl text-[11px] font-black uppercase tracking-widest rtl:tracking-normal disabled:opacity-40">
              {busy ? '…' : (ar ? 'احفظ وتابع' : 'Save & continue')}
            </button>
          </div>
        )}
      </div>

      {scanning && (
        <BarcodeScanner
          ar={ar}
          onClose={() => setScanning(false)}
          onDetect={(c) => { setScanning(false); setCode(c); runBarcode(c); }}
        />
      )}

      {/* Portion step — sits above the sheet once a food is chosen */}
      {chosen && (
        <div className="absolute inset-0 z-10 flex items-end md:items-center justify-center md:p-6 bg-black/50" onClick={e => { e.stopPropagation(); setChosen(null); }}>
          <div className="bg-white w-full md:max-w-sm rounded-t-[2rem] md:rounded-3xl shadow-2xl p-5 space-y-4" onClick={e => e.stopPropagation()} style={{ paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom))' }}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-base font-black text-black leading-tight">{chosen.name}</p>
                <p className="text-[11px] font-medium text-neutral-400 truncate">{chosen.brand || (chosen.source === 'custom' ? (ar ? 'طعامي' : 'My food') : (ar ? 'عام' : 'Generic'))}</p>
              </div>
              <button onClick={() => setChosen(null)} className="w-8 h-8 rounded-lg bg-neutral-50 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {(() => {
              const units = unitsFor(chosen);
              const safeIdx = Math.min(unitIdx, units.length - 1);
              return (
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2">
                    <input
                      value={qty}
                      onChange={e => setQty(e.target.value)}
                      inputMode="decimal"
                      dir="ltr"
                      aria-label={ar ? 'الكمية' : 'Quantity'}
                      className="w-20 bg-neutral-50 border border-neutral-100 rounded-xl px-3 py-2.5 text-base font-black tabular-nums outline-none focus:border-black transition"
                    />
                    <select
                      value={safeIdx}
                      onChange={e => setUnitIdx(Number(e.target.value))}
                      aria-label={ar ? 'الوحدة' : 'Unit'}
                      className="flex-1 bg-neutral-50 border border-neutral-100 rounded-xl px-3 py-2.5 text-sm font-bold outline-none focus:border-black transition"
                    >
                      {units.map((u, i) => (
                        <option key={u.label + i} value={i}>
                          {(ar ? (u.ar ?? u.label) : u.label) + (u.grams !== 1 ? (ar ? ` (${u.grams} غ)` : ` (${u.grams} g)`) : '')}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-1.5">
                    {[0.5, 1, 2, 3].map(n => (
                      <button
                        key={n}
                        onClick={() => setQty(String(n))}
                        className={`flex-1 py-1.5 rounded-lg text-[10px] font-black tabular-nums transition ${
                          parseFloat(qty) === n ? 'bg-black text-white' : 'bg-neutral-100 text-neutral-500'
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                    <span className="flex-1 flex items-center justify-center text-[10px] font-black text-neutral-400 tabular-nums" dir={ar ? undefined : 'ltr'}>
                      = {Math.max(1, Math.round((parseFloat(qty) || 0) * units[safeIdx].grams))} {ar ? 'غ' : 'g'}
                    </span>
                  </div>
                </div>
              );
            })()}

            {(() => {
              const us = unitsFor(chosen);
              const u = us[Math.min(unitIdx, us.length - 1)];
              const m = macrosFor(chosen, Math.max(1, Math.round((parseFloat(qty) || 0) * u.grams)));
              return (
                <div className="space-y-2">
                  <div className="flex items-baseline justify-between bg-black text-white rounded-xl px-4 py-2.5">
                    <span className="text-[9px] font-black uppercase tracking-widest rtl:tracking-normal text-white/60">{ar ? 'السعرات' : 'Calories'}</span>
                    <span className="text-xl font-black tabular-nums"><span dir="ltr">{m.kcal}</span> <span className="text-[10px] text-white/60">{KCAL}</span></span>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { l: ar ? 'بروتين' : 'Protein', v: `${m.protein}${G}` },
                      { l: ar ? 'كارب' : 'Carbs', v: `${m.carbs}${G}` },
                      { l: ar ? 'ألياف' : 'Fibre', v: typeof m.fiber === 'number' ? `${m.fiber}${G}` : '\u2014' },
                      { l: ar ? 'دهون' : 'Fat', v: `${m.fat}${G}` },
                    ].map(x => (
                      <div key={x.l} className="bg-neutral-50 rounded-xl py-2.5 text-center">
                        <p className="text-sm font-black text-black tabular-nums" dir={ar ? undefined : 'ltr'}>{x.v}</p>
                        <p className="text-[8px] font-black uppercase tracking-widest rtl:tracking-normal text-neutral-400 mt-0.5">{x.l}</p>
                      </div>
                    ))}
                  </div>
                  {typeof m.fiber !== 'number' && (
                    <p className="text-[10px] font-medium text-neutral-400 text-center">
                      {ar ? 'هذا المنتج لا يذكر الألياف.' : 'This product does not list fibre.'}
                    </p>
                  )}
                </div>
              );
            })()}

            <button onClick={addChosen} className="w-full py-4 bg-black text-white rounded-2xl text-[11px] font-black uppercase tracking-widest rtl:tracking-normal">
              {ar ? `أضف إلى ${SLOTS.find(s => s.id === targetSlot)?.ar}` : `Add to ${SLOTS.find(s => s.id === targetSlot)?.en}`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FoodLogSheet;
