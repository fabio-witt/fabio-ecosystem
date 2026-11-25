import { useNow } from '@/hooks/use-now';
import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import { AppText, Button, Card, Screen, ScreenHeader } from '@/components/ui';
import { screenPadding, spacing } from '@/constants/theme';
import { ExerciseView } from '@/features/learn/exercise';
import { usePracticeReview } from '@/features/learn/practice-review';
import { t } from '@/lib/i18n';
import { useGame } from '@/features/game/store';

export default function PracticeReviewScreen() {
  const review = usePracticeReview();
  const game = useGame();
  const [completed, setCompleted] = useState<string[]>([]);
  const now = useNow();
  const due = review.mistakes.filter(card => card.dueAt <= now && !completed.includes(card.key));
  const next = due[0];

  return (
    <Screen edges={['top', 'bottom', 'left', 'right']}>
      <ScreenHeader title={t('Review mistakes')} />
      <ScrollView contentContainerStyle={styles.content}>
        <AppText variant="title">{t('Your daily review')}</AppText>
        <AppText color="textSecondary">{t('Mistakes return until you remember them. Progress is saved on this device for your account.')}</AppText>
        {next ? <>
          <AppText variant="bodyStrong">{next.lesson.course.name} · {next.lesson.entry.title}</AppText>
          <AppText variant="caption">{t('{n} questions due', { n: due.length })}</AppText>
          <Card>
            <ExerciseView key={next.key} exercise={next.exercise} isLast={due.length === 1}
              onContinue={correct => {
                review.rateMistake(next.key, correct);
                if (correct) game.recordMistakeFixed();
                setCompleted(current => [...current, next.key]);
              }} />
          </Card>
        </> : <Card>
          <AppText variant="heading">{t('Review complete')}</AppText>
          <AppText>{t('Your next questions will appear here when they are due.')}</AppText>
          {review.mistakes.find(card => card.dueAt > now) && <AppText color="textSecondary">
            {t('Next review: {date}', { date: new Date(review.mistakes.find(card => card.dueAt > now)!.dueAt).toLocaleString() })}
          </AppText>}
        </Card>}
        <Button title={t('Back to Learn')} variant="secondary" onPress={() => {
          // Expo Router retains the originating learning screen.
          router.back();
        }} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: screenPadding, gap: spacing.md },
});
