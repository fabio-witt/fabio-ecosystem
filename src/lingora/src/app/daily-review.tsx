import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Medved } from '@/components/medved';
import { AppText, Button, Card, Screen, ScreenHeader } from '@/components/ui';
import { radius, screenPadding, spacing, useThemedStyles, type ThemeColors } from '@/constants/theme';
import { useGame } from '@/features/game/store';
import { useDailyReview, type ReviewItem } from '@/features/learn/daily-review';
import { ExerciseView } from '@/features/learn/exercise';
import { usePracticeReview } from '@/features/learn/practice-review';
import { t } from '@/lib/i18n';
import { track } from '@/lib/insights';

/** About five minutes: due mistakes, due words and a few new words. */
export default function DailyReviewScreen() {
  const { styles } = useThemedStyles(createStyles);
  const daily = useDailyReview();
  const review = usePracticeReview();
  const game = useGame();
  // Freeze the list when the session starts, so answers do not reshuffle it.
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [started, setStarted] = useState(false);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);

  function start(size: number) {
    setItems(daily.items.slice(0, size));
    setStarted(true);
  }
  const [index, setIndex] = useState(0);
  const [correct, setCorrect] = useState(0);
  const item = items[index];
  const done = index >= items.length;

  function answer(right: boolean) {
    if (!item) return;
    if (item.kind === 'mistake') {
      review.rateMistake(item.key, right);
      if (right) game.recordMistakeFixed();
    } else {
      review.rateWord(item.key, right);
      game.recordWord(right);
    }
    if (right) {
      setCorrect((value) => value + 1);
      const next = combo + 1;
      setCombo(next);
      setBestCombo(value => Math.max(value, next));
    } else setCombo(0);
    if (index + 1 === items.length) track('daily_review_completed', { questions: items.length });
    setIndex((value) => value + 1);
  }

  return (
    <Screen edges={['top', 'bottom', 'left', 'right']}>
      <ScreenHeader title={t('Daily review')} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {!started && daily.items.length > 0 ? (
          <Card style={styles.center}>
            <Medved mood="cheer" size={110} />
            <AppText variant="title" align="center">{t('Your focus, your pace')}</AppText>
            <AppText color="textSecondary" align="center">{t('Choose a short round or the full review. Mistakes come first.')}</AppText>
            <AppText align="center">{t('{mistakes} mistakes · {words} words', { mistakes: daily.items.filter(item => item.kind === 'mistake').length, words: daily.items.filter(item => item.kind === 'word').length })}</AppText>
            <Button title={t('Quick round · {n} questions', { n: Math.min(5, daily.items.length) })} size="lg" fullWidth onPress={() => start(5)} />
            {daily.items.length > 5 && <Button title={t('Full review · {n} questions', { n: daily.items.length })} variant="secondary" fullWidth onPress={() => start(daily.items.length)} />}
          </Card>
        ) : items.length === 0 ? (
          <Card style={styles.center}>
            <Medved mood="cheer" size={110} />
            <AppText variant="title" align="center">{t('Nothing to review right now')}</AppText>
            <AppText color="textSecondary" align="center">{t('Finish a lesson or pick a course, and your review fills up by itself.')}</AppText>
            <Button title={t('Open Learn')} size="lg" fullWidth onPress={() => router.replace('/learn')} />
          </Card>
        ) : done ? (
          <Card style={styles.center}>
            <Medved mood="cheer" size={110} />
            <AppText variant="title" align="center">{t('Review done!')}</AppText>
            <AppText style={styles.score}>{correct}/{items.length}</AppText>
            <AppText>{t('Best combo: {n}', { n: bestCombo })}</AppText>
            <AppText color="textSecondary" align="center">
              {t('What you missed comes back soon. What you knew returns in a few days.')}
            </AppText>
            <Button title={t('Continue learning')} size="lg" fullWidth onPress={() => router.replace('/learn')} />
            <Button title={t('Back home')} variant="ghost" onPress={() => router.replace('/')} />
          </Card>
        ) : (
          <>
            <View style={styles.track} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: items.length, now: index }}>
              <View style={[styles.fill, { width: `${Math.max((index / items.length) * 100, 4)}%` }]} />
            </View>
            <View style={styles.meta}>
              <AppText variant="caption" color="textSecondary">{t('Question {n} of {total}', { n: index + 1, total: items.length })}</AppText>
              <AppText variant="caption" style={styles.tag}>
                {item.kind === 'mistake' ? t('🔁 Earlier mistake') : item.fresh ? t('✨ New word') : t('🗂 Word review')}
              </AppText>
            </View>
            <AppText accessibilityLiveRegion="polite">{t('Combo: {n}', { n: combo })}</AppText>
            <AppText variant="small" color="textSecondary">{item.source}</AppText>
            <Card>
              <ExerciseView key={`${item.kind}-${item.key}-${index}`} exercise={item.exercise}
                isLast={index === items.length - 1} onContinue={(right) => answer(right)} />
            </Card>
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  content: { width: '100%', maxWidth: 560, alignSelf: 'center', padding: screenPadding, paddingBottom: spacing.xxxl, gap: spacing.md },
  center: { alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xl },
  score: { fontSize: 56, lineHeight: 64, fontWeight: '900', color: colors.text },
  track: { height: 12, borderRadius: radius.full, backgroundColor: colors.surfaceMuted, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: radius.full, backgroundColor: '#F2B705' },
  meta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tag: { fontWeight: '800', color: colors.primary },
});
