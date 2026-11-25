// Remembers on this device that a user skipped onboarding, so Home does not
// keep sending them back. Completing onboarding (adding languages) also ends it.
const key = (userId: string) => 'lingora.onboarding.skipped.' + userId;

export function hasSkippedOnboarding(userId: string) {
  try {
    return globalThis.localStorage?.getItem(key(userId)) === '1';
  } catch {
    return false;
  }
}

export function skipOnboarding(userId: string) {
  try {
    globalThis.localStorage?.setItem(key(userId), '1');
  } catch {
    // Without storage the user simply sees onboarding again next time.
  }
}
