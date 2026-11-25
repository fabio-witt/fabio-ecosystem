import { supabase } from '@/lib/supabase';
import { t } from '@/lib/i18n';
import { useSession } from '@/providers/session-provider';
import { track } from '@/lib/insights';

/** True while someone uses Lingora without an account (anonymous sign-in). */
export function useIsGuest() {
  return useSession().user?.is_anonymous === true;
}

/** Starts a guest session. Returns an error message, or null on success. */
export async function startAsGuest(): Promise<string | null> {
  try {
    const { error } = await supabase.auth.signInAnonymously();
    if (!error) {
      track('guest_started');
      return null;
    }
    if (error.code === 'anonymous_provider_disabled' || /anonymous sign-ins are disabled/i.test(error.message)) {
      return t('Guest mode is not switched on yet. Please create a free account instead.');
    }
    if (error.status === 429 || /rate limit/i.test(error.message)) {
      return t('Too many guests started from this network. Please wait a moment and try again.');
    }
    return error.message;
  } catch {
    return t('No connection. Check your internet and try again.');
  }
}

/** Marks that the next email confirmation finishes a guest's account, so the app asks for a password. */
const setupKey = 'lingora.auth.account-setup';
export function markAccountSetup() {
  try { globalThis.localStorage?.setItem(setupKey, '1'); } catch { /* ignore */ }
}
export function takeAccountSetup() {
  let pending = false;
  try {
    pending = globalThis.localStorage?.getItem(setupKey) === '1';
    globalThis.localStorage?.removeItem(setupKey);
  } catch { /* ignore */ }
  return pending;
}
