import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Switch, View } from 'react-native';

import { AppText, Button, Card, ErrorState, LoadingState, PressableCard, Screen, ScreenHeader } from '@/components/ui';
import { screenPadding, spacing } from '@/constants/theme';
import { useActivityInbox, useNotificationPreferences, useReadInboxActivity } from '@/features/notifications/inbox';
import { cancelLearningReminder, remindersAvailable, scheduleLearningReminder } from '@/features/notifications/reminders';
import { useLearnSummary } from '@/features/learn/progress';
import { useSession } from '@/providers/session-provider';
import { useGame } from '@/features/game/store';
import { AUTO_REMINDER, resolveReminderHour, usualLearningHour } from '@/features/notifications/usual-hour';
import { t } from '@/lib/i18n';

export default function NotificationsScreen() {
  const { user } = useSession();
  const summary = useLearnSummary();
  const [preferences, save] = useNotificationPreferences();
  const inbox = useActivityInbox();
  const read = useReadInboxActivity();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const game = useGame();

  async function reminder(hour: number | null) {
    if (!user || busy) return;
    setBusy(true);
    setError('');
    try {
      if (hour === null) await cancelLearningReminder(user.id);
      else await scheduleLearningReminder(user.id, resolveReminderHour(hour, game.state.lessonHours)!, summary.data);
      save({ ...preferences, reminderHour: hour });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not update the reminder.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen>
      <ScreenHeader title={t("Notifications")} />
      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.group}>
          <AppText variant="heading">{t("Preferences")}</AppText>
          <View style={styles.row}><AppText style={styles.flex}>{t("Messages in activity inbox")}</AppText>
            <Switch accessibilityLabel={t("Messages in activity inbox")} value={preferences.messages} disabled={busy}
              onValueChange={(messages) => save({ ...preferences, messages })} />
          </View>
          <View style={styles.row}><AppText style={styles.flex}>{t("Replies in activity inbox")}</AppText>
            <Switch accessibilityLabel={t("Replies in activity inbox")} value={preferences.replies} disabled={busy}
              onValueChange={(replies) => save({ ...preferences, replies })} />
          </View>
          <AppText variant="bodyStrong">{t("Daily learning reminder")}</AppText>
          <AppText color="textSecondary">{remindersAvailable
            ? t("Choose a time on this device. Lingora asks for permission when you turn it on.")
            : t("Available in the mobile app.")}</AppText>
          {remindersAvailable && (
            <View style={styles.row}>
              {[null, AUTO_REMINDER, 9, 13, 19].map((hour) => (
                <Button key={String(hour)} size="sm" title={hour === null ? t("Off") : hour === AUTO_REMINDER
                  ? t('Auto ({time})', { time: `${String(usualLearningHour(game.state.lessonHours)).padStart(2, '0')}:00` })
                  : `${String(hour).padStart(2, '0')}:00`}
                  variant={preferences.reminderHour === hour ? 'primary' : 'secondary'} disabled={busy}
                  accessibilityState={{ selected: preferences.reminderHour === hour }} onPress={() => void reminder(hour)} />
              ))}
            </View>
          )}
          {!!error && <AppText color="danger" accessibilityLiveRegion="polite">{error}</AppText>}
        </Card>
        <AppText variant="heading">{t("Activity inbox")}</AppText>
        {(!preferences.messages && !preferences.replies) ? <AppText color="textSecondary">{t("Both inbox categories are turned off.")}</AppText>
          : inbox.isPending ? <LoadingState /> : inbox.isError
            ? <ErrorState message={t("Could not load activity.")} onRetry={() => inbox.refetch()} />
            : !inbox.data.length ? <AppText color="textSecondary">{t("You’re all caught up.")}</AppText>
              : inbox.data.map((item) => (
                <PressableCard key={`${item.kind}-${item.target_id}`} onPress={() => {
                  read.mutate({ kind: item.kind, targetId: item.target_id, updatedAt: item.updated_at });
                  if (item.kind === 'message') router.push({ pathname: '/chat/[id]', params: { id: item.target_id } });
                  else if (item.kind === 'forum') router.push({ pathname: '/forum/[id]', params: { id: item.target_id } });
                  else router.push({ pathname: '/post/[id]', params: { id: item.target_id } });
                }}>
                  <AppText variant="bodyStrong">{item.kind === 'message' ? t("Message in a chat") : item.kind === 'forum' ? t("New answer in the forum") : t("Reply to your post")}</AppText>
                  <AppText color="textSecondary">{item.read_at ? '' : t("Unread · ")}{new Date(item.updated_at).toLocaleString()}</AppText>
                </PressableCard>
              ))}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: screenPadding, gap: spacing.md, paddingBottom: spacing.xxxl },
  group: { gap: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: spacing.sm },
  flex: { flex: 1 },
});
