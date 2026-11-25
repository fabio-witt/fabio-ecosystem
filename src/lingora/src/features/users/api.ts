import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { profileKeys, type ProfileLanguage } from '@/features/profile/api';
import type { Tables } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/providers/session-provider';

export type UserSummary = Pick<
  Tables<'profiles'>,
  'id' | 'full_name' | 'username' | 'avatar_url' | 'country'
>;

export type PublicPost = Pick<Tables<'posts'>, 'id' | 'content' | 'image_url' | 'created_at'>;

export type PublicProfile = {
  profile: Tables<'profiles'>;
  languages: ProfileLanguage[];
  followers: number;
  following: number;
  posts: number;
  isFollowing: boolean;
  recentPosts: PublicPost[];
};

export type ConnectionType = 'followers' | 'following';

export const userKeys = {
  all: ['users'] as const,
  detail: (userId: string) => [...userKeys.all, 'detail', userId] as const,
  connections: (userId: string, type: ConnectionType) =>
    [...userKeys.all, 'connections', userId, type] as const,
};

const SUMMARY_COLUMNS = 'id, full_name, username, avatar_url, country';

export function displayNameOf(user: Pick<UserSummary, 'full_name' | 'username'> | null) {
  return user?.full_name || user?.username || 'GrammarBay User';
}

async function fetchPublicProfile(userId: string, viewerId: string): Promise<PublicProfile> {
  const [
    profileResult,
    languagesResult,
    followersResult,
    followingResult,
    postsCountResult,
    isFollowingResult,
    recentPostsResult,
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
    supabase
      .from('user_languages')
      .select('language_id, language_type, proficiency_level, languages(name, flag_emoji)')
      .eq('user_id', userId)
      .order('created_at', { ascending: true }),
    supabase
      .from('follows')
      .select('id', { count: 'exact', head: true })
      .eq('following_id', userId),
    supabase
      .from('follows')
      .select('id', { count: 'exact', head: true })
      .eq('follower_id', userId),
    supabase.from('posts').select('id', { count: 'exact', head: true }).eq('user_id', userId),
    supabase
      .from('follows')
      .select('id')
      .eq('follower_id', viewerId)
      .eq('following_id', userId)
      .maybeSingle(),
    supabase
      .from('posts')
      .select('id, content, image_url, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10),
  ]);

  for (const result of [
    profileResult,
    languagesResult,
    followersResult,
    followingResult,
    postsCountResult,
    isFollowingResult,
    recentPostsResult,
  ]) {
    if (result.error) throw result.error;
  }

  if (!profileResult.data) {
    throw new Error('This profile does not exist anymore.');
  }

  const languages: ProfileLanguage[] = (languagesResult.data ?? [])
    .filter((item) => item.languages)
    .map((item) => ({
      languageId: item.language_id,
      name: item.languages!.name,
      flagEmoji: item.languages!.flag_emoji,
      type: item.language_type,
      level: item.proficiency_level,
    }));

  return {
    profile: profileResult.data,
    languages,
    followers: followersResult.count ?? 0,
    following: followingResult.count ?? 0,
    posts: postsCountResult.count ?? 0,
    isFollowing: !!isFollowingResult.data,
    recentPosts: recentPostsResult.data ?? [],
  };
}

/** Another user's public profile, as seen by the signed-in user. */
export function usePublicProfile(userId: string | undefined) {
  const { user } = useSession();
  const viewerId = user?.id;

  return useQuery({
    queryKey: userKeys.detail(userId ?? 'none'),
    queryFn: () => fetchPublicProfile(userId!, viewerId!),
    enabled: !!userId && !!viewerId,
  });
}

const CONNECTIONS_PAGE_SIZE = 100;

async function fetchConnections(userId: string, type: ConnectionType): Promise<UserSummary[]> {
  // followers: rows where someone follows userId -> show the follower
  // following: rows where userId follows someone -> show the followed user
  const query =
    type === 'followers'
      ? supabase
          .from('follows')
          .select(`user:profiles!follows_follower_id_fkey(${SUMMARY_COLUMNS})`)
          .eq('following_id', userId)
      : supabase
          .from('follows')
          .select(`user:profiles!follows_following_id_fkey(${SUMMARY_COLUMNS})`)
          .eq('follower_id', userId);

  // TODO: infinite scrolling once accounts have more than 100 connections.
  const { data, error } = await query
    .order('created_at', { ascending: false })
    .limit(CONNECTIONS_PAGE_SIZE);

  if (error) throw error;

  return (data ?? [])
    .map((row) => row.user as UserSummary | null)
    .filter((user): user is UserSummary => user !== null);
}

export function useConnections(userId: string | undefined, type: ConnectionType) {
  return useQuery({
    queryKey: userKeys.connections(userId ?? 'none', type),
    queryFn: () => fetchConnections(userId!, type),
    enabled: !!userId,
  });
}

/** Follow or unfollow a user. Updates the profile screen instantly. */
export function useToggleFollow(targetUserId: string) {
  const { user } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (follow: boolean) => {
      if (!user) throw new Error('You are not signed in.');

      const { error } = follow
        ? await supabase
            .from('follows')
            .insert({ follower_id: user.id, following_id: targetUserId })
        : await supabase
            .from('follows')
            .delete()
            .eq('follower_id', user.id)
            .eq('following_id', targetUserId);

      // 23505 = already following (e.g. double tap). Treat as success.
      if (error && error.code !== '23505') throw error;
    },

    // Optimistic update: flip the button and counter before the server answers.
    onMutate: async (follow) => {
      const key = userKeys.detail(targetUserId);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<PublicProfile>(key);

      if (previous) {
        queryClient.setQueryData<PublicProfile>(key, {
          ...previous,
          isFollowing: follow,
          followers: Math.max(0, previous.followers + (follow ? 1 : -1)),
        });
      }

      return { previous };
    },

    onError: (_error, _follow, context) => {
      if (context?.previous) {
        queryClient.setQueryData(userKeys.detail(targetUserId), context.previous);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.all });
      queryClient.invalidateQueries({ queryKey: profileKeys.all });
    },
  });
}
