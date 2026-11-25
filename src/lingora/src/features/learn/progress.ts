import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { profileKeys } from '@/features/profile/api';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/providers/session-provider';

/** Best score per lesson id, e.g. { gsw1: 100 }. */
type Scores = Record<string, number>;

export type LearnSummary = {
  streak: number;
  longest_streak: number;
  total_xp: number;
  completed_lessons: number;
  daily_xp: number;
  daily_goal_xp: number;
  streak_freezes: number;
  goal_done_today: boolean;
};

export type LessonResult = {
  earned_xp: number;
  stars: number;
  first_completion: boolean;
  new_best: boolean;
  daily_xp: number;
  daily_goal_xp: number;
  goal_reached: boolean;
  streak: number;
  freeze_used: boolean;
  freeze_earned: boolean;
  total_xp: number;
  /** Double XP from the booster after a perfect lesson (server side). */
  boosted?: boolean;
  boost_until?: string | null;
};

export const dailyGoalOptions = [10, 20, 30, 50] as const;

export const learnKeys = {
  all: ['learn'] as const,
  progress: (userId: string) => ['learn', 'progress', userId] as const,
  summary: (userId: string) => ['learn', 'summary', userId] as const,
};

/** Same rule as the server: 100% = 3 stars, 80% = 2 stars, otherwise 1. */
export function starsForScore(score: number) {
  return score === 100 ? 3 : score >= 80 ? 2 : 1;
}

function deviceTimeZone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || undefined;
  } catch {
    return undefined;
  }
}

// Earlier app versions stored progress only on the device. It is moved to
// Supabase once and then removed locally.
const legacyStorageKey = (userId: string) => 'lingora.grammarfirst.progress.v1.' + userId;

function readLegacyProgress(userId: string): Scores | null {
  try {
    const raw = globalThis.localStorage?.getItem(legacyStorageKey(userId));
    if (!raw) return null;
    const data: unknown = JSON.parse(raw);
    if (!data || typeof data !== 'object' || Array.isArray(data)) return null;
    return Object.fromEntries(Object.entries(data).filter(([, score]) =>
      typeof score === 'number' && Number.isInteger(score) && score >= 0 && score <= 100));
  } catch {
    return null;
  }
}

export function removeLocalLearnProgress(userId: string) {
  try {
    globalThis.localStorage?.removeItem(legacyStorageKey(userId));
  } catch {
    // Nothing stored on this device.
  }
}

async function fetchProgress(userId: string): Promise<Scores> {
  const legacy = readLegacyProgress(userId);
  if (legacy && Object.keys(legacy).length > 0) {
    const { error } = await supabase.rpc('import_learn_progress', { p_scores: legacy });
    if (!error) removeLocalLearnProgress(userId);
  }

  const { data, error } = await supabase
    .from('learn_progress')
    .select('entry_id, best_score')
    .eq('user_id', userId);
  if (error) throw error;
  return Object.fromEntries(data.map((row) => [row.entry_id, row.best_score]));
}

export function useLearnProgress() {
  const { user } = useSession();
  return useQuery({
    queryKey: learnKeys.progress(user?.id ?? ''),
    enabled: !!user,
    queryFn: () => fetchProgress(user!.id),
  });
}

export function useLearnSummary() {
  const { user } = useSession();
  return useQuery({
    queryKey: learnKeys.summary(user?.id ?? ''),
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_learn_summary', { p_time_zone: deviceTimeZone() });
      if (error) throw error;
      return data as unknown as LearnSummary;
    },
  });
}

export function useCompleteLesson(lessonId: string) {
  const { user } = useSession();
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (score: number) => {
      if (!user) throw new Error('Sign in to save your progress.');
      const { data, error } = await supabase.rpc('complete_lesson', {
        p_entry_id: lessonId,
        p_score: score,
        p_time_zone: deviceTimeZone(),
      });
      if (error) throw new Error(error.message);
      return data as unknown as LessonResult;
    },
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: learnKeys.all });
      void client.invalidateQueries({ queryKey: profileKeys.all });
    },
  });
}

export function useSetDailyGoal() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (goal: number) => {
      const { error } = await supabase.rpc('set_daily_goal', { p_goal: goal });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => client.invalidateQueries({ queryKey: learnKeys.all }),
  });
}

/** How often each lesson was completed (for crowns on the path). */
export function useCompletions() {
  const { user } = useSession();
  return useQuery({
    queryKey: ['learn', 'completions', user?.id ?? ''],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from('learn_progress').select('entry_id, completions').eq('user_id', user!.id);
      if (error) throw error;
      return Object.fromEntries((data ?? []).map((row) => [row.entry_id, row.completions ?? 0])) as Record<string, number>;
    },
  });
}
