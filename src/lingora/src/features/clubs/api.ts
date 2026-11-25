import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { communityKeys } from '@/features/community/api';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/providers/session-provider';

export type Club = {
  id: string;
  name: string;
  description: string;
  emoji: string;
  language_id: number | null;
  is_official: boolean;
  member_count: number;
  created_at: string;
  language: { name: string; flag_emoji: string | null } | null;
  isMember: boolean;
  role: 'owner' | 'member' | null;
};

export const clubKeys = {
  all: ['clubs'] as const,
  list: (userId: string) => ['clubs', 'list', userId] as const,
  detail: (clubId: string, userId: string) => ['clubs', 'detail', clubId, userId] as const,
};

const COLUMNS = 'id, name, description, emoji, language_id, is_official, member_count, created_at, ' +
  'language:languages!clubs_language_id_fkey(name, flag_emoji)';

type ClubRow = Omit<Club, 'isMember' | 'role'>;

async function membershipMap(userId: string) {
  const { data, error } = await supabase.from('club_members').select('club_id, role').eq('user_id', userId);
  if (error) throw error;
  return new Map((data ?? []).map((row) => [row.club_id, row.role as 'owner' | 'member']));
}

export function useClubs() {
  const { user } = useSession();
  return useQuery({
    queryKey: clubKeys.list(user?.id ?? ''),
    enabled: !!user,
    queryFn: async (): Promise<Club[]> => {
      const [clubs, memberships] = await Promise.all([
        supabase.from('clubs').select(COLUMNS)
          .order('is_official', { ascending: false })
          .order('member_count', { ascending: false })
          .limit(100),
        membershipMap(user!.id),
      ]);
      if (clubs.error) throw clubs.error;
      return ((clubs.data ?? []) as unknown as ClubRow[]).map((club) => ({
        ...club,
        isMember: memberships.has(club.id),
        role: memberships.get(club.id) ?? null,
      }));
    },
  });
}

export function useClub(clubId: string | undefined) {
  const { user } = useSession();
  return useQuery({
    queryKey: clubKeys.detail(clubId ?? '', user?.id ?? ''),
    enabled: !!user && !!clubId,
    queryFn: async (): Promise<Club> => {
      const [club, membership] = await Promise.all([
        supabase.from('clubs').select(COLUMNS).eq('id', clubId!).maybeSingle(),
        supabase.from('club_members').select('role').eq('club_id', clubId!).eq('user_id', user!.id).maybeSingle(),
      ]);
      if (club.error) throw club.error;
      if (membership.error) throw membership.error;
      if (!club.data) throw new Error('This club no longer exists.');
      return {
        ...(club.data as unknown as ClubRow),
        isMember: !!membership.data,
        role: (membership.data?.role as Club['role']) ?? null,
      };
    },
  });
}

function useInvalidateClubs() {
  const client = useQueryClient();
  return () => {
    void client.invalidateQueries({ queryKey: clubKeys.all });
    void client.invalidateQueries({ queryKey: communityKeys.feeds() });
  };
}

export function useJoinClub() {
  const invalidate = useInvalidateClubs();
  return useMutation({
    mutationFn: async ({ clubId, join }: { clubId: string; join: boolean }) => {
      const { error } = join
        ? await supabase.rpc('join_club', { p_club: clubId })
        : await supabase.rpc('leave_club', { p_club: clubId });
      if (error) throw new Error(error.message);
    },
    onSuccess: invalidate,
  });
}

export function useCreateClub() {
  const invalidate = useInvalidateClubs();
  return useMutation({
    mutationFn: async (input: { name: string; description: string; languageId: number | null; emoji: string }) => {
      const { data, error } = await supabase.rpc('create_club', {
        p_name: input.name,
        p_description: input.description,
        p_language_id: input.languageId as number,
        p_emoji: input.emoji,
      });
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: invalidate,
  });
}
