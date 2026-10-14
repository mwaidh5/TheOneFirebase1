import { onCall, HttpsError } from 'firebase-functions/v2/https';

// Meal photo -> list of foods with portion and macros, via Claude Haiku.
// Runs server-side so the Anthropic key never reaches the app; the client
// downscales the photo first, so requests stay small and quick.

const PHOTO_MODEL = 'claude-haiku-5-5';

const PROMPT = `You are a nutrition assistant looking at a photo of a meal.

List each distinct food item you can see. For each one estimate the portion in
grams and its macros for that portion (not per 100 g): kcal, protein, carbs,
fat and dietary fibre ("fiber", grams; 0 for meat, fish, eggs, dairy and oils).

- Only list food you can actually see. Never invent items.
- Estimate portions from visual cues: plate size, utensils, relative volume.
- "confidence": "high" if the food and portion are both clear, "medium" if the
  food is clear but the portion is a guess, "low" if even the food is unsure.
- Use plain, common food names (e.g. "Spaghetti with tomato sauce").
- If there is no food in the image, return an empty items array.`;

// Structured output: the API guarantees the reply matches this schema.
const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['items'],
  properties: {
    items: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['name', 'grams', 'kcal', 'protein', 'carbs', 'fat', 'fiber', 'confidence'],
        properties: {
          name: { type: 'string' },
          grams: { type: 'number' },
          kcal: { type: 'number' },
          protein: { type: 'number' },
          carbs: { type: 'number' },
          fat: { type: 'number' },
          fiber: { type: 'number' },
          confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
        },
      },
    },
  },
};

const MEDIA_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_BASE64 = 6_000_000; // ~4.5 MB image; the client sends ~150 KB

export const analyzeFoodPhoto = onCall(
  {
    region: 'me-central1',
    secrets: ['ANTHROPIC_API_KEY'],
    timeoutSeconds: 60,
    memory: '256MiB',
  },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Must be signed in.');

    const { image, mimeType } = (request.data ?? {}) as { image?: unknown; mimeType?: unknown };
    if (typeof image !== 'string' || !image || image.length > MAX_BASE64) {
      throw new HttpsError('invalid-argument', 'image must be base64 data under 4.5 MB.');
    }
    const mediaType = typeof mimeType === 'string' && MEDIA_TYPES.includes(mimeType) ? mimeType : 'image/jpeg';

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new HttpsError('internal', 'ANTHROPIC_API_KEY secret not configured.');

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: PHOTO_MODEL,
        max_tokens: 4096,
        // Recognition plus a small JSON list: no thinking, lowest effort.
        thinking: { type: 'disabled' },
        output_config: { effort: 'low', format: { type: 'json_schema', schema: SCHEMA } },
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mediaType, data: image } },
            { type: 'text', text: PROMPT },
          ],
        }],
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error('Anthropic', res.status, body.slice(0, 500));
      if (res.status === 429 || res.status === 529) {
        throw new HttpsError('resource-exhausted', 'The food scanner is busy — try again in a moment.');
      }
      throw new HttpsError('internal', 'Could not analyse that photo.');
    }

    const msg = await res.json() as { stop_reason?: string; content?: { type: string; text?: string }[]; usage?: unknown };
    if (msg.stop_reason === 'refusal') {
      throw new HttpsError('failed-precondition', 'That photo could not be analysed — try another one.');
    }
    const text = (msg.content ?? []).filter(b => b.type === 'text').map(b => b.text ?? '').join('');
    try {
      const parsed = JSON.parse(text) as { items?: unknown[] };
      return { items: Array.isArray(parsed.items) ? parsed.items : [] };
    } catch {
      console.error('Unparseable reply', msg.stop_reason, text.slice(0, 300));
      throw new HttpsError('internal', 'Could not read the result — try another photo.');
    }
  }
);
