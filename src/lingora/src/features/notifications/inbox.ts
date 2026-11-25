import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useDeviceState } from '@/lib/device-state';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/providers/session-provider';

const key = (userId?: string) => ['activity-inbox', userId] as const;

export function useNotificationPreferences() {
  const { user } = useSession();
  return useDeviceState(user?.id, 'notifications', { messages: true, replies: true, reminderHour: null as number | null });
}

export function useActivityInbox() {
  const { user } = useSession();
  const [preferences] = useNotificationPreferences();
  return useQuery({
    queryKey: [...key(user?.id), preferences.messages, preferences.replies],
    enabled: !!user && (preferences.messages || preferences.replies),
    refetchInterval: 60_000,
    queryFn: async () => {
      const kinds = [preferences.messages && 'message', preferences.replies && 'reply', preferences.replies && 'forum'].filter(Boolean) as string[];
      const { data, error } = await supabase.from('activity_inbox').select('kind, target_id, updated_at, read_at')
        .eq('user_id', user!.id).in('kind', kinds).order('updated_at', { ascending: false }).limit(30);
      if (error) throw new Error(error.message);
      return data;
    },
  });
}

export function useReadInboxActivity() {
  const client = useQueryClient();
  const { user } = useSession();
  return useMutation({
    mutationFn: async ({ kind, targetId, updatedAt }: { kind: string; targetId: string; updatedAt: string }) => {
      const { error } = await supabase.from('activity_inbox').update({ read_at: new Date().toISOString() })
        .eq('user_id', user!.id).eq('kind', kind).eq('target_id', targetId).eq('updated_at', updatedAt);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => client.invalidateQueries({ queryKey: key(user?.id) }),
  });
}
