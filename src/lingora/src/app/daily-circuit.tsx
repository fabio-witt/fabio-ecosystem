import * as Clipboard from 'expo-clipboard';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView } from 'react-native';

import { AppText, Button, Card, Screen, ScreenHeader } from '@/components/ui';
import { screenPadding, spacing } from '@/constants/theme';
import { circuitMedal, circuitQuestions, saveCircuitScore, weekMedals } from '@/features/game/daily-circuit';
import { coursePairs, type QuizQuestion } from '@/features/game/quiz';
import { useActiveCourse } from '@/features/learn/active-course';
import { courses } from '@/features/learn/catalog';
import { ExerciseView, type ScoredExercise } from '@/features/learn/exercise';
import { useNow } from '@/hooks/use-now';
import { useDeviceState } from '@/lib/device-state';
import { t } from '@/lib/i18n';
import { useSession } from '@/providers/session-provider';

type Round = {
  day: string;
  questions: QuizQuestion[];
  indices: number[];
  answers: boolean[];
  retry: boolean;
};
const empty: Record<string, number> = {};

export default function DailyCircuit() {
  const { course: code } = useLocalSearchParams<{ course?: string }>();
  const { course: active } = useActiveCourse();
  const chosen = courses.find(course => course.id === code) ?? active ?? courses[0];
  return <CircuitSession key={chosen.id} course={chosen} />;
}

function CircuitSession({ course }: { course: typeof courses[number] }) {
  const { user } = useSession();
  const [stored, save] = useDeviceState(user?.id, `daily-circuit.${course.id}`, empty);
  const [guest, setGuest] = useState(empty);
  const scores = user ? stored : guest;
  const day = new Date(useNow()).toISOString().slice(0, 10);
  const pairs = useMemo(() => coursePairs(course), [course]);
  const available = useMemo(() => circuitQuestions(pairs, course.id, day), [pairs, course.id, day]);
  const [round, setRound] = useState<Round>();
  const [picking, setPicking] = useState(false);
  const [copyStatus, setCopyStatus] = useState<'done' | 'error'>();
  const index = round?.indices[round.answers.length];
  const question = index === undefined ? undefined : round?.questions[index];
  const score = round?.answers.filter(Boolean).length ?? 0;
  const medal = round ? circuitMedal(score, round.indices.length) : null;
  const questionCount = available.length;
  const week = weekMedals(scores, day, questionCount);
  const badges = questionCount ? Object.values(scores).filter(value => circuitMedal(value, questionCount)).length : 0;

  function start() {
    setCopyStatus(undefined);
    setRound({ day, questions: available, indices: available.map((_, i) => i), answers: [], retry: false });
  }

  function answer(correct: boolean) {
    if (!round) return;
    const answers = [...round.answers, correct];
    if (!round.retry && answers.length === round.indices.length) {
      const points = answers.filter(Boolean).length;
      if (user) save(before => saveCircuitScore(before ?? {}, round.day, points));
      else setGuest(before => saveCircuitScore(before, round.day, points));
    }
    setRound({ ...round, answers });
  }

  async function copyScore() {
    if (!round) return;
    try {
      const text = `${t('Daily circuit')} · ${t(course.name)} · ${round.day}: ${score}/${round.indices.length}`;
      setCopyStatus(await Clipboard.setStringAsync(text) ? 'done' : 'error');
    } catch {
      setCopyStatus('error');
    }
  }

  const exercise: ScoredExercise | undefined = question && index !== undefined ? (
    index % 2 === 0 && !round?.retry
      ? { type: 'choice', prompt: question.pair.word, options: question.options, answer: question.options.indexOf(question.answer) }
      : { type: 'type', prompt: question.pair.meaning, accept: [question.pair.word], explain: question.pair.word }
  ) : undefined;

  return (
    <Screen>
      <ScreenHeader title={t('Daily circuit')} />
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: screenPadding, gap: spacing.md }}>
        {!round ? (
          <Card style={{ gap: spacing.sm }}>
            <AppText variant="heading">{t(course.name)}</AppText>
            <AppText>{t('Every day brings a new set. Recognise words, then recall them without choices.')}</AppText>
            <AppText>{t('Silver for all but one. Gold for a perfect round.')}</AppText>
            <AppText>{t('Medal days: {n}', { n: badges })}</AppText>
            <AppText variant="bodyStrong">{week >= 3 ? t('Weekly medal goal reached!') : t('Weekly goal: {n} of 3 medal days', { n: week })}</AppText>
            {scores[day] !== undefined && <AppText>{t('Best today: {n}', { n: scores[day] })}</AppText>}
            <Button title={t('Start practice')} disabled={!questionCount} onPress={start} />
            <Button title={t('Choose another language')} variant="ghost" onPress={() => setPicking(value => !value)} />
            {picking && courses.map(item => <Button key={item.id} title={`${item.flag} ${t(item.name)}`}
              variant="secondary" size="sm" disabled={item.id === course.id}
              onPress={() => router.setParams({ course: item.id })} />)}
          </Card>
        ) : exercise ? (
          <Card style={{ gap: spacing.sm }}>
            <AppText>{t('Question {n} of {total}', { n: round.answers.length + 1, total: round.indices.length })}</AppText>
            <AppText color="textSecondary">{exercise.type === 'type' ? t('Type the word in your practice language') : t('Choose the meaning')}</AppText>
            <ExerciseView key={`${round.retry}:${index}`} exercise={exercise} courseId={course.id}
              isLast={round.answers.length + 1 === round.indices.length} onContinue={answer} />
          </Card>
        ) : (
          <Card style={{ gap: spacing.sm }}>
            <AppText variant="heading">{!round.retry && medal ? (medal === 'gold' ? t('Gold medal') : t('Silver medal')) : t('Review complete')}</AppText>
            <AppText>{t('{correct} of {total} correct', { correct: score, total: round.indices.length })}</AppText>
            {!round.retry && score < round.indices.length && <Button title={t('Mistake rematch')} onPress={() => setRound({
              ...round,
              indices: round.indices.filter((_, i) => !round.answers[i]),
              answers: [],
              retry: true,
            })} />}
            {user && !round.retry && <Button title={t('Discuss this round')} variant="secondary"
              onPress={() => router.push({ pathname: '/forum/new', params: { course: course.id, practice: 'daily-circuit' } })} />}
            {!round.retry && <Button title={t('Copy practice result')} variant="secondary" onPress={() => void copyScore()} />}
            {copyStatus && <AppText accessibilityLiveRegion="polite">{copyStatus === 'done' ? t('Copied') : t('Could not copy')}</AppText>}
            <Button title={t('Play again')} variant="secondary" onPress={start} />
            <Button title={t('Done')} variant="ghost" onPress={() => setRound(undefined)} />
          </Card>
        )}
      </ScrollView>
    </Screen>
  );
}
