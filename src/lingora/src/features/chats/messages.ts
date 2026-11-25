import { useInfiniteQuery, useMutation, useQuery, useQueryClient, type InfiniteData } from '@tanstack/react-query';
import { useEffect } from 'react';

import { supabase } from '@/lib/supabase';
import { useSession } from '@/providers/session-provider';

import { chatKeys } from './api';

const PAGE_SIZE = 30;
const columns = 'id, conversation_id, sender_id, content, created_at, message_type, corrects_id';

export type ChatMessage = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string | null;
  message_type: string | null;
  corrects_id: string | null;
};

type MessageCursor = { time: string; id: string };
type Pages = InfiniteData<ChatMessage[], MessageCursor | null>;

/** Messages newest first, 30 per page. Older pages load with a created_at cursor. */
export function useMessages(conversationId: string | undefined) {
  const { user } = useSession();
  return useInfiniteQuery({
    queryKey: chatKeys.messages(conversationId ?? ''),
    enabled: !!user && !!conversationId,
    initialPageParam: null as MessageCursor | null,
    queryFn: async ({ pageParam }) => {
      let query = supabase.from('messages').select(columns)
        .eq('conversation_id', conversationId!)
        .order('created_at', { ascending: false, nullsFirst: false })
        .order('id', { ascending: false })
        .limit(PAGE_SIZE);
      if (pageParam) query = query.or(`created_at.lt.${pageParam.time},and(created_at.eq.${pageParam.time},id.lt.${pageParam.id})`);
      const { data, error } = await query;
      if (error) throw error;
      return data as ChatMessage[];
    },
    getNextPageParam: (lastPage) => {
      const last = lastPage.at(-1);
      return lastPage.length === PAGE_SIZE && last?.created_at ? { time: last.created_at, id: last.id } : undefined;
    },
  });
}

function addMessage(client: ReturnType<typeof useQueryClient>, conversationId: string, message: ChatMessage) {
  client.setQueryData<Pages>(chatKeys.messages(conversationId), (current) => {
    if (!current) return current;
    if (current.pages.some((page) => page.some((item) => item.id === message.id))) return current;
    const [first = [], ...rest] = current.pages;
    return { ...current, pages: [[message, ...first], ...rest] };
  });
}

/** Live updates for new messages in this conversation. */
export function useMessageSubscription(conversationId: string | undefined, onIncoming: () => void) {
  const client = useQueryClient();
  useEffect(() => {
    if (!conversationId) return;
    const channel = supabase
      .channel(`chat-${conversationId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}`,
      }, (payload) => {
        addMessage(client, conversationId, payload.new as ChatMessage);
        onIncoming();
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [client, conversationId, onIncoming]);
}

export function useSendMessage(conversationId: string) {
  const { user } = useSession();
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (input: { content: string; correctsId?: string; type?: 'voice' | 'call' }) => {
      if (!user) throw new Error('You are not signed in.');
      const { data, error } = await supabase.from('messages').insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content: input.content,
        ...(input.correctsId ? { message_type: 'correction', corrects_id: input.correctsId } : {}),
        ...(input.type ? { message_type: input.type } : {}),
      }).select(columns).single();
      if (error) throw new Error(error.message);
      return data as ChatMessage;
    },
    onSuccess: (message) => {
      addMessage(client, conversationId, message);
      void client.invalidateQueries({ queryKey: chatKeys.list(user?.id ?? '') });
    },
  });
}

export function useMarkConversationRead(conversationId: string | undefined) {
  const { user } = useSession();
  const client = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!user || !conversationId) return;
      const { error } = await supabase.from('conversation_members')
        .update({ last_read_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .eq('user_id', user.id);
      if (error) throw error;
    },
    onSuccess: () => client.invalidateQueries({ queryKey: chatKeys.list(user?.id ?? '') }),
  });
}

export type ChatPartner = { id: string; name: string; avatar_url: string | null };

export function useChatPartner(conversationId: string | undefined) {
  const { user } = useSession();
  return useQuery({
    queryKey: [...chatKeys.all, 'partner', conversationId ?? ''],
    enabled: !!user && !!conversationId,
    queryFn: async (): Promise<ChatPartner | null> => {
      const { data, error } = await supabase.from('conversation_members')
        .select('user_id, profiles(full_name, username, avatar_url)')
        .eq('conversation_id', conversationId!)
        .neq('user_id', user!.id)
        .maybeSingle();
      if (error) throw error;
      if (!data?.profiles) return null;
      return {
        id: data.user_id,
        name: data.profiles.full_name || data.profiles.username || 'Lingora user',
        avatar_url: data.profiles.avatar_url,
      };
    },
  });
}

/** A snapshot of the read position before this chat was opened. */
export function useChatReadBoundary(conversationId: string) {
  const { user } = useSession();
  return useQuery({
    queryKey: [...chatKeys.all, 'read-boundary', conversationId, user?.id],
    enabled: !!user && !!conversationId,
    staleTime: Infinity,
    gcTime: 0,
    queryFn: async () => {
      const { data, error } = await supabase.from('conversation_members')
        .select('last_read_at').eq('conversation_id', conversationId).eq('user_id', user!.id).maybeSingle();
      if (error) throw error;
      return data?.last_read_at ?? null;
    },
  });
}
