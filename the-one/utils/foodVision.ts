// Photo → food estimate, via the Firebase AI (Gemini) that the app already uses.
// Flash rather than Pro: this is image recognition with a small JSON answer, so
// it is the faster and cheaper of the two and the quality difference is noise.
import { getGenerativeModel } from 'firebase/ai';
import { aiService } from '../firebase';

export interface GuessedFood {
  name: string;
  grams: number;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  confidence: 'high' | 'medium' | 'low';
}

const visionModel = getGenerativeModel(aiService, {
  model: 'gemini-2.5-flash',
  generationConfig: {
    responseMimeType: 'application/json',
    temperature: 0.2,
    maxOutputTokens: 2048,
  },
});

const PROMPT = `You are a nutrition assistant looking at a photo of a meal.

List each distinct food item you can see on the plate. For each one estimate the
portion in grams and its macros for that portion (not per 100g).

Rules:
- Only list food you can actually see. Never invent items.
- Estimate portions from visual cues (plate size, utensils, relative volume).
- Give "confidence": "high" if the food and portion are both clear, "medium" if
  the food is clear but the portion is a guess, "low" if even the food is unsure.
- If the image contains no food at all, return an empty array.

Respond with JSON only, in exactly this shape:
{"items":[{"name":"Grilled chicken breast","grams":180,"kcal":297,"protein":56,"carbs":0,"fat":6.5,"confidence":"high"}]}`;

const clampNum = (v: unknown, max: number): number => {
  const n = typeof v === 'number' ? v : parseFloat(String(v ?? ''));
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.round(Math.min(n, max) * 10) / 10;
};

/** Identify the foods in a meal photo. `base64` must be the raw data, no data: prefix. */
export async function analyzePlate(base64: string, mimeType: string): Promise<GuessedFood[]> {
  const result = await visionModel.generateContent([
    { inlineData: { data: base64, mimeType } },
    { text: PROMPT },
  ]);

  const raw = result.response.text();
  let parsed: { items?: unknown[] };
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('Could not read the result — try another photo.');
  }

  const items = Array.isArray(parsed.items) ? parsed.items : [];
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
        confidence: conf,
      };
    })
    .filter((f): f is GuessedFood => f !== null);
}

/** Read a File (camera capture or picked image) into base64 for the model. */
export function fileToBase64(file: File): Promise<{ base64: string; mimeType: string }> {
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
