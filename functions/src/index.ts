import { onCall, HttpsError } from 'firebase-functions/v2/https';

interface Exercise {
  id?: string;
  name?: string;
  format?: string;
  supersetId?: string;
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
  /**
   * 2 = the client sends a slimmed program (no ids or media) and applies
   * day-level patches. App builds from before this send nothing and get the
   * original whole-week prompt, so they keep working.
   */
  protocol?: number;
}

const COURSE_MODEL = 'claude-sonnet-5-5';

/** Original prompt: whole weeks with ids. Kept for app builds that predate protocol 2. */
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

SUPERSETS (the app groups a superset by its supersetId, so every superset needs its own)
- A superset is 2 or more exercises done back to back. Each exercise in it has "format":"SUPER_SET" and the same "supersetId".
- Separate supersets in one day get separate letters in order of appearance: the first superset is "A", the second "B", the third "C". Start again at "A" on every day.
- Never give two different supersets the same letter, and never leave supersetId off a SUPER_SET exercise: back-to-back supersets without distinct letters merge into one.
- List the exercises of one superset next to each other.
- Read all the usual notations: "A1/A2, B1/B2", "superset X with Y", "X + Y superset", "X & Y (SS)", "2 supersets: X + Y, and Z + W". "A1 Squat, A2 Jump, B1 RDL, B2 Lunge" is two supersets, A and B. Drop the "A1"-style prefix from the exercise name.
- Exercises that are not part of a superset are not SUPER_SET and have no supersetId.
- When editing a day that already has supersets, keep their letters; a new superset takes the next free letter.
Example day: Bench Press 5x5, then superset incline DB press with cable fly 3x10, then superset lateral raise with face pull 3x15:
[{"name":"Bench Press","format":"REGULAR","sets":5,"reps":"5"},{"name":"Incline Dumbbell Press","format":"SUPER_SET","supersetId":"A","sets":3,"reps":"10"},{"name":"Cable Fly","format":"SUPER_SET","supersetId":"A","sets":3,"reps":"10"},{"name":"Lateral Raise","format":"SUPER_SET","supersetId":"B","sets":3,"reps":"15"},{"name":"Face Pull","format":"SUPER_SET","supersetId":"B","sets":3,"reps":"15"}]

SCHEMA:
interface Exercise { id: string; name: string; format: string; sets?: number; reps?: string; rest?: string; description?: string; supersetId?: string; durationMinutes?: number; rounds?: number; distance?: string; time?: string; }
interface DayProgram { id: string; dayNumber: number; title: string; exercises: Exercise[]; }
interface WeekProgram { id: string; weekNumber: number; days: DayProgram[]; }`;

/**
 * Protocol 2: no ids, and edits come back as only the days that changed.
 * Output length is what an edit waits on (thinking is off), so not re-writing
 * untouched days and ids is the speed-up.
 */
const SYSTEM_PROMPT_V2 = `You are an elite strength & conditioning coach. Turn workout instructions into a structured training program.

Reply with one minified JSON object and nothing else (no markdown, no commentary):
{"mode":"replace"|"merge","weeks":[...]}

WHEN THE USER MESSAGE INCLUDES A CURRENT PROGRAM
- "merge" for targeted changes (add a day to week 4, change week 2 day 3, add week 5, swap an exercise). Return only what changed:
  - For each week you touch: {"weekNumber":N,"days":[...]} with only the days you added or changed. Each returned day is complete (all its exercises, in order). Days you leave out stay exactly as they are.
  - If the change removes or renumbers days in a week, return that week with "fullWeek":true and all of its days.
  - A new week is returned whole.
- "replace" only for a brand-new program or a full overhaul; return every week.
- Anything you were not asked to change stays identical: same names, sets, reps, rest, notes, supersetId.
WHEN THERE IS NO CURRENT PROGRAM: always "replace".

FIELDS
- No "id" fields; the app assigns them.
- "format": one of REGULAR, EMOM, SUPER_SET, CIRCUIT, DROP_SET, AMRAP, FOR_TIME, HIIT, CARDIO, MAX_EFFORT. REGULAR for standard sets x reps; AMRAP when reps say AMRAP; MAX_EFFORT for 1RM/3RM tests.
- "sets" is a number. "reps" and "rest" are strings ("10", "5-8", "AMRAP"; "90s", "3 min").
- "description": a short coaching note, at most 12 words. No double quotes or newlines inside strings.
- Rest or recovery days: "title":"Rest Day" and an empty exercises array.
- Omit fields that do not apply.

SUPERSETS (the app groups a superset by its supersetId, so every superset needs its own)
- A superset is 2 or more exercises done back to back. Each exercise in it has "format":"SUPER_SET" and the same "supersetId".
- Separate supersets in one day get separate letters in order of appearance: the first superset is "A", the second "B", the third "C". Start again at "A" on every day.
- Never give two different supersets the same letter, and never leave supersetId off a SUPER_SET exercise: back-to-back supersets without distinct letters merge into one.
- List the exercises of one superset next to each other.
- Read all the usual notations: "A1/A2, B1/B2", "superset X with Y", "X + Y superset", "X & Y (SS)", "2 supersets: X + Y, and Z + W". "A1 Squat, A2 Jump, B1 RDL, B2 Lunge" is two supersets, A and B. Drop the "A1"-style prefix from the exercise name.
- Exercises that are not part of a superset are not SUPER_SET and have no supersetId.
- When editing a day that already has supersets, keep their letters; a new superset takes the next free letter.
Example day: Bench Press 5x5, then superset incline DB press with cable fly 3x10, then superset lateral raise with face pull 3x15:
[{"name":"Bench Press","format":"REGULAR","sets":5,"reps":"5"},{"name":"Incline Dumbbell Press","format":"SUPER_SET","supersetId":"A","sets":3,"reps":"10"},{"name":"Cable Fly","format":"SUPER_SET","supersetId":"A","sets":3,"reps":"10"},{"name":"Lateral Raise","format":"SUPER_SET","supersetId":"B","sets":3,"reps":"15"},{"name":"Face Pull","format":"SUPER_SET","supersetId":"B","sets":3,"reps":"15"}]

SCHEMA
Exercise {name, format, sets?, reps?, rest?, weight?, description?, durationMinutes?, rounds?, distance?, time?, workInterval?, restInterval?, supersetId?, emomItems?: {name, time}[], forTimeItems?: {name, reps}[]}
Day {dayNumber, title, exercises: Exercise[]}
Week {weekNumber, days: Day[], fullWeek?}`;

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
    ? `\n\nCURRENT PROGRAM (JSON):\n${JSON.stringify(data.currentWeeks)}`
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
      'anthropic-beta': 'server-side-fallback-2026-07-01',
    },
    body: JSON.stringify({
      model: COURSE_MODEL,
      // Room for a long multi-week program; 8k used to cut big courses off mid-JSON.
      max_tokens: 64000,
      stream: true,
      // Converting a program into JSON needs no deliberation, and thinking
      // tokens are pure wait before the first exercise streams.
      thinking: { type: 'between_tools' },
      output_config: { effort: 'medium' },
      // If a safety classifier declines, Anthropic re-runs on a fallback model.
      fallbacks: 'default',
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
      let event: any;
      try {
        event = JSON.parse(payload);
      } catch {
        continue; // partial line
      }
      if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
        const delta = event.delta.text as string;
        full += delta;
        onDelta(delta);
      } else if (event.type === 'message_start' && event.message?.usage) {
        const u = event.message.usage;
        console.log('Input tokens:', u.input_tokens, 'cache read:', u.cache_read_input_tokens ?? 0);
      } else if (event.type === 'message_delta') {
        console.log('Stop:', event.delta?.stop_reason, 'output tokens:', event.usage?.output_tokens);
        if (event.delta?.stop_reason === 'max_tokens') throw new Error('The program was too long to finish in one go — split it into fewer weeks.');
        if (event.delta?.stop_reason === 'refusal') throw new Error('Claude declined this request.');
      } else if (event.type === 'error') {
        throw new Error(`Anthropic stream error: ${event.error?.message ?? 'unknown'}`);
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
        data.protocol === 2 ? SYSTEM_PROMPT_V2 : STATIC_SYSTEM_PROMPT,
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

// Food search / barcode lookup (Open Food Facts proxy)
export { searchFoodDb, lookupFoodBarcode } from './foodSearch';

// Meal photo -> foods + macros (Claude Haiku)
export { analyzeFoodPhoto } from './foodPhoto';
