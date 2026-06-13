// Shared timer feedback: loud audio + haptics + native "done" notifications.
//
// Why a module-level AudioContext: creating a new one per beep (the old approach)
// starts each context in a *suspended* state on iOS, so the first tone is swallowed
// and the rest play quiet/late. One reused, resumed context is far louder and tighter.
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { LocalNotifications } from '@capacitor/local-notifications';

let _ctx: AudioContext | null = null;
let _master: GainNode | null = null;

function audio(): { ctx: AudioContext; master: GainNode } | null {
  try {
    const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!Ctx) return null;
    if (!_ctx) {
      _ctx = new Ctx();
      // A light limiter keeps the louder square-wave tones punchy without clipping.
      const comp = _ctx.createDynamicsCompressor();
      _master = _ctx.createGain();
      _master.gain.value = 1;
      _master.connect(comp);
      comp.connect(_ctx.destination);
    }
    if (_ctx.state === 'suspended') _ctx.resume();
    return { ctx: _ctx, master: _master! };
  } catch {
    return null;
  }
}

// Call once from a user gesture (e.g. tapping Start) so iOS unlocks audio output.
export function unlockAudio() {
  audio();
}

// A single tone. Square waves carry more harmonic energy than sine, so they read
// much louder at the same gain — exactly what a noisy gym needs.
function tone(freq: number, startOffset: number, dur: number, vol: number, type: OscillatorType = 'square') {
  const a = audio();
  if (!a) return;
  const { ctx, master } = a;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.connect(g);
  g.connect(master);
  o.type = type;
  o.frequency.value = freq;
  const at = ctx.currentTime + startOffset;
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(vol, at + 0.008); // fast attack = crisp
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  o.start(at);
  o.stop(at + dur + 0.05);
}

function haptic(kind: 'tick' | 'success') {
  if (!Capacitor.isNativePlatform()) return;
  try {
    if (kind === 'success') Haptics.notification({ type: NotificationType.Success });
    else Haptics.impact({ style: ImpactStyle.Heavy });
  } catch {}
}

export type BeepKind = 'countdown' | 'switch' | 'done';

// Loud, layered beeps + matching haptic. Volumes pushed near full; the limiter
// above prevents distortion when several oscillators overlap.
export function beep(kind: BeepKind) {
  if (kind === 'countdown') {
    tone(880, 0, 0.14, 0.9);
    haptic('tick');
  } else if (kind === 'switch') {
    tone(990, 0, 0.14, 0.9);
    tone(1245, 0.16, 0.14, 0.85);
    haptic('tick');
  } else {
    // "Done" fanfare — three rising tones, doubled with a sine for body.
    tone(880, 0, 0.18, 0.95);
    tone(880, 0, 0.18, 0.4, 'sine');
    tone(1175, 0.22, 0.18, 0.95);
    tone(1568, 0.46, 0.34, 0.95);
    tone(1568, 0.46, 0.34, 0.4, 'sine');
    haptic('success');
  }
}

// ── Native lock-screen / banner notifications ───────────────────────────────
let _notifReady: Promise<boolean> | null = null;

export function ensureNotifPermission(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return Promise.resolve(false);
  if (!_notifReady) {
    _notifReady = (async () => {
      try {
        let perm = await LocalNotifications.checkPermissions();
        if (perm.display !== 'granted') perm = await LocalNotifications.requestPermissions();
        return perm.display === 'granted';
      } catch {
        return false;
      }
    })();
  }
  return _notifReady;
}

let _notifId = 1;

// Fire a notification immediately. iOS plays the notification through the ringer/
// notification channel and shows it on the lock screen — visible even when the
// app is backgrounded or the media volume is low.
export async function notify(title: string, body: string) {
  if (!(await ensureNotifPermission())) return;
  try {
    await LocalNotifications.schedule({
      notifications: [
        {
          id: _notifId++,
          title,
          body,
          schedule: { at: new Date(Date.now() + 80) },
        },
      ],
    });
  } catch {}
}
