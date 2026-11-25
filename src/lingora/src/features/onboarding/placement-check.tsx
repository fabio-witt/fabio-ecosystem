import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { Medved } from '@/components/medved';
import { usePop } from '@/components/motion';
import { AppText, Button, Card } from '@/components/ui';
import { radius, spacing, useThemedStyles, type ThemeColors } from '@/constants/theme';
import { cefrNames, type CefrLevel } from '@/features/learn/catalog';

import { passMark, placementLevel, type PlacementStage, type StageResult } from './placement';
import { t } from '@/lib/i18n';

/** Option order that looks random but stays the same while a question is shown. */
function shuffledIndices(count: number, seed: string) {
  let hash = 0;
  for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) | 0;
  return Array.from({ length: count }, (_, index) => index)
    .map((index) => ({ index, key: Math.abs((hash ^ (index * 2654435761)) | 0) % 1000 }))
    .sort((a, b) => a.key - b.key)
    .map(({ index }) => index);
}

/**
 * Short adaptive level check. Works through the levels from A1 upwards and
 * stops at the first level where fewer than two of three answers are right.
 */
export function PlacementCheck({ stages, languageName, onSelect, onClose }: {
  stages: PlacementStage[];
  languageName: string;
  /** Called with the suggested level when the learner accepts it. */
  onSelect: (level: CefrLevel) => void;
  onClose: () => void;
}) {
  const { colors, styles } = useThemedStyles(createStyles);
  const [started, setStarted] = useState(false);
  const [stageIndex, setStageIndex] = useState(0);
  const [stageAnswers, setStageAnswers] = useState<boolean[]>([]);
  const [results, setResults] = useState<StageResult[]>([]);
  const stage = stages[stageIndex];
  const finished = started && (!stage || results.some(({ passed }) => !passed));
  const question = !finished ? stage?.questions[stageAnswers.length] : undefined;
  const pop = usePop(`${stageIndex}-${stageAnswers.length}-${finished}`);

  const totalQuestions = stages.reduce((count, item) => count + item.questions.length, 0);
  const asked = results.reduce((count, item) => count + item.total, 0) + stageAnswers.length;

  function answer(correct: boolean) {
    if (!stage) return;
    const next = [...stageAnswers, correct];
    if (next.length < stage.questions.length) {
      setStageAnswers(next);
      return;
    }
    const correctCount = next.filter(Boolean).length;
    setResults((current) => [...current, {
      level: stage.level,
      correct: correctCount,
      total: next.length,
      passed: correctCount >= passMark(next.length),
    }]);
    setStageAnswers([]);
    setStageIndex((index) => index + 1);
  }

  function restart() {
    setStarted(true);
    setStageIndex(0);
    setStageAnswers([]);
    setResults([]);
  }

  if (!started) {
    return (
      <Card style={styles.card}>
        <AppText variant="heading">{t("Quick level check")}</AppText>
        <AppText>{t('Find out where to start in {language}. It takes about 2 minutes.', { language: languageName })}</AppText>
        <View style={styles.steps}>
          <AppText variant="callout">{t("1. Answer short grammar questions, starting easy.")}</AppText>
          <AppText variant="callout">{t("2. Tap “I’m not sure” instead of guessing.")}</AppText>
          <AppText variant="callout">{t("3. We stop as soon as the questions get too hard and suggest your level.")}</AppText>
        </View>
        <Button title={t("Start the level check")} size="lg" fullWidth onPress={restart} />
        <Button title={t("Not now")} variant="ghost" onPress={onClose} />
      </Card>
    );
  }

  if (finished) {
    const level = placementLevel(stages, results);
    const allPassed = results.length > 0 && results.every(({ passed }) => passed);
    return (
      <Animated.View style={pop}>
        <Card style={styles.card}>
          <View style={styles.resultHead}>
            <Medved mood="cheer" size={72} />
            <View style={styles.flex}>
              <AppText variant="caption" color="textSecondary">{t("Your starting level")}</AppText>
              <AppText variant="title">{level} · {t(cefrNames[level])}</AppText>
            </View>
          </View>
          <View style={styles.levels}>
            {results.map((item) => (
              <View key={item.level} style={[styles.levelRow, { borderLeftColor: item.passed ? colors.success : colors.danger }]}>
                <AppText variant="bodyStrong" color={item.passed ? 'success' : 'danger'}>
                  {item.passed ? '✓' : '✗'} {item.level}
                </AppText>
                <AppText variant="caption" color="textSecondary">
                  {t('{correct} of {total} right', { correct: item.correct, total: item.total })} · {item.passed ? t('you know this level') : t('start here')}
                </AppText>
              </View>
            ))}
          </View>
          <AppText color="textSecondary">
            {allPassed
              ? `Great! You passed every level we could test. Your path starts at ${level}.`
              : `Your path starts at ${level}. Lessons before it stay open, so you can always go back and review.`}
          </AppText>
          <View style={styles.next}>
            <AppText variant="bodyStrong">{t("What happens next")}</AppText>
            <AppText variant="callout">{t("→ Tap the button below to save your level.")}</AppText>
            <AppText variant="callout">{t('→ You then get your first {level} lesson. Every lesson starts with the rule, then you practise.', { level })}</AppText>
          </View>
          <Button title={t('Start at {level} →', { level })} size="lg" fullWidth onPress={() => onSelect(level)} />
          <Button title={t("Choose a level myself")} variant="ghost" onPress={onClose} />
          <Button title={t("Take the check again")} variant="ghost" onPress={restart} />
        </Card>
      </Animated.View>
    );
  }

  if (!question || !stage) return null;
  return (
    <Card style={styles.card}>
      <View style={styles.progressHead}>
        <AppText variant="label" color="primary">
          {t('LEVEL {level} · QUESTION {n} OF {total}', { level: stage.level, n: stageAnswers.length + 1, total: stage.questions.length })}
        </AppText>
        <Button title={t("Stop")} variant="ghost" size="sm" onPress={onClose} />
      </View>
      <View style={styles.track} accessibilityRole="progressbar"
        accessibilityValue={{ min: 0, max: totalQuestions, now: asked }}>
        <View style={[styles.fill, { width: `${Math.max(4, (asked / Math.max(totalQuestions, 1)) * 100)}%` }]} />
      </View>
      <Animated.View style={[styles.question, pop]}>
        <AppText variant="caption" color="textSecondary">{t('From the lesson “{lesson}”', { lesson: question.lesson })}</AppText>
        <AppText variant="heading">{question.exercise.prompt}</AppText>
        {shuffledIndices(question.exercise.options.length, `${stageIndex}-${stageAnswers.length}-${question.exercise.prompt}`).map((index) => (
          <Button key={`${stageIndex}-${stageAnswers.length}-${index}`} title={question.exercise.options[index]} variant="secondary"
            style={styles.option} onPress={() => answer(index === question.exercise.answer)} />
        ))}
        <Button title={t("I’m not sure")} variant="ghost" onPress={() => answer(false)} />
      </Animated.View>
    </Card>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  flex: { flex: 1 },
  card: { gap: spacing.md },
  steps: { gap: spacing.xs, padding: spacing.md, borderRadius: radius.lg, backgroundColor: colors.surfaceMuted },
  progressHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  track: { height: 10, borderRadius: radius.full, backgroundColor: colors.surfaceMuted, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: radius.full, backgroundColor: colors.action },
  question: { gap: spacing.sm },
  option: { minHeight: 46, height: 'auto', paddingVertical: spacing.sm },
  resultHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  levels: { gap: spacing.xs },
  levelRow: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderLeftWidth: 4,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceMuted,
  },
  next: { gap: spacing.xs, padding: spacing.md, borderRadius: radius.lg, backgroundColor: colors.primarySoft },
});
