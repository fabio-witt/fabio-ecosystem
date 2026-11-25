import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';
import { useSession } from '@/providers/session-provider';

export type Chat = {
  id: string;
  partnerId: string;
  name: string;
  username: string;
  country: string;
  avatar_url: string | null;
  lastMessage: string;
  lastMessageTime: string;
  lastMessageMine: boolean;
  unreadCount: number;
};

export const chatKeys = {
  all: ['chats'] as const,
  list: (userId: string) => [...chatKeys.all, 'list', userId] as const,
  messages: (conversationId: string) => [...chatKeys.all, 'messages', conversationId] as const,
};

/** One database call: partner, last message and unread count per conversation. */
export async function fetchChats(userId: string): Promise<Chat[]> {
  const { data, error } = await supabase.rpc('get_my_chats');
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.conversation_id,
    partnerId: row.partner_id,
    name: row.partner_name,
    username: row.partner_username ?? '',
    country: row.partner_country ?? '',
    avatar_url: row.partner_avatar,
    lastMessage: !row.last_message
      ? 'Start your conversation!'
      : row.last_message_type === 'correction'
        ? `✏️ Correction: ${row.last_message}`
        : row.last_message_type === 'voice'
          ? '🎤 Voice message'
          : row.last_message_type === 'call'
            ? '📞 Video call'
            : row.last_message,
    lastMessageTime: row.last_message_at,
    lastMessageMine: row.last_sender_id === userId,
    unreadCount: row.unread_count,
  }));
}

export function useChats() {
  const { user } = useSession();
  const userId = user?.id;

  return useQuery({
    queryKey: chatKeys.list(userId ?? 'signed-out'),
    queryFn: () => fetchChats(userId!),
    // During sign-out the screen can render once more without a user.
    enabled: !!userId,
  });
}

/** Opens the existing 1:1 chat with a user, or creates it. Returns the conversation id. */
export function useStartConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (otherUserId: string) => {
      const { data, error } = await supabase.rpc('create_direct_conversation', {
        p_other_user_id: otherUserId,
      });

      if (error) throw error;
      if (!data) throw new Error('No conversation was returned.');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chatKeys.all });
    },
  });
}
