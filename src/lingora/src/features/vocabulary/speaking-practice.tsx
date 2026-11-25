import { useEffect, useMemo, useRef, useState } from 'react';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { Medved } from '@/components/medved';
import { usePop } from '@/components/motion';
import { AppText, Button, Card } from '@/components/ui';
import { screenPadding, spacing, useThemedStyles, type ThemeColors } from '@/constants/theme';
import { useGame } from '@/features/game/store';
import { usePracticeReview } from '@/features/learn/practice-review';
import { t } from '@/lib/i18n';
import { canSpeak, speak, speechLocale, useVoicesReady } from '@/lib/speech';

import type { Topic } from './catalog';
import { trainerPairs } from './vocabulary-trainer';

const ROUNDS = 8;

type Recognition = {
  lang: string; interimResults: boolean; maxAlternatives: number;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void; abort: () => void;
};

export function recognitionClass(): (new () => Recognition) | null {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return null;
  const scope = window as unknown as { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition };
  return scope.SpeechRecognition ?? scope.webkitSpeechRecognition ?? null;
}

export function canPractiseSpeaking(courseId: string) {
  return !!recognitionClass() && !!speechLocale(courseId);
}

export function normalizeSpoken(text: string) {
  return text.normalize('NFD').replace(/\p{M}/gu, '').replace(/\(.*?\)/g, '').toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim();
}

/** The answer counts when the spoken text contains the word (or one of its "a / b" variants). */
export function matchesSpoken(target: string, heard: string[]) {
  const variants = target.split('/').map(normalizeSpoken).filter(Boolean);
  return heard.map(normalizeSpoken).some((said) => variants.some((variant) => said === variant || ` ${said} `.includes(` ${variant} `)));
}

/** Say the word out loud; the browser's speech recognition checks it. */
export function SpeakingPractice({ courseId, topics, onBack }: { courseId: string; topics: Topic[]; onBack: () => void }) {
  useVoicesReady();
  const { colors, styles } = useThemedStyles(createStyles);
  const review = usePracticeReview();
  const game = useGame();
  const pairs = useMemo(() => trainerPairs(courseId, topics).filter((pair) => pair.word.length <= 30), [courseId, topics]);
  const [rounds, setRounds] = useState(() => [...pairs].sort(() => Math.random() - 0.5).slice(0, ROUNDS));
  const [index, setIndex] = useState(0);
  const [state, setState] = useState<'idle' | 'listening' | 'right' | 'wrong'>('idle');
  const [heard, setHeard] = useState('');
  const [correct, setCorrect] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const active = useRef<Recognition | null>(null);
  const pop = usePop(`${index}-${state}`);
  const pair = rounds[index];
  const Recognizer = recognitionClass();

  useEffect(() => () => active.current?.abort(), []);

  function listen() {
    if (!Recognizer || !pair) return;
    setError(null);
    const recognition = new Recognizer();
    recognition.lang = speechLocale(courseId) ?? 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 5;
    recognition.onresult = (event) => {
      const options = Array.from(event.results[0] ?? []).map((item) => item.transcript);
      const right = matchesSpoken(pair.word, options);
      setHeard(options[0] ?? '');
      setState(right ? 'right' : 'wrong');
      review.rateWord(pair.key, right);
      game.recordWord(right);
      if (right) setCorrect((value) => value + 1);
    };
    recognition.onerror = (event) => {
      setState('idle');
      setError(event.error === 'not-allowed' || event.error === 'service-not-allowed'
        ? t('Allow microphone access in your browser to practise speaking.')
        : event.error === 'no-speech' ? t('I did not hear anything. Tap the microphone and try again.')
          : t('Speech recognition did not work. Try again.'));
    };
    recognition.onend = () => setState((current) => (current === 'listening' ? 'idle' : current));
    active.current = recognition;
    setState('listening');
    recognition.start();
  }

  function next() {
    setState('idle');
    setHeard('');
    setIndex((value) => value + 1);
  }

  if (!Recognizer || pairs.length < 4) {
    return (
      <ScrollView contentContainerStyle={styles.content}>
        <Button title={t('‹ Vocabulary')} variant="ghost" onPress={onBack} style={styles.back} />
        <Card style={styles.center}>
          <AppText variant="heading">{t('🎤 Speaking practice')}</AppText>
          <AppText color="textSecondary" align="center">
            {t('Speaking practice works in the web version in Chrome, Edge and Safari.')}
          </AppText>
        </Card>
      </ScrollView>
    );
  }

  if (!pair) {
    return (
      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.center}>
          <Medved mood="cheer" size={110} />
          <AppText variant="title" align="center">{t('Well spoken!')}</AppText>
          <AppText variant="heading">{correct}/{rounds.length}</AppText>
          <Button title={t('Practise again')} size="lg" fullWidth onPress={() => {
            setRounds([...pairs].sort(() => Math.random() - 0.5).slice(0, ROUNDS)); setIndex(0); setCorrect(0);
          }} />
          <Button title={t('Back to vocabulary')} variant="ghost" onPress={onBack} />
        </Card>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Button title={t('‹ Vocabulary')} variant="ghost" onPress={onBack} style={styles.back} />
      <AppText variant="caption" color="textSecondary">{t('Question {n} of {total}', { n: index + 1, total: rounds.length })}</AppText>
      <Animated.View style={[styles.center, pop]}>
        <AppText variant="label" color="primary">{t('SAY THIS WORD')}</AppText>
        <AppText variant="display" align="center">{pair.word}</AppText>
        <AppText color="textSecondary" align="center">{pair.meaning}</AppText>
        {canSpeak(courseId) ? <Button title={t('🔊 Listen first')} variant="ghost" size="sm" onPress={() => speak(pair.word, courseId)} /> : null}
      </Animated.View>
      {state === 'idle' || state === 'listening' ? (
        <Button
          title={state === 'listening' ? t('Listening…') : t('🎤 Tap and speak')}
          size="lg"
          fullWidth
          disabled={state === 'listening'}
          onPress={listen}
        />
      ) : (
        <Card style={[styles.feedback, { borderColor: state === 'right' ? colors.success : colors.danger }]}>
          <AppText variant="bodyStrong" color={state === 'right' ? 'success' : 'danger'}>
            {state === 'right' ? t('Great pronunciation!') : t('Not quite.')}
          </AppText>
          {heard ? <AppText color="textSecondary">{t('I heard: “{text}”', { text: heard })}</AppText> : null}
          <View style={styles.actions}>
            {state === 'wrong' ? <Button title={t('Try again')} variant="secondary" style={styles.flex} onPress={() => { setState('idle'); listen(); }} /> : null}
            <Button title={index + 1 === rounds.length ? t('See results') : t('Next →')} style={styles.flex} onPress={next} />
          </View>
        </Card>
      )}
      {error ? <AppText color="danger" align="center">{error}</AppText> : null}
    </ScrollView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  content: { width: '100%', maxWidth: 560, alignSelf: 'center', padding: screenPadding, paddingBottom: spacing.xxxl, gap: spacing.md },
  back: { alignSelf: 'flex-start', marginLeft: -spacing.md },
  center: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.lg },
  feedback: { gap: spacing.sm, borderWidth: 2 },
  actions: { flexDirection: 'row', gap: spacing.sm },
  flex: { flex: 1 },
});
