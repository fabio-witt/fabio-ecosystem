import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Flag } from '@/components/flag';
import { AppText } from '@/components/ui';
import { radius, spacing, useThemedStyles, type ThemeColors } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/providers/session-provider';

import { cefrLevels, courses, type CefrLevel } from './catalog';
import { t } from '@/lib/i18n';

export type LanguageBadge = { courseId: string; name: string; flag: string; level: CefrLevel };

/**
 * The highest level per course whose final exam was passed (80 % or more).
 * The server only returns exam ids that were passed.
 */
export function computeBadges(completed: Set<string>): LanguageBadge[] {
  return courses.flatMap((course) => {
    const passed = cefrLevels.filter((level) => completed.has(`${course.id}-exam-${level}`));
    const earned = passed[passed.length - 1];
    return earned ? [{ courseId: course.id, name: course.name, flag: course.flag, level: earned }] : [];
  }).sort((a, b) => cefrLevels.indexOf(b.level) - cefrLevels.indexOf(a.level));
}

export function useLanguageBadges(userId: string | undefined) {
  const { user } = useSession();
  return useQuery({
    queryKey: ['learn', 'badges', userId ?? ''],
    enabled: !!user && !!userId,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_completed_entries', { p_user: userId! });
      if (error) throw error;
      return computeBadges(new Set((data ?? []) as string[]));
    },
  });
}

export const levelColors: Record<CefrLevel, string> = {
  A1: '#3E9B6B', A2: '#2F8F8A', B1: '#3C6FD1', B2: '#6554C4', C1: '#B8860B', C2: '#C0392B',
};

/** Badges like "🇪🇸 Spanish B1" shown on profiles. */
export function LanguageBadges({ userId, isMe }: { userId: string; isMe: boolean }) {
  const { styles } = useThemedStyles(createStyles);
  const badges = useLanguageBadges(userId);
  if (!badges.data) return null;

  return (
    <View style={styles.section}>
      <AppText variant="heading">{t("Language badges")}</AppText>
      {badges.data.length === 0 ? (
        <AppText variant="caption" color="textSecondary">
          {isMe
            ? t("Pass the final exam of a level with 80% to earn your first badge, for example Spanish A1.")
            : t("No language badges yet.")}
        </AppText>
      ) : (
        <View style={styles.badges}>
          {badges.data.map((badge) => (
            <Pressable key={badge.courseId} style={styles.badge} disabled={!isMe}
              onPress={() => router.push({ pathname: '/certificate', params: { course: badge.courseId, level: badge.level } })}
              accessibilityRole={isMe ? 'button' : undefined}
              accessibilityLabel={t('{language} level {level} badge', { language: t(badge.name), level: badge.level })}>
              <Flag emoji={badge.flag} size={32} />
              <View>
                <AppText variant="small" color="textSecondary">{t(badge.name)}</AppText>
                <View style={[styles.level, { backgroundColor: levelColors[badge.level] }]}>
                  <AppText variant="label" style={styles.levelText}>{badge.level}</AppText>
                </View>
              </View>
              {isMe ? <AppText variant="small" color="primary">🎓</AppText> : null}
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  // Extra room below so the badges never touch the next button.
  section: { gap: spacing.sm, marginTop: spacing.lg, marginBottom: spacing.xl },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderRadius: radius.xl,
    borderWidth: 1, borderColor: colors.borderSubtle, backgroundColor: colors.surface,
  },
  flag: { fontSize: 26, lineHeight: 32 },
  level: { alignSelf: 'flex-start', marginTop: 2, paddingHorizontal: spacing.sm, borderRadius: radius.full },
  levelText: { color: '#FFFFFF', fontWeight: '800' },
});
