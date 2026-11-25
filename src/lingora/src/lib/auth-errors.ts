import { t } from './i18n';

type AuthLikeError = { message?: string; code?: string; status?: number; name?: string };

export type FriendlyError = { title: string; message: string; tone?: 'error' | 'info' };

/** Very small check so obvious typos are caught before anything is sent. */
export function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());
}

/** Usernames: 3–20 characters, lowercase letters, numbers, dot and underscore. */
export function usernameProblem(value: string) {
  const name = value.trim().toLowerCase();
  if (name.length < 3) return t('Use at least 3 characters.');
  if (name.length > 20) return t('Use at most 20 characters.');
  if (!/^[a-z0-9._]+$/.test(name)) return t('Use only letters, numbers, dots and underscores.');
  return null;
}

/** No answer from the server at all. Supabase also labels 502–504 as retryable, so check the status. */
function isNetworkProblem(error: AuthLikeError) {
  if (error.status && error.status > 0) return false;
  const text = `${error.name ?? ''} ${error.message ?? ''}`;
  return /Failed to fetch|Network request failed|NetworkError|AuthRetryableFetchError|Load failed/i.test(text);
}

function isTimeout(error: AuthLikeError) {
  return error.status === 502 || error.status === 503 || error.status === 504 || error.code === 'request_timeout'
    || /HTTP 50[234]|timed? ?out|deadline exceeded/i.test(error.message ?? '');
}

/**
 * Turns Supabase auth errors into short, helpful messages. Never shows raw
 * texts like "HTTP 504" to people.
 */
export function friendlyAuthError(error: unknown, action: 'sign-up' | 'login' | 'reset' | 'update'): FriendlyError {
  const e = (error ?? {}) as AuthLikeError;
  const code = e.code ?? '';
  const message = e.message ?? '';

  if (isTimeout(e)) {
    return action === 'login' || action === 'update'
      ? { title: t('The server is busy'), message: t('Please try again in a moment.') }
      : {
        title: t('We could not send the email'),
        message: action === 'sign-up'
          ? t('Our email service did not respond. Your account was not created yet. Please try again in a few minutes.')
          : t('Our email service did not respond. Please try again in a few minutes.'),
      };
  }
  if (isNetworkProblem(e)) {
    return { title: t('No connection'), message: t('Lingora could not reach the server. Check your internet connection and try again.') };
  }
  if (code === 'over_email_send_rate_limit' || /email rate limit/i.test(message)) {
    return { tone: 'info', title: t('Too many emails right now'), message: t('Please wait a few minutes and try again.') };
  }
  if (code === 'over_request_rate_limit' || /For security purposes, you can only request this after/i.test(message)) {
    const seconds = message.match(/after (\d+) seconds/)?.[1];
    return {
      tone: 'info',
      title: t('Please wait a moment'),
      message: seconds ? t('You can try again in {n} seconds.', { n: seconds }) : t('Please wait a few minutes and try again.'),
    };
  }
  if (code === 'user_already_exists' || code === 'email_exists' || /already registered/i.test(message)) {
    return { title: t('This email already has an account'), message: t('Log in instead, or use another email address.') };
  }
  if (code === 'email_address_invalid' || /invalid.*email|email.*invalid/i.test(message)) {
    return { title: t('Check your email address'), message: t('This email address does not look valid.') };
  }
  if (code === 'weak_password' || /password should|weak password/i.test(message)) {
    return { title: t('Choose a stronger password'), message: t('Use at least 8 characters with letters and numbers.') };
  }
  if (code === 'same_password') {
    return { title: t('Choose a new password'), message: t('The new password must be different from the old one.') };
  }
  if (code === 'invalid_credentials') {
    return { title: t('Login failed'), message: t('The email or password is not correct.') };
  }
  if (code === 'email_not_confirmed' || /not confirmed/i.test(message)) {
    return { tone: 'info', title: t('Please confirm your email first'), message: t('Open the confirmation link we sent you, then log in.') };
  }
  if (/Database error saving new user/i.test(message) || code === 'unexpected_failure') {
    return { title: t('Registration failed'), message: t('This username may already be taken. Please choose another one and try again.') };
  }
  return {
    title: action === 'sign-up' ? t('Registration failed') : action === 'login' ? t('Login failed') : t('Something went wrong'),
    message: t('Please try again. If it keeps happening, contact support.'),
  };
}
