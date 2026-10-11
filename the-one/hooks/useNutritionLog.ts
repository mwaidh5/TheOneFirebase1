import { useEffect, useMemo, useState } from 'react';
import { doc, collection, onSnapshot, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import type { Food, Macros } from '../utils/foodDb';

export type DayMode = 'training' | 'off' | 'cheat';
export type MealSlot = 'breakfast' | 'lunch' | 'snack' | 'dinner';

export interface LogEntry extends Macros {
  id: string;
  foodId: string;
  name: string;
  brand?: string;
  slot: MealSlot;
  grams: number;
  loggedAt: number;
}

export const SLOTS: { id: MealSlot; en: string; ar: string; icon: string }[] = [
  { id: 'breakfast', en: 'Breakfast', ar: 'فطور', icon: 'wb_twilight' },
  { id: 'lunch', en: 'Lunch', ar: 'غداء', icon: 'light_mode' },
  { id: 'snack', en: 'Snack', ar: 'سناك', icon: 'cookie' },
  { id: 'dinner', en: 'Dinner', ar: 'عشاء', icon: 'bedtime' },
];

export const dateKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// ── The old localStorage format, so days logged before this feature survive ──
const legacyEaten = (key: string): string[] => {
  try {
    const raw = localStorage.getItem(`theone_meals_${key}`);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch { return []; }
};
const legacyMode = (key: string): DayMode => {
  try {
    const m = localStorage.getItem(`theone_daymode_${key}`);
    if (m === 'training' || m === 'off' || m === 'cheat') return m;
    if (localStorage.getItem(`theone_cheat_${key}`) === '1') return 'cheat';
  } catch {}
  return 'training';
};

/**
 * One day of nutrition: which plan meals were ticked, which foods were logged,
 * and whether it is a training / off / cheat day. Lives in Firestore so it
 * follows the athlete across devices and the coach can see it.
 */
export function useNutritionLog(uid: string | undefined, date: Date) {
  const key = dateKey(date);
  const [mode, setModeState] = useState<DayMode>(() => legacyMode(key));
  const [planEaten, setPlanEaten] = useState<Set<string>>(() => new Set(legacyEaten(key)));
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const ref = useMemo(
    () => (uid ? doc(db, 'users', uid, 'nutrition_log', key) : null),
    [uid, key]
  );

  useEffect(() => {
    if (!ref) { setLoading(false); return; }
    setLoading(true);
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        const d = snap.data() as { mode?: DayMode; planEaten?: string[]; entries?: LogEntry[] };
        setModeState(d.mode ?? 'training');
        setPlanEaten(new Set(d.planEaten ?? []));
        setEntries(d.entries ?? []);
      } else {
        // First time this day is opened on this account: carry over anything
        // the device logged before the log moved to Firestore.
        const seedEaten = legacyEaten(key);
        const seedMode = legacyMode(key);
        setModeState(seedMode);
        setPlanEaten(new Set(seedEaten));
        setEntries([]);
        if (seedEaten.length > 0 || seedMode !== 'training') {
          setDoc(ref, { mode: seedMode, planEaten: seedEaten, entries: [] }, { merge: true }).catch(() => {});
        }
      }
      setLoading(false);
    }, () => setLoading(false));
    return () => unsub();
  }, [ref, key]);

  const save = (patch: Partial<{ mode: DayMode; planEaten: string[]; entries: LogEntry[] }>) => {
    if (!ref) return;
    setDoc(ref, patch, { merge: true }).catch(err => console.error('nutrition log save', err));
  };

  const setMode = (m: DayMode) => { setModeState(m); save({ mode: m }); };

  const togglePlanMeal = (id: string) => {
    const next = new Set(planEaten);
    if (next.has(id)) next.delete(id); else next.add(id);
    setPlanEaten(next);
    save({ planEaten: Array.from(next) as string[] });
  };

  const addEntry = (entry: LogEntry) => {
    const next = [...entries, entry];
    setEntries(next);
    save({ entries: next });
  };

  const removeEntry = (id: string) => {
    const next = entries.filter(e => e.id !== id);
    setEntries(next);
    save({ entries: next });
  };

  return { mode, setMode, planEaten, togglePlanMeal, entries, addEntry, removeEntry, loading };
}

/**
 * The athlete's own foods — anything not in Open Food Facts, saved once with
 * its macros and (optionally) a barcode so scanning it finds it next time.
 */
export function useCustomFoods(uid: string | undefined) {
  const [foods, setFoods] = useState<Food[]>([]);

  useEffect(() => {
    if (!uid) { setFoods([]); return; }
    const unsub = onSnapshot(collection(db, 'users', uid, 'custom_foods'), (snap) => {
      setFoods(snap.docs.map(d => ({ ...(d.data() as Food), id: `custom:${d.id}`, source: 'custom' as const })));
    }, () => setFoods([]));
    return () => unsub();
  }, [uid]);

  const saveFood = async (food: Omit<Food, 'id' | 'source'>): Promise<Food> => {
    const docId = food.barcode?.replace(/\D/g, '') || `f${Date.now()}`;
    const saved: Food = { ...food, id: `custom:${docId}`, source: 'custom' };
    if (uid) {
      const { id, source, ...payload } = saved;
      await setDoc(doc(db, 'users', uid, 'custom_foods', docId), { ...payload, createdAt: Date.now() }, { merge: true });
    }
    return saved;
  };

  const deleteFood = async (id: string) => {
    if (!uid) return;
    await deleteDoc(doc(db, 'users', uid, 'custom_foods', id.replace(/^custom:/, '')));
  };

  return { foods, saveFood, deleteFood };
}
