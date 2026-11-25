import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, { ReduceMotion, ZoomIn } from 'react-native-reanimated';

import { Flag } from '@/components/flag';
import { Medved } from '@/components/medved';
import { AppText, Button, Card, Screen, ScreenHeader } from '@/components/ui';
import { radius, screenPadding, spacing, useThemedStyles, type ThemeColors } from '@/constants/theme';
import { celebrate } from '@/features/game/celebrations';
import { levelColors } from '@/features/learn/badges';
import { cefrLevels, cefrNames, courses, type CefrLevel } from '@/features/learn/catalog';
import { EXAM_PASS, examId, examQuestions, type ExamQuestion } from '@/features/learn/exams';
import { ExerciseView } from '@/features/learn/exercise';
import { useCompleteLesson, useLearnProgress } from '@/features/learn/progress';
import { t } from '@/lib/i18n';
import { track } from '@/lib/insights';

/**
 * Final exam of a CEFR level: questions from all its lessons and stories.
 * Passing with at least 80 % earns the level badge and certificate.
 * No hearts are lost here.
 */
export default function ExamScreen() {
  const { styles } = useThemedStyles(createStyles);
  const params = useLocalSearchParams<{ course?: string; level?: string }>();
  const course = courses.find((item) => item.id === params.course);
  const level = cefrLevels.includes(params.level as CefrLevel) ? (params.level as CefrLevel) : 'A1';
  const id = course ? examId(course.id, level) : '';
  const save = useCompleteLesson(id);
  const best = useLearnProgress().data?.[id];

  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [index, setIndex] = useState(-1);
  const [answers, setAnswers] = useState<boolean[]>([]);
  // Different questions on every attempt.
  const [seed] = useState(() => Math.floor(Math.random() * 1_000_000_000));
  const [attempt, setAttempt] = useState(0);

  if (!course) {
    return (
      <Screen edges={['top', 'bottom', 'left', 'right']}>
        <ScreenHeader title={t('Level exam')} />
        <AppText style={styles.content}>{t('This exam does not exist.')}</AppText>
      </Screen>
    );
  }

  const started = index >= 0;
  const finished = started && index >= questions.length;
  const correct = answers.filter(Boolean).length;
  const score = questions.length ? Math.round((correct / questions.length) * 100) : 0;
  const passed = score >= EXAM_PASS;

  function start() {
    setQuestions(examQuestions(course!, level, seed + attempt * 7919));
    setAttempt(attempt + 1);
    track('exam_started', { course: course!.id, level });
    setAnswers([]);
    setIndex(0);
  }

  function answer(right: boolean) {
    const next = [...answers, right];
    setAnswers(next);
    if (next.length === questions.length) {
      const result = Math.round((next.filter(Boolean).length / questions.length) * 100);
      save.mutate(result);
      if (result >= EXAM_PASS) {
        track('exam_passed', { course: course!.id, level, score: result });
        celebrate({ icon: '🏆', title: t('Level {level} passed!', { level }), message: t('Your badge and certificate are ready.') });
      }
    }
    setIndex(index + 1);
  }

  // Lessons to review: the ones behind the wrong answers.
  const toReview = [...new Map(questions.filter((_, position) => answers[position] === false)
    .map((question) => [question.lessonId, question.lessonTitle])).entries()];

  return (
    <Screen edges={['top', 'bottom', 'left', 'right']}>
      <ScreenHeader title={t('{level} exam · {course}', { level, course: t(course.name) })} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {!started ? (
          <Card style={styles.center}>
            <View style={[styles.medal, { backgroundColor: levelColors[level] }]}>
              <AppText style={styles.medalText}>{level}</AppText>
            </View>
            <AppText variant="title" align="center">{t('Final exam {level}', { level })}</AppText>
            <AppText align="center" color="textSecondary">
              {t('{course} · {name}', { course: t(course.name), name: t(cefrNames[level]) })}
            </AppText>
            <View style={styles.rules}>
              <Rule icon="📝" text={t('Questions from all lessons and stories of this level')} />
              <Rule icon="🎯" text={t('Pass with at least {n}% correct', { n: EXAM_PASS })} />
              <Rule icon="❤️" text={t('No hearts are lost in the exam')} />
              <Rule icon="🏅" text={t('Passing gives you the {level} badge and a certificate', { level })} />
            </View>
            {best !== undefined ? (
              <AppText variant="caption" color={best >= EXAM_PASS ? 'success' : 'textSecondary'}>
                {best >= EXAM_PASS ? t('Already passed with {n}%. You can try to improve.', { n: best }) : t('Best attempt so far: {n}%', { n: best })}
              </AppText>
            ) : null}
            <Button title={t('Start the exam')} size="lg" fullWidth onPress={start} />
          </Card>
        ) : finished ? (
          <Card style={styles.center}>
            <Animated.View entering={ZoomIn.duration(450).reduceMotion(ReduceMotion.System)}>
              <Medved mood={passed ? 'cheer' : 'happy'} size={110} />
            </Animated.View>
            <AppText variant="title" align="center">{passed ? t('Passed! 🎉') : t('Not passed yet')}</AppText>
            <AppText style={[styles.score, { color: passed ? '#2E9D5B' : '#C0392B' }]}>{score}%</AppText>
            <AppText color="textSecondary" align="center">
              {t('{correct} of {total} correct · needed: {n}%', { correct, total: questions.length, n: EXAM_PASS })}
            </AppText>
            {save.isError ? (
              <AppText color="danger" align="center">{t('Your result could not be saved. Check your connection and try again.')}</AppText>
            ) : null}
            {passed ? (
              <>
                <Button title={t('🎓 View my certificate')} size="lg" fullWidth
                  onPress={() => router.replace({ pathname: '/certificate', params: { course: course.id, level } })} />
                <Button title={t('Back to the path')} variant="ghost" onPress={() => router.back()} />
              </>
            ) : (
              <>
                {toReview.length ? (
                  <View style={styles.review}>
                    <AppText variant="bodyStrong">{t('Review these lessons:')}</AppText>
                    {toReview.slice(0, 6).map(([lessonId, title]) => (
                      <AppText key={lessonId} color="primary" onPress={() => router.push({ pathname: '/lesson/[id]', params: { id: lessonId } })}>
                        • {title}
                      </AppText>
                    ))}
                  </View>
                ) : null}
                <Button title={t('Try again')} size="lg" fullWidth onPress={start} />
                <Button title={t('Back to the path')} variant="ghost" onPress={() => router.back()} />
              </>
            )}
          </Card>
        ) : (
          <>
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${Math.max(4, (index / questions.length) * 100)}%`, backgroundColor: levelColors[level] }]} />
            </View>
            <View style={styles.meta}>
              <AppText variant="caption" color="textSecondary">{t('Question {n} of {total}', { n: index + 1, total: questions.length })}</AppText>
              <View style={styles.metaRight}>
                <Flag emoji={course.flag} size={18} />
                <AppText variant="caption" style={styles.bold}>{level}</AppText>
              </View>
            </View>
            <Card>
              <ExerciseView key={index} exercise={questions[index].exercise} isLast={index === questions.length - 1}
                onContinue={(right) => answer(right)} />
            </Card>
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

function Rule({ icon, text }: { icon: string; text: string }) {
  const { styles } = useThemedStyles(createStyles);
  return (
    <View style={styles.rule}>
      <AppText style={styles.ruleIcon} accessible={false}>{icon}</AppText>
      <AppText variant="callout" style={styles.flex}>{text}</AppText>
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  content: { width: '100%', maxWidth: 560, alignSelf: 'center', padding: screenPadding, paddingBottom: spacing.xxxl, gap: spacing.md },
  flex: { flex: 1 },
  bold: { fontWeight: '800' },
  center: { alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xl },
  medal: { width: 84, height: 84, borderRadius: 42, alignItems: 'center', justifyContent: 'center', borderWidth: 4, borderColor: '#F2B705' },
  medalText: { color: '#FFFFFF', fontSize: 28, lineHeight: 34, fontWeight: '900' },
  rules: { alignSelf: 'stretch', gap: spacing.sm, padding: spacing.md, borderRadius: radius.lg, backgroundColor: colors.surfaceMuted },
  rule: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  ruleIcon: { fontSize: 20, lineHeight: 26, width: 28, textAlign: 'center' },
  score: { fontSize: 56, lineHeight: 64, fontWeight: '900' },
  review: { alignSelf: 'stretch', gap: 4, padding: spacing.md, borderRadius: radius.lg, backgroundColor: colors.surfaceMuted },
  track: { height: 12, borderRadius: radius.full, backgroundColor: colors.surfaceMuted, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: radius.full },
  meta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  metaRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
});
