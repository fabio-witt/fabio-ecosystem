import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
  type QueryClient,
} from '@tanstack/react-query';

import { profileKeys } from '@/features/profile/api';
import { userKeys, type UserSummary } from '@/features/users/api';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/providers/session-provider';

export const POST_MAX_LENGTH = 2000;
export const COMMENT_MAX_LENGTH = 1000;
const PAGE_SIZE = 20;

/** 'club:<id>' shows the posts of one club. */
export type FeedFilter = 'all' | 'questions' | 'mine' | `club:${string}`;
export type PostKind = 'post' | 'question';

export type FeedPost = {
  id: string;
  user_id: string;
  content: string;
  image_url: string | null;
  created_at: string | null;
  updated_at: string | null;
  like_count: number;
  comment_count: number;
  kind: PostKind;
  language_id: number | null;
  club_id: string | null;
  accepted_comment_id: string | null;
  language: { name: string; flag_emoji: string | null } | null;
  author: UserSummary | null;
  likedByMe: boolean;
};

export type PostComment = {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  /** A corrected version of the post, HelloTalk-style. */
  correction: string | null;
  created_at: string | null;
  author: UserSummary | null;
};

export const communityKeys = {
  all: ['community'] as const,
  feeds: () => [...communityKeys.all, 'feed'] as const,
  feed: (filter: FeedFilter, userId: string) => [...communityKeys.feeds(), filter, userId] as const,
  post: (postId: string) => [...communityKeys.all, 'post', postId] as const,
  comments: (postId: string) => [...communityKeys.all, 'comments', postId] as const,
};

const POST_COLUMNS =
  'id, user_id, content, image_url, created_at, updated_at, like_count, comment_count, ' +
  'kind, language_id, club_id, accepted_comment_id, language:languages!posts_language_id_fkey(name, flag_emoji), ' +
  'author:profiles!posts_user_id_fkey(id, full_name, username, avatar_url, country)';

type PostRow = Omit<FeedPost, 'likedByMe'>;

async function attachLikedByMe(posts: PostRow[], userId: string): Promise<FeedPost[]> {
  if (posts.length === 0) return [];

  const { data, error } = await supabase
    .from('post_likes')
    .select('post_id')
    .eq('user_id', userId)
    .in(
      'post_id',
      posts.map((post) => post.id)
    );

  if (error) throw error;
  const liked = new Set((data ?? []).map((like) => like.post_id));
  return posts.map((post) => ({ ...post, likedByMe: liked.has(post.id) }));
}

async function fetchFeedPage(
  filter: FeedFilter,
  userId: string,
  cursor: string | null,
  practiceWeek?: string
): Promise<FeedPost[]> {
  let query = supabase
    .from('posts')
    .select(POST_COLUMNS)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(PAGE_SIZE);

  if (filter.startsWith('club:')) {
    query = query.eq('club_id', filter.slice(5));
    if (practiceWeek) query = query.eq('club_practice_week', practiceWeek);
  } else {
    query = query.is('club_id', null);
    if (filter === 'mine') query = query.eq('user_id', userId);
    if (filter === 'questions') query = query.eq('kind', 'question');
  }
  if (cursor) query = query.lt('created_at', cursor);

  const { data, error } = await query;
  if (error) throw error;
  return attachLikedByMe((data ?? []) as unknown as PostRow[], userId);
}

/** Community feed, loaded 20 posts at a time (newest first). */
export function useFeed(filter: FeedFilter, practiceWeek?: string) {
  const { user } = useSession();
  const userId = user?.id;

  return useInfiniteQuery({
    queryKey: [...communityKeys.feed(filter, userId ?? 'signed-out'), practiceWeek],
    queryFn: ({ pageParam }) => fetchFeedPage(filter, userId!, pageParam, practiceWeek),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) =>
      lastPage.length === PAGE_SIZE ? (lastPage[lastPage.length - 1].created_at ?? null) : null,
    enabled: !!userId,
  });
}

/** A single post (for the detail screen). */
export function usePost(postId: string | undefined) {
  const { user } = useSession();
  const userId = user?.id;

  return useQuery({
    queryKey: communityKeys.post(postId ?? 'none'),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('posts')
        .select(POST_COLUMNS)
        .eq('id', postId!)
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error('This post was deleted.');
      const [post] = await attachLikedByMe([data as unknown as PostRow], userId!);
      return post;
    },
    enabled: !!postId && !!userId,
  });
}

// ---------------------------------------------------------------------------
// Cache helpers: keep feed lists and the detail screen in sync
// ---------------------------------------------------------------------------

function updatePostInCaches(
  queryClient: QueryClient,
  postId: string,
  update: (post: FeedPost) => FeedPost | null
) {
  queryClient.setQueriesData<InfiniteData<FeedPost[]>>(
    { queryKey: communityKeys.feeds() },
    (data) =>
      data && {
        ...data,
        pages: data.pages.map((page) =>
          page.flatMap((post) => {
            if (post.id !== postId) return [post];
            const next = update(post);
            return next ? [next] : [];
          })
        ),
      }
  );

  queryClient.setQueryData<FeedPost>(communityKeys.post(postId), (post) =>
    post ? (update(post) ?? undefined) : post
  );
}

function invalidateAfterPostChange(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: communityKeys.all });
  queryClient.invalidateQueries({ queryKey: userKeys.all });
  queryClient.invalidateQueries({ queryKey: profileKeys.all });
}

/** Path inside the post-images bucket, taken from a public URL. */
function storagePathFromPublicUrl(url: string) {
  const marker = '/object/public/post-images/';
  const index = url.indexOf(marker);
  return index === -1 ? null : decodeURIComponent(url.slice(index + marker.length));
}

async function removePostImage(url: string | null) {
  const path = url ? storagePathFromPublicUrl(url) : null;
  if (!path) return;
  // Best effort: a leftover file must not block deleting/editing the post.
  const { error } = await supabase.storage.from('post-images').remove([path]);
  if (error) console.warn('Could not delete post image:', error.message);
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export function useToggleLike() {
  const { user } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId, like }: { postId: string; like: boolean }) => {
      if (!user) throw new Error('You are not signed in.');

      const { error } = like
        ? await supabase.from('post_likes').insert({ post_id: postId, user_id: user.id })
        : await supabase.from('post_likes').delete().eq('post_id', postId).eq('user_id', user.id);

      // 23505 = already liked (double tap) – fine.
      if (error && error.code !== '23505') throw error;
    },
    onMutate: ({ postId, like }) => {
      updatePostInCaches(queryClient, postId, (post) => ({
        ...post,
        likedByMe: like,
        like_count: Math.max(0, post.like_count + (like ? 1 : -1)),
      }));
    },
    onError: (_error, { postId, like }) => {
      // Undo the optimistic change.
      updatePostInCaches(queryClient, postId, (post) => ({
        ...post,
        likedByMe: !like,
        like_count: Math.max(0, post.like_count + (like ? -1 : 1)),
      }));
    },
  });
}

export function useCreatePost() {
  const { user } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { content: string; kind?: PostKind; languageId?: number | null; clubId?: string | null; practiceWeek?: string }) => {
      if (!user) throw new Error('You are not signed in.');
      const { error } = await supabase.from('posts').insert({
        user_id: user.id,
        content: input.content.trim(),
        kind: input.kind ?? 'post',
        language_id: input.languageId ?? null,
        club_id: input.clubId ?? null,
        ...(input.practiceWeek ? { club_practice_week: input.practiceWeek } : {}),
      });
      if (error) throw error;
    },
    onSuccess: () => invalidateAfterPostChange(queryClient),
  });
}

export function useUpdatePost() {
  const { user } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      post,
      content,
      removeImage,
    }: {
      post: Pick<FeedPost, 'id' | 'image_url'>;
      content: string;
      removeImage: boolean;
    }) => {
      if (!user) throw new Error('You are not signed in.');

      const imageUrl = removeImage ? null : post.image_url;
      const { error } = await supabase
        .from('posts')
        .update({ content: content.trim(), image_url: imageUrl })
        .eq('id', post.id);

      if (error) throw error;

      if (imageUrl !== post.image_url) await removePostImage(post.image_url);
    },
    onSuccess: () => invalidateAfterPostChange(queryClient),
  });
}

export function useDeletePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (post: Pick<FeedPost, 'id' | 'image_url'>) => {
      const { error } = await supabase.from('posts').delete().eq('id', post.id);
      if (error) throw error;
      await removePostImage(post.image_url);
    },
    onSuccess: (_data, post) => {
      updatePostInCaches(queryClient, post.id, () => null);
      queryClient.removeQueries({ queryKey: communityKeys.post(post.id) });
      invalidateAfterPostChange(queryClient);
    },
  });
}

// ---------------------------------------------------------------------------
// Comments
// ---------------------------------------------------------------------------

export function useComments(postId: string | undefined) {
  return useQuery({
    queryKey: communityKeys.comments(postId ?? 'none'),
    queryFn: async (): Promise<PostComment[]> => {
      const { data, error } = await supabase
        .from('comments')
        .select(
          'id, post_id, user_id, content, correction, created_at, ' +
            'author:profiles!comments_user_id_fkey(id, full_name, username, avatar_url, country)'
        )
        .eq('post_id', postId!)
        .order('created_at', { ascending: true })
        .limit(200);

      if (error) throw error;
      return (data ?? []) as unknown as PostComment[];
    },
    enabled: !!postId,
  });
}

export function useAddComment(postId: string) {
  const { user } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: string | { content: string; correction?: string }) => {
      if (!user) throw new Error('You are not signed in.');
      const { content, correction } = typeof input === 'string' ? { content: input, correction: undefined } : input;
      const fixed = correction?.trim();
      const { error } = await supabase
        .from('comments')
        .insert({ post_id: postId, user_id: user.id, content: content.trim(), correction: fixed ? fixed : null });
      if (error) throw error;
    },
    onSuccess: () => {
      updatePostInCaches(queryClient, postId, (post) => ({
        ...post,
        comment_count: post.comment_count + 1,
      }));
      queryClient.invalidateQueries({ queryKey: communityKeys.comments(postId) });
    },
  });
}

export function useDeleteComment(postId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (commentId: string) => {
      const { error } = await supabase.from('comments').delete().eq('id', commentId);
      if (error) throw error;
    },
    onSuccess: () => {
      updatePostInCaches(queryClient, postId, (post) => ({
        ...post,
        comment_count: Math.max(0, post.comment_count - 1),
      }));
      queryClient.invalidateQueries({ queryKey: communityKeys.comments(postId) });
    },
  });
}

export function useAcceptAnswer(postId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (commentId: string | null) => {
      const { error } = await supabase.rpc('accept_answer', { p_post: postId, p_comment: commentId as string });
      if (error) throw new Error(error.message);
      return commentId;
    },
    onSuccess: (commentId) => {
      updatePostInCaches(queryClient, postId, (post) => ({ ...post, accepted_comment_id: commentId }));
    },
  });
}

export type Language = { id: number; name: string; flag_emoji: string | null; language_code: string | null };

/** All languages, for question tags and clubs. */
export function useLanguages() {
  return useQuery({
    queryKey: ['languages'],
    staleTime: 60 * 60 * 1000,
    queryFn: async (): Promise<Language[]> => {
      const { data, error } = await supabase.from('languages').select('id, name, flag_emoji, language_code').order('name');
      if (error) throw error;
      return data ?? [];
    },
  });
}
