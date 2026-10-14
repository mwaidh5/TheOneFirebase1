// Photo → food estimate. The analyzeFoodPhoto function sends the photo to
// Claude Haiku server-side (the prompt and schema live there) and returns the
// items; this file shrinks the photo first and cleans up the numbers.
import { getApp } from 'firebase/app';
import { getFunctions, httpsCallable } from 'firebase/functions';

export interface GuessedFood {
  name: string;
  grams: number;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  /** Dietary fibre in grams for the estimated portion. */
  fiber: number;
  confidence: 'high' | 'medium' | 'low';
}

const clampNum = (v: unknown, max: number): number => {
  const n = typeof v === 'number' ? v : parseFloat(String(v ?? ''));
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.round(Math.min(n, max) * 10) / 10;
};

/** Identify the foods in a meal photo. `base64` must be the raw data, no data: prefix. */
export async function analyzePlate(base64: string, mimeType: string): Promise<GuessedFood[]> {
  const call = httpsCallable<{ image: string; mimeType: string }, { items?: unknown[] }>(
    getFunctions(getApp(), 'me-central1'), 'analyzeFoodPhoto', { timeout: 60000 },
  );
  let items: unknown[];
  try {
    const { data } = await call({ image: base64, mimeType });
    items = Array.isArray(data?.items) ? data.items : [];
  } catch (e) {
    const code = (e as { code?: string }).code ?? '';
    if (code.endsWith('unauthenticated')) throw new Error('Sign in again to scan food.');
    if (code.endsWith('resource-exhausted')) throw new Error('The food scanner is busy — try again in a moment.');
    throw new Error((e as Error).message || 'Could not analyse that photo.');
  }

  return items
    .map((it): GuessedFood | null => {
      const o = it as Record<string, unknown>;
      const name = String(o.name ?? '').trim();
      if (!name) return null;
      const conf = o.confidence === 'high' || o.confidence === 'low' ? o.confidence : 'medium';
      return {
        name,
        grams: clampNum(o.grams, 2000) || 100,
        kcal: Math.round(clampNum(o.kcal, 5000)),
        protein: clampNum(o.protein, 500),
        carbs: clampNum(o.carbs, 1000),
        fat: clampNum(o.fat, 500),
        fiber: clampNum(o.fiber, 300),
        confidence: conf,
      };
    })
    .filter((f): f is GuessedFood => f !== null);
}

const MAX_SIDE = 1280;

/**
 * Read a File (camera capture or picked image) into base64 for the model,
 * downscaled to at most 1280 px on the long side as a JPEG. Falls back to the
 * original bytes if the browser can't decode it.
 */
export async function fileToBase64(file: File): Promise<{ base64: string; mimeType: string }> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const w = Math.max(1, Math.round(bitmap.width * scale));
    const h = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('no canvas');
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close?.();
    const url = canvas.toDataURL('image/jpeg', 0.82);
    return { base64: url.slice(url.indexOf(',') + 1), mimeType: 'image/jpeg' };
  } catch {
    return readRaw(file);
  }
}

function readRaw(file: File): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read that image.'));
    reader.onload = () => {
      const url = String(reader.result || '');
      const comma = url.indexOf(',');
      resolve({ base64: url.slice(comma + 1), mimeType: file.type || 'image/jpeg' });
    };
    reader.readAsDataURL(file);
  });
}
