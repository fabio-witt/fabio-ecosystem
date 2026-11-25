import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Confetti } from '@/components/confetti';
import { Flag } from '@/components/flag';
import { Medved } from '@/components/medved';
import { AppText, Button, Card, Screen, ScreenHeader } from '@/components/ui';
import { radius, screenPadding, spacing, useThemedStyles, type ThemeColors } from '@/constants/theme';
import { useActiveCourse } from '@/features/learn/active-course';
import { cefrNames, courses, type CefrLevel } from '@/features/learn/catalog';
import { courseLevels, examQuestions, type ExamQuestion } from '@/features/learn/exams';
import { ExerciseView } from '@/features/learn/exercise';
import { useAddCourseLanguage } from '@/features/profile/learning-language';
import { feedback } from '@/lib/feedback';
import { t } from '@/lib/i18n';

const PER_LEVEL = 5;
const PASS = 4;

/**
 * Adaptive placement test: five questions per level, starting at A1.
 * Four right → the next level; otherwise the test stops and recommends that level.
 */
export default function PlacementScreen() {
  const { styles } = useThemedStyles(createStyles);
  const params = useLocalSearchParams<{ course?: string }>();
  const active = useActiveCourse();
  const course = courses.find((item) => item.id === (params.course ?? active.course?.id)) ?? active.course;
  const addLanguage = useAddCourseLanguage();
  const levels = course ? courseLevels(course) : [];
  const [seed] = useState(() => Math.floor(Math.random() * 1e9));
  const [levelIndex, setLevelIndex] = useState(0);
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [step, setStep] = useState(-1);
  const [right, setRight] = useState(0);
  const [result, setResult] = useState<CefrLevel | null>(null);

  if (!course) {
    return (
      <Screen edges={['top', 'bottom', 'left', 'right']}>
        <ScreenHeader title={t('Placement test')} />
        <View style={styles.content}><AppText>{t('Choose a course first.')}</AppText>
          <Button title={t('Open Learn')} onPress={() => router.replace('/learn')} /></View>
      </Screen>
    );
  }

  function startLevel(index: number) {
    setLevelIndex(index);
    setQuestions(examQuestions(course!, levels[index], seed + index * 101).slice(0, PER_LEVEL));
    setStep(0);
    setRight(0);
  }

  function answer(correct: boolean) {
    const nextRight = right + (correct ? 1 : 0);
    if (step + 1 < questions.length) { setRight(nextRight); setStep(step + 1); return; }
    const passed = nextRight >= PASS;
    if (passed && levelIndex + 1 < levels.length) { startLevel(levelIndex + 1); return; }
    // Passed the top level → recommend it; otherwise start at the level that was too hard.
    const level = levels[levelIndex];
    setResult(level);
    feedback('win');
    void addLanguage(course!, level);
    active.choose(course!.id);
  }

  return (
    <Screen edges={['top', 'bottom', 'left', 'right']}>
      <ScreenHeader title={t('Placement test')} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {result ? (
          <Card style={styles.center}>
            <Medved mood="cheer" size={110} />
            <AppText variant="title" align="center">{t('Start at {level}', { level: result })}</AppText>
            <AppText align="center" color="textSecondary">{t(cefrNames[result])} · {t(course.name)}</AppText>
            <AppText align="center">{t('Your level is saved. Lessons below it stay open, so you can repeat anything.')}</AppText>
            <Button title={t('Go to my learning path')} size="lg" fullWidth onPress={() => router.replace('/learn')} />
          </Card>
        ) : step < 0 ? (
          <Card style={styles.center}>
            <Flag emoji={course.flag} size={44} />
            <AppText variant="title" align="center">{t('How good is your {course} already?', { course: t(course.name) })}</AppText>
            <AppText align="center" color="textSecondary">{t('About 5–10 minutes. Five questions per level – the test stops as soon as it gets too hard. No hearts are lost.')}</AppText>
            <View style={styles.levels}>{levels.map((level) => <AppText key={level} style={styles.level}>{level}</AppText>)}</View>
            <Button title={t('Start the test')} size="lg" fullWidth onPress={() => startLevel(0)} />
          </Card>
        ) : (
          <>
            <AppText variant="label" color="primary">{t('Level {level} · question {n} of {total}', { level: levels[levelIndex], n: step + 1, total: questions.length })}</AppText>
            <Card>
              <ExerciseView key={`${levelIndex}-${step}`} exercise={questions[step].exercise} isLast={false} courseId={course.id}
                onContinue={(correct) => answer(correct)} />
            </Card>
          </>
        )}
      </ScrollView>
      {result ? <Confetti /> : null}
    </Screen>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  content: { width: '100%', maxWidth: 560, alignSelf: 'center', padding: screenPadding, paddingBottom: spacing.xxxl, gap: spacing.md },
  center: { alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xl },
  levels: { flexDirection: 'row', gap: spacing.xs, flexWrap: 'wrap', justifyContent: 'center' },
  level: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.full, backgroundColor: colors.surfaceMuted, fontWeight: '800' },
});
