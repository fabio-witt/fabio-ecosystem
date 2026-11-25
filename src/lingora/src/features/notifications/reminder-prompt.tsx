import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, Button, Card } from '@/components/ui';
import { spacing } from '@/constants/theme';
import { useLearnSummary } from '@/features/learn/progress';
import { useDeviceState } from '@/lib/device-state';
import { t } from '@/lib/i18n';
import { useSession } from '@/providers/session-provider';

import { useNotificationPreferences } from './inbox';
import { remindersAvailable, scheduleLearningReminder } from './reminders';

const hours = [9, 13, 19];

/**
 * Offers the daily learning reminder where people learn, instead of only in
 * Settings. Shown in the mobile app until a time is chosen or it is dismissed.
 */
export function ReminderPrompt() {
  const { user } = useSession();
  const [preferences, save] = useNotificationPreferences();
  const [dismissed, setDismissed] = useDeviceState(user?.id, 'reminder-prompt-dismissed', false);
  const summary = useLearnSummary();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  if (!remindersAvailable || !user || preferences.reminderHour !== null || dismissed) return null;

  async function choose(hour: number) {
    if (!user || busy) return;
    setBusy(true);
    setError('');
    try {
      await scheduleLearningReminder(user.id, hour, summary.data);
      save({ ...preferences, reminderHour: hour });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t('Could not update the reminder.'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card style={styles.card}>
      <AppText variant="heading">{t('⏰ Daily reminder?')}</AppText>
      <AppText color="textSecondary">
        {t('A short nudge at your time helps you keep your streak. It skips days on which you have already learned.')}
      </AppText>
      <View style={styles.row}>
        {hours.map((hour) => (
          <Button key={hour} size="sm" variant="secondary" disabled={busy}
            title={`${String(hour).padStart(2, '0')}:00`} onPress={() => void choose(hour)} />
        ))}
        <Button size="sm" variant="ghost" title={t('Not now')} disabled={busy} onPress={() => setDismissed(true)} />
      </View>
      {error ? <AppText color="danger">{error}</AppText> : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.sm },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
