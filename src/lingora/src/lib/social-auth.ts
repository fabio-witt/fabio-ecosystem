import { useQuery } from '@tanstack/react-query';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

import { confirmationRedirect } from './auth-redirect';
import { supabase } from './supabase';
import { t } from '@/lib/i18n';

export type SocialProvider = 'apple' | 'google';

// Lets a web auth popup hand its result back to the app window.
WebBrowser.maybeCompleteAuthSession();

/**
 * Which social logins are switched on in Supabase (Authentication → Sign In /
 * Providers). Buttons only show for enabled providers, so turning one on in
 * the dashboard is enough to make it appear in the app.
 */
export function useSocialProviders() {
  return useQuery({
    queryKey: ['auth-providers'],
    staleTime: 10 * 60 * 1000,
    queryFn: async () => {
      const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
      const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
      if (!url || !key) return { apple: false, google: false };
      const response = await fetch(`${url}/auth/v1/settings`, { headers: { apikey: key } });
      if (!response.ok) return { apple: false, google: false };
      const settings = await response.json() as { external?: Record<string, boolean> };
      return { apple: !!settings.external?.apple, google: !!settings.external?.google };
    },
  });
}

/**
 * Reads tokens or a code from an OAuth or email link and starts the session.
 * Returns the link type, e.g. "recovery" for a password reset link.
 */
export async function finishOAuth(url: string): Promise<string | null> {
  const query = new URL(url.replace(/^[a-z][a-z0-9+.-]*:\/\/\/?/i, 'https://app/')).searchParams;
  const fragment = new URLSearchParams(url.split('#')[1] ?? '');
  const failure = fragment.get('error_description') ?? query.get('error_description');
  if (failure) throw new Error(failure.replace(/\+/g, ' '));

  const code = query.get('code');
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) throw error;
    return query.get('type');
  }
  const access_token = fragment.get('access_token');
  const refresh_token = fragment.get('refresh_token');
  if (!access_token || !refresh_token) throw new Error(t("The sign-in did not return a session. Please try again."));
  const { error } = await supabase.auth.setSession({ access_token, refresh_token });
  if (error) throw error;
  return fragment.get('type');
}

/**
 * Signs in with Apple or Google. On the web the page moves to the provider
 * and comes back to /auth/callback. In the app a secure browser sheet opens
 * and the result is handled here. Returns false when the person cancelled.
 */
export async function signInWithProvider(provider: SocialProvider) {
  if (Platform.OS === 'web') {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: confirmationRedirect() },
    });
    if (error) throw error;
    return true;
  }

  const redirectTo = Linking.createURL('auth/callback');
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo, skipBrowserRedirect: true },
  });
  if (error) throw error;
  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type !== 'success') return false;
  await finishOAuth(result.url);
  return true;
}
