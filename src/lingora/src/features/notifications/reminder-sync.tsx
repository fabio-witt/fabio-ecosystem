import { router } from 'expo-router';
import { useEffect } from 'react';
import { AppState } from 'react-native';

import { useLearnSummary } from '@/features/learn/progress';
import { useT } from '@/lib/i18n';
import { useSession } from '@/providers/session-provider';

import { useGame } from '@/features/game/store';

import { useNotificationPreferences } from './inbox';
import { resolveReminderHour } from './usual-hour';
import { syncLearningReminders, watchLearningReminder } from './reminders';

export function ReminderSync() {
  const { user } = useSession();
  const [preferences] = useNotificationPreferences();
  const { language } = useT();
  const { data: progress, refetch } = useLearnSummary();
  const userId = user?.id;
  const game = useGame();
  const hour = resolveReminderHour(preferences.reminderHour, game.state.lessonHours);

  useEffect(() => {
    if (!userId) return;
    return watchLearningReminder(userId, () => router.push('/learn'));
  }, [userId]);

  useEffect(() => {
    const sync = () => {
      // Wait for today's server progress before planning a signed-in reminder.
      if (userId && hour !== null && !progress) return;
      void syncLearningReminders(userId, hour, progress).catch(() => {
        // Opening the app must still work if the OS cannot schedule reminders.
      });
    };
    sync();
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') { void refetch(); sync(); }
    });
    return () => subscription.remove();
  }, [userId, hour, language, progress, refetch]);
  return null;
}
