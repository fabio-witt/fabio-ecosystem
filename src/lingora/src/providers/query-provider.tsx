import {
  QueryCache,
  QueryClient,
  QueryClientProvider,
  focusManager,
} from '@tanstack/react-query';
import { useEffect, useState, type ReactNode } from 'react';
import { AppState, Platform, type AppStateStatus } from 'react-native';

import { supabase } from '@/lib/supabase';

function isAuthError(error: unknown) {
  const e = (error ?? {}) as { status?: number; code?: string; message?: string };
  return e.status === 401 || e.code === 'PGRST301' || e.code === 'PGRST303' || /jwt/i.test(e.message ?? '');
}

let checkingSession = false;
async function recoverFromInvalidSession(error: unknown) {
  if (!isAuthError(error) || checkingSession) return;
  checkingSession = true;
  try {
    const { data } = await supabase.auth.getSession();
    if (!data.session) return;
    // getUser asks the server; the client refreshes the token first when it can.
    const { error: userError } = await supabase.auth.getUser();
    if (userError && userError.status !== undefined && userError.status >= 400 && userError.status < 500) {
      await supabase.auth.signOut({ scope: 'local' });
    }
  } catch {
    // Offline: keep the session and try again later.
  } finally {
    checkingSession = false;
  }
}

function createQueryClient() {
  return new QueryClient({
    // A 401 means the stored session is no longer valid (expired, or the
    // account was deleted). Check once and sign out instead of failing forever.
    queryCache: new QueryCache({ onError: (error) => void recoverFromInvalidSession(error) }),
    defaultOptions: {
      queries: {
        // Data counts as fresh for 30 s; switching tabs within that time
        // shows cached data instantly without a new request.
        staleTime: 30 * 1000,
        retry: (failures, error) => !isAuthError(error) && failures < 2,
      },
    },
  });
}

/** Caching, loading and error state for all server data in the app. */
export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(createQueryClient);

  // Refetch stale data when the app returns from the background.
  useEffect(() => {
    if (Platform.OS === 'web') return;

    const subscription = AppState.addEventListener('change', (status: AppStateStatus) => {
      focusManager.setFocused(status === 'active');
    });

    return () => subscription.remove();
  }, []);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
