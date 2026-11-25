import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';

import { AppText, Button, Card, Screen, ScreenHeader } from '@/components/ui';
import { radius, screenPadding, spacing, useThemedStyles, type ThemeColors } from '@/constants/theme';
import { useGame } from '@/features/game/store';
import { usePracticeReview } from '@/features/learn/practice-review';
import { useLearnProgress, useLearnSummary } from '@/features/learn/progress';
import { t } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/providers/session-provider';

const DAYS = 28;

function isoDay(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/** Learning statistics from real data: XP per day, totals and weak spots. */
export default function StatsScreen() {
  const { colors, styles } = useThemedStyles(createStyles);
  const { user } = useSession();
  const summary = useLearnSummary().data;
  const progress = useLearnProgress().data ?? {};
  const review = usePracticeReview();
  const game = useGame();

  const history = useQuery({
    queryKey: ['daily-xp', user?.id ?? ''],
    enabled: !!user,
    queryFn: async () => {
      const since = new Date();
      since.setDate(since.getDate() - DAYS);
      const { data, error } = await supabase.from('daily_xp').select('day, xp, lessons')
        .eq('user_id', user!.id).gte('day', isoDay(since));
      if (error) throw error;
      return new Map((data ?? []).map((row) => [row.day, row]));
    },
  });

  const days = Array.from({ length: DAYS }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (DAYS - 1 - index));
    const row = history.data?.get(isoDay(date));
    return { date, xp: row?.xp ?? 0, lessons: row?.lessons ?? 0 };
  });
  const maxXp = Math.max(20, ...days.map((day) => day.xp));
  const activeDays = days.filter((day) => day.lessons > 0).length;
  const monthXp = days.reduce((sum, day) => sum + day.xp, 0);

  const scores = Object.values(progress);
  const average = scores.length ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) : 0;
  const wordsKnown = Object.values(review.words).filter((word) => word.stage >= 1).length;
  const wordsStrong = Object.values(review.words).filter((word) => word.stage >= 3).length;

  // Weak spots: lessons with mistakes that are not yet remembered.
  const weak = new Map<string, { title: string; course: string; count: number; id: string }>();
  for (const card of review.mistakes) {
    if (card.stage > 1) continue;
    const key = card.lesson.entry.id;
    const item = weak.get(key) ?? { title: card.lesson.entry.title, course: card.lesson.course.name, count: 0, id: key };
    item.count += 1;
    weak.set(key, item);
  }
  const weakSpots = [...weak.values()].sort((a, b) => b.count - a.count).slice(0, 5);

  return (
    <Screen edges={['top', 'bottom', 'left', 'right']}>
      <ScreenHeader title={t('📈 Your statistics')} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.grid}>
          <Tile value={summary?.streak ?? 0} label={t('day streak')} icon="🔥" />
          <Tile value={summary?.longest_streak ?? 0} label={t('longest streak')} icon="🏅" />
          <Tile value={summary?.total_xp ?? 0} label={t('total XP')} icon="⭐" />
          <Tile value={scores.length} label={t('lessons finished')} icon="📘" />
          <Tile value={wordsKnown} label={t('words learned')} icon="🗂" />
          <Tile value={game.state.totals.mistakes} label={t('mistakes fixed')} icon="🔁" />
        </View>

        <Card style={styles.group}>
          <AppText variant="heading">{t('Last 4 weeks')}</AppText>
          <AppText variant="caption" color="textSecondary">
            {t('{xp} XP on {days} active days', { xp: monthXp, days: activeDays })}
          </AppText>
          <View style={styles.chart} accessible accessibilityLabel={t('{xp} XP on {days} active days', { xp: monthXp, days: activeDays })}>
            {days.map((day) => (
              <View key={day.date.toISOString()} style={styles.barSlot}>
                <View style={[styles.bar, {
                  height: `${Math.max(day.xp ? 6 : 2, (day.xp / maxXp) * 100)}%`,
                  backgroundColor: day.xp ? (day.xp >= (summary?.daily_goal_xp ?? 20) ? '#F2B705' : colors.primary) : colors.surfaceMuted,
                }]} />
              </View>
            ))}
          </View>
          <View style={styles.legend}>
            <AppText variant="small" color="textSecondary">{days[0].date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}</AppText>
            <AppText variant="small" color="textSecondary">🟨 {t('daily goal reached')}</AppText>
            <AppText variant="small" color="textSecondary">{t('today')}</AppText>
          </View>
        </Card>

        <Card style={styles.group}>
          <AppText variant="heading">{t('Accuracy')}</AppText>
          <AppText color="textSecondary">
            {scores.length ? t('Your average lesson score is {n}%.', { n: average }) : t('Finish a lesson to see your accuracy.')}
          </AppText>
          {scores.length ? (
            <View style={styles.meter}><View style={[styles.meterFill, { width: `${average}%` }]} /></View>
          ) : null}
          <AppText variant="caption" color="textSecondary">
            {t('{n} words are firmly in your memory (reviewed several times).', { n: wordsStrong })}
          </AppText>
        </Card>

        <Card style={styles.group}>
          <AppText variant="heading">{t('Your weak spots')}</AppText>
          {weakSpots.length === 0 ? (
            <AppText color="textSecondary">{t('No open mistakes. Great work!')}</AppText>
          ) : weakSpots.map((spot) => (
            <View key={spot.id} style={styles.weak}>
              <View style={styles.flex}>
                <AppText variant="bodyStrong" numberOfLines={1}>{spot.title}</AppText>
                <AppText variant="caption" color="textSecondary">{t(spot.course)}</AppText>
              </View>
              <AppText variant="caption" style={styles.weakCount}>{t('{n} to review', { n: spot.count })}</AppText>
            </View>
          ))}
          {weakSpots.length ? <Button title={t('Practise them now')} onPress={() => router.push('/daily-review')} /> : null}
        </Card>
      </ScrollView>
    </Screen>
  );
}

function Tile({ value, label, icon }: { value: number; label: string; icon: string }) {
  const { styles } = useThemedStyles(createStyles);
  return (
    <View style={styles.tile} accessible accessibilityLabel={`${value} ${label}`}>
      <AppText style={styles.tileIcon} accessible={false}>{icon}</AppText>
      <AppText variant="heading">{value.toLocaleString()}</AppText>
      <AppText variant="small" color="textSecondary" align="center">{label}</AppText>
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  content: { width: '100%', maxWidth: 560, alignSelf: 'center', padding: screenPadding, paddingBottom: spacing.xxxl, gap: spacing.md },
  flex: { flex: 1 },
  group: { gap: spacing.sm },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  tile: { width: '31.5%', alignItems: 'center', gap: 2, paddingVertical: spacing.md, borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderSubtle },
  tileIcon: { fontSize: 22, lineHeight: 28 },
  chart: { flexDirection: 'row', alignItems: 'flex-end', height: 120, gap: 2 },
  barSlot: { flex: 1, height: '100%', justifyContent: 'flex-end' },
  bar: { width: '100%', borderRadius: 3 },
  legend: { flexDirection: 'row', justifyContent: 'space-between' },
  meter: { height: 10, borderRadius: radius.full, backgroundColor: colors.surfaceMuted, overflow: 'hidden' },
  meterFill: { height: '100%', borderRadius: radius.full, backgroundColor: colors.success },
  weak: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  weakCount: { fontWeight: '800', color: colors.danger },
});
