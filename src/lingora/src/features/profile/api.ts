import { useQuery } from '@tanstack/react-query';

import type { Tables } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/providers/session-provider';

export type ProfileLanguage = {
  languageId: number;
  name: string;
  flagEmoji: string | null;
  type: 'native' | 'learning' | string;
  level: string | null;
};

export type MyProfile = {
  profile: Tables<'profiles'> | null;
  statistics: Pick<
    Tables<'user_statistics'>,
    'current_streak' | 'longest_streak' | 'total_xp' | 'completed_lessons'
  > | null;
  languages: ProfileLanguage[];
};

export const profileKeys = {
  all: ['profile'] as const,
  me: (userId: string) => [...profileKeys.all, 'me', userId] as const,
};

export async function fetchMyProfile(userId: string): Promise<MyProfile> {
  const [profileResult, statisticsResult, languagesResult] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
    supabase
      .from('user_statistics')
      .select('current_streak, longest_streak, total_xp, completed_lessons')
      .eq('user_id', userId)
      .maybeSingle(),
    supabase
      .from('user_languages')
      .select('language_id, language_type, proficiency_level, languages(name, flag_emoji)')
      .eq('user_id', userId)
      .order('created_at', { ascending: true }),
  ]);

  if (profileResult.error) throw profileResult.error;
  if (statisticsResult.error) throw statisticsResult.error;
  if (languagesResult.error) throw languagesResult.error;

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
    statistics: statisticsResult.data,
    languages,
  };
}

/** The signed-in user's profile, statistics and languages. */
export function useMyProfile() {
  const { user } = useSession();
  const userId = user?.id;

  return useQuery({
    queryKey: profileKeys.me(userId ?? 'signed-out'),
    queryFn: () => fetchMyProfile(userId!),
    enabled: !!userId,
  });
}
