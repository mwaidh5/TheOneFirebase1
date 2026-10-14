import { useEffect, useMemo, useRef, useState } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

export interface GroceryItem {
  id: string;
  name: string;
}

interface GroceryState {
  custom: GroceryItem[];
  checked: string[];
}

/** Ticked-state keys: plan items by name, the athlete's own items by id. */
export const planItemKey = (name: string) => `plan:${name}`;
export const customItemKey = (id: string) => `custom:${id}`;

/**
 * The athlete's grocery list: their own items plus which items (plan-derived
 * and own) are ticked. One doc at users/{uid}/grocery/list so it survives
 * closing the sheet, reloading, and follows the athlete across devices.
 */
export function useGroceryList(uid: string | undefined) {
  const [state, setState] = useState<GroceryState>({ custom: [], checked: [] });
  // Latest state for back-to-back changes made before a re-render.
  const latest = useRef(state);
  latest.current = state;

  const ref = useMemo(() => (uid ? doc(db, 'users', uid, 'grocery', 'list') : null), [uid]);

  useEffect(() => {
    if (!ref) { setState({ custom: [], checked: [] }); return; }
    const unsub = onSnapshot(ref, (snap) => {
      const d = (snap.exists() ? snap.data() : {}) as Partial<GroceryState>;
      setState({ custom: d.custom ?? [], checked: d.checked ?? [] });
    }, () => {});
    return () => unsub();
  }, [ref]);

  const commit = (next: GroceryState) => {
    latest.current = next;
    setState(next);
    if (!ref) return;
    setDoc(ref, { ...next, updatedAt: Date.now() }, { merge: true }).catch(err => console.error('grocery list save', err));
  };

  const checked = useMemo(() => new Set(state.checked), [state.checked]);

  const toggle = (key: string) => {
    const cur = latest.current;
    const has = cur.checked.includes(key);
    commit({ ...cur, checked: has ? cur.checked.filter(k => k !== key) : [...cur.checked, key] });
  };

  const addItem = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const cur = latest.current;
    const id = `g${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
    commit({ ...cur, custom: [...cur.custom, { id, name: trimmed }] });
  };

  const removeItem = (id: string) => {
    const cur = latest.current;
    const key = customItemKey(id);
    commit({ custom: cur.custom.filter(i => i.id !== id), checked: cur.checked.filter(k => k !== key) });
  };

  /** Untick every plan item and drop the athlete's own items that were ticked. */
  const clearTicked = () => {
    const cur = latest.current;
    const done = new Set(cur.checked);
    commit({ custom: cur.custom.filter(i => !done.has(customItemKey(i.id))), checked: [] });
  };

  return { custom: state.custom, checked, toggle, addItem, removeItem, clearTicked };
}
