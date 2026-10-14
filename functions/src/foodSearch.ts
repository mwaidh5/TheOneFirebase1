import { onCall, HttpsError } from 'firebase-functions/v2/https';

// ─── Food lookup (Open Food Facts) ───────────────────────────────────────────
// Both of these are proxied through functions rather than called from the app,
// for three reasons found while building this:
//   1. Open Food Facts' full-text search host sends no CORS headers at all.
//   2. Their legacy /cgi/search.pl answers 503 to any request with an Origin.
//   3. Even the v2 API serves Access-Control-Allow-Origin only intermittently,
//      so a browser call succeeds once and fails the next minute.
// The server also sets the identifying User-Agent their API policy asks for,
// which a browser is not allowed to set.

interface OffHit {
  code?: string;
  product_name?: string | Record<string, string>;
  brands?: string | string[];
  serving_quantity?: number | string;
  serving_size?: string;
  image_small_url?: string;
  nutriments?: Record<string, unknown>;
}

interface Food {
  id: string;
  name: string;
  brand?: string;
  barcode?: string;
  per100: { kcal: number; protein: number; carbs: number; fat: number; fiber?: number };
  servingGrams?: number;
  servingLabel?: string;
  imageUrl?: string;
  source: 'off';
}

const UA = 'TheOneTraining/1.0 (https://theonefirebase1-42441499-db7a8.web.app)';
const FIELDS =
  'code,product_name,brands,nutriments,serving_quantity,serving_size,image_small_url';

function pickName(v: OffHit['product_name']): string {
  if (!v) return '';
  if (typeof v === 'string') return v.trim();
  return String(v.en || v.main || Object.values(v)[0] || '').trim();
}

function pickBrand(v: OffHit['brands']): string | undefined {
  if (!v) return undefined;
  const first = Array.isArray(v) ? v[0] : String(v).split(',')[0];
  return (first || '').trim() || undefined;
}

function toNum(v: unknown): number {
  const n = typeof v === 'number' ? v : parseFloat(String(v ?? ''));
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

/** Open Food Facts hit → the shape the app uses. Null when it isn't loggable. */
function toFood(h: OffHit): Food | null {
  const name = pickName(h.product_name);
  if (!name) return null;

  const n = h.nutriments ?? {};
  let kcal = toNum(n['energy-kcal_100g']);
  if (kcal <= 0) {
    const kj = toNum(n['energy-kj_100g']) || toNum(n['energy_100g']);
    kcal = kj > 0 ? kj / 4.184 : 0;
  }
  const per100: Food['per100'] = {
    kcal: Math.round(kcal),
    protein: Math.round(toNum(n['proteins_100g']) * 10) / 10,
    carbs: Math.round(toNum(n['carbohydrates_100g']) * 10) / 10,
    fat: Math.round(toNum(n['fat_100g']) * 10) / 10,
  };
  // Many OFF products have no fibre on their panel. Leave the key out then, so
  // the app can tell "unknown" apart from a real 0 g.
  const fiberRaw = n['fiber_100g'];
  if (fiberRaw !== undefined && fiberRaw !== null && fiberRaw !== '') {
    per100.fiber = Math.round(toNum(fiberRaw) * 10) / 10;
  }
  // A product with no nutrition panel is noise in a calorie logger.
  if (per100.kcal <= 0 && per100.protein <= 0 && per100.carbs <= 0 && per100.fat <= 0) {
    return null;
  }

  return {
    id: 'off:' + (h.code ?? name),
    name,
    brand: pickBrand(h.brands),
    barcode: h.code ? String(h.code) : undefined,
    per100,
    servingGrams: toNum(h.serving_quantity) || undefined,
    servingLabel: (h.serving_size ?? '').trim() || undefined,
    imageUrl: h.image_small_url || undefined,
    source: 'off',
  };
}

export const searchFoodDb = onCall(
  { region: 'me-central1', timeoutSeconds: 20, memory: '256MiB' },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Must be signed in.');

    const query = String((request.data as { query?: string })?.query ?? '').trim();
    if (query.length < 2) return { foods: [] };

    const url =
      'https://search.openfoodfacts.org/search?q=' +
      encodeURIComponent(query) +
      '&page_size=25&fields=' +
      FIELDS;

    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA } });
      if (!res.ok) throw new Error('search ' + res.status);
      const data = (await res.json()) as { hits?: OffHit[] };
      const foods = (data.hits ?? [])
        .map(toFood)
        .filter((f): f is Food => f !== null);
      return { foods };
    } catch (err) {
      console.error('Food search failed:', (err as Error).message);
      throw new HttpsError('unavailable', 'Food search is temporarily unavailable.');
    }
  }
);

export const lookupFoodBarcode = onCall(
  { region: 'me-central1', timeoutSeconds: 20, memory: '256MiB' },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Must be signed in.');

    const code = String((request.data as { barcode?: string })?.barcode ?? '').replace(/\D/g, '');
    if (!code) return { food: null };

    const url =
      'https://world.openfoodfacts.org/api/v2/product/' + code + '.json?fields=' + FIELDS;

    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA } });
      if (res.status === 404) return { food: null };
      if (!res.ok) throw new Error('lookup ' + res.status);
      const data = (await res.json()) as { product?: OffHit; code?: string };
      if (!data.product) return { food: null };
      return { food: toFood({ ...data.product, code: data.product.code ?? data.code ?? code }) };
    } catch (err) {
      console.error('Barcode lookup failed:', (err as Error).message);
      throw new HttpsError('unavailable', 'Barcode lookup is temporarily unavailable.');
    }
  }
);
