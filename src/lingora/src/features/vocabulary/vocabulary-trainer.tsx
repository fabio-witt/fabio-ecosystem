import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { Medved } from '@/components/medved';
import { usePop, useShake } from '@/components/motion';
import { AppText, Button, Card } from '@/components/ui';
import { radius, screenPadding, spacing, useThemedStyles, type ThemeColors } from '@/constants/theme';
import { usePracticeReview } from '@/features/learn/practice-review';
import { trainerPairs } from './pairs';
import { t } from '@/lib/i18n';
import { canSpeak, speak, useVoicesReady } from '@/lib/speech';

import type { Topic } from './catalog';
import { useGame } from '@/features/game/store';

const ROUNDS = 10;
type Pair = { key: string; word: string; meaning: string };
type Round = { pair: Pair; toMeaning: boolean; options: string[]; answer: string };

function shuffle<T>(items: T[]) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index--) {
    const swap = Math.floor(Math.random() * (index + 1));
    [result[index], result[swap]] = [result[swap], result[index]];
  }
  return result;
}

export { trainerPairs };

/** Words due for review first, then new words, then the rest. */
function buildRounds(pairs: Pair[], schedule: Record<string, { stage: number; dueAt: number }>, listen = false): Round[] {
  const now = Date.now();
  const due = shuffle(pairs.filter((pair) => schedule[pair.key] && schedule[pair.key].dueAt <= now));
  const fresh = shuffle(pairs.filter((pair) => !schedule[pair.key]));
  const rest = shuffle(pairs.filter((pair) => schedule[pair.key] && schedule[pair.key].dueAt > now));
  const picked = [...due, ...fresh, ...rest].slice(0, ROUNDS);
  return picked.map((pair, index) => {
    const toMeaning = listen || index % 2 === 0;
    const answer = toMeaning ? pair.meaning : pair.word;
    const others = shuffle(pairs.filter((item) => item.key !== pair.key))
      .map((item) => (toMeaning ? item.meaning : item.word))
      .filter((value, position, list) => value !== answer && list.indexOf(value) === position)
      .slice(0, 3);
    return { pair, toMeaning, answer, options: shuffle([answer, ...others]) };
  });
}

/**
 * Quick multiple-choice vocabulary game: 10 rounds, alternating
 * word → meaning and meaning → word, with a combo streak and points.
 * Results feed the same review schedule as the flashcards.
 */
export function VocabularyTrainer({ courseId, topics, onBack, mode = 'mixed', onFinish, backLabel }: {
  courseId: string; topics: Topic[]; onBack: () => void; mode?: 'mixed' | 'listen';
  /** Called once when the last question is answered. */
  onFinish?: (correct: number, total: number) => void;
  backLabel?: string;
}) {
  useVoicesReady();
  const listen = mode === 'listen' && canSpeak(courseId);
  const { colors, styles } = useThemedStyles(createStyles);
  const review = usePracticeReview();
  const game = useGame();
  const pairs = useMemo(() => trainerPairs(courseId, topics), [courseId, topics]);
  const [rounds, setRounds] = useState(() => buildRounds(pairs, review.words, listen));
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [points, setPoints] = useState(0);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [misses, setMisses] = useState(0);
  const shake = useShake(misses);
  const round = rounds[index];
  const pop = usePop(`${index}-${picked ?? ''}`);
  const finished = index >= rounds.length;

  // Listening mode reads every new word aloud.
  useEffect(() => {
    if (listen && rounds[index]) speak(rounds[index].pair.word, courseId);
  }, [listen, index, rounds, courseId]);

  function choose(option: string) {
    if (!round || picked) return;
    const right = option === round.answer;
    setPicked(option);
    review.rateWord(round.pair.key, right);
    game.recordWord(right);
    if (right) {
      const nextCombo = combo + 1;
      setCombo(nextCombo);
      setBestCombo((best) => Math.max(best, nextCombo));
      setCorrectCount((count) => count + 1);
      setPoints((total) => total + 10 + Math.min(combo, 5) * 2);
    } else {
      setCombo(0);
      setMisses((count) => count + 1);
    }
  }

  function next() {
    setPicked(null);
    if (index + 1 >= rounds.length) onFinish?.(correctCount, rounds.length);
    setIndex((current) => current + 1);
  }

  function restart() {
    setRounds(buildRounds(pairs, review.words, listen));
    setIndex(0);
    setPicked(null);
    setPoints(0);
    setCombo(0);
    setBestCombo(0);
    setCorrectCount(0);
  }

  if (pairs.length < 4) {
    return (
      <ScrollView contentContainerStyle={styles.content}>
        <Button title={backLabel ?? t('‹ Vocabulary')} variant="ghost" onPress={onBack} style={styles.back} />
        <Card style={styles.group}>
          <AppText variant="heading">{t('Vocabulary trainer')}</AppText>
          <AppText color="textSecondary">{t('This course does not have enough translated words for the trainer yet.')}</AppText>
        </Card>
      </ScrollView>
    );
  }

  if (finished) {
    const great = correctCount >= rounds.length * 0.8;
    return (
      <ScrollView contentContainerStyle={styles.content}>
        <Button title={backLabel ?? t('‹ Vocabulary')} variant="ghost" onPress={onBack} style={styles.back} />
        <Animated.View style={pop}>
          <Card style={styles.result}>
            <Medved mood={great ? 'cheer' : 'happy'} size={110} />
            <AppText variant="title" align="center">{great ? t('Fantastic!') : t('Good practice!')}</AppText>
            <View style={styles.statRow}>
              <Stat value={`${correctCount}/${rounds.length}`} label={t('correct')} />
              <Stat value={`⚡ ${points}`} label={t('points')} />
              <Stat value={`🔥 ${bestCombo}`} label={t('best combo')} />
            </View>
            <AppText align="center" color="textSecondary">
              {t('Words you missed come back sooner. Words you knew return in a few days.')}
            </AppText>
            <Button title={t('Train again')} size="lg" fullWidth onPress={restart} />
            <Button title={backLabel ? t('Back to the path') : t('Back to vocabulary')} variant="ghost" onPress={onBack} />
          </Card>
        </Animated.View>
      </ScrollView>
    );
  }

  const progress = index / rounds.length;
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.topRow}>
        <Button title={backLabel ?? t('‹ Vocabulary')} variant="ghost" onPress={onBack} style={styles.back} />
        <AppText variant="bodyStrong">⚡ {points}</AppText>
      </View>
      <View style={styles.track} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: rounds.length, now: index }}>
        <View style={[styles.fill, { width: `${Math.max(progress * 100, 4)}%` }]} />
      </View>
      <View style={styles.metaRow}>
        <AppText variant="caption" color="textSecondary">{t('Question {n} of {total}', { n: index + 1, total: rounds.length })}</AppText>
        {combo >= 2 ? <AppText variant="caption" style={styles.combo}>{t('🔥 Combo ×{n}', { n: combo })}</AppText> : null}
      </View>

      <Animated.View style={[styles.question, pop]}>
        <AppText variant="label" color="primary">
          {listen ? t('LISTEN AND CHOOSE THE MEANING') : round.toMeaning ? t('WHAT DOES THIS MEAN?') : t('HOW DO YOU SAY IT?')}
        </AppText>
        {listen && !picked ? (
          <Pressable onPress={() => speak(round.pair.word, courseId)} accessibilityRole="button"
            accessibilityLabel={t('Play the word again')} style={({ pressed }) => [styles.bigSpeaker, pressed && styles.optionPressed]}>
            <AppText style={styles.bigSpeakerIcon}>🔊</AppText>
          </Pressable>
        ) : (
          <AppText variant="display" align="center" style={styles.prompt}>
            {round.toMeaning ? round.pair.word : round.pair.meaning}
          </AppText>
        )}
        {round.toMeaning && canSpeak(courseId) && !(listen && !picked) ? (
          <Button title={t('🔊 Listen')} variant="ghost" size="sm" onPress={() => speak(round.pair.word, courseId)} />
        ) : null}
      </Animated.View>

      <Animated.View style={[styles.options, shake]}>
        {round.options.map((option) => {
          const isAnswer = option === round.answer;
          const isPicked = option === picked;
          const state = !picked ? 'idle' : isAnswer ? 'right' : isPicked ? 'wrong' : 'idle';
          return (
            <Pressable
              key={option}
              accessibilityRole="button"
              accessibilityState={{ disabled: !!picked }}
              disabled={!!picked}
              onPress={() => choose(option)}
              style={({ pressed }) => [
                styles.option,
                state === 'right' && { backgroundColor: colors.successSoft, borderColor: colors.success },
                state === 'wrong' && { backgroundColor: colors.dangerSoft, borderColor: colors.danger },
                pressed && styles.optionPressed,
              ]}
            >
              <AppText variant="bodyStrong" align="center"
                color={state === 'right' ? 'success' : state === 'wrong' ? 'danger' : 'text'}>
                {state === 'right' ? '✓ ' : state === 'wrong' ? '✗ ' : ''}{option}
              </AppText>
            </Pressable>
          );
        })}
      </Animated.View>

      {picked ? (
        <Animated.View style={pop}>
          <Card style={styles.feedback}>
            <AppText variant="bodyStrong" color={picked === round.answer ? 'success' : 'danger'}>
              {picked === round.answer ? t('Correct! +{n}', { n: 10 + Math.min(combo - 1, 5) * 2 }) : t('Not quite.')}
            </AppText>
            <AppText>{round.pair.word} = {round.pair.meaning}</AppText>
            <Button title={index + 1 === rounds.length ? t('See results') : t('Next →')} size="lg" fullWidth onPress={next} />
          </Card>
        </Animated.View>
      ) : null}
    </ScrollView>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  const { styles } = useThemedStyles(createStyles);
  return (
    <View style={styles.stat}>
      <AppText variant="heading">{value}</AppText>
      <AppText variant="small" color="textSecondary">{label}</AppText>
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  content: { width: '100%', maxWidth: 560, alignSelf: 'center', padding: screenPadding, paddingBottom: spacing.xxxl, gap: spacing.md },
  back: { alignSelf: 'flex-start', marginLeft: -spacing.md },
  group: { gap: spacing.sm },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  track: { height: 12, borderRadius: radius.full, backgroundColor: colors.surfaceMuted, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: radius.full, backgroundColor: '#F2B705' },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  combo: { color: '#E76F51', fontWeight: '800' },
  question: { alignItems: 'center', gap: spacing.xs, paddingVertical: spacing.lg },
  prompt: { textAlign: 'center' },
  bigSpeaker: {
    width: 120, height: 120, borderRadius: 60, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.primarySoft, borderBottomWidth: 5, borderBottomColor: colors.border,
  },
  bigSpeakerIcon: { fontSize: 56, lineHeight: 64 },
  options: { gap: spacing.sm },
  option: {
    minHeight: 54,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.xl,
    borderWidth: 2,
    borderBottomWidth: 4,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  optionPressed: { transform: [{ translateY: 2 }] },
  feedback: { gap: spacing.sm },
  result: { alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xl },
  statRow: { flexDirection: 'row', gap: spacing.sm, alignSelf: 'stretch' },
  stat: { flex: 1, alignItems: 'center', paddingVertical: spacing.md, borderRadius: radius.lg, backgroundColor: colors.primarySoft },
});
