import { router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';

import { AppText, Button, Card, Screen, ScreenHeader } from '@/components/ui';
import { screenPadding, spacing, useThemedStyles, type ThemeColors } from '@/constants/theme';
import { rangeTotals } from '@/features/game/challenges';
import { ChallengesCard } from '@/features/game/challenges-card';
import { useGame } from '@/features/game/store';
import { useDailyReview } from '@/features/learn/daily-review';
import { usePracticeReview } from '@/features/learn/practice-review';
import { t } from '@/lib/i18n';

const DAY = 86_400_000;

/** Your week at a glance: compared with the week before, weak spots and the next step. */
export default function ReportScreen() {
  const { styles } = useThemedStyles(createStyles);
  const game = useGame();
  const review = usePracticeReview();
  const daily = useDailyReview();
  const now = new Date();
  const week = rangeTotals(game.state.days, new Date(now.getTime() - 6 * DAY), now);
  const before = rangeTotals(game.state.days, new Date(now.getTime() - 13 * DAY), new Date(now.getTime() - 7 * DAY));
  // Lessons with the most open mistakes are the weak spots.
  const weak = Object.values(review.mistakes.reduce<Record<string, { id: string; title: string; count: number }>>((all, item) => {
    const entry = all[item.entryId] ?? { id: item.entryId, title: item.lesson.entry.title, count: 0 };
    entry.count += 1;
    all[item.entryId] = entry;
    return all;
  }, {})).sort((a, b) => b.count - a.count).slice(0, 3);

  const rows: [string, string, number, number][] = [
    ['📅', 'Active days', week.activeDays, before.activeDays],
    ['📚', 'Lessons', week.lessons, before.lessons],
    ['⚡', 'XP', week.xp, before.xp],
    ['🗂', 'Words practised', week.words, before.words],
    ['💯', 'Perfect lessons', week.perfect, before.perfect],
  ];

  return (
    <Screen edges={['top', 'bottom', 'left', 'right']}>
      <ScreenHeader title={t('Weekly report')} />
      <ScrollView contentContainerStyle={styles.content}>
        <AppText variant="title">{week.activeDays >= 5 ? t('Strong week! 🔥') : week.activeDays >= 2 ? t('Good rhythm – keep going.') : t('A fresh start is one lesson away.')}</AppText>
        <AppText color="textSecondary">{t('Last 7 days compared with the 7 days before.')}</AppText>
        <Card style={styles.table}>
          {rows.map(([icon, label, value, prev]) => {
            const diff = value - prev;
            return (
              <View key={label} style={styles.row}>
                <AppText style={styles.flex}>{icon} {t(label)}</AppText>
                <AppText variant="bodyStrong">{value}</AppText>
                <AppText variant="caption" color={diff > 0 ? 'success' : diff < 0 ? 'danger' : 'textSecondary'} style={styles.diff}>
                  {diff > 0 ? `▲ ${diff}` : diff < 0 ? `▼ ${-diff}` : '–'}
                </AppText>
              </View>
            );
          })}
        </Card>
        <Card style={styles.table}>
          <AppText variant="heading">{t('Your weak spots')}</AppText>
          {weak.length === 0 ? <AppText color="textSecondary">{t('No open mistakes – great.')}</AppText> : weak.map((item) => (
            <View key={item.id} style={styles.row}>
              <AppText style={styles.flex} numberOfLines={1}>{item.title}</AppText>
              <Button title={t('{n} to fix', { n: item.count })} size="sm" variant="secondary"
                onPress={() => router.push({ pathname: '/lesson/[id]', params: { id: item.id } })} />
            </View>
          ))}
        </Card>
        <Card style={styles.table}>
          <AppText variant="heading">{t('Next step')}</AppText>
          <AppText>{daily.items.length > 0 ? t('{n} cards are waiting in your daily review.', { n: daily.items.length }) : t('Your review is empty – time for a new lesson.')}</AppText>
          <Button title={daily.items.length > 0 ? t('Start daily review') : t('Open Learn')} onPress={() => router.push(daily.items.length > 0 ? '/daily-review' : '/learn')} />
        </Card>
        <ChallengesCard />
      </ScrollView>
    </Screen>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  content: { width: '100%', maxWidth: 620, alignSelf: 'center', padding: screenPadding, paddingBottom: spacing.xxxl, gap: spacing.md },
  table: { gap: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  flex: { flex: 1 },
  diff: { minWidth: 46, textAlign: 'right' },
});
