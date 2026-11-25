import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, Button } from '@/components/ui';
import { radius, spacing, useThemedStyles, type ThemeColors } from '@/constants/theme';
import { canPractiseSpeaking, normalizeSpoken, recognitionClass } from '@/features/vocabulary/speaking-practice';
import { feedback } from '@/lib/feedback';
import { t } from '@/lib/i18n';
import { speechLocale } from '@/lib/speech';

type Result = { heard: string; words: { word: string; ok: boolean }[]; score: number };

/** Compares what was said with the sentence, word by word (order-tolerant). */
export function scorePronunciation(target: string, heardOptions: string[]): Result {
  const words = target.replace(/\(.*?\)/g, '').split(/\s+/).filter((word) => normalizeSpoken(word));
  let best: Result = { heard: heardOptions[0] ?? '', words: words.map((word) => ({ word, ok: false })), score: 0 };
  for (const heard of heardOptions) {
    const said = new Set(normalizeSpoken(heard).split(' '));
    const marked = words.map((word) => ({ word, ok: said.has(normalizeSpoken(word)) }));
    const score = Math.round((marked.filter((item) => item.ok).length / Math.max(words.length, 1)) * 100);
    if (score > best.score) best = { heard, words: marked, score };
  }
  return best;
}

/** "Say it yourself": microphone button that checks the pronunciation of a sentence. */
export function PronunciationCheck({ text, courseId }: { text: string; courseId: string }) {
  const { styles } = useThemedStyles(createStyles);
  const [state, setState] = useState<'idle' | 'listening'>('idle');
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const active = useRef<{ abort: () => void } | null>(null);
  useEffect(() => () => active.current?.abort(), []);
  if (!canPractiseSpeaking(courseId) || text.split('/').length > 2) return null;
  const target = text.split('/')[0].trim();

  function listen() {
    const Recognizer = recognitionClass();
    if (!Recognizer) return;
    setError(null);
    const recognition = new Recognizer();
    recognition.lang = speechLocale(courseId) ?? 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 5;
    recognition.onresult = (event) => {
      const options = Array.from(event.results[0] ?? []).map((item) => item.transcript);
      const next = scorePronunciation(target, options);
      setResult(next);
      feedback(next.score >= 80 ? 'ok' : 'bad');
    };
    recognition.onerror = (event) => {
      setState('idle');
      setError(event.error === 'not-allowed' || event.error === 'service-not-allowed'
        ? t('Allow microphone access in your browser to practise speaking.')
        : t('I did not hear anything. Tap the microphone and try again.'));
    };
    recognition.onend = () => setState('idle');
    active.current = recognition;
    setState('listening');
    recognition.start();
  }

  return (
    <View style={styles.box}>
      <Button title={state === 'listening' ? t('🎙 Listening…') : t('🎤 Say it yourself')} size="sm" variant="secondary"
        disabled={state === 'listening'} onPress={listen} />
      {result ? (
        <View style={styles.result} accessibilityLiveRegion="polite">
          <AppText variant="caption" style={styles.score}>{t('Pronunciation: {n}%', { n: result.score })}</AppText>
          <View style={styles.words}>
            {result.words.map((item, index) => (
              <AppText key={index} style={[styles.word, item.ok ? styles.ok : styles.miss]}>{item.word}</AppText>
            ))}
          </View>
          <AppText variant="caption" color="textSecondary">{t('Heard: “{text}”', { text: result.heard })}</AppText>
        </View>
      ) : null}
      {error ? <AppText variant="caption" color="danger">{error}</AppText> : null}
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  box: { gap: spacing.xs },
  result: { gap: 4 },
  score: { fontWeight: '800' },
  words: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  word: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: radius.sm, fontWeight: '700', overflow: 'hidden' },
  ok: { backgroundColor: colors.successSoft, color: colors.success },
  miss: { backgroundColor: colors.dangerSoft, color: colors.danger },
});
