import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText, Avatar, Button, Card } from '@/components/ui';
import { radius, spacing, useThemedStyles, type ThemeColors } from '@/constants/theme';
import { ReportButton } from '@/features/safety/actions';
import { formatRelativeTime } from '@/lib/format';

import { reviewTags, useProfileReviews, useReviewStatus, type ProfileReview } from './api';
import { t } from '@/lib/i18n';

export function StarRow({ rating, size = 16 }: { rating: number; size?: number }) {
  const full = Math.round(rating);
  return (
    <AppText style={{ fontSize: size, lineHeight: size + 4, color: '#F5B700', letterSpacing: 1 }}
      accessibilityLabel={t('{n} of 5 stars', { n: rating })}>
      {'★'.repeat(full)}{'☆'.repeat(5 - full)}
    </AppText>
  );
}

const GOLD = '#F5B700';

/** Five stars filled to the exact average, e.g. 4.3 → four full stars and a third. */
export function FractionalStars({ rating, size = 28 }: { rating: number; size?: number }) {
  const { styles } = useThemedStyles(createStyles);
  return (
    <View style={styles.starLine} accessible accessibilityLabel={t('{n} of 5 stars', { n: rating.toFixed(1) })}>
      {[0, 1, 2, 3, 4].map((index) => {
        const fill = Math.max(0, Math.min(1, rating - index));
        return (
          <View key={index} style={{ width: size, height: size + 4 }}>
            <AppText style={[styles.starGlyph, { fontSize: size, lineHeight: size + 4 }]}>★</AppText>
            <View style={[styles.starFill, { width: size * fill, height: size + 4 }]}>
              <AppText style={[styles.starGlyph, styles.starGold, { fontSize: size, lineHeight: size + 4, width: size }]}>★</AppText>
            </View>
          </View>
        );
      })}
    </View>
  );
}

/** Average rating with stars and how the ratings are spread. */
export function RatingSummary({ userId, name, isMe }: { userId: string; name: string; isMe: boolean }) {
  const { styles } = useThemedStyles(createStyles);
  const reviews = useProfileReviews(userId);
  const data = reviews.data;
  if (!data) return null;
  const average = data.average === null ? 0 : Number(data.average);
  const counts = [5, 4, 3, 2, 1].map((stars) => ({
    stars,
    count: data.reviews.filter((review) => Math.round(review.rating) === stars).length,
  }));
  const shown = Math.max(data.reviews.length, 1);

  return (
    <View style={styles.section}>
      <AppText variant="heading">{t('Rating')}</AppText>
      <Card style={styles.ratingCard}>
        <View style={styles.ratingLeft}>
          <AppText style={styles.ratingNumber}>{data.total > 0 ? average.toFixed(1) : '–'}</AppText>
          <FractionalStars rating={data.total > 0 ? average : 0} size={22} />
          <AppText variant="caption" color="textSecondary" align="center">
            {data.total === 0
              ? (isMe ? t('No ratings yet') : t('{name} has no ratings yet', { name }))
              : data.total === 1 ? t('1 review') : t('{n} reviews', { n: data.total })}
          </AppText>
        </View>
        <View style={styles.bars}>
          {counts.map(({ stars, count }) => (
            <View key={stars} style={styles.barRow}>
              <AppText variant="small" color="textSecondary" style={styles.barLabel}>{stars}★</AppText>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { width: `${(count / shown) * 100}%` }]} />
              </View>
              <AppText variant="small" color="textSecondary" style={styles.barCount}>{count}</AppText>
            </View>
          ))}
        </View>
      </Card>
    </View>
  );
}

/** Written partner reviews on a profile, plus the prompt to write one after 50 messages. */
export function ReviewsSection({ userId, name, isMe }: { userId: string; name: string; isMe: boolean }) {
  const { styles } = useThemedStyles(createStyles);
  const reviews = useProfileReviews(userId);
  const status = useReviewStatus(userId, !isMe);
  const data = reviews.data;

  return (
    <>
      <RatingSummary userId={userId} name={name} isMe={isMe} />
      <View style={styles.section}>
        <AppText variant="heading">{t('Reviews')}</AppText>

        {!isMe && status.data ? <ReviewPrompt userId={userId} name={name} status={status.data} /> : null}

        {reviews.isError ? (
          <AppText color="danger">{t("Reviews could not be loaded.")}</AppText>
        ) : data && data.reviews.length > 0 ? (
          data.reviews.map((review) => <ReviewCard key={review.id} review={review} />)
        ) : data ? (
          <Card style={styles.empty}>
            <AppText style={styles.emptyIcon} accessible={false}>💬</AppText>
            <AppText variant="callout" color="textSecondary" align="center">
              {isMe
                ? t("Reviews from your language partners will appear here.")
                : t('{name} has no written reviews yet.', { name })}
            </AppText>
          </Card>
        ) : null}
      </View>
    </>
  );
}

function ReviewPrompt({ userId, name, status }: {
  userId: string;
  name: string;
  status: NonNullable<ReturnType<typeof useReviewStatus>['data']>;
}) {
  const { styles } = useThemedStyles(createStyles);
  const total = status.my_messages + status.their_messages;
  const progress = Math.min(total / status.required_total, 1);

  if (status.eligible) {
    return (
      <Card style={styles.prompt}>
        <AppText variant="bodyStrong">
          {status.my_review ? t("You reviewed this partner") : `How was practising with ${name}?`}
        </AppText>
        {status.my_review ? <StarRow rating={status.my_review.rating} /> : null}
        <AppText variant="caption" color="textSecondary">
          {status.they_reviewed_me || status.my_review
            ? t("Reviews become visible once you have both written one, or after 14 days.")
            : t("Your review stays hidden until you have both written one, or for 14 days.")}
        </AppText>
        <Button
          title={status.my_review ? t("Edit review") : t("Write a review")}
          variant={status.my_review ? 'secondary' : 'primary'}
          size="sm"
          onPress={() => router.push({ pathname: '/review/[id]', params: { id: userId, name } })}
        />
      </Card>
    );
  }

  if (total === 0) return null;

  return (
    <Card style={styles.prompt}>
      <AppText variant="caption" color="textSecondary">
        {t('Reviews unlock after 50 messages, with at least 15 from each of you. You have exchanged {n}.', { n: total })}
      </AppText>
      <View style={styles.track} accessibilityRole="progressbar"
        accessibilityValue={{ min: 0, max: status.required_total, now: Math.min(total, status.required_total) }}>
        <View style={[styles.fill, { width: `${progress * 100}%` }]} />
      </View>
    </Card>
  );
}

function ReviewCard({ review }: { review: ProfileReview }) {
  const { styles } = useThemedStyles(createStyles);
  const name = review.reviewer_name || review.reviewer_username || 'Lingora user';
  return (
    <Card style={styles.review}>
      <View style={styles.reviewHeader}>
        <Avatar name={name} uri={review.reviewer_avatar} size={36} />
        <View style={styles.flex}>
          <AppText variant="bodyStrong" numberOfLines={1}>{name}</AppText>
          <AppText variant="small" color="textMuted">{formatRelativeTime(review.created_at)}</AppText>
        </View>
        <StarRow rating={review.rating} size={14} />
      </View>
      {review.tags.length > 0 ? (
        <View style={styles.tags}>
          {review.tags.map((tag) => (
            <View key={tag} style={styles.tag}>
              <AppText variant="small" color="primary">{t(reviewTags[tag] ?? tag)}</AppText>
            </View>
          ))}
        </View>
      ) : null}
      {review.content ? <AppText variant="callout">{review.content}</AppText> : null}
      <View style={styles.reportRow}>
        <ReportButton kind="review" id={review.id} />
      </View>
    </Card>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  flex: { flex: 1 },
  section: { gap: spacing.sm, marginTop: spacing.lg },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  summary: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  prompt: { gap: spacing.sm },
  track: { height: 10, borderRadius: radius.full, backgroundColor: colors.surfaceMuted, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: radius.full, backgroundColor: colors.primary },
  review: { gap: spacing.sm },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  tag: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xxs, borderRadius: radius.full, backgroundColor: colors.primarySoft },
  reportRow: { alignItems: 'flex-end' },
  starLine: { flexDirection: 'row', gap: 2 },
  starGlyph: { color: colors.border, textAlign: 'center' },
  starGold: { color: GOLD },
  starFill: { position: 'absolute', left: 0, top: 0, overflow: 'hidden' },
  ratingCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  ratingLeft: { alignItems: 'center', gap: spacing.xs, minWidth: 130 },
  ratingNumber: { fontSize: 44, lineHeight: 50, fontWeight: '900', color: colors.text },
  bars: { flex: 1, gap: 6 },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  barLabel: { width: 24 },
  barTrack: { flex: 1, height: 8, borderRadius: radius.full, backgroundColor: colors.surfaceMuted, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: radius.full, backgroundColor: GOLD },
  barCount: { width: 18, textAlign: 'right' },
  empty: { alignItems: 'center', gap: spacing.xs },
  emptyIcon: { fontSize: 30, lineHeight: 36 },
});
