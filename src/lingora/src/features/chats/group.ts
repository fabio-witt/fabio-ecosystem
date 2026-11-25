import { useMutation, useQuery } from '@tanstack/react-query';

import type { UserSummary } from '@/features/users/api';
import { supabase } from '@/lib/supabase';

export function useOpenClubChat() {
  return useMutation({
    mutationFn: async (clubId: string) => {
      const { data, error } = await supabase.rpc('open_club_chat', { p_club: clubId });
      if (error) throw error;
      return data as string;
    },
  });
}

/** Names and avatars of everyone in a group chat, to label messages. */
export function useGroupMembers(conversationId: string | undefined) {
  return useQuery({
    queryKey: ['group-members', conversationId],
    enabled: !!conversationId,
    queryFn: async () => {
      const { data, error } = await supabase.from('conversation_members')
        .select('user_id, profile:profiles!conversation_members_user_id_fkey(id, full_name, username, avatar_url, country)')
        .eq('conversation_id', conversationId!);
      if (error) throw error;
      return new Map((data ?? []).map((row) => [row.user_id, (row as unknown as { profile: UserSummary | null }).profile]));
    },
  });
}
