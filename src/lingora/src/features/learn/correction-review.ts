import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';
import { useSession } from '@/providers/session-provider';

const key = (userId?: string) => ['correction-cards', userId] as const;

export function useCorrectionCards() {
  const { user } = useSession();
  return useQuery({
    queryKey: key(user?.id),
    enabled: !!user,
    refetchInterval: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('list_correction_cards');
      if (error) throw new Error(error.message);
      return data;
    },
  });
}

export function useCorrectionAction() {
  const { user } = useSession();
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; action: 'save' | 'remove' } | { id: string; action: 'review'; remembered: boolean }) => {
      const args = { p_correction_id: input.id };
      const { error } = input.action === 'review'
        ? await supabase.rpc('review_correction_card', { ...args, p_remembered: input.remembered })
        : await supabase.rpc(input.action === 'save' ? 'save_correction_card' : 'remove_correction_card', args);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => client.invalidateQueries({ queryKey: key(user?.id) }),
  });
}
