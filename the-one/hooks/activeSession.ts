// Tracks the in-progress workout session globally (via localStorage) so the timer
// keeps counting across navigation and a "Resume training" button can reappear.
import { startWorkoutActivity, endWorkoutActivity } from './liveActivity';

export const ACTIVE_SESSION_KEY = 'theone_active_session';
export const MAX_SESSION_MS = 3 * 60 * 60 * 1000; // 3 hours -> auto-stop

export interface ActiveSession {
  courseId: string;
  courseTitle?: string;
  weekNumber: number;
  dayId: string;
  dayTitle?: string;
  startTs: number; // wall-clock ms when the session started
}

export function readActiveSession(): ActiveSession | null {
  try {
    const raw = localStorage.getItem(ACTIVE_SESSION_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as ActiveSession;
    if (!s || !s.courseId || !s.startTs) return null;
    // Expired (older than the 3h cap) -> treat as no active session.
    if (Date.now() - s.startTs >= MAX_SESSION_MS) return null;
    return s;
  } catch {
    return null;
  }
}

// Like readActiveSession but ignores the 3h expiry — used when returning to the
// workout page so an over-cap session can be finalized & logged on arrival.
export function readActiveSessionRaw(): ActiveSession | null {
  try {
    const raw = localStorage.getItem(ACTIVE_SESSION_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as ActiveSession;
    if (!s || !s.courseId || !s.startTs) return null;
    return s;
  } catch {
    return null;
  }
}

export function writeActiveSession(s: ActiveSession): void {
  try {
    localStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(s));
    window.dispatchEvent(new Event('theone-session-change'));
  } catch {}
  // Mirror to the iOS Lock-Screen / Dynamic Island live timer (no-op on web).
  startWorkoutActivity({ title: s.dayTitle || s.courseTitle || 'Workout', courseTitle: s.courseTitle || '', startTs: s.startTs });
}

export function clearActiveSession(): void {
  try {
    localStorage.removeItem(ACTIVE_SESSION_KEY);
    window.dispatchEvent(new Event('theone-session-change'));
  } catch {}
  endWorkoutActivity();
}
