// Food lookup against Open Food Facts — a free, open database of ~3M products
// with barcodes and nutrition panels, no API key needed.
//
// Both calls go through Cloud Functions (see functions/src/foodSearch.ts),
// which normalise every product to per-100g macros before it reaches the app.
import { getApp } from 'firebase/app';
import { getFunctions, httpsCallable } from 'firebase/functions';

export interface Macros {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  /** Dietary fibre in grams. Optional: entries logged before fibre was tracked, and products whose label omits it, have none. */
  fiber?: number;
}

/** A way to measure a portion: 1 piece, 1 scoop, 1 ml… and its weight in grams. */
export interface Unit {
  label: string;
  ar?: string;
  grams: number;
}

export interface Food {
  id: string;                 // "off:<barcode>", "custom:<docId>" or "common:<id>"
  name: string;
  brand?: string;
  barcode?: string;
  per100: Macros;
  servingGrams?: number;      // product's own serving, when it declares one
  servingLabel?: string;      // e.g. "1 bar (40 g)"
  imageUrl?: string;
  /** Portions this food can be logged in. Falls back to grams/serving. */
  units?: Unit[];
  source: 'off' | 'custom' | 'common';
}

const GRAM: Unit = { label: 'g', ar: 'غرام', grams: 1 };

/**
 * The portions a food can be logged in. Packaged products rarely declare
 * anything but a serving, so they get serving + grams; generic foods carry
 * their own natural units (1 egg, 1 scoop, 1 slice).
 */
export function unitsFor(food: Food): Unit[] {
  if (food.units?.length) {
    return food.units.some(u => u.grams === 1 && u.label === 'g')
      ? food.units
      : [...food.units, GRAM];
  }
  const out: Unit[] = [];
  if (food.servingGrams && food.servingGrams > 0) {
    // Always 'serving': OFF's own serving text ("30 g", "1 bar (40 g)") reads badly
    // after a quantity ("1 30 g"); the grams are shown next to it anyway.
    out.push({ label: 'serving', ar: 'حصة', grams: food.servingGrams });
  }
  out.push(GRAM);
  return out;
}


/**
 * Search by name/brand.
 *
 * This goes through our `searchFoodDb` function rather than straight to Open
 * Food Facts: their full-text endpoint sends no CORS headers, the legacy
 * /cgi/ search answers 503 to anything with an Origin header, and the v2
 * `search_terms` parameter is silently ignored (it returns the same products
 * whatever you type). The function also sets the identifying User-Agent their
 * API policy asks for, which a browser cannot.
 */
export async function searchFoods(query: string, _signal?: AbortSignal): Promise<Food[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  const fns = getFunctions(getApp(), 'me-central1');
  const call = httpsCallable<{ query: string }, { foods: Food[] }>(fns, 'searchFoodDb', { timeout: 20000 });
  const { data } = await call({ query: q });
  return rankFoods((data?.foods ?? []).filter(f => f && f.name), q);
}

/**
 * Drop entries whose label can't be right, then order what's left so the
 * food you meant comes first.
 *
 * Plausibility: nothing exceeds 900 kcal/100 g (pure fat), and the stated
 * calories should roughly match the label's own macros (4/4/9). Entries that
 * fail are almost always kJ typed into the kcal field — "Saudi Dates,
 * 1,830 kcal/100 g".
 *
 * Ranking: in English the main noun is the last word ("pitted DATES",
 * "date SYRUP"), in Arabic the first ("تمر سعودي"). A result whose main noun is
 * the word searched for beats one that merely contains it, then shorter (more
 * generic) names win.
 */
export function rankFoods(foods: Food[], query: string): Food[] {
  const q = query.trim().toLowerCase();
  const arabic = /[\u0600-\u06FF]/.test(q);
  const isWord = (w: string) => w === q || w === q + 's' || w === q + 'es' || (q.endsWith('s') && w === q.slice(0, -1));

  const plausible = foods.filter(f => {
    const { kcal, protein, carbs, fat } = f.per100;
    if (kcal > 900) return false;
    const fromMacros = 4 * protein + 4 * carbs + 9 * fat;
    if (fromMacros > 0 && (kcal > fromMacros * 2 + 50 || kcal < fromMacros * 0.5 - 50)) return false;
    return true;
  });

  const seen = new Set<string>();
  const unique = plausible.filter(f => {
    const k = `${f.name.toLowerCase().trim()}|${(f.brand ?? '').toLowerCase().trim()}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });

  const score = (f: Food) => {
    const words = f.name.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(Boolean);
    const head = arabic ? words[0] : words[words.length - 1];
    if (head && isWord(head)) return 0;
    if (words.some(isWord)) return 1;
    if (words.some(w => w.startsWith(q))) return 2;
    return 3;
  };
  return unique
    .map((f, i) => ({ f, i, s: score(f) }))
    .sort((a, b) => a.s - b.s || a.f.name.length - b.f.name.length || a.i - b.i)
    .map(x => x.f);
}

/**
 * Look a product up by its barcode. Goes through the function for the same
 * reason as search: Open Food Facts serves CORS headers only intermittently,
 * so calling it from the browser works one minute and fails the next.
 * Returns null when the product isn't in the database.
 */
export async function lookupBarcode(code: string, _signal?: AbortSignal): Promise<Food | null> {
  const clean = code.replace(/\D/g, '');
  if (!clean) return null;
  const fns = getFunctions(getApp(), 'me-central1');
  const call = httpsCallable<{ barcode: string }, { food: Food | null }>(fns, 'lookupFoodBarcode', { timeout: 20000 });
  const { data } = await call({ barcode: clean });
  return data?.food ?? null;
}

/** Scale a food's per-100g macros to an actual portion. */
export function macrosFor(food: Food, grams: number): Macros {
  const k = grams / 100;
  const m: Macros = {
    kcal: Math.round(food.per100.kcal * k),
    protein: Math.round(food.per100.protein * k * 10) / 10,
    carbs: Math.round(food.per100.carbs * k * 10) / 10,
    fat: Math.round(food.per100.fat * k * 10) / 10,
  };
  if (typeof food.per100.fiber === 'number') m.fiber = Math.round(food.per100.fiber * k * 10) / 10;
  return m;
}
