/**
 * Remembers that the current sign-in came from a password reset link. Signing
 * in rebuilds the navigation, so the redirect to /reset-password happens after
 * that, in the root layout.
 */
const key = 'lingora.auth.recovery';
let memory = false;

export function markPasswordRecovery() {
  memory = true;
  try { globalThis.localStorage?.setItem(key, '1'); } catch { /* memory is enough */ }
}

export function takePasswordRecovery() {
  let pending = memory;
  try { pending = pending || globalThis.localStorage?.getItem(key) === '1'; } catch { /* ignore */ }
  memory = false;
  try { globalThis.localStorage?.removeItem(key); } catch { /* ignore */ }
  return pending;
}

/** True when a link URL is a password reset link. */
export function isRecoveryLink(url: string) {
  return /[?#&]type=recovery\b/.test(url);
}
