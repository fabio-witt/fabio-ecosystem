import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Medved } from '@/components/medved';
import { AppText, Button, Card, Screen, ScreenHeader } from '@/components/ui';
import { radius, screenPadding, spacing, useThemedStyles, type ThemeColors } from '@/constants/theme';
import { buildQuestions, coursePairs } from '@/features/game/quiz';
import { QuizRunner } from '@/features/game/quiz-runner';
import { useGame } from '@/features/game/store';
import { courses } from '@/features/learn/catalog';
import { usePracticeReview } from '@/features/learn/practice-review';
import { t } from '@/lib/i18n';

const SECONDS = 60;

/** 60-second word sprint: as many right answers as possible. */
export default function SprintScreen() {
  const { course: courseId } = useLocalSearchParams<{ course?: string }>();
  const course = courses.find((item) => item.id === courseId) ?? courses[0];
  const { styles } = useThemedStyles(createStyles);
  const game = useGame();
  const review = usePracticeReview();
  const pairs = useMemo(() => coursePairs(course), [course]);
  const [round, setRound] = useState(0);
  const [phase, setPhase] = useState<'ready' | 'play' | 'done'>('ready');
  const [result, setResult] = useState({ correct: 0, answered: 0, record: false });
  const questions = useMemo(() => buildQuestions(pairs, 200), [pairs, round]); // eslint-disable-line react-hooks/exhaustive-deps
  const best = game.state.sprintBest[course.id] ?? 0;

  return (
    <Screen edges={['top', 'bottom', 'left', 'right']}>
      <ScreenHeader title={t('⏱️ 60-second sprint')} />
      <ScrollView contentContainerStyle={styles.content}>
        {phase === 'ready' ? (
          <Card style={styles.center}>
            <Medved mood="cheer" size={110} />
            <AppText variant="title" align="center">{course.flag} {t(course.name)}</AppText>
            <AppText align="center" color="textSecondary">
              {t('Answer as many words as you can in 60 seconds. Wrong answers cost time to read the solution.')}
            </AppText>
            <View style={styles.best}><AppText variant="bodyStrong">{t('Your record: {n}', { n: best })}</AppText></View>
            {questions.length ? (
              <Button title={t('Start sprint')} size="lg" fullWidth onPress={() => setPhase('play')} />
            ) : (
              <AppText color="textSecondary">{t('This course does not have enough translated words for the trainer yet.')}</AppText>
            )}
          </Card>
        ) : null}
        {phase === 'play' ? (
          <QuizRunner
            key={round}
            questions={questions}
            seconds={SECONDS}
            onAnswer={(question, right) => { review.rateWord(question.pair.key, right); game.recordWord(right); }}
            onFinish={(correct, answered) => {
              setResult({ correct, answered, record: correct > best });
              game.recordSprint(course.id, correct);
              setPhase('done');
            }}
          />
        ) : null}
        {phase === 'done' ? (
          <Card style={styles.center}>
            <Medved mood={result.record ? 'cheer' : 'happy'} size={110} />
            <AppText variant="title" align="center">{result.record ? t('New record!') : t('Time is up!')}</AppText>
            <AppText style={styles.score}>{result.correct}</AppText>
            <AppText color="textSecondary">{t('{correct} of {answered} right', { correct: result.correct, answered: result.answered })}</AppText>
            <Button title={t('Play again')} size="lg" fullWidth onPress={() => { setRound((value) => value + 1); setPhase('play'); }} />
            <Button title={t('Done')} variant="ghost" onPress={() => router.back()} />
          </Card>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  content: { width: '100%', maxWidth: 560, alignSelf: 'center', padding: screenPadding, paddingBottom: spacing.xxxl, gap: spacing.md },
  center: { alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xl },
  best: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.full, backgroundColor: colors.primarySoft },
  score: { fontSize: 64, lineHeight: 72, fontWeight: '900', color: colors.text },
});
