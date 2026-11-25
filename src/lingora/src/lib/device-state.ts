import { useCallback, useSyncExternalStore } from 'react';

const listeners = new Set<() => void>();
const fallbackStorage = new Map<string, string | null>();
const prefix = 'lingora.ux.';
const keyFor = (userId: string, feature: string) => `${prefix}${userId}.${feature}`;

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

function read(key: string) {
  if (fallbackStorage.has(key)) return fallbackStorage.get(key) ?? null;
  try { return globalThis.localStorage?.getItem(key) ?? null; } catch { return null; }
}

export function useDeviceState<T>(userId: string | undefined, feature: string, fallback: T) {
  const key = userId ? keyFor(userId, feature) : undefined;
  const snapshot = useSyncExternalStore(subscribe, () => key ? read(key) : null, () => null);
  let value = fallback;
  try { if (snapshot !== null) value = JSON.parse(snapshot) as T; } catch { /* Use fallback. */ }
  const write = useCallback((next: T | null | ((current: T | null) => T | null)) => {
    if (!key) return;
    let resolved: T | null;
    if (typeof next === 'function') {
      let current: T | null = null;
      try { const raw = read(key); if (raw !== null) current = JSON.parse(raw) as T; } catch { /* Ignore invalid state. */ }
      resolved = (next as (current: T | null) => T | null)(current);
    } else {
      resolved = next;
    }
    const raw = resolved === null ? null : JSON.stringify(resolved);
    try {
      const storage = globalThis.localStorage;
      if (raw === null) storage.removeItem(key);
      else storage.setItem(key, raw);
      fallbackStorage.delete(key);
    } catch { fallbackStorage.set(key, raw); }
    touch(key);
    listeners.forEach((listener) => listener());
    writeListeners.forEach((listener) => listener(key));
  }, [key]);
  return [value, write] as const;
}

// ---- Server sync support ------------------------------------------------
// Every write remembers when it happened, so the newest copy (device or
// server) wins when the app starts on another device.

const writeListeners = new Set<(key: string) => void>();
const stampKey = (key: string) => `${key}.at`;

function touch(key: string, at = Date.now()) {
  try { globalThis.localStorage?.setItem(stampKey(key), String(at)); } catch { fallbackStorage.set(stampKey(key), String(at)); }
}

/** Called after every local write with the storage key that changed. */
export function onDeviceStateWrite(listener: (key: string) => void) {
  writeListeners.add(listener);
  return () => { writeListeners.delete(listener); };
}

export function deviceStateKey(userId: string, feature: string) {
  return keyFor(userId, feature);
}

/** The stored JSON and when it was last written on this device (0 = never). */
export function readDeviceState(userId: string, feature: string) {
  const key = keyFor(userId, feature);
  return { raw: read(key), at: Number(read(stampKey(key)) ?? 0) || 0 };
}

/** Replaces the local copy with a newer one from the server, without echoing it back. */
export function replaceDeviceState(userId: string, feature: string, raw: string, at: number) {
  const key = keyFor(userId, feature);
  try {
    globalThis.localStorage?.setItem(key, raw);
    fallbackStorage.delete(key);
  } catch { fallbackStorage.set(key, raw); }
  touch(key, at);
  listeners.forEach((listener) => listener());
}

export function clearDeviceState(userId: string) {
  for (const key of fallbackStorage.keys()) if (key.startsWith(`${prefix}${userId}.`)) fallbackStorage.delete(key);
  try {
    const storage = globalThis.localStorage;
    const keys = Array.from({ length: storage.length }, (_, index) => storage.key(index));
    for (const key of keys) if (key?.startsWith(`${prefix}${userId}.`)) storage.removeItem(key);
  } catch { /* Device storage is optional. */ }
  listeners.forEach((listener) => listener());
}
