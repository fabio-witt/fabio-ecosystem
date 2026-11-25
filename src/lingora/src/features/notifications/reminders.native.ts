import {
  AndroidImportance, IosAuthorizationStatus, SchedulableTriggerInputTypes,
  addNotificationResponseReceivedListener, getLastNotificationResponseAsync,
  cancelScheduledNotificationAsync, getAllScheduledNotificationsAsync,
  getPermissionsAsync, requestPermissionsAsync, scheduleNotificationAsync,
  setNotificationChannelAsync, setNotificationHandler,
} from 'expo-notifications';
import { Platform } from 'react-native';

import { getUiLanguage, t } from '@/lib/i18n';

import { reminderPlan, type ReminderProgress } from './reminder-plan';

export const remindersAvailable = true;
const channelId = 'learning-reminders';
const prefix = 'lingora-learn-';
let pending = Promise.resolve();

setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false,
  }),
});

function serialize(operation: () => Promise<void>) {
  const next = pending.then(operation);
  pending = next.catch(() => {});
  return next;
}

async function cancelScheduledReminders() {
  const notifications = await getAllScheduledNotificationsAsync();
  await Promise.all(notifications.filter(({ identifier }) => identifier.startsWith(prefix))
    .map(({ identifier }) => cancelScheduledNotificationAsync(identifier)));
}

function permitted(permission: Awaited<ReturnType<typeof getPermissionsAsync>>) {
  return permission.granted || permission.ios?.status === IosAuthorizationStatus.PROVISIONAL;
}

export async function scheduleLearningReminder(userId: string, hour: number, progress?: ReminderProgress) {
  if (Platform.OS === 'android') {
    await setNotificationChannelAsync(channelId, {
      name: t('Learning reminders'), importance: AndroidImportance.DEFAULT,
    });
  }
  let permission = await getPermissionsAsync();
  if (!permitted(permission) && permission.canAskAgain) permission = await requestPermissionsAsync();
  if (!permitted(permission)) throw new Error(t('Allow GrammarBay notifications in your device settings to use reminders.'));
  await replaceReminders(userId, hour, progress);
}

function replaceReminders(userId: string, hour: number, progress?: ReminderProgress) {
  const plan = reminderPlan(hour, progress, getUiLanguage());
  return serialize(async () => {
    await cancelScheduledReminders();
    for (const item of plan) {
      await scheduleNotificationAsync({
        identifier: prefix + userId + '-' + item.date.getTime(),
        content: { title: item.title, body: item.body, data: { screen: 'learn', userId } },
        trigger: { type: SchedulableTriggerInputTypes.DATE, date: item.date, channelId },
      });
    }
  });
}

export function cancelLearningReminder(_userId: string) {
  return serialize(cancelScheduledReminders);
}

/** Background reconciliation never asks for notification permission. */
export async function syncLearningReminders(userId: string | undefined, hour: number | null, progress?: ReminderProgress) {
  if (!userId || hour === null) return serialize(cancelScheduledReminders);
  const permission = await getPermissionsAsync();
  if (permitted(permission)) await replaceReminders(userId, hour, progress);
}

let lastOpened: string | undefined;

export function watchLearningReminder(userId: string, onOpen: () => void) {
  let active = true;
  const handle = (response: Awaited<ReturnType<typeof getLastNotificationResponseAsync>>) => {
    if (!active || !response) return;
    const request = response.notification.request;
    if (!request.identifier.startsWith(prefix) || request.content.data?.userId !== userId
      || lastOpened === request.identifier) return;
    lastOpened = request.identifier;
    onOpen();
  };
  const subscription = addNotificationResponseReceivedListener(handle);
  void getLastNotificationResponseAsync().then(handle).catch(() => {});
  return () => { active = false; subscription.remove(); };
}
