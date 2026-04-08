
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

export type LogEventType =
  | 'USER_SIGNUP'
  | 'USER_LOGIN'
  | 'COURSE_ENROLL'
  | 'WORKOUT_COMPLETE'
  | 'CUSTOM_REQUEST'
  | 'CUSTOM_PROGRAM_SENT'
  | 'COURSE_CREATED'
  | 'COURSE_UPDATED'
  | 'USER_UPDATED'
  | 'SYSTEM';

export interface LogPayload {
  type: LogEventType;
  title: string;
  description: string;
  userId?: string;
  userName?: string;
  userEmail?: string;
  userAvatar?: string;
  meta?: Record<string, any>;
}

/**
 * Writes a structured event to the `system_logs` Firestore collection.
 * Fire-and-forget — errors are silently caught so they never break UX.
 */
export async function logEvent(payload: LogPayload): Promise<void> {
  try {
    await addDoc(collection(db, 'system_logs'), {
      ...payload,
      createdAt: serverTimestamp(),
    });
  } catch (e) {
    // Silent — logging must never break app flow
    console.warn('[logEvent] Failed to write log:', e);
  }
}
