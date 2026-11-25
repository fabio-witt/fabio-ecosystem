import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';
import { useSession } from '@/providers/session-provider';

export type LeagueRow = { user_id: string; name: string; username: string; avatar_url: string | null; weekly_xp: number; is_me: boolean };
export type Duel = {
  id: string; course_id: string; seed: number; challenger_id: string; opponent_id: string;
  challenger_name: string; opponent_name: string; challenger_score: number; opponent_score: number | null;
  created_at: string; completed_at: string | null;
};

export const socialKeys = {
  league: ['league'] as const,
  duels: ['duels'] as const,
  sharedStreak: (partner: string) => ['shared-streak', partner] as const,
};

/** League tiers by XP earned this week. */
export const tiers = [
  { id: 'diamond', name: 'Diamond league', icon: '💎', min: 500 },
  { id: 'gold', name: 'Gold league', icon: '🥇', min: 250 },
  { id: 'silver', name: 'Silver league', icon: '🥈', min: 100 },
  { id: 'bronze', name: 'Bronze league', icon: '🥉', min: 0 },
] as const;

export function tierFor(xp: number) {
  return tiers.find((tier) => xp >= tier.min) ?? tiers[tiers.length - 1];
}

export function nextTier(xp: number) {
  return [...tiers].reverse().find((tier) => tier.min > xp);
}

export function useWeeklyLeague() {
  const { user } = useSession();
  return useQuery({
    queryKey: socialKeys.league,
    enabled: !!user,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_weekly_league');
      if (error) throw error;
      return (data ?? []) as LeagueRow[];
    },
  });
}

export function useDuels() {
  const { user } = useSession();
  return useQuery({
    queryKey: socialKeys.duels,
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('list_my_duels');
      if (error) throw error;
      return (data ?? []) as Duel[];
    },
  });
}

export function useSharedStreak(partner: string | undefined) {
  const { user } = useSession();
  return useQuery({
    queryKey: socialKeys.sharedStreak(partner ?? ''),
    enabled: !!user && !!partner && partner !== user.id,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_shared_streak', { p_partner: partner! });
      if (error) throw error;
      return typeof data === 'number' ? data : 0;
    },
  });
}
