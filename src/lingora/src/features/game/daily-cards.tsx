/**
 * Small home cards that bring people back every day:
 * - Word of the day from the active course, with audio and "save"
 * - A welcome-back chest after 3+ days away
 * - An evening warning when today's streak is still at risk
 */
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText, Button, Card } from '@/components/ui';
import { spacing, useThemedStyles, type ThemeColors } from '@/constants/theme';
import { useActiveCourse } from '@/features/learn/active-course';
import { useLearnSummary } from '@/features/learn/progress';
import { vocabularyFor } from '@/features/vocabulary/catalog';
import { useNow } from '@/hooks/use-now';
import { feedback } from '@/lib/feedback';
import { t } from '@/lib/i18n';
import { canSpeak, speak } from '@/lib/speech';

import { COMEBACK_GEMS, comebackDue, dayKey, useGame } from './store';

function seedOf(text: string) {
  let seed = 0;
  for (let index = 0; index < text.length; index++) seed = (seed * 31 + text.charCodeAt(index)) | 0;
  return Math.abs(seed);
}

export function DailyCards() {
  return (
    <>
      <ComebackCard />
      <StreakRiskCard />
      <WordOfTheDay />
    </>
  );
}

function ComebackCard() {
  const { styles } = useThemedStyles(createStyles);
  const game = useGame();
  if (!comebackDue(game.state)) return null;
  return (
    <Card style={[styles.card, styles.comeback]}>
      <AppText style={styles.icon}>🎁</AppText>
      <View style={styles.flex}>
        <AppText variant="bodyStrong">{t('Welcome back!')}</AppText>
        <AppText variant="caption" color="textSecondary">{t('We kept a chest for you: {n} gems to restart.', { n: COMEBACK_GEMS })}</AppText>
      </View>
      <Button title={t('Open')} size="sm" onPress={() => { feedback('chest'); game.claimComeback(); }} />
    </Card>
  );
}

function StreakRiskCard() {
  const { styles } = useThemedStyles(createStyles);
  const summary = useLearnSummary().data;
  const now = useNow(60_000);
  const hour = new Date(now).getHours();
  if (!summary || summary.goal_done_today || summary.streak < 1 || hour < 18) return null;
  return (
    <Card style={[styles.card, styles.risk]}>
      <AppText style={styles.icon}>🔥</AppText>
      <View style={styles.flex}>
        <AppText variant="bodyStrong">{t('Your {n}-day streak is at risk!', { n: summary.streak })}</AppText>
        <AppText variant="caption" color="textSecondary">
          {summary.streak_freezes > 0 ? t('A streak freeze would save it, but one short lesson is better.') : t('One short lesson keeps it alive.')}
        </AppText>
      </View>
      <Button title={t('Learn')} size="sm" onPress={() => router.push('/learn')} />
    </Card>
  );
}

function WordOfTheDay() {
  const { styles } = useThemedStyles(createStyles);
  const game = useGame();
  const { course } = useActiveCourse();
  if (!course) return null;
  const catalog = vocabularyFor(course);
  const words = [...catalog.categories.flatMap((topic) => topic.words), ...catalog.frequency.words]
    .filter(([word, meaning]) => meaning && meaning !== word && word.length > 2);
  if (!words.length) return null;
  const [word, meaning] = words[seedOf(`${course.id}:${dayKey()}`) % words.length];
  const saved = game.state.saved.some((item) => item.courseId === course.id && item.word === word);
  const audio = canSpeak(course.id);
  return (
    <Card style={styles.card}>
      <View style={styles.flex}>
        <AppText variant="label" color="primary">{t('Word of the day')} · {course.flag}</AppText>
        <AppText variant="title">{word}</AppText>
        <AppText color="textSecondary">{meaning}</AppText>
      </View>
      <View style={styles.actions}>
        {audio ? <Button title="🔊" size="sm" variant="secondary" accessibilityLabel={t('Listen')} onPress={() => speak(word, course.id)} /> : null}
        <Button title={saved ? '★' : '☆'} size="sm" variant="secondary" accessibilityLabel={saved ? t('★ Saved') : t('☆ Save')}
          onPress={() => { feedback('tap'); game.toggleSaved({ courseId: course.id, word, meaning, at: Date.now() }); }} />
      </View>
    </Card>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  flex: { flex: 1, gap: 2 },
  card: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  icon: { fontSize: 30, lineHeight: 36 },
  comeback: { borderWidth: 2, borderColor: '#F2B705' },
  risk: { borderWidth: 2, borderColor: colors.danger, backgroundColor: colors.dangerSoft },
  actions: { gap: spacing.xs },
});
