import * as Speech from 'expo-speech';
import { useSyncExternalStore } from 'react';

// Device voices per course: the preferred locale first, then fallbacks that
// still pronounce the language correctly. Swiss German has no system voice,
// so a Swiss (or any) German voice reads it and pronunciation is approximate.
const voices: Record<string, string[]> = {
  de: ['de-DE', 'de-AT', 'de-CH', 'de'],
  en: ['en-GB', 'en-US', 'en-AU', 'en'],
  es: ['es-ES', 'es-MX', 'es-US', 'es'],
  fr: ['fr-FR', 'fr-CH', 'fr-CA', 'fr'],
  it: ['it-IT', 'it'],
  ru: ['ru-RU', 'ru'],
  pl: ['pl-PL', 'pl'],
  gsw: ['de-CH', 'de-DE', 'de'],
  ga: ['ga-IE', 'ga'],
  pt: ['pt-PT', 'pt-BR', 'pt'],
  // Croatian; a Bosnian voice reads Croatian text correctly as well.
  sh: ['hr-HR', 'hr', 'bs-BA', 'bs'],
  id: ['id-ID', 'id'],
};

/** BCP 47 language tag of the course, for speech recognition. */
export function speechLocale(courseId: string): string | undefined {
  return voices[courseId]?.[0];
}

// ---- Which voices does this device have? --------------------------------

type Voice = { identifier: string; language: string; name: string };
let available: Voice[] | null = null;
const listeners = new Set<() => void>();

function normalize(tag: string) {
  return tag.replace('_', '-').toLowerCase();
}

async function loadVoices() {
  try {
    const list = await Speech.getAvailableVoicesAsync();
    available = list.map((voice) => ({ identifier: voice.identifier, language: voice.language, name: voice.name }));
  } catch {
    available = [];
  }
  listeners.forEach((listener) => listener());
}

// Browsers fill the voice list a moment after the page loads.
void loadVoices();
if (typeof window !== 'undefined' && window.speechSynthesis) {
  window.speechSynthesis.addEventListener?.('voiceschanged', () => void loadVoices());
}

/** The best installed voice for a course, never a voice of another language. */
function voiceFor(courseId: string): Voice | undefined {
  const wanted = voices[courseId];
  if (!wanted || !available) return undefined;
  for (const tag of wanted) {
    const target = normalize(tag);
    const exact = available.filter((voice) => normalize(voice.language) === target);
    const prefix = target.includes('-') ? [] : available.filter((voice) => normalize(voice.language).split('-')[0] === target);
    const match = [...exact, ...prefix];
    // Prefer higher-quality voices when the device offers several.
    const best = match.find((voice) => /enhanced|premium|natural|neural|google/i.test(voice.name)) ?? match[0];
    if (best) return best;
  }
  return undefined;
}

/**
 * True when this device can read the course language with a matching voice.
 * While the voice list is still loading it optimistically says yes.
 */
export function canSpeak(courseId: string) {
  if (!voices[courseId]) return false;
  if (available === null) return true;
  return !!voiceFor(courseId);
}

/** Re-renders when the voice list has loaded, for buttons that depend on canSpeak. */
export function useVoicesReady() {
  return useSyncExternalStore(
    (listener) => { listeners.add(listener); return () => { listeners.delete(listener); }; },
    () => available !== null,
    () => false,
  );
}

let requestId = 0;

export function stopSpeech() {
  requestId++;
  void Speech.stop().catch(() => {});
}

/**
 * Reads a word or sentence aloud with a voice of the course language.
 * If the device has no such voice it stays silent (and calls onError)
 * instead of reading the text with a wrong, e.g. English, voice.
 */
export function speak(text: string, courseId: string, onError?: () => void, rate = 0.9) {
  const tags = voices[courseId];
  if (!tags) return;
  const id = ++requestId;
  const notifyError = () => {
    if (requestId === id) onError?.();
  };
  const run = () => {
    const voice = voiceFor(courseId);
    if (!voice) {
      notifyError();
      return;
    }
    // Strip articles in brackets and alternatives like "grüezi / hoi" -> read both.
    const clean = text.replace(/\(.*?\)/g, '').replace(/\s*\/\s*/g, ', ').trim();
    void Speech.stop().then(() => {
      if (requestId === id) Speech.speak(clean, { language: voice.language, voice: voice.identifier, rate, onError: notifyError });
    }).catch(notifyError);
  };
  if (available === null) void loadVoices().then(run);
  else run();
}
