import { useState } from 'react';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { AppText, Button, Card, ErrorState, LoadingState, Screen, ScreenHeader } from '@/components/ui';
import { radius, screenPadding, spacing, useThemedStyles, type ThemeColors } from '@/constants/theme';
import { useCorrectionAction, useCorrectionCards } from '@/features/learn/correction-review';
import type { Database } from '@/lib/database.types';
import { t } from '@/lib/i18n';

type ReviewCard = Database['public']['Functions']['list_correction_cards']['Returns'][number];

export default function CorrectionReviewScreen() {
  const cards = useCorrectionCards();
  const due = cards.data?.filter((card) => card.due) ?? [];
  const [selected, setSelected] = useState<string>();
  const next = due.find((card) => card.correction_id === selected) ?? due[0];
  const upcoming = cards.data?.filter((card) => !card.due) ?? [];
  const remove = useCorrectionAction();

  return (
    <Screen edges={['top', 'bottom', 'left', 'right']}>
      <ScreenHeader title={t("Correction review")} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <AppText variant="title">{t("Review your chat corrections")}</AppText>
        <AppText variant="heading">{t("Due today")}</AppText>
        {cards.isPending ? <LoadingState /> : cards.isError ? (
          <ErrorState message={cards.error.message} onRetry={() => cards.refetch()} />
        ) : next ? <CardReview key={next.correction_id} card={next} /> : (
          <Card style={styles.group}>
            <AppText>{cards.data.length ? t("You are caught up. Your next review is scheduled for later.") : t("Save a correction you received in a chat to start reviewing it here.")}</AppText>
            {cards.data[0] && <AppText color="textSecondary">{t('Next review: {date}', { date: new Date(cards.data[0].due_at).toLocaleString() })}</AppText>}
          </Card>
        )}
        {due.filter((card) => card.correction_id !== next?.correction_id).map((card) => (
          <Card key={card.correction_id} style={styles.group}>
            <AppText>{card.original}</AppText>
            <Button title={t("Review this card")} variant="secondary" onPress={() => setSelected(card.correction_id)} />
            <Button title={t("Remove from review")} variant="ghost" disabled={remove.isPending}
              onPress={() => remove.mutate({ id: card.correction_id, action: 'remove' })} />
          </Card>
        ))}
        {!cards.isPending && !cards.isError && <AppText variant="heading">{t("Upcoming")}</AppText>}
        {!cards.isPending && !cards.isError && upcoming.length === 0 && <AppText color="textSecondary">{t("Nothing scheduled yet.")}</AppText>}
        {upcoming.map((card) => (
          <Card key={card.correction_id} style={styles.group}>
            <AppText>{card.corrected}</AppText>
            <AppText color="textSecondary">{new Date(card.due_at).toLocaleString()}</AppText>
            <Button title={t("Remove from review")} variant="ghost" disabled={remove.isPending}
              onPress={() => remove.mutate({ id: card.correction_id, action: 'remove' })} />
          </Card>
        ))}
        {remove.isError && <AppText color="danger">{remove.error.message}</AppText>}
      </ScrollView>
    </Screen>
  );
}

function CardReview({ card }: { card: ReviewCard }) {
  const { colors, styles: themed } = useThemedStyles(createStyles);
  const [draft, setDraft] = useState('');
  const [revealed, setRevealed] = useState(false);
  const action = useCorrectionAction();

  return (
    <Card style={styles.group}>
      <AppText variant="heading">{t("Use the correction in a new situation")}</AppText>
      <AppText>{t("Rewrite your sentence for a different person, time or place. Keep the part your partner corrected.")}</AppText>
      <AppText variant="label" color="textSecondary">{t("Your original sentence")}</AppText>
      <AppText>{card.original}</AppText>
      <TextInput value={draft} onChangeText={setDraft} style={themed.input} multiline maxLength={2000}
        accessibilityLabel={t("Your new sentence")} placeholder={t("Write a new version")} placeholderTextColor={colors.textMuted} />
      {revealed ? (
        <>
          <AppText variant="label" color="primary">{t("Your partner’s correction")}</AppText>
          <AppText>{card.corrected}</AppText>
          <AppText color="textSecondary">{t("Did you use the corrected form in your new sentence?")}</AppText>
          <View style={styles.group}>
            <Button title={t("Review again soon")} variant="secondary" disabled={action.isPending}
              onPress={() => action.mutate({ id: card.correction_id, action: 'review', remembered: false })} />
            <Button title={t("I remembered it")} disabled={action.isPending}
              onPress={() => action.mutate({ id: card.correction_id, action: 'review', remembered: true })} />
          </View>
        </>
      ) : <Button title={t("Show correction")} disabled={!draft.trim()} onPress={() => setRevealed(true)} />}
      <Button title={t("Remove from review")} variant="ghost" disabled={action.isPending}
        onPress={() => action.mutate({ id: card.correction_id, action: 'remove' })} />
      {action.isError && <AppText color="danger">{action.error.message}</AppText>}
    </Card>
  );
}

const styles = StyleSheet.create({
  content: { padding: screenPadding, gap: spacing.md, paddingBottom: spacing.xxxl },
  group: { gap: spacing.sm },
});
const createStyles = (colors: ThemeColors) => StyleSheet.create({
  input: {
    minHeight: 96, padding: spacing.sm, color: colors.text, backgroundColor: colors.surface,
    borderColor: colors.border, borderWidth: 1, borderRadius: radius.md, textAlignVertical: 'top',
  },
});
