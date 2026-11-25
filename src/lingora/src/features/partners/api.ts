import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';
import { useSession } from '@/providers/session-provider';

const PAGE_SIZE = 20;

export type PartnerLanguage = { id: number; name: string; flag: string | null; level?: string | null };

export type Partner = {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  city: string | null;
  country: string | null;
  bio: string | null;
  native_languages: PartnerLanguage[];
  learning_languages: PartnerLanguage[];
  match_score: number;
  review_average: number | null;
  review_total: number;
  active_recently: boolean;
  interests?: string[] | null;
  conversation_topics?: string | null;
  practice_preference?: string | null;
  availability?: string | null;
};

export type PartnerFilters = { languageId: number | null; country: string | null; query: string; level?: string; practice?: string; availability?: string };

export const partnerKeys = {
  all: ['partners'] as const,
  search: (userId: string, filters: PartnerFilters) => ['partners', 'search', userId, filters] as const,
};

export function usePartnerSearch(filters: PartnerFilters) {
  const { user } = useSession();
  return useInfiniteQuery({
    queryKey: partnerKeys.search(user?.id ?? '', filters),
    enabled: !!user,
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const args = {
        p_language_id: filters.languageId ?? undefined,
        p_country: filters.country ?? undefined,
        p_query: filters.query.trim() || undefined,
        p_limit: PAGE_SIZE,
        p_offset: pageParam,
      };
      const { data, error } = filters.level || filters.practice || filters.availability
        ? await supabase.rpc('find_partners_filtered', {
            ...args, p_level: filters.level, p_practice: filters.practice, p_availability: filters.availability,
          })
        : await supabase.rpc('find_partners', args);
      if (error) throw error;
      const rows = (data ?? []) as unknown as Partner[];
      if (!rows.length) return rows;
      const details = await supabase.from('profiles')
        .select('id, interests, conversation_topics, practice_preference, availability')
        .in('id', rows.map(row => row.id));
      if (details.error) return rows;
      const byId = new Map(details.data.map(profile => [profile.id, profile]));
      return rows.map(row => ({ ...row, ...byId.get(row.id) }));
    },
    getNextPageParam: (lastPage, pages) =>
      lastPage.length === PAGE_SIZE ? pages.length * PAGE_SIZE : undefined,
  });
}

// ------------------------------------------------------------------ Reviews

export const reviewTags = {
  patient: 'Patient',
  helpful_corrections: 'Helpful corrections',
  reliable: 'Reliable',
  fun: 'Fun to talk to',
  great_teacher: 'Great teacher',
  good_listener: 'Good listener',
} as const;
export type ReviewTag = keyof typeof reviewTags;

export type ReviewStatus = {
  required_total: number;
  required_each: number;
  my_messages: number;
  their_messages: number;
  eligible: boolean;
  my_review: { rating: number; content: string; tags: ReviewTag[]; updated_at: string } | null;
  they_reviewed_me: boolean;
};

export type ProfileReview = {
  id: string;
  rating: number;
  content: string;
  tags: ReviewTag[];
  created_at: string;
  reviewer_id: string;
  reviewer_name: string | null;
  reviewer_username: string | null;
  reviewer_avatar: string | null;
};

export type ProfileReviews = { average: number | null; total: number; reviews: ProfileReview[] };

export const reviewKeys = {
  all: ['reviews'] as const,
  status: (userId: string) => ['reviews', 'status', userId] as const,
  profile: (userId: string) => ['reviews', 'profile', userId] as const,
};

export function useReviewStatus(userId: string | undefined, enabled = true) {
  const { user } = useSession();
  return useQuery({
    queryKey: reviewKeys.status(userId ?? ''),
    enabled: !!user && !!userId && enabled,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_review_status', { p_user: userId! });
      if (error) throw error;
      return data as unknown as ReviewStatus;
    },
  });
}

export function useProfileReviews(userId: string | undefined) {
  const { user } = useSession();
  return useQuery({
    queryKey: reviewKeys.profile(userId ?? ''),
    enabled: !!user && !!userId,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_profile_reviews', { p_user: userId! });
      if (error) throw error;
      return (data ?? { average: null, total: 0, reviews: [] }) as unknown as ProfileReviews;
    },
  });
}

export function useSubmitReview(userId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (input: { rating: number; content: string; tags: ReviewTag[] }) => {
      const { error } = await supabase.rpc('submit_review', {
        p_user: userId,
        p_rating: input.rating,
        p_content: input.content,
        p_tags: input.tags,
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: reviewKeys.all });
      void client.invalidateQueries({ queryKey: partnerKeys.all });
    },
  });
}
