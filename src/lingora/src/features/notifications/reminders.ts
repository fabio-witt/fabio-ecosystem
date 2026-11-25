import { t } from '@/lib/i18n';

import type { ReminderProgress } from './reminder-plan';

export const remindersAvailable = false;
export async function scheduleLearningReminder(_userId: string, _hour: number, _progress?: ReminderProgress) {
  throw new Error(t('Learning reminders are available in the mobile app.'));
}
export async function cancelLearningReminder(_userId: string) {}
export async function syncLearningReminders(_userId: string | undefined, _hour: number | null, _progress?: ReminderProgress) {}

export function watchLearningReminder(_userId: string, _onOpen: () => void) { return () => {}; }
