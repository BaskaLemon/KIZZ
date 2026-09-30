/** Ask the notification bell to refetch now (e.g. right after an action that
 * may have created a notification such as a level-up). */
export const NOTIFICATIONS_REFRESH = 'kizz:notifications';

export function refreshNotifications(): void {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(NOTIFICATIONS_REFRESH));
}
