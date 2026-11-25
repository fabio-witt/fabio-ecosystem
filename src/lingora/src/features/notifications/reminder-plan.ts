import { translate, type UiLanguage } from '@/lib/i18n';

export type ReminderProgress = { daily_xp: number; streak: number };
export type ReminderPlanItem = { date: Date; title: string; body: string };

/** Refresh a month of local reminders whenever the app opens or learning changes. */
export function reminderPlan(hour: number, progress: ReminderProgress | undefined, language: UiLanguage, now = new Date()) {
  if (!Number.isInteger(hour) || hour < 0 || hour > 23) throw new Error('Invalid reminder time.');
  const result: ReminderPlanItem[] = [];
  for (let offset = 0; offset < 30; offset++) {
    const date = new Date(now);
    date.setDate(now.getDate() + offset);
    date.setHours(hour, 0, 0, 0);
    if (date <= now || (offset === 0 && (progress?.daily_xp ?? 0) > 0)) continue;
    result.push({
      date,
      title: translate('Time to practise', undefined, language),
      body: offset === 0 && (progress?.streak ?? 0) > 0
        ? translate('Keep your {n}-day streak alive with one lesson!', { n: progress!.streak }, language)
        : translate('Continue a lesson or review a correction in GrammarBay.', undefined, language),
    });
  }
  return result;
}
