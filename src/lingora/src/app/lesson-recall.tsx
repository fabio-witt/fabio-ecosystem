import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView } from 'react-native';

import { AppText, Button, Card, Screen, ScreenHeader } from '@/components/ui';
import { screenPadding, spacing } from '@/constants/theme';
import { findLesson } from '@/features/learn/catalog';
import { ExerciseView } from '@/features/learn/exercise';
import { recallRound } from '@/features/learn/recall-round';
import { t } from '@/lib/i18n';

export default function LessonRecall() {
  const { lesson: id } = useLocalSearchParams<{ lesson?: string }>();
  const lesson = typeof id === 'string' ? findLesson(id) : undefined;
  return <RecallSession key={id} lesson={lesson} />;
}

function RecallSession({ lesson }: { lesson: ReturnType<typeof findLesson> }) {
  const round = lesson && 'examples' in lesson.entry ? recallRound(lesson.entry.examples) : [];
  const [results, answer] = useState<boolean[]>([]);
  const [attempt, setAttempt] = useState(0);
  const current = round[results.length];
  return (
    <Screen>
      <ScreenHeader title={t('Recall round')} />
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: screenPadding, gap: spacing.md }}>
        {lesson && <AppText variant="heading">{lesson.entry.title}</AppText>}
        {current ? <Card style={{ gap: spacing.sm }}>
          <AppText>{t('Complete the sentence without a timer or hearts.')}</AppText>
          <AppText>{t('Question {n} of {total}', { n: results.length + 1, total: round.length })}</AppText>
          <ExerciseView key={`${attempt}:${results.length}`} exercise={current} courseId={lesson?.course.id}
            isLast={results.length + 1 === round.length} onContinue={correct => answer(before => [...before, correct])} />
        </Card> : round.length ? <Card style={{ gap: spacing.sm }}>
          <AppText variant="heading">{t('Review complete')}</AppText>
          <AppText>{t('{correct} of {total} correct', { correct: results.filter(Boolean).length, total: round.length })}</AppText>
          <Button title={t('Practise again')} variant="secondary" onPress={() => { setAttempt(value => value + 1); answer([]); }} />
          <Button title={t('Back to results')} onPress={() => router.back()} />
        </Card> : <AppText>{t('This lesson has no examples for a recall round.')}</AppText>}
      </ScrollView>
    </Screen>
  );
}
