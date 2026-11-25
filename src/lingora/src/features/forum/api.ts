import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { UserSummary } from '@/features/users/api';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/providers/session-provider';

export const FORUM_TITLE_MAX = 140;
export const FORUM_TEXT_MAX = 5000;
export const FORUM_REPLY_MAX = 4000;
const PAGE = 20;

export const forumCategories = [
  { id: 'grammar', icon: '📐', label: 'Grammar' },
  { id: 'vocabulary', icon: '🗂', label: 'Vocabulary' },
  { id: 'pronunciation', icon: '🗣', label: 'Pronunciation' },
  { id: 'culture', icon: '🌍', label: 'Culture and life' },
  { id: 'methods', icon: '🧠', label: 'Learning tips' },
  { id: 'exchange', icon: '🤝', label: 'Find partners' },
  { id: 'offtopic', icon: '☕', label: 'Off-topic' },
] as const;
export type ForumCategory = typeof forumCategories[number]['id'];
export type ForumSort = 'active' | 'new' | 'top' | 'unanswered';

export type ForumThread = {
  id: string; user_id: string; category: ForumCategory; language_id: number | null;
  title: string; content: string; reply_count: number; score: number;
  accepted_reply_id: string | null; is_pinned: boolean; is_locked: boolean;
  created_at: string; last_activity_at: string;
  author: UserSummary | null;
  language: { name: string; flag_emoji: string | null; language_code: string | null } | null;
};
export type ForumReply = {
  id: string; thread_id: string; user_id: string; content: string; correction: string | null;
  score: number; created_at: string; author: UserSummary | null;
};

const AUTHOR = 'author:profiles!forum_threads_user_id_fkey(id, full_name, username, avatar_url, country)';
const LANGUAGE = 'language:languages!forum_threads_language_id_fkey(name, flag_emoji, language_code)';
const THREAD_COLUMNS = `id, user_id, category, language_id, title, content, reply_count, score, accepted_reply_id, is_pinned, is_locked, created_at, last_activity_at, ${AUTHOR}, ${LANGUAGE}`;

export const forumKeys = {
  all: ['forum'] as const,
  list: (filters: object) => ['forum', 'list', filters] as const,
  thread: (id: string) => ['forum', 'thread', id] as const,
  replies: (id: string) => ['forum', 'replies', id] as const,
  votes: (kind: string, ids: string[]) => ['forum', 'votes', kind, ids.join(',')] as const,
};

export type ForumFilters = { category?: ForumCategory; languageId?: number; sort: ForumSort; mine?: boolean; search?: string };

/** Threads, 20 at a time. Pinned ones stay on top in the "active" view. */
export function useThreads(filters: ForumFilters) {
  const { user } = useSession();
  return useInfiniteQuery({
    queryKey: forumKeys.list({ ...filters, user: user?.id }),
    enabled: !!user,
    initialPageParam: 0,
    getNextPageParam: (last: ForumThread[], pages) => last.length === PAGE ? pages.length * PAGE : undefined,
    queryFn: async ({ pageParam }) => {
      let query = supabase.from('forum_threads').select(THREAD_COLUMNS);
      if (filters.category) query = query.eq('category', filters.category);
      if (filters.languageId) query = query.eq('language_id', filters.languageId);
      if (filters.mine && user) query = query.eq('user_id', user.id);
      if (filters.sort === 'unanswered') query = query.eq('reply_count', 0);
      const term = filters.search?.trim().replace(/[%_,()]/g, ' ');
      if (term) query = query.or(`title.ilike.%${term}%,content.ilike.%${term}%`);
      if (filters.sort === 'active') query = query.order('is_pinned', { ascending: false }).order('last_activity_at', { ascending: false });
      else if (filters.sort === 'top') query = query.order('score', { ascending: false }).order('created_at', { ascending: false });
      else query = query.order('created_at', { ascending: false });
      const { data, error } = await query.range(pageParam, pageParam + PAGE - 1);
      if (error) throw error;
      return (data ?? []) as unknown as ForumThread[];
    },
  });
}

export function useThread(id: string | undefined) {
  return useQuery({
    queryKey: forumKeys.thread(id ?? ''),
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase.from('forum_threads').select(THREAD_COLUMNS).eq('id', id!).maybeSingle();
      if (error) throw error;
      return data as unknown as ForumThread | null;
    },
  });
}

export function useReplies(threadId: string | undefined) {
  return useQuery({
    queryKey: forumKeys.replies(threadId ?? ''),
    enabled: !!threadId,
    queryFn: async () => {
      const { data, error } = await supabase.from('forum_replies')
        .select('id, thread_id, user_id, content, correction, score, created_at, author:profiles!forum_replies_user_id_fkey(id, full_name, username, avatar_url, country)')
        .eq('thread_id', threadId!).order('created_at', { ascending: true }).limit(300);
      if (error) throw error;
      return (data ?? []) as unknown as ForumReply[];
    },
  });
}

/** My votes on a set of threads or replies: id → +1 / -1. */
export function useMyVotes(kind: 'thread' | 'reply', ids: string[]) {
  const { user } = useSession();
  return useQuery({
    queryKey: forumKeys.votes(kind, ids),
    enabled: !!user && ids.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase.from('forum_votes').select('target_id, value')
        .eq('user_id', user!.id).eq('target_kind', kind).in('target_id', ids);
      if (error) throw error;
      return Object.fromEntries((data ?? []).map((vote) => [vote.target_id, vote.value])) as Record<string, number>;
    },
  });
}

export function useVote() {
  const client = useQueryClient();
  const { user } = useSession();
  return useMutation({
    mutationFn: async ({ kind, id, value }: { kind: 'thread' | 'reply'; id: string; value: -1 | 0 | 1 }) => {
      const match = supabase.from('forum_votes');
      if (value === 0) {
        const { error } = await match.delete().eq('user_id', user!.id).eq('target_kind', kind).eq('target_id', id);
        if (error) throw error;
        return;
      }
      const { error } = await match.upsert({ target_kind: kind, target_id: id, value }, { onConflict: 'user_id,target_kind,target_id' });
      if (error) throw error;
    },
    onSettled: () => client.invalidateQueries({ queryKey: forumKeys.all }),
  });
}

export function useCreateThread() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (input: { category: ForumCategory; languageId: number | null; title: string; content: string }) => {
      const { data, error } = await supabase.from('forum_threads')
        .insert({ category: input.category, language_id: input.languageId, title: input.title.trim(), content: input.content.trim() })
        .select('id').single();
      if (error) throw error;
      return data.id;
    },
    onSuccess: () => client.invalidateQueries({ queryKey: forumKeys.all }),
  });
}

export function useAddReply(threadId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (input: { content: string; correction?: string }) => {
      const correction = input.correction?.trim();
      const { error } = await supabase.from('forum_replies')
        .insert({ thread_id: threadId, content: input.content.trim(), correction: correction ? correction : null });
      if (error) throw error;
    },
    onSuccess: () => client.invalidateQueries({ queryKey: forumKeys.all }),
  });
}

export function useAcceptReply(threadId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (replyId: string | null) => {
      const { error } = await supabase.rpc('forum_accept_reply', { p_thread: threadId, p_reply: replyId });
      if (error) throw error;
    },
    onSuccess: () => client.invalidateQueries({ queryKey: forumKeys.all }),
  });
}

export function useDeleteForumItem() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async ({ kind, id }: { kind: 'thread' | 'reply'; id: string }) => {
      const { error } = await supabase.from(kind === 'thread' ? 'forum_threads' : 'forum_replies').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => client.invalidateQueries({ queryKey: forumKeys.all }),
  });
}

export function useModerateThread(threadId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (input: { pinned?: boolean; locked?: boolean }) => {
      const { error } = await supabase.rpc('forum_moderate', { p_thread: threadId, p_pinned: input.pinned ?? null, p_locked: input.locked ?? null });
      if (error) throw error;
    },
    onSuccess: () => client.invalidateQueries({ queryKey: forumKeys.all }),
  });
}
