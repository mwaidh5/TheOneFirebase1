// Timer feedback: loud beeps (that play even when the iPhone is on silent) + haptics.
//
// The mute switch problem: WebAudio inside the WKWebView ignores the app's
// AVAudioSession category, so on iOS the beeps stayed silent whenever the
// ring/silent switch was on. We therefore play beeps through a tiny NATIVE
// plugin (SoundPlugin.swift) which uses AVAudioEngine on the app's `.playback`
// session — audible regardless of the mute switch. On the web we fall back to
// WebAudio so the browser build still beeps.
import { registerPlugin, Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

interface SoundPlugin {
  beep(opts: { kind: BeepKind }): Promise<void>;
}
const NativeSound = registerPlugin<SoundPlugin>('Sound');
const isNative = Capacitor.isNativePlatform();

export type BeepKind = 'countdown' | 'switch' | 'done';

// ── Web fallback (browser only) ─────────────────────────────────────────────
let _ctx: AudioContext | null = null;
let _master: GainNode | null = null;

function webAudio(): { ctx: AudioContext; master: GainNode } | null {
  try {
    const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!Ctx) return null;
    if (!_ctx) {
      _ctx = new Ctx();
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

function webTone(freq: number, startOffset: number, dur: number, vol: number, type: OscillatorType = 'square') {
  const a = webAudio();
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
  g.gain.exponentialRampToValueAtTime(vol, at + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  o.start(at);
  o.stop(at + dur + 0.05);
}

function webBeep(kind: BeepKind) {
  if (kind === 'countdown') {
    webTone(880, 0, 0.14, 0.9);
  } else if (kind === 'switch') {
    webTone(990, 0, 0.14, 0.9);
    webTone(1245, 0.16, 0.14, 0.85);
  } else {
    webTone(880, 0, 0.18, 0.95);
    webTone(1175, 0.22, 0.18, 0.95);
    webTone(1568, 0.46, 0.34, 0.95);
  }
}

// Call once from a user gesture (the Start tap) so the browser unlocks audio.
export function unlockAudio() {
  if (!isNative) webAudio();
}

function haptic(kind: 'tick' | 'success') {
  if (!isNative) return;
  try {
    if (kind === 'success') Haptics.notification({ type: NotificationType.Success });
    else Haptics.impact({ style: ImpactStyle.Heavy });
  } catch {}
}

// Loud beep + matching haptic. Native path plays through AVAudioEngine (silent-
// switch proof); web path uses WebAudio.
export function beep(kind: BeepKind) {
  if (isNative) {
    NativeSound.beep({ kind }).catch(() => {}); // native plugin owns the sound
  } else {
    webBeep(kind);
  }
  haptic(kind === 'done' ? 'success' : 'tick');
}
