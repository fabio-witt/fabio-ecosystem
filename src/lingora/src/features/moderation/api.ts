import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';
import { useSession } from '@/providers/session-provider';

export type Report = {
  id: number;
  created_at: string;
  target_kind: 'profile' | 'post' | 'comment' | 'message' | 'review' | 'forum_thread' | 'forum_reply';
  target_id: string;
  reason: string;
  evidence: Record<string, unknown> | null;
  reviewed_at: string | null;
  resolution: string | null;
  reporter_id: string;
  reporter_name: string;
  subject_id: string;
  subject_name: string;
  subject_report_count: number;
  subject_suspended_until: string | null;
};

export type ModerationAction = 'dismiss' | 'remove' | 'remove_and_suspend';

const keys = {
  admin: (userId: string) => ['moderation', 'admin', userId] as const,
  reports: (openOnly: boolean) => ['moderation', 'reports', openOnly] as const,
};

/** Whether the signed-in user may moderate. Decided by the server. */
export function useIsAdmin() {
  const { user } = useSession();
  return useQuery({
    queryKey: keys.admin(user?.id ?? ''),
    enabled: !!user,
    staleTime: 10 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('am_i_admin');
      if (error) return false;
      return data === true;
    },
  });
}

export function useReports(openOnly: boolean) {
  return useQuery({
    queryKey: keys.reports(openOnly),
    queryFn: async () => {
      const { data, error } = await supabase.rpc('admin_list_reports', { p_open_only: openOnly });
      if (error) throw new Error(error.message);
      return (data ?? []) as unknown as Report[];
    },
  });
}

export function useResolveReport() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (input: { reportId: number; action: ModerationAction; note?: string; days?: number }) => {
      const { error } = await supabase.rpc('admin_resolve_report', {
        p_report: input.reportId,
        p_action: input.action,
        p_note: input.note ?? '',
        p_days: input.days ?? 7,
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => client.invalidateQueries({ queryKey: ['moderation', 'reports'] }),
  });
}

export function useLiftSuspension() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase.rpc('admin_lift_suspension', { p_user: userId });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => client.invalidateQueries({ queryKey: ['moderation', 'reports'] }),
  });
}
