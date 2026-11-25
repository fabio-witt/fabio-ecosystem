/**
 * Small sounds and vibrations that answer every action in a lesson,
 * like a game: a click when you pick something, a bright double tone for
 * a right answer, a low tone for a wrong one and a short tune at the end.
 *
 * The tones are generated in the browser (Web Audio), so no sound files
 * are needed. On phones the app vibrates lightly instead. Both can be
 * switched off in the settings.
 */
import * as Haptics from 'expo-haptics';
import { useSyncExternalStore } from 'react';
import { Platform } from 'react-native';

export type FeedbackKind =
  | 'tap' | 'ok' | 'bad' | 'win' | 'combo'
  | 'flip' | 'star' | 'heart' | 'refund' | 'unlock' | 'chest' | 'levelup' | 'perfect' | 'whoosh';

/** One step of a sound: one or more notes (Hz) played together for some seconds. */
type Step = [frequencies: number | number[], seconds: number];

// Notes: C5 523, E5 659, G5 784, A5 880, C6 1047, E6 1319, G6 1568.
const tones: Record<FeedbackKind, Step[]> = {
  tap: [[440, 0.035]],
  flip: [[587, 0.03], [784, 0.04]],
  ok: [[[659, 988], 0.08], [[880, 1319], 0.16]],
  bad: [[[233, 349], 0.12], [[196, 294], 0.2]],
  combo: [[784, 0.06], [988, 0.06], [1175, 0.06], [[1568, 1976], 0.18]],
  star: [[[1319, 1976], 0.12]],
  heart: [[392, 0.08], [311, 0.16]],
  refund: [[523, 0.06], [784, 0.06], [[1047, 1319], 0.14]],
  unlock: [[659, 0.05], [988, 0.05], [[1319, 1661, 1976], 0.22]],
  chest: [[523, 0.05], [659, 0.05], [784, 0.05], [1047, 0.05], [[1319, 1568, 2093], 0.3]],
  win: [[523, 0.1], [659, 0.1], [784, 0.1], [[1047, 1319, 1568], 0.32]],
  levelup: [[392, 0.08], [523, 0.08], [659, 0.08], [784, 0.08], [[1047, 1319, 1568, 2093], 0.4]],
  perfect: [[784, 0.07], [1047, 0.07], [1319, 0.07], [1568, 0.07], [[2093, 2637], 0.35]],
  whoosh: [[[180, 360], 0.12]],
};

// ---- On / off setting, remembered on this device ------------------------

const KEY = 'lingora.sound';
const listeners = new Set<() => void>();
let memory: boolean | null = null;

function readEnabled(): boolean {
  if (memory !== null) return memory;
  try {
    const raw = globalThis.localStorage?.getItem(KEY);
    if (raw === '0') return false;
  } catch { /* Storage blocked: default on. */ }
  return true;
}

export function setSoundEnabled(on: boolean) {
  memory = on;
  try { globalThis.localStorage?.setItem(KEY, on ? '1' : '0'); } catch { /* Keep it in memory. */ }
  listeners.forEach((listener) => listener());
}

/** True when sounds and vibration are on; re-renders when it changes. */
export function useSoundEnabled() {
  return useSyncExternalStore(
    (listener) => { listeners.add(listener); return () => { listeners.delete(listener); }; },
    readEnabled,
    () => true,
  );
}

// ---- Playing ------------------------------------------------------------

type AudioCtx = { currentTime: number; destination: unknown; state?: string; resume?: () => Promise<void>;
  createOscillator: () => any; createGain: () => any };
let audio: AudioCtx | null = null;

function context(): AudioCtx | null {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return null;
  const Ctor = (window as any).AudioContext ?? (window as any).webkitAudioContext;
  if (!Ctor) return null;
  audio = audio ?? new Ctor();
  if (audio?.state === 'suspended') void audio.resume?.();
  return audio;
}

function vibrate(kind: FeedbackKind) {
  if (Platform.OS === 'web') return;
  const run = kind === 'bad' || kind === 'heart'
    ? Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
    : kind === 'tap' || kind === 'flip' || kind === 'whoosh'
      ? Haptics.selectionAsync()
      : kind === 'star'
        ? Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
        : kind === 'chest' || kind === 'levelup' || kind === 'perfect'
          ? Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)
          : Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  void run.catch(() => {});
}

/**
 * Plays the sound (web) or vibration (phone) for an action. `rise` lifts the
 * pitch by that many semitones (up to 7), so a long combo sounds brighter.
 */
export function feedback(kind: FeedbackKind, rise = 0) {
  const lift = Math.pow(2, Math.min(Math.max(rise - 1, 0), 7) / 12);
  if (!readEnabled()) return;
  vibrate(kind);
  try {
    const ctx = context();
    if (!ctx) return;
    let start = ctx.currentTime + 0.01;
    const soft = kind === 'tap' || kind === 'flip';
    const level = soft ? 0.05 : kind === 'whoosh' ? 0.04 : 0.1;
    for (const [notes, seconds] of tones[kind]) {
      const chord = Array.isArray(notes) ? notes : [notes];
      for (const frequency of chord) {
        // A soft attack and a long tail sound like a bell instead of a beep;
        // a quiet octave on top makes the tone brighter.
        for (const [type, multiple, share] of [['sine', 1, 1], ['triangle', 2, 0.25]] as const) {
          const oscillator = ctx.createOscillator();
          const gain = ctx.createGain();
          oscillator.type = kind === 'bad' || kind === 'heart' ? 'triangle' : type;
          oscillator.frequency.value = frequency * multiple * lift;
          const peak = (level * share) / chord.length;
          gain.gain.setValueAtTime(0.0001, start);
          gain.gain.exponentialRampToValueAtTime(peak, start + 0.012);
          gain.gain.exponentialRampToValueAtTime(0.0001, start + seconds * 1.6);
          oscillator.connect(gain);
          gain.connect(ctx.destination);
          oscillator.start(start);
          oscillator.stop(start + seconds * 1.7);
        }
      }
      start += seconds * 0.85;
    }
  } catch { /* Sound is a bonus, never an error. */ }
}
