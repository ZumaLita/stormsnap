// The web app has no background reminders; the APK handles those.
export const remindersSupported = false;
export async function scheduleReminders(_enabled: boolean, _start: number, _end: number) {
  return true;
}
export function onReminderTap(_cb: () => void) {
  return () => {};
}
