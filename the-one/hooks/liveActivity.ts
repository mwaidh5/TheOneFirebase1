import { registerPlugin, Capacitor } from '@capacitor/core';

export interface WorkoutActivityPlugin {
  start(opts: { title: string; courseTitle: string; startTs: number }): Promise<{ id: string }>;
  end(): Promise<void>;
  isSupported(): Promise<{ supported: boolean }>;
}

const Plugin = registerPlugin<WorkoutActivityPlugin>('WorkoutActivity');

// Last known status of the Lock-Screen / Dynamic Island timer, so the UI can
// show WHY it isn't appearing (the errors used to be swallowed to the console,
// which is invisible on a real iPhone).
export type LiveActivityStatus =
  | { state: 'idle' }
  | { state: 'web' }               // running in a browser, not the native app
  | { state: 'active'; id: string }
  | { state: 'unsupported' }       // device/OS can't do Live Activities
  | { state: 'error'; reason: string };

let lastStatus: LiveActivityStatus = { state: 'idle' };

export function getLiveActivityStatus(): LiveActivityStatus {
  return lastStatus;
}

function setStatus(s: LiveActivityStatus) {
  lastStatus = s;
  try {
    window.dispatchEvent(new CustomEvent('theone-liveactivity-status', { detail: s }));
  } catch {}
}

// Start the Lock-Screen / Dynamic Island training timer. No-op on web.
export async function startWorkoutActivity(opts: { title: string; courseTitle: string; startTs: number }): Promise<LiveActivityStatus> {
  if (!Capacitor.isNativePlatform()) {
    setStatus({ state: 'web' });
    return lastStatus;
  }
  try {
    const { id } = await Plugin.start(opts);
    setStatus({ state: 'active', id });
  } catch (e: any) {
    const reason = (e && (e.message || e.errorMessage)) ? String(e.message || e.errorMessage) : 'Unknown error';
    // Map the plugin's known rejections to a cleaner state.
    if (/disabled/i.test(reason)) setStatus({ state: 'error', reason: 'Live Activities are turned off for this app (Settings → The One Training → Live Activities).' });
    else if (/16\.2|requires ios/i.test(reason)) setStatus({ state: 'unsupported' });
    else if (/not implemented|unimplemented|not available/i.test(reason)) setStatus({ state: 'error', reason: 'Live Activity plugin not found in this build.' });
    else setStatus({ state: 'error', reason });
    console.warn('Live Activity start failed:', reason);
  }
  return lastStatus;
}

// End the training timer. No-op on web.
export async function endWorkoutActivity(): Promise<void> {
  setStatus({ state: 'idle' });
  if (!Capacitor.isNativePlatform()) return;
  try {
    await Plugin.end();
  } catch (e) {
    console.warn('Live Activity end failed', e);
  }
}

// One-shot capability probe for the diagnostic UI.
export async function probeLiveActivity(): Promise<{ nativePlatform: boolean; supported: boolean; reason?: string }> {
  if (!Capacitor.isNativePlatform()) return { nativePlatform: false, supported: false, reason: 'Not running in the native app (web preview).' };
  try {
    const { supported } = await Plugin.isSupported();
    return { nativePlatform: true, supported, reason: supported ? undefined : 'Live Activities are disabled or unavailable on this device.' };
  } catch (e: any) {
    const reason = (e && (e.message || e.errorMessage)) ? String(e.message || e.errorMessage) : 'Plugin not found in this build.';
    return { nativePlatform: true, supported: false, reason };
  }
}
