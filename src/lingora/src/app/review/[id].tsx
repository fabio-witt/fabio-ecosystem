import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { MedvedSays } from '@/components/medved';
import { AppText, Button, EmptyState, LoadingState, Screen, ScreenHeader } from '@/components/ui';
import { radius, screenPadding, spacing, typography, useThemedStyles, type ThemeColors } from '@/constants/theme';
import {
  reviewTags, useReviewStatus, useSubmitReview, type ReviewStatus, type ReviewTag,
} from '@/features/partners/api';
import { t } from '@/lib/i18n';

const MAX_LENGTH = 500;
const MAX_TAGS = 3;

export default function WriteReviewScreen() {
  const { id, name } = useLocalSearchParams<{ id: string; name?: string }>();
  const status = useReviewStatus(id);
  const partnerName = name || 'your partner';

  return (
    <Screen edges={['top', 'bottom', 'left', 'right']}>
      <ScreenHeader title={t("Partner review")} />
      {status.isPending ? (
        <LoadingState />
      ) : status.isError || !status.data.eligible ? (
        <EmptyState
          title={t("Reviews are not available yet")}
          message={t("You can review a partner after 50 messages, with at least 15 from each of you.")}
          actionLabel={t("Go back")}
          onAction={() => router.back()}
        />
      ) : (
        <ReviewForm key={status.data.my_review?.updated_at ?? 'new'} id={id} name={partnerName} status={status.data} />
      )}
    </Screen>
  );
}

function ReviewForm({ id, name, status }: { id: string; name: string; status: ReviewStatus }) {
  const { colors, styles } = useThemedStyles(createStyles);
  const submit = useSubmitReview(id);
  const [rating, setRating] = useState(status.my_review?.rating ?? 0);
  const [tags, setTags] = useState<ReviewTag[]>(status.my_review?.tags ?? []);
  const [content, setContent] = useState(status.my_review?.content ?? '');

  function toggleTag(tag: ReviewTag) {
    setTags((current) => current.includes(tag)
      ? current.filter((item) => item !== tag)
      : current.length < MAX_TAGS ? [...current, tag] : current);
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <MedvedSays size={72} message={t('How was practising with {name}? Be kind and specific.', { name })} />

        <AppText variant="heading">{t("Your rating")}</AppText>
        <View style={styles.stars} accessibilityRole="radiogroup" accessibilityLabel={t("Rating")}>
          {[1, 2, 3, 4, 5].map((value) => (
            <Pressable
              key={value}
              onPress={() => setRating(value)}
              accessibilityRole="radio"
              accessibilityState={{ selected: rating === value }}
              accessibilityLabel={t('{n} stars', { n: value })}
              hitSlop={6}
            >
              <AppText style={[styles.star, value <= rating && styles.starActive]}>
                {value <= rating ? '★' : '☆'}
              </AppText>
            </Pressable>
          ))}
        </View>

        <AppText variant="heading">{t("What stood out?")} <AppText color="textMuted">{t("(up to 3)")}</AppText></AppText>
        <View style={styles.tags}>
          {(Object.keys(reviewTags) as ReviewTag[]).map((tag) => {
            const selected = tags.includes(tag);
            return (
              <Pressable
                key={tag}
                onPress={() => toggleTag(tag)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: selected }}
                style={[styles.tag, selected && styles.tagSelected]}
              >
                <AppText variant="caption" color={selected ? 'primary' : 'textSecondary'} style={styles.bold}>
                  {t(reviewTags[tag])}
                </AppText>
              </Pressable>
            );
          })}
        </View>

        <AppText variant="heading">{t("Your review")} <AppText color="textMuted">{t("(optional)")}</AppText></AppText>
        <TextInput
          style={styles.input}
          value={content}
          onChangeText={setContent}
          maxLength={MAX_LENGTH}
          multiline
          placeholder={t("What was it like to practise together?")}
          placeholderTextColor={colors.textMuted}
          accessibilityLabel={t("Review text")}
        />
        <AppText variant="small" color="textMuted" align="right">{content.length} / {MAX_LENGTH}</AppText>

        <AppText variant="caption" color="textSecondary">
          {t('Your review stays hidden until {name} has also reviewed you, or for 14 days. You can edit it later.', { name })}
        </AppText>
        {submit.isError ? <AppText color="danger">{submit.error.message}</AppText> : null}

        <Button
          title={status.my_review ? t("Update review") : t("Publish review")}
          disabled={rating === 0}
          loading={submit.isPending}
          onPress={() => submit.mutate({ rating, content: content.trim(), tags }, {
            onSuccess: () => (router.canGoBack() ? router.back() : router.replace('/')),
          })}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  flex: { flex: 1 },
  bold: { fontWeight: '700' },
  content: { padding: screenPadding, gap: spacing.md, paddingBottom: spacing.xxxl },
  stars: { flexDirection: 'row', gap: spacing.sm },
  star: { fontSize: 40, lineHeight: 48, color: colors.textMuted },
  starActive: { color: '#F5B700' },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  tag: {
    minHeight: 36,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tagSelected: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  input: {
    ...typography.body,
    minHeight: 120,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    color: colors.text,
    textAlignVertical: 'top',
  },
});
