import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';
import { useSession } from '@/providers/session-provider';

export type PlusTier = 'plus' | 'vip';

/** Active Lingora Plus / VIP memberships for the given users (for badges). */
export function usePlusTiers(userIds: string[]) {
  const { user } = useSession();
  const ids = [...new Set(userIds)].sort();
  return useQuery({
    queryKey: ['plus', ids],
    enabled: !!user && ids.length > 0,
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<Map<string, PlusTier>> => {
      const { data, error } = await supabase.from('plus_members')
        .select('user_id, tier, expires_at')
        .in('user_id', ids);
      if (error) throw error;
      const now = Date.now();
      return new Map((data ?? [])
        .filter((row) => !row.expires_at || new Date(row.expires_at).getTime() > now)
        .map((row) => [row.user_id, row.tier as PlusTier]));
    },
  });
}

/** Whether the signed-in person has an active Lingora Plus (or VIP) membership. */
export function useMyPlus() {
  const { user } = useSession();
  const query = useQuery({
    queryKey: ['plus', 'me', user?.id ?? ''],
    enabled: !!user && user.is_anonymous !== true,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase.from('plus_members')
        .select('tier, expires_at, source')
        .eq('user_id', user!.id)
        .maybeSingle();
      if (error) throw error;
      if (!data || (data.expires_at && new Date(data.expires_at).getTime() <= Date.now())) return null;
      return { tier: data.tier as PlusTier, expiresAt: data.expires_at, source: data.source };
    },
  });
  return { isPlus: !!query.data, membership: query.data ?? null, isLoading: query.isLoading, refetch: query.refetch };
}
