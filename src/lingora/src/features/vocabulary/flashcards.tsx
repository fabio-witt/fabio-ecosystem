import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { AppText, Button, Card } from '@/components/ui';
import { screenPadding, spacing } from '@/constants/theme';
import { usePracticeReview, wordReviewKey } from '@/features/learn/practice-review';
import { t } from '@/lib/i18n';
import { canSpeak, speak, useVoicesReady } from '@/lib/speech';

import type { Topic } from './catalog';
import { useGame } from '@/features/game/store';

export function VocabularyFlashcards({ topic, courseId, onBack }: {
  topic: Topic; courseId: string; onBack: () => void;
}) {
  useVoicesReady();
  const review = usePracticeReview();
  const game = useGame();
  const [batch] = useState(() => {
    const unique = new Map(topic.words.filter((word): word is [string, string] => !!word[1] && word[0] !== word[1])
      .map(([word, meaning]) => [wordReviewKey(courseId, word), { word, meaning }]));
    return [...unique].map(([key, value]) => ({ key, ...value }))
      .filter(item => !review.words[item.key] || review.words[item.key].dueAt <= Date.now())
      .sort((a, b) => (review.words[a.key]?.dueAt ?? 0) - (review.words[b.key]?.dueAt ?? 0))
      .slice(0, 20);
  });
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const item = batch[index];

  function rate(remembered: boolean) {
    if (!item || !revealed) return;
    review.rateWord(item.key, remembered);
    game.recordWord(remembered);
    setRevealed(false);
    setIndex(current => current + 1);
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Button title={t('‹ Vocabulary')} variant="ghost" onPress={onBack} />
      <AppText variant="title">{t('Vocabulary cards')}</AppText>
      <AppText>{t(topic.title === 'Home' ? 'Home vocabulary' : topic.title)}</AppText>
      <AppText color="textSecondary">{t('Progress is saved on this device for your account.')}</AppText>
      {item ? <Card style={styles.group}>
        <AppText variant="caption">{t('Card {n} of {total}', { n: index + 1, total: batch.length })}</AppText>
        <AppText variant="display">{item.word}</AppText>
        {canSpeak(courseId) && <Button title={t('Listen')} variant="ghost" onPress={() => speak(item.word, courseId)} />}
        {revealed ? <>
          <AppText variant="heading" accessibilityLiveRegion="polite">{item.meaning}</AppText>
          <View style={styles.group}>
            <Button title={t('Practise again')} variant="secondary" onPress={() => rate(false)} />
            <Button title={t('I remembered it')} onPress={() => rate(true)} />
          </View>
        </> : <Button title={t('Show meaning')} onPress={() => setRevealed(true)} />}
      </Card> : <Card style={styles.group}>
        <AppText variant="heading">{t('Review complete')}</AppText>
        <AppText>{batch.length ? t('Your next cards will appear when they are due.') : t('No cards are due in this category. Words need a translation to appear as cards.')}</AppText>
        <Button title={t('Back')} onPress={onBack} />
      </Card>}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: screenPadding, paddingBottom: spacing.xxxl, gap: spacing.md },
  group: { gap: spacing.md },
});
