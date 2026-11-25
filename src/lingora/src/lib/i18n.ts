/**
 * App language (English or German) for buttons, hints and messages.
 *
 * Texts are written in English in the code and wrapped in t(). The English
 * text is the key: src/i18n/de.ts maps it to German. A text without a German
 * entry simply stays English, so nothing breaks while translations grow.
 * Lesson content (rules, examples, exercises) is not translated here.
 */
import { useCallback, useSyncExternalStore } from 'react';

import { de } from '../i18n/de';

export type UiLanguage = 'en' | 'de';
export const uiLanguages: { id: UiLanguage; label: string }[] = [
  { id: 'en', label: 'English' },
  { id: 'de', label: 'Deutsch' },
];

const storageKey = 'lingora.ui.language';
const listeners = new Set<() => void>();
let memory: UiLanguage | null = null;

function deviceLanguage(): UiLanguage {
  try {
    const locale = Intl.DateTimeFormat().resolvedOptions().locale ?? '';
    return locale.toLowerCase().startsWith('de') || locale.toLowerCase().startsWith('gsw') ? 'de' : 'en';
  } catch {
    return 'en';
  }
}

export function getUiLanguage(): UiLanguage {
  if (memory) return memory;
  try {
    const saved = globalThis.localStorage?.getItem(storageKey);
    if (saved === 'en' || saved === 'de') return saved;
  } catch {
    // Fall back to the device language.
  }
  return deviceLanguage();
}

export function setUiLanguage(language: UiLanguage) {
  memory = language;
  try {
    globalThis.localStorage?.setItem(storageKey, language);
  } catch {
    // Applies for this session only.
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

/** Translates outside of components, e.g. in notifications. */
export function translate(text: string, vars?: Record<string, string | number>, language = getUiLanguage()) {
  const base = language === 'de' ? de[text] ?? text : text;
  if (!vars) return base;
  return base.replace(/\{(\w+)\}/g, (match, name: string) => (name in vars ? String(vars[name]) : match));
}

/**
 * Translates a UI text into the current app language. The root layout
 * remounts the app when the language changes, so plain calls stay current.
 */
export function t(text: string, vars?: Record<string, string | number>) {
  return translate(text, vars);
}

/** Current app language and t(), re-rendering when the language changes. */
export function useT() {
  const language = useSyncExternalStore(subscribe, getUiLanguage, getUiLanguage);
  const t = useCallback(
    (text: string, vars?: Record<string, string | number>) => translate(text, vars, language),
    [language],
  );
  return { t, language };
}
