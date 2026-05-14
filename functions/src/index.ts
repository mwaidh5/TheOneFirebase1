import { onCall, HttpsError } from 'firebase-functions/v2/https';

interface Exercise {
  id?: string;
  name?: string;
  format?: string;
  sets?: number;
  reps?: string;
  rest?: string;
  description?: string;
  durationMinutes?: number;
  rounds?: number;
  distance?: string;
  time?: string;
}

interface DayProgram {
  id?: string;
  dayNumber?: number;
  title?: string;
  exercises?: Exercise[];
}

interface WeekProgram {
  id?: string;
  weekNumber?: number;
  days?: DayProgram[];
}

interface RequestData {
  text: string;
  context: 'course' | 'custom';
  currentWeeks?: WeekProgram[];
}

const STATIC_SYSTEM_PROMPT = `You are an elite strength & conditioning coach.

Convert workout instructions into a structured JSON response.

RESPONSE FORMAT — return a single JSON object:
{
  "mode": "replace" | "merge",
  "weeks": WeekProgram[]
}

MODE SELECTION (when there is an existing program in the user message):
- Use "mode": "merge" when the request targets specific weeks or days (e.g. "add a day to week 4", "change week 2 day 3"). Return ONLY the modified weeks — all other weeks are automatically preserved.
- Use "mode": "replace" only when the user wants a completely new program or full overhaul.
- For "merge": return the COMPLETE week data (all days) for any week that changed, not just the modified day.

MODE SELECTION (when there is no existing program):
- Always use "mode": "replace".

RULES:
- Return ONLY valid JSON, no markdown, no explanations.
- Every exercise must have a unique "id" (format: "ex_" + random 6 digits).
- Every day must have a unique "id" (format: "d_" + random 6 digits).
- Every week must have a unique "id" (format: "w_" + random 6 digits).
- "format" must be one of: REGULAR, EMOM, SUPER_SET, CIRCUIT, DROP_SET, AMRAP, FOR_TIME, HIIT, CARDIO, MAX_EFFORT
- Use REGULAR for standard sets/reps. Use AMRAP when reps say "AMRAP". Use MAX_EFFORT for 1RM/3RM.
- "reps" is always a string (e.g. "10", "AMRAP", "5-8").
- "rest" is always a string (e.g. "90s", "3 min", "2:00").
- "sets" is always a number.
- Add a brief "description" coaching note per exercise (1 sentence max). No double quotes inside strings — use single quotes. No newlines inside strings.
- Rest/Recovery days: empty exercises array, title "Rest Day".

SCHEMA:
interface Exercise { id: string; name: string; format: string; sets?: number; reps?: string; rest?: string; description?: string; durationMinutes?: number; rounds?: number; distance?: string; time?: string; }
interface DayProgram { id: string; dayNumber: number; title: string; exercises: Exercise[]; }
interface WeekProgram { id: string; weekNumber: number; days: DayProgram[]; }`;

function buildUserMessage(data: RequestData): string {
  const contextNote = data.context === 'custom'
    ? 'This is a bespoke program for a specific athlete. Be precise with coaching notes.'
    : 'This is a public course for multiple athletes. Keep descriptions general but motivating.';

  const hasExisting = !!(
    data.currentWeeks &&
    data.currentWeeks.length > 0 &&
    data.currentWeeks[0]?.days?.[0]?.exercises?.length
  );

  const currentProgramSection = hasExisting
    ? `\n\nCURRENT PROGRAM STATE (JSON):\n${JSON.stringify(data.currentWeeks, null, 2)}`
    : '';

  return `${contextNote}${currentProgramSection}\n\nINSTRUCTION:\n${data.text}\n\nReturn the JSON object:`;
}

async function streamAnthropic(
  apiKey: string,
  systemText: string,
  userText: string,
  onDelta: (text: string) => void
): Promise<string> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 8192,
      stream: true,
      system: [
        {
          type: 'text',
          text: systemText,
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: [{ role: 'user', content: userText }],
    }),
  });

  if (!response.ok || !response.body) {
    const errorText = await response.text();
    throw new Error(`Anthropic ${response.status}: ${errorText.slice(0, 500)}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let full = '';
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const payload = line.slice(6).trim();
      if (!payload || payload === '[DONE]') continue;
      try {
        const event = JSON.parse(payload);
        if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
          const delta = event.delta.text as string;
          full += delta;
          onDelta(delta);
        } else if (event.type === 'message_start' && event.message?.usage) {
          const u = event.message.usage;
          console.log('Cache hit:', u.cache_read_input_tokens ?? 0, 'cache write:', u.cache_creation_input_tokens ?? 0);
        }
      } catch {
        // ignore partial parse errors
      }
    }
  }

  return full;
}

export const generateCourseWithClaude = onCall(
  {
    region: 'me-central1',
    secrets: ['ANTHROPIC_API_KEY'],
    timeoutSeconds: 540,
    memory: '512MiB',
  },
  async (request, response) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Must be signed in.');
    }

    const data = request.data as RequestData;
    if (!data?.text || typeof data.text !== 'string') {
      throw new HttpsError('invalid-argument', 'text is required.');
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new HttpsError('internal', 'ANTHROPIC_API_KEY secret not configured.');
    }

    const userMessage = buildUserMessage(data);
    const canStream = request.acceptsStreaming === true && response !== undefined;

    try {
      const text = await streamAnthropic(
        apiKey,
        STATIC_SYSTEM_PROMPT,
        userMessage,
        (delta) => {
          if (canStream && response) {
            response.sendChunk({ delta });
          }
        }
      );
      return { text };
    } catch (err: any) {
      console.error('Anthropic call failed:', err.message);
      throw new HttpsError('internal', err.message);
    }
  }
);
