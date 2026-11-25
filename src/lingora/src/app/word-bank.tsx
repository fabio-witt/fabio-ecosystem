import { useSession } from '@/providers/session-provider';
import { useDeviceState } from '@/lib/device-state';
import { ExerciseView } from '@/features/learn/exercise';
import { phraseStars, ratePhrase, type Mastery } from '@/features/learn/phrase-mastery';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { Flag } from '@/components/flag';
import { AppText, Button, Card, EmptyState, Screen, ScreenHeader } from '@/components/ui';
import { radius, screenPadding, spacing, useThemedStyles, type ThemeColors } from '@/constants/theme';
import { useGame, type SavedWord } from '@/features/game/store';
import { useActiveCourse } from '@/features/learn/active-course';
import { courses } from '@/features/learn/catalog';
import { usePracticeReview, wordReviewKey } from '@/features/learn/practice-review';
import { feedback } from '@/lib/feedback';
import { t } from '@/lib/i18n';
import { canSpeak, speak, useVoicesReady } from '@/lib/speech';

/** Everything you saved – from lessons, vocabulary or typed in – with a quick flashcard drill. */
export default function WordBankScreen() {
  const { colors, styles } = useThemedStyles(createStyles);
  useVoicesReady();
  const game = useGame();
  const { user } = useSession();
  const [mastery, setMastery] = useDeviceState<Record<string, Mastery>>(user?.id, 'phrase-mastery', {});
  const [recall, setRecall] = useState<{ card: SavedWord; mode: 'translate' | 'cloze' | 'listen' }>();
  function mark(card: SavedWord, mode: 'recognise' | 'recall') {
    const key = wordReviewKey(card.courseId, card.word);
    const now = new Date();
    setMastery(before => ({ ...before, [key]: ratePhrase(before?.[key] ?? {}, mode, now) }));
  }
  const review = usePracticeReview();
  const { course } = useActiveCourse();
  const [filter, setFilter] = useState<string | undefined>(course?.id);
  const [word, setWord] = useState('');
  const [meaning, setMeaning] = useState('');
  const [drill, setDrill] = useState<SavedWord[] | null>(null);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const saved = useMemo(() => game.state.saved ?? [], [game.state.saved]);
  const courseIds = [...new Set(saved.map((item) => item.courseId))];
  const shown = useMemo(() => saved.filter((item) => !filter || item.courseId === filter).sort((a, b) => b.at - a.at), [saved, filter]);

  function add() {
    const target = filter ?? course?.id;
    if (!word.trim() || !target) return;
    feedback('ok');
    game.toggleSaved({ courseId: target, word: word.trim(), meaning: meaning.trim() || undefined, at: Date.now() });
    setWord(''); setMeaning('');
  }

  function rate(remembered: boolean) {
    const card = drill![index];
    review.rateWord(wordReviewKey(card.courseId, card.word), remembered);
    game.recordWord(remembered);
    if (remembered && card.meaning) mark(card, 'recognise');
    feedback(remembered ? 'ok' : 'bad');
    setFlipped(false);
    if (index + 1 >= drill!.length) { feedback('win'); setDrill(null); setIndex(0); } else setIndex(index + 1);
  }

  if (recall) {
    const { card, mode } = recall;
    const parts = card.word.trim().split(/\s+/);
    const removed = parts.at(-1) ?? card.word;
    const exercise = mode === 'cloze'
      ? { prompt: parts.slice(0, -1).join(' ') + ' ___', accept: [removed] }
      : mode === 'listen'
        ? { prompt: t('Listen and type the phrase'), audio: card.word, accept: [card.word] }
        : { prompt: card.meaning ?? '', accept: [card.word] };
    return <Screen>
      <ScreenHeader title={t('Recall the phrase')} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Card>
          <ExerciseView exercise={{ type: 'type', ...exercise }} courseId={card.courseId}
            isLast onContinue={correct => {
              if (mode === 'translate') {
                if (correct) mark(card, 'recall');
                review.rateWord(wordReviewKey(card.courseId, card.word), correct);
              }
              setRecall(undefined);
            }} />
        </Card>
        <Button title={t('Stop')} variant="ghost" onPress={() => setRecall(undefined)} />
      </ScrollView>
    </Screen>;
  }

  if (drill) {
    const card = drill[index];
    return (
      <Screen edges={['top', 'bottom', 'left', 'right']}>
        <ScreenHeader title={t('Word bank')} />
        <ScrollView contentContainerStyle={styles.content}>
          <AppText variant="label" color="primary">{t('Card {n} of {total}', { n: index + 1, total: drill.length })}</AppText>
          <Card style={styles.flash}>
            <AppText variant="title" align="center">{card.word}</AppText>
            {canSpeak(card.courseId) ? <Button title={t('🔊 Listen')} size="sm" variant="secondary" onPress={() => speak(card.word, card.courseId)} /> : null}
            {flipped ? <AppText align="center" color="textSecondary">{card.meaning || t('(no translation saved)')}</AppText>
              : <Button title={t('Show meaning')} variant="ghost" onPress={() => { feedback('tap'); setFlipped(true); }} />}
          </Card>
          {flipped ? (
            <View style={styles.row}>
              <Button title={t('Not yet')} variant="secondary" style={styles.flex} onPress={() => rate(false)} />
              <Button title={t('I knew it')} style={styles.flex} onPress={() => rate(true)} />
            </View>
          ) : null}
          <Button title={t('Stop')} variant="ghost" onPress={() => setDrill(null)} />
        </ScrollView>
      </Screen>
    );
  }

  return (
    <Screen edges={['top', 'bottom', 'left', 'right']}>
      <ScreenHeader title={t('Word bank')} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <AppText color="textSecondary">{t('Words and sentences you saved. Tap ☆ Save after an exercise, or add your own here.')}</AppText>
        {courseIds.length > 1 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
            <Button title={t('All')} size="sm" variant={!filter ? 'primary' : 'secondary'} onPress={() => setFilter(undefined)} />
            {courseIds.map((id) => {
              const item = courses.find((c) => c.id === id);
              return <Button key={id} title={`${item?.flag ?? ''} ${t(item?.name ?? id)}`} size="sm" variant={filter === id ? 'primary' : 'secondary'} onPress={() => setFilter(id)} />;
            })}
          </ScrollView>
        ) : null}
        <Card style={styles.addCard}>
          <AppText variant="bodyStrong">{t('Add a word')}</AppText>
          <TextInput value={word} onChangeText={setWord} placeholder={t('Word or sentence')} placeholderTextColor={colors.textMuted} style={styles.input} accessibilityLabel={t('Word or sentence')} />
          <TextInput value={meaning} onChangeText={setMeaning} placeholder={t('Meaning (optional)')} placeholderTextColor={colors.textMuted} style={styles.input} accessibilityLabel={t('Meaning (optional)')} />
          <Button title={t('Save')} disabled={!word.trim() || !(filter ?? course?.id)} onPress={add} />
        </Card>
        {shown.some(item => item.meaning) && <AppText color="textSecondary">{t('Earn stars by recognising a phrase, recalling it from its meaning, and recalling it on another day.')}</AppText>}
        {shown.length > 0 ? (
          <Button title={t('🃏 Practise {n} cards', { n: Math.min(shown.length, 20) })} size="lg"
            onPress={() => { setDrill([...shown].sort(() => Math.random() - 0.5).slice(0, 20)); setIndex(0); setFlipped(false); }} />
        ) : null}
        {shown.length === 0 ? <EmptyState title={t('Nothing saved yet')} message={t('Tap ☆ Save after an exercise to collect useful sentences.')} />
          : shown.map((item) => {
            const itemCourse = courses.find((c) => c.id === item.courseId);
            return (
              <Card key={`${item.courseId}-${item.word}`} style={styles.item}>
                {itemCourse ? <Flag emoji={itemCourse.flag} size={22} /> : null}
                <View style={styles.flex}>
                  <AppText variant="bodyStrong" selectable>{item.word}</AppText>
                  {item.meaning && <>
                    <AppText variant="caption" color="textSecondary" numberOfLines={2}>{item.meaning}</AppText>
                    <AppText variant="caption">{t('{n} of 3 practice stars', { n: phraseStars(mastery[wordReviewKey(item.courseId, item.word)]) })}</AppText>
                    <Button title={t('Recall the phrase')} size="sm" variant="secondary" onPress={() => setRecall({ card: item, mode: 'translate' })} />
                  </>}
                  {item.word.trim().split(/\s+/).length > 1 && <Button title={t('Fill in the missing word')} size="sm" variant="ghost"
                    onPress={() => setRecall({ card: item, mode: 'cloze' })} />}
                  {canSpeak(item.courseId) && <Button title={t('Listen and type the phrase')} size="sm" variant="ghost"
                    onPress={() => setRecall({ card: item, mode: 'listen' })} />}
                </View>
                {canSpeak(item.courseId) ? <Button title="🔊" size="sm" variant="ghost" accessibilityLabel={t('Listen')} onPress={() => speak(item.word, item.courseId)} /> : null}
                <Button title="✕" size="sm" variant="ghost" accessibilityLabel={t('Remove')} onPress={() => game.toggleSaved(item)} />
              </Card>
            );
          })}
      </ScrollView>
    </Screen>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  content: { width: '100%', maxWidth: 620, alignSelf: 'center', padding: screenPadding, paddingBottom: spacing.xxxl, gap: spacing.md },
  row: { flexDirection: 'row', gap: spacing.xs },
  flex: { flex: 1 },
  addCard: { gap: spacing.sm },
  input: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, color: colors.text, borderRadius: radius.md, paddingHorizontal: spacing.md, minHeight: 46, fontSize: 16 },
  item: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  flash: { alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xl },
});
