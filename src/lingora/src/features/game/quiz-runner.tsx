import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { usePop, useShake } from '@/components/motion';
import { AppText } from '@/components/ui';
import { radius, spacing, useThemedStyles, type ThemeColors } from '@/constants/theme';
import { t } from '@/lib/i18n';

import type { QuizQuestion } from './quiz';

/**
 * Fast multiple-choice round used by the sprint and duels.
 * Answers advance automatically; an optional timer ends the round.
 */
export function QuizRunner({ questions, seconds, onAnswer, onFinish }: {
  questions: QuizQuestion[];
  seconds?: number;
  onAnswer?: (question: QuizQuestion, right: boolean) => void;
  onFinish: (correct: number, answered: number) => void;
}) {
  const { colors, styles } = useThemedStyles(createStyles);
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [correct, setCorrect] = useState(0);
  const [misses, setMisses] = useState(0);
  const [left, setLeft] = useState(seconds ?? 0);
  const finished = useRef(false);
  const score = useRef({ correct: 0, answered: 0 });
  const shake = useShake(misses);
  const pop = usePop(index);
  const question = questions[index];

  const finish = () => {
    if (finished.current) return;
    finished.current = true;
    onFinish(score.current.correct, score.current.answered);
  };

  useEffect(() => {
    if (!seconds) return;
    const timer = setInterval(() => {
      setLeft((value) => {
        if (value <= 1) {
          clearInterval(timer);
          setTimeout(finish, 0);
          return 0;
        }
        return value - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seconds]);

  function choose(option: string) {
    if (!question || picked || finished.current) return;
    const right = option === question.answer;
    setPicked(option);
    score.current = { correct: score.current.correct + (right ? 1 : 0), answered: score.current.answered + 1 };
    if (right) setCorrect((value) => value + 1);
    else setMisses((value) => value + 1);
    onAnswer?.(question, right);
    setTimeout(() => {
      if (index + 1 >= questions.length) finish();
      else {
        setPicked(null);
        setIndex(index + 1);
      }
    }, right ? 350 : 900);
  }

  if (!question) return null;
  return (
    <View style={styles.wrap}>
      <View style={styles.meta}>
        {seconds ? (
          <View style={[styles.timer, left <= 10 && styles.timerLow]} accessibilityLiveRegion="polite"
            accessibilityLabel={t('{n} seconds left', { n: left })}>
            <AppText variant="bodyStrong" style={left <= 10 ? styles.onDanger : undefined}>⏱️ {left}s</AppText>
          </View>
        ) : (
          <AppText variant="caption" color="textSecondary">{t('Question {n} of {total}', { n: index + 1, total: questions.length })}</AppText>
        )}
        <AppText variant="bodyStrong">✅ {correct}</AppText>
      </View>
      {seconds ? (
        <View style={styles.track}><View style={[styles.fill, { width: `${(left / seconds) * 100}%` }]} /></View>
      ) : null}
      <Animated.View style={[styles.question, pop]}>
        <AppText variant="label" color="primary">{t('WHAT DOES THIS MEAN?')}</AppText>
        <AppText variant="display" align="center">{question.pair.word}</AppText>
      </Animated.View>
      <Animated.View style={[styles.options, shake]}>
        {question.options.map((option) => {
          const state = !picked ? 'idle' : option === question.answer ? 'right' : option === picked ? 'wrong' : 'idle';
          return (
            <Pressable key={option} accessibilityRole="button" disabled={!!picked} onPress={() => choose(option)}
              style={({ pressed }) => [styles.option,
                state === 'right' && { backgroundColor: colors.successSoft, borderColor: colors.success },
                state === 'wrong' && { backgroundColor: colors.dangerSoft, borderColor: colors.danger },
                pressed && styles.pressed]}>
              <AppText variant="bodyStrong" align="center"
                color={state === 'right' ? 'success' : state === 'wrong' ? 'danger' : 'text'}>{option}</AppText>
            </Pressable>
          );
        })}
      </Animated.View>
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  wrap: { gap: spacing.md },
  meta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  timer: { paddingHorizontal: spacing.md, paddingVertical: 4, borderRadius: radius.full, backgroundColor: colors.surfaceMuted },
  timerLow: { backgroundColor: colors.danger },
  onDanger: { color: '#FFFFFF' },
  track: { height: 10, borderRadius: radius.full, backgroundColor: colors.surfaceMuted, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: radius.full, backgroundColor: '#F2B705' },
  question: { alignItems: 'center', gap: spacing.xs, paddingVertical: spacing.lg },
  options: { gap: spacing.sm },
  option: {
    minHeight: 54, justifyContent: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm,
    borderRadius: radius.xl, borderWidth: 2, borderBottomWidth: 4, borderColor: colors.border, backgroundColor: colors.surface,
  },
  pressed: { transform: [{ translateY: 2 }] },
});
