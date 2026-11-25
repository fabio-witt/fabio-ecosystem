import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';

import {
  AppText, Button, Card, EmptyState, ErrorState, LoadingState, Screen, ScreenHeader,
} from '@/components/ui';
import { radius, screenPadding, spacing, useThemedStyles, type ThemeColors } from '@/constants/theme';
import {
  useIsAdmin, useLiftSuspension, useReports, useResolveReport, type ModerationAction, type Report,
} from '@/features/moderation/api';
import { reportReasons } from '@/features/safety/actions';
import { formatRelativeTime } from '@/lib/format';
import { t } from '@/lib/i18n';

const reasonLabels = Object.fromEntries(reportReasons) as Record<string, string>;
const kindLabels: Record<Report['target_kind'], string> = {
  profile: '👤 Profile', post: '📝 Post', comment: '💬 Comment', message: '✉️ Message', review: '⭐ Review',
  forum_thread: '🗣 Forum topic', forum_reply: '🗣 Forum answer',
};

export default function AdminScreen() {
  const { colors, styles } = useThemedStyles(createStyles);
  const admin = useIsAdmin();
  const [openOnly, setOpenOnly] = useState(true);
  const reports = useReports(openOnly);

  if (admin.isPending) return <Screen><ScreenHeader title={t("Moderation")} /><LoadingState /></Screen>;
  if (!admin.data) {
    return (
      <Screen>
        <ScreenHeader title={t("Moderation")} />
        <EmptyState title={t("Not available")} message={t("This area is only for moderators.")} />
      </Screen>
    );
  }

  return (
    <Screen edges={['top', 'bottom', 'left', 'right']}>
      <ScreenHeader title={t("Moderation")} />
      <View style={styles.tabs}>
        {([true, false] as const).map((value) => (
          <Pressable
            key={String(value)}
            onPress={() => setOpenOnly(value)}
            accessibilityRole="tab"
            accessibilityState={{ selected: openOnly === value }}
            style={[styles.tab, openOnly === value && styles.tabActive]}
          >
            <AppText variant="bodyStrong" color={openOnly === value ? 'primary' : 'textSecondary'}>
              {value ? t("Open reports") : t("All reports")}
            </AppText>
          </Pressable>
        ))}
      </View>

      {reports.isPending ? <LoadingState /> : reports.isError ? (
        <ErrorState message={reports.error.message} onRetry={() => reports.refetch()} />
      ) : (
        <FlatList
          data={reports.data}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={reports.isRefetching} onRefresh={() => { void reports.refetch(); }}
              tintColor={colors.primary} />
          }
          ListHeaderComponent={
            <AppText variant="caption" color="textSecondary">
              {t("Apple expects reports to be handled within 24 hours. Removing content deletes it for everyone.")}
            </AppText>
          }
          ListEmptyComponent={<EmptyState title={t("All clear 🎉")} message={t("There are no open reports.")} />}
          renderItem={({ item }) => <ReportCard report={item} />}
        />
      )}
    </Screen>
  );
}

function evidenceText(report: Report) {
  const evidence = report.evidence ?? {};
  if (typeof evidence.text === 'string') return evidence.text;
  if (report.target_kind === 'profile') {
    return ['full_name', 'username', 'bio', 'learning_goal']
      .map((key) => evidence[key]).filter((value) => typeof value === 'string' && value).join(' · ');
  }
  return '';
}

function ReportCard({ report }: { report: Report }) {
  const { styles } = useThemedStyles(createStyles);
  const resolve = useResolveReport();
  const lift = useLiftSuspension();
  const open = !report.reviewed_at;
  const text = evidenceText(report);

  function act(action: ModerationAction) {
    const labels: Record<ModerationAction, string> = {
      dismiss: 'Dismiss this report? The content stays online.',
      remove: 'Remove this content for everyone?',
      remove_and_suspend: `Remove the content and restrict ${report.subject_name} from posting for 7 days?`,
    };
    Alert.alert(t("Confirm"), labels[action], [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Confirm',
        style: action === 'dismiss' ? 'default' : 'destructive',
        onPress: () => resolve.mutate({ reportId: report.id, action }, {
          onError: (error) => Alert.alert(t("Could not update the report"), error.message),
        }),
      },
    ]);
  }

  return (
    <Card style={styles.card}>
      <View style={styles.headerRow}>
        <AppText variant="bodyStrong">{t(kindLabels[report.target_kind])}</AppText>
        <View style={styles.reason}>
          <AppText variant="small" color="danger" style={styles.bold}>{t(reasonLabels[report.reason] ?? report.reason)}</AppText>
        </View>
      </View>
      <AppText variant="caption" color="textSecondary">
        {formatRelativeTime(report.created_at)} · {t('reported by {name}', { name: report.reporter_name })}
      </AppText>

      <Pressable onPress={() => router.push({ pathname: '/user/[id]', params: { id: report.subject_id } })}
        accessibilityRole="button">
        <AppText variant="callout">
          {t('Author:')} <AppText variant="callout" color="primary" style={styles.bold}>{report.subject_name}</AppText>
          {' '}· {t('{n} reports in total', { n: report.subject_report_count })}
        </AppText>
      </Pressable>

      {text ? (
        <View style={styles.evidence}>
          <AppText variant="callout">{text}</AppText>
        </View>
      ) : (
        <AppText variant="caption" color="textMuted">{t("No text snapshot.")}</AppText>
      )}

      {report.subject_suspended_until ? (
        <View style={styles.suspended}>
          <AppText variant="caption" color="warning" style={styles.flex}>
            {t('Restricted until {date}', { date: new Date(report.subject_suspended_until).toLocaleDateString() })}
          </AppText>
          <Button title={t("Lift")} size="sm" variant="ghost" loading={lift.isPending}
            onPress={() => lift.mutate(report.subject_id)} />
        </View>
      ) : null}

      {open ? (
        <View style={styles.actions}>
          <Button title={t("Dismiss")} size="sm" variant="secondary" style={styles.flex}
            disabled={resolve.isPending} onPress={() => act('dismiss')} />
          <Button title={t("Remove")} size="sm" variant="danger" style={styles.flex}
            disabled={resolve.isPending} onPress={() => act('remove')} />
          <Button title={t("Remove + 7d ban")} size="sm" variant="danger" style={styles.flex}
            disabled={resolve.isPending} onPress={() => act('remove_and_suspend')} />
        </View>
      ) : (
        <AppText variant="caption" color="success">
          {t('Resolved')} {formatRelativeTime(report.reviewed_at)} · {report.resolution}
        </AppText>
      )}
    </Card>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  flex: { flex: 1 },
  bold: { fontWeight: '700' },
  tabs: { flexDirection: 'row', marginHorizontal: screenPadding, marginBottom: spacing.sm, padding: spacing.xs,
    borderRadius: radius.lg, backgroundColor: colors.surfaceMuted },
  tab: { flex: 1, alignItems: 'center', paddingVertical: spacing.sm, borderRadius: radius.md },
  tabActive: { backgroundColor: colors.surface },
  list: { paddingHorizontal: screenPadding, paddingBottom: spacing.xxxl, gap: spacing.md },
  card: { gap: spacing.sm },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  reason: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.full, backgroundColor: colors.dangerSoft },
  evidence: { padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.surfaceMuted },
  suspended: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.sm,
    borderRadius: radius.md, backgroundColor: colors.warningSoft },
  actions: { flexDirection: 'row', gap: spacing.xs, flexWrap: 'wrap' },
});
