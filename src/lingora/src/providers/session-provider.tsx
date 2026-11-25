import type { Session, User } from '@supabase/supabase-js';
import { useQueryClient } from '@tanstack/react-query';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import { supabase } from '@/lib/supabase';
import { t } from '@/lib/i18n';

type SessionContextValue = {
  session: Session | null;
  user: User | null;
  /** True until the stored session has been read on app start. */
  isLoading: boolean;
};

const SessionContext = createContext<SessionContextValue | null>(null);

/**
 * Single source of truth for the signed-in user.
 * Screens read the user with useSession() instead of calling
 * supabase.auth.getUser() (which is a network request every time).
 */
export function SessionProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    supabase.auth.getSession().then(({ data, error }) => {
      if (!isMounted) return;
      if (error) console.warn('Could not restore session:', error.message);
      setSession(data.session);
      setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession);
      setIsLoading(false);

      // Never show one user's cached data to the next user.
      if (event === 'SIGNED_OUT') {
        queryClient.clear();
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [queryClient]);

  return (
    <SessionContext.Provider value={{ session, user: session?.user ?? null, isLoading }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const value = useContext(SessionContext);
  if (!value) {
    throw new Error(t("useSession must be used inside <SessionProvider>"));
  }
  return value;
}
