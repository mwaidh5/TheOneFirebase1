import { registerPlugin, Capacitor } from '@capacitor/core';

export interface WorkoutActivityPlugin {
  start(opts: { title: string; courseTitle: string; startTs: number }): Promise<{ id: string }>;
  end(): Promise<void>;
  isSupported(): Promise<{ supported: boolean }>;
}

const Plugin = registerPlugin<WorkoutActivityPlugin>('WorkoutActivity');

// Start the Lock-Screen / Dynamic Island training timer. No-op on web.
export async function startWorkoutActivity(opts: { title: string; courseTitle: string; startTs: number }): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await Plugin.start(opts);
  } catch (e) {
    console.warn('Live Activity start failed', e);
  }
}

// End the training timer. No-op on web.
export async function endWorkoutActivity(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await Plugin.end();
  } catch (e) {
    console.warn('Live Activity end failed', e);
  }
}
