import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const LINES = [
  'What are you up to right now?',
  'Quick, show the family your moment.',
  'Front and back, go!',
  'Snap it or skip it, your call.',
  "New hour, new snap. What's happening?",
];

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export const remindersSupported = true;

/** Schedules one daily reminder at the start of every hour in the window. */
export async function scheduleReminders(enabled: boolean, start: number, end: number) {
  await Notifications.cancelAllScheduledNotificationsAsync();
  if (!enabled) return true;

  const perm = await Notifications.requestPermissionsAsync();
  if (!perm.granted) return false;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('snaps', {
      name: 'Hourly snaps',
      importance: Notifications.AndroidImportance.HIGH,
      lightColor: '#E2668F',
    });
  }

  for (let h = start; h <= end; h++) {
    await Notifications.scheduleNotificationAsync({
      content: { title: '📸 StormSnap time', body: LINES[h % LINES.length], data: { hour: h } },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: h, minute: 0, channelId: 'snaps' },
    });
  }
  return true;
}

export function onReminderTap(cb: () => void) {
  const sub = Notifications.addNotificationResponseReceivedListener(() => cb());
  return () => sub.remove();
}
