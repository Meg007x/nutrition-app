import { Platform } from "react-native";
import * as Notifications from "expo-notifications";

const isWeb = Platform.OS === "web";

if (!isWeb) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

export async function ensureNotificationPermissions() {
  if (isWeb) {
    return false;
  }

  const settings = await Notifications.getPermissionsAsync();

  if (
    settings.granted ||
    settings.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
  ) {
    return true;
  }

  const request = await Notifications.requestPermissionsAsync();

  return (
    request.granted ||
    request.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
  );
}

export async function setupNotificationChannel() {
  if (isWeb) return;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("meal-reminders", {
      name: "Meal Reminders",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      sound: "default",
    });
  }
}

export async function cancelAllMealNotifications() {
  if (isWeb) return;
  await Notifications.cancelAllScheduledNotificationsAsync();
}

type MealReminderItem = {
  id: string;
  name: string;
  time: string;
  notify: boolean;
};

export async function scheduleMealNotifications(meals: MealReminderItem[]) {
  if (isWeb) {
    return { ok: false, reason: "web_not_supported" as const };
  }

  const granted = await ensureNotificationPermissions();

  if (!granted) {
    return { ok: false, reason: "permission_denied" as const };
  }

  await setupNotificationChannel();
  await cancelAllMealNotifications();

  const scheduledIds: string[] = [];

  for (const meal of meals) {
    if (!meal.notify) continue;

    const [hourStr, minuteStr] = meal.time.split(":");
    const hour = Number(hourStr);
    const minute = Number(minuteStr);

    if (Number.isNaN(hour) || Number.isNaN(minute)) continue;

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: `ถึงเวลามื้อ${meal.name}`,
        body: `ได้เวลารับประทานมื้อ${meal.name}แล้ว`,
        sound: "default",
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
        channelId: "meal-reminders",
      },
    });

    scheduledIds.push(id);
  }

  return { ok: true, ids: scheduledIds };
}