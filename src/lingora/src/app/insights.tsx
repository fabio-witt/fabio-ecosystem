import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { AppText, Card, EmptyState, ErrorState, LoadingState, Screen, ScreenHeader } from '@/components/ui';
import { radius, screenPadding, spacing, useThemedStyles, type ThemeColors } from '@/constants/theme';
import { courses } from '@/features/learn/catalog';
import { useIsAdmin } from '@/features/moderation/api';
import { formatRelativeTime } from '@/lib/format';
import { t } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';

type Insights = {
  new_accounts: number; new_guests: number; total_accounts: number; active_learners: number; active_last_7_days: number;
  lessons_done: number; plus_members: number; messages_sent: number;
  events: Record<string, number>; courses: Record<string, number>;
  feedback: { created_at: string; rating: number | null; message: string; context: string | null; username: string | null }[];
  errors: { message: string; count: number; last_seen: string; path: string | null; platform: string | null }[];
};

const ranges = [7, 30, 90] as const;

/** Admin overview: funnel, activity, money signals, feedback and errors. */
export default function InsightsScreen() {
  const { colors, styles } = useThemedStyles(createStyles);
  const admin = useIsAdmin();
  const [days, setDays] = useState<number>(30);
  const query = useQuery({
    queryKey: ['admin-insights', days],
    enabled: admin.data === true,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('admin_insights', { p_days: days });
      if (error) throw error;
      return data as unknown as Insights;
    },
  });

  if (admin.isPending) return <Screen><ScreenHeader title={t('Insights')} /><LoadingState /></Screen>;
  if (!admin.data) {
    return <Screen><ScreenHeader title={t('Insights')} /><EmptyState title={t('Not available')} message={t('This area is only for admins.')} /></Screen>;
  }
  const data = query.data;
  const ev = (name: string) => data?.events?.[name] ?? 0;
  const funnel: [string, number][] = data ? [
    [t('Onboarding started'), ev('onboarding_started')],
    [t('Onboarding completed'), ev('onboarding_completed')],
    [t('Lessons completed'), ev('lesson_completed')],
    [t('Guests → accounts'), ev('account_created')],
    [t('Plus page viewed'), ev('plus_viewed')],
    [t('Checkout started'), ev('checkout_started')],
  ] : [];
  const top = Math.max(1, ...funnel.map(([, value]) => value));

  return (
    <Screen edges={['top', 'bottom', 'left', 'right']}>
      <ScreenHeader title={t('📊 Insights')} />
      <ScrollView contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={() => void query.refetch()} tintColor={colors.primary} />}>
        <View style={styles.ranges}>
          {ranges.map((value) => (
            <Pressable key={value} onPress={() => setDays(value)} accessibilityRole="tab" accessibilityState={{ selected: days === value }}
              style={[styles.range, days === value && styles.rangeActive]}>
              <AppText variant="bodyStrong" color={days === value ? 'primary' : 'textSecondary'}>{t('{n} days', { n: value })}</AppText>
            </Pressable>
          ))}
        </View>
        {query.isPending ? <LoadingState /> : query.isError ? (
          <ErrorState message={query.error.message} onRetry={() => void query.refetch()} />
        ) : data ? (
          <>
            <View style={styles.grid}>
              <Tile label={t('new accounts')} value={data.new_accounts} />
              <Tile label={t('new guests')} value={data.new_guests} />
              <Tile label={t('active learners')} value={data.active_learners} />
              <Tile label={t('active last 7 days')} value={data.active_last_7_days} />
              <Tile label={t('lessons done')} value={data.lessons_done} />
              <Tile label={t('Plus members')} value={data.plus_members} />
              <Tile label={t('chat messages')} value={data.messages_sent} />
              <Tile label={t('accounts in total')} value={data.total_accounts} />
              <Tile label={t('exams passed')} value={ev('exam_passed')} />
            </View>

            <Card style={styles.group}>
              <AppText variant="heading">{t('Funnel')}</AppText>
              {funnel.map(([label, value]) => (
                <View key={label} style={styles.funnelRow}>
                  <AppText variant="caption" style={styles.funnelLabel}>{label}</AppText>
                  <View style={styles.bar}><View style={[styles.barFill, { width: `${(value / top) * 100}%` }]} /></View>
                  <AppText variant="caption" style={styles.bold}>{value}</AppText>
                </View>
              ))}
            </Card>

            <Card style={styles.group}>
              <AppText variant="heading">{t('Learners per course')}</AppText>
              {Object.entries(data.courses).sort((a, b) => b[1] - a[1]).map(([id, value]) => {
                const course = courses.find((item) => item.id === id);
                return <AppText key={id}>{course ? `${course.flag} ${t(course.name)}` : id}: {value}</AppText>;
              })}
              {Object.keys(data.courses).length === 0 ? <AppText color="textSecondary">{t('No activity yet.')}</AppText> : null}
            </Card>

            <Card style={styles.group}>
              <AppText variant="heading">{t('Feedback')}</AppText>
              {data.feedback.length === 0 ? <AppText color="textSecondary">{t('No feedback yet.')}</AppText> : data.feedback.map((item) => (
                <View key={item.created_at + item.message.slice(0, 10)} style={styles.item}>
                  <AppText variant="caption" color="textSecondary">
                    {item.rating ? '★'.repeat(item.rating) + ' · ' : ''}{t(item.context ?? 'Other')} · @{item.username ?? '—'} · {formatRelativeTime(item.created_at)}
                  </AppText>
                  <AppText>{item.message}</AppText>
                </View>
              ))}
            </Card>

            <Card style={styles.group}>
              <AppText variant="heading">{t('Errors')}</AppText>
              {data.errors.length === 0 ? <AppText color="textSecondary">{t('No errors reported. 🎉')}</AppText> : data.errors.map((item) => (
                <View key={item.message} style={styles.item}>
                  <AppText variant="caption" color="danger">{t('{n}× · {platform} · {path}', { n: item.count, platform: item.platform ?? '?', path: item.path ?? '?' })}</AppText>
                  <AppText variant="callout">{item.message}</AppText>
                  <AppText variant="small" color="textSecondary">{formatRelativeTime(item.last_seen)}</AppText>
                </View>
              ))}
            </Card>
          </>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

function Tile({ label, value }: { label: string; value: number }) {
  const { styles } = useThemedStyles(createStyles);
  return (
    <View style={styles.tile}>
      <AppText variant="heading">{value.toLocaleString()}</AppText>
      <AppText variant="small" color="textSecondary" align="center">{label}</AppText>
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  content: { width: '100%', maxWidth: 720, alignSelf: 'center', padding: screenPadding, paddingBottom: spacing.xxxl, gap: spacing.md },
  bold: { fontWeight: '800' },
  ranges: { flexDirection: 'row', gap: spacing.sm },
  range: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.full, borderWidth: 1, borderColor: colors.border },
  rangeActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  tile: { width: '31.5%', alignItems: 'center', paddingVertical: spacing.md, borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderSubtle },
  group: { gap: spacing.sm },
  funnelRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  funnelLabel: { width: 150 },
  bar: { flex: 1, height: 10, borderRadius: radius.full, backgroundColor: colors.surfaceMuted, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: radius.full, backgroundColor: colors.primary },
  item: { gap: 2, paddingVertical: spacing.xs, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.borderSubtle },
});
