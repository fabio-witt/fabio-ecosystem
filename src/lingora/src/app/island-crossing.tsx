import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';

import { AppText, Button, Card, Screen, ScreenHeader } from '@/components/ui';
import { screenPadding, spacing } from '@/constants/theme';
import { useGame } from '@/features/game/store';
import { courses, entriesForUnit, shuffled } from '@/features/learn/catalog';
import { ExerciseView, type ScoredExercise } from '@/features/learn/exercise';
import { EncounterPortrait, IslandArt } from '@/features/learn/island-art';
import { crossingBadge, crossingExercises, encounterAfterUnit, islandForUnit } from '@/features/learn/island-route';
import { useLearnProgress } from '@/features/learn/progress';
import { t } from '@/lib/i18n';

type Round = { questions: ScoredExercise[]; answers: boolean[] };

function backToPath() {
  if (router.canGoBack()) router.back();
  else router.replace('/learn');
}

export default function IslandCrossing() {
  const { course: courseId, unit: rawIndex } = useLocalSearchParams<{ course?: string; unit?: string }>();
  const course = courses.find(item => item.id === courseId);
  const index = typeof rawIndex === 'string' && /^\d+$/.test(rawIndex) ? Number(rawIndex) : -1;
  if (!course || !course.units[index] || !course.units[index + 1]) {
    return (
      <Screen>
        <ScreenHeader title={t('Island crossing')} />
        <View style={styles.content}>
          <AppText>{t('This crossing does not exist.')}</AppText>
          <Button title={t('Back to the map')} onPress={backToPath} />
        </View>
      </Screen>
    );
  }

  return <CrossingRound key={crossingBadge(course.id, index)} course={course} index={index} />;
}

function CrossingRound({ course, index }: { course: typeof courses[number]; index: number }) {
  const game = useGame();
  const progress = useLearnProgress();
  const [round, setRound] = useState<Round>();
  const [attempt, setAttempt] = useState(0);
  const encounter = encounterAfterUnit(index);
  const destination = islandForUnit(index + 1);
  const available = crossingExercises(entriesForUnit(course.units[index]), progress.data);
  const total = Math.min(available.length, 3);
  const step = round?.answers.length ?? 0;
  const question = round?.questions[step];
  const correct = round?.answers.filter(Boolean).length ?? 0;
  const passed = !!round && correct >= requiredToPass(round.questions.length);

  function start() {
    setAttempt(value => value + 1);
    setRound({ questions: shuffled(available).slice(0, total), answers: [] });
  }

  function answer(right: boolean) {
    if (!round) return;
    const answers = [...round.answers, right];
    setRound({ ...round, answers });
    if (answers.length === round.questions.length && answers.filter(Boolean).length >= requiredToPass(answers.length)) {
      game.stampIslandCrossing(crossingBadge(course.id, index));
    }
  }

  return (
    <Screen edges={['top', 'bottom', 'left', 'right']}>
      <ScreenHeader title={t('Island crossing')} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView key={`${attempt}:${step}`} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
          <Card style={styles.group}>
            <View style={styles.encounter}>
              <EncounterPortrait encounter={encounter} />
              <View style={styles.flex}>
                <AppText variant="label" color="textSecondary">{t('Destination: {island}', { island: t(destination.name) })}</AppText>
                <AppText variant="heading" accessibilityRole="header">{t(encounter.name)}</AppText>
              </View>
            </View>
            {!round ? (
              <>
                <AppText>{t(encounter.briefing)}</AppText>
                <AppText color="textSecondary">{progress.isError
                  ? t('Saved progress could not be loaded on this device.')
                  : progress.isPending ? t('Loading…') : total
                    ? t('Get {required} of {total} questions right to earn a stamp.', { required: requiredToPass(total), total })
                    : t('Complete a lesson with exercises on this island to set sail.')}</AppText>
                <Button title={t('Set sail')} onPress={start} disabled={!available.length} />
              </>
            ) : null}
            {round && (
              <View style={styles.checkpoints} aria-hidden>
                {round.questions.map((_, position) => {
                  const answer = round.answers[position];
                  const mark = answer === true ? '✓' : answer === false ? '×' : position === step ? '⛵' : '·';
                  const backgroundColor = answer === true ? '#246F5B' : answer === false ? '#835049' : '#174356';
                  return (
                    <View key={position} style={[styles.checkpoint, { backgroundColor }]}>
                      <AppText variant="bodyStrong" style={styles.checkpointMark}>{mark}</AppText>
                    </View>
                  );
                })}
              </View>
            )}
            {round && (question ? (
              <>
                <AppText>{t('Question {n} of {total}', { n: step + 1, total: round.questions.length })}</AppText>
                <ExerciseView key={step} exercise={question} courseId={course.id}
                  isLast={step + 1 === round.questions.length} onContinue={answer} />
              </>
            ) : (
              <>
                {passed && <IslandArt island={destination} />}
                <AppText variant="heading" accessibilityLiveRegion="polite">
                  {passed ? t('Crossing stamp earned!') : t('Try the crossing again')}
                </AppText>
                <AppText>{t('{correct} of {total} correct', { correct, total: round.questions.length })}</AppText>
                <Button title={t('Back to the map')} onPress={backToPath} />
                <Button title={t('Play again')} variant="secondary" disabled={!available.length} onPress={start} />
              </>
            ))}
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

function requiredToPass(total: number) {
  return Math.ceil(total * 2 / 3);
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: screenPadding, paddingBottom: spacing.xl, gap: spacing.md },
  group: { gap: spacing.md, width: '100%', maxWidth: 640, alignSelf: 'center' },
  encounter: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  checkpoints: { flexDirection: 'row', gap: spacing.xs },
  checkpoint: { flex: 1, alignItems: 'center', padding: spacing.xs, borderRadius: 10 },
  checkpointMark: { color: '#FFFFFF' },
});
