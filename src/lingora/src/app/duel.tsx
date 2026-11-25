import { useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { FormNotice } from '@/components/form-notice';
import { Medved } from '@/components/medved';
import { AppText, Button, Card, Screen, ScreenHeader } from '@/components/ui';
import { radius, screenPadding, spacing, useThemedStyles, type ThemeColors } from '@/constants/theme';
import { buildQuestions, coursePairs } from '@/features/game/quiz';
import { QuizRunner } from '@/features/game/quiz-runner';
import { socialKeys } from '@/features/game/social';
import { useGame } from '@/features/game/store';
import { celebrate } from '@/features/game/celebrations';
import { courses } from '@/features/learn/catalog';
import { t } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';

const QUESTIONS = 5;

/**
 * Friendly duel: five word questions. The challenger plays first; the
 * opponent later gets the same questions (same seed) and the scores are compared.
 */
export default function DuelScreen() {
  const params = useLocalSearchParams<{ opponent?: string; name?: string; course?: string; id?: string; seed?: string; theirs?: string }>();
  const { styles } = useThemedStyles(createStyles);
  const client = useQueryClient();
  const game = useGame();
  const course = courses.find((item) => item.id === params.course) ?? courses[0];
  const answering = !!params.id;
  const [seed] = useState(() => (params.seed ? Number(params.seed) : Math.floor(Math.random() * 2 ** 31)));
  const questions = useMemo(() => buildQuestions(coursePairs(course), QUESTIONS, seed), [course, seed]);
  const [phase, setPhase] = useState<'ready' | 'play' | 'saving' | 'done'>('ready');
  const [score, setScore] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const theirs = params.theirs ? Number(params.theirs) : null;
  const name = params.name ?? t('your partner');

  async function finish(correct: number) {
    const percent = Math.round((correct / QUESTIONS) * 100);
    setScore(percent);
    setPhase('saving');
    const { error: saveError } = answering
      ? await supabase.rpc('play_duel', { p_duel: params.id!, p_score: percent })
      : await supabase.rpc('create_duel', { p_opponent: params.opponent!, p_course: course.id, p_seed: seed, p_score: percent });
    if (saveError) {
      setError(saveError.message || t('The duel could not be saved. Check your connection and try again.'));
    } else if (answering && theirs !== null && percent > theirs) {
      celebrate({ icon: '⚔️', title: 'You won the duel!', gems: 10 });
      game.addGems(10);
    }
    void client.invalidateQueries({ queryKey: socialKeys.duels });
    setPhase('done');
  }

  const won = theirs !== null && score > theirs;
  const tied = theirs !== null && score === theirs;

  return (
    <Screen edges={['top', 'bottom', 'left', 'right']}>
      <ScreenHeader title={t('⚔️ Duel')} />
      <ScrollView contentContainerStyle={styles.content}>
        {phase === 'ready' ? (
          <Card style={styles.center}>
            <Medved mood="cheer" size={110} />
            <AppText variant="title" align="center">
              {answering ? t('{name} challenged you!', { name }) : t('Challenge {name}', { name })}
            </AppText>
            <AppText align="center" color="textSecondary">
              {answering
                ? t('Answer the same five questions. Beat their score to win 10 gems.')
                : t('Answer five {course} words. Then {name} gets the same questions.', { course: t(course.name), name })}
            </AppText>
            {questions.length ? (
              <Button title={t('Start duel')} size="lg" fullWidth onPress={() => setPhase('play')} />
            ) : (
              <AppText color="textSecondary">{t('This course does not have enough translated words for the trainer yet.')}</AppText>
            )}
          </Card>
        ) : null}
        {phase === 'play' ? <QuizRunner questions={questions} onFinish={(correct) => void finish(correct)} /> : null}
        {phase === 'saving' ? <Card style={styles.center}><AppText>{t('Saving…')}</AppText></Card> : null}
        {phase === 'done' ? (
          <Card style={styles.center}>
            <Medved mood={error ? 'sad' : won || !answering ? 'cheer' : 'happy'} size={110} />
            {error ? <FormNotice notice={{ tone: 'error', title: error }} /> : null}
            <View style={styles.scores}>
              <View style={styles.scoreBox}>
                <AppText variant="caption" color="textSecondary">{t('You')}</AppText>
                <AppText style={styles.score}>{score}%</AppText>
              </View>
              {theirs !== null ? (
                <View style={styles.scoreBox}>
                  <AppText variant="caption" color="textSecondary">{name}</AppText>
                  <AppText style={styles.score}>{theirs}%</AppText>
                </View>
              ) : null}
            </View>
            {!error ? (
              <AppText variant="title" align="center">
                {!answering ? t('Challenge sent to {name}!', { name })
                  : won ? t('You won! +10 💎') : tied ? t("It's a tie!") : t('{name} won this time.', { name })}
              </AppText>
            ) : null}
            <Button title={t('See all duels')} size="lg" fullWidth onPress={() => router.replace('/league')} />
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
  scores: { flexDirection: 'row', gap: spacing.md, alignSelf: 'stretch' },
  scoreBox: { flex: 1, alignItems: 'center', padding: spacing.md, borderRadius: radius.lg, backgroundColor: colors.primarySoft },
  score: { fontSize: 40, lineHeight: 48, fontWeight: '900', color: colors.text },
});
