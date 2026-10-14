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
    out.push({ label: food.servingLabel || 'serving', ar: 'حصة', grams: food.servingGrams });
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
  return (data?.foods ?? []).filter(f => f && f.name);
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
