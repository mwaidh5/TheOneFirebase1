// Helpers for the AI course builder (protocol 2 of generateCourseWithClaude).
//
// What the model reads and writes is kept small, because the wait is almost
// all output tokens: it gets the program without ids or media URLs, and for
// an edit it returns only the days that changed. Ids and media are put back
// here by matching exercises by name, so progress keyed on exercise ids and
// attached videos survive an AI edit.
import type { DayProgram, Exercise, WeekProgram } from '../types';

export const AI_PROTOCOL = 2;

type Loose<T> = Partial<T> & Record<string, unknown>;

/** A day as the model returns it: no ids. */
export type AiDay = Loose<Omit<DayProgram, 'exercises'>> & { exercises?: Loose<Exercise>[] };
/** A week as the model returns it; `fullWeek` replaces every day of that week. */
export type AiWeek = Loose<Omit<WeekProgram, 'days'>> & { days?: AiDay[]; fullWeek?: boolean };
export interface AiResult { mode?: string; weeks?: AiWeek[] }

const MEDIA_KEYS = ['videoUrl', 'imageUrl', 'collaboratorId'] as const;

const newId = (prefix: string) => `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
const norm = (s: unknown) => String(s ?? '').trim().toLowerCase().replace(/\s+/g, ' ');

/** The program as the model sees it: no ids, no media, no empty fields. */
export function slimWeeks(weeks: WeekProgram[]): unknown[] {
  const clean = (o: Record<string, unknown>, drop: readonly string[]) => {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(o)) {
      if (drop.includes(k) || v === undefined || v === null || v === '') continue;
      out[k] = v;
    }
    return out;
  };
  return weeks.map(w => ({
    weekNumber: w.weekNumber,
    days: (w.days ?? []).map(d => ({
      dayNumber: d.dayNumber,
      title: d.title,
      exercises: (d.exercises ?? []).map(ex => {
        const e = clean(ex as unknown as Record<string, unknown>, ['id', ...MEDIA_KEYS]);
        if (ex.emomItems) e.emomItems = ex.emomItems.map(i => clean(i as unknown as Record<string, unknown>, ['id']));
        if (ex.forTimeItems) e.forTimeItems = ex.forTimeItems.map(i => clean(i as unknown as Record<string, unknown>, ['id']));
        return e;
      }),
    })),
  }));
}

/** True when there is a program worth sending as context (mirrors the server check). */
export function hasProgram(weeks?: WeekProgram[]): weeks is WeekProgram[] {
  return !!weeks?.length && !!weeks[0]?.days?.[0]?.exercises?.length;
}

const byWeek = (a: { weekNumber: number }, b: { weekNumber: number }) => a.weekNumber - b.weekNumber;
const byDay = (a: { dayNumber: number }, b: { dayNumber: number }) => a.dayNumber - b.dayNumber;

/**
 * Turn the model's reply into the full program to preview, plus which weeks
 * changed. "merge" patches days into the current program; anything else
 * replaces it.
 */
export function applyAiResult(
  current: WeekProgram[] | undefined,
  result: AiResult,
): { weeks: WeekProgram[]; merged: boolean; changed: number[] } {
  const patches = (result.weeks ?? []).filter(w => Number.isFinite(Number(w.weekNumber)));
  const base = current ?? [];
  const merged = result.mode === 'merge' && hasProgram(current);

  let weeks: WeekProgram[];
  if (merged) {
    weeks = base.map(w => ({ ...w, days: [...(w.days ?? [])] }));
    for (const patch of patches) {
      const num = Number(patch.weekNumber);
      const target = weeks.find(w => w.weekNumber === num);
      const days = (patch.days ?? []) as DayProgram[];
      if (!target) {
        weeks.push({ id: '', weekNumber: num, days: [...days] });
      } else if (patch.fullWeek) {
        target.days = [...days];
      } else {
        for (const day of days) {
          const i = target.days.findIndex(d => d.dayNumber === Number(day.dayNumber));
          if (i >= 0) target.days[i] = day; else target.days.push(day);
        }
      }
    }
  } else {
    weeks = patches.map(p => ({ id: '', weekNumber: Number(p.weekNumber), days: [...((p.days ?? []) as DayProgram[])] }));
  }

  weeks.sort(byWeek);
  for (const w of weeks) w.days.sort(byDay);
  return { weeks: reattach(weeks, base), merged, changed: patches.map(p => Number(p.weekNumber)) };
}

/**
 * Give every week/day/exercise an id and its media back. A day keeps the id of
 * the day it replaces; an exercise keeps the id (and video) of the same-named
 * exercise in that day; a new exercise borrows the video of any same-named
 * exercise elsewhere in the program. Items that already have an id are
 * untouched days, left exactly as they were.
 */
function reattach(weeks: WeekProgram[], current: WeekProgram[]): WeekProgram[] {
  const mediaByName = new Map<string, Exercise>();
  for (const w of current) for (const d of w.days ?? []) for (const ex of d.exercises ?? []) {
    const k = norm(ex.name);
    if (!mediaByName.has(k) && (ex.videoUrl || ex.imageUrl)) mediaByName.set(k, ex);
  }

  return weeks.map(w => {
    const oldWeek = current.find(o => o.weekNumber === w.weekNumber);
    return {
      ...w,
      id: w.id || oldWeek?.id || newId('w'),
      days: w.days.map(d => {
        const oldDay = oldWeek?.days?.find(o => o.dayNumber === d.dayNumber);
        const pool = [...(oldDay?.exercises ?? [])];
        return {
          ...d,
          id: d.id || oldDay?.id || newId('d'),
          title: d.title || '',
          exercises: (d.exercises ?? []).map(ex => {
            if (ex.id) return ex;
            const at = pool.findIndex(o => norm(o.name) === norm(ex.name));
            const same = at >= 0 ? pool.splice(at, 1)[0] : undefined;
            const media = same ?? mediaByName.get(norm(ex.name));
            const out: Exercise = { ...ex, id: same?.id || newId('ex'), format: ex.format || 'REGULAR' };
            for (const k of MEDIA_KEYS) if (!out[k] && media?.[k]) out[k] = media[k];
            if (out.emomItems) out.emomItems = out.emomItems.map(i => ({ ...i, id: i.id || newId('em') }));
            if (out.forTimeItems) out.forTimeItems = out.forTimeItems.map(i => ({ ...i, id: i.id || newId('ft') }));
            return out;
          }),
        };
      }),
    };
  });
}

/** Rough live progress from the streamed JSON text: exercises and the week being written. */
export function streamProgress(text: string): { exercises: number; week: number | null } {
  const exercises = (text.match(/"format"\s*:/g) ?? []).length;
  const weeks = text.match(/"weekNumber"\s*:\s*(\d+)/g);
  const last = weeks?.[weeks.length - 1]?.match(/(\d+)$/);
  return { exercises, week: last ? Number(last[1]) : null };
}
