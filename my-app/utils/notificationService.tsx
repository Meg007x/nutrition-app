import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";

const isWeb = Platform.OS === "web";
const WATER_REMINDER_TYPE = "water-reminder";
const WATER_COMPLETION_TYPE = "water-goal-complete";
const WATER_REMINDER_DAYS_AHEAD = 3;
const WATER_REMINDER_START_HOUR = 8;
const WATER_REMINDER_END_HOUR = 21;

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
    await Notifications.setNotificationChannelAsync("water-reminders", {
      name: "Water reminders",
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 150],
      sound: "default",
    });
  }
}

export async function cancelAllMealNotifications() {
  if (isWeb) return;
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const mealNotifications = scheduled.filter(
    ({ content }) =>
      content.data?.type === "meal-reminder" ||
      content.data?.screen === "/scan"
  );

  await Promise.all(
    mealNotifications.map(({ identifier }) =>
      Notifications.cancelScheduledNotificationAsync(identifier)
    )
  );
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
        data: { type: "meal-reminder", screen: "/scan" },
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

export async function requestWaterReminderPermission() {
  if (isWeb) {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return false;
    }

    const permission =
      window.Notification.permission === "default"
        ? await window.Notification.requestPermission()
        : window.Notification.permission;
    return permission === "granted";
  }

  const granted = await ensureNotificationPermissions();
  if (granted) await setupNotificationChannel();
  return granted;
}

const getLocalDateKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

const getCompletionKey = (userId: string, date: Date) =>
  `water_goal_completed_${userId}_${getLocalDateKey(date)}`;

async function cancelScheduledWaterReminders(dateKey?: string) {
  if (isWeb) return;

  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const waterNotifications = scheduled.filter(({ content }) => {
    if (content.data?.type !== WATER_REMINDER_TYPE) return false;
    return !dateKey || content.data?.date === dateKey;
  });

  await Promise.all(
    waterNotifications.map(({ identifier }) =>
      Notifications.cancelScheduledNotificationAsync(identifier)
    )
  );
}

export async function syncWaterReminderSchedule({
  userId,
  enabled,
  totalMl,
  targetMl,
}: {
  userId: string;
  enabled: boolean;
  totalMl: number;
  targetMl: number;
}) {
  const now = new Date();
  const completionKey = getCompletionKey(userId, now);
  const completed =
    totalMl >= targetMl ||
    (await AsyncStorage.getItem(completionKey)) === "true";

  if (totalMl >= targetMl) {
    await AsyncStorage.setItem(completionKey, "true");
  }

  if (isWeb) {
    return {
      ok: true,
      completed,
      reason: "web_uses_foreground_timer" as const,
    };
  }

  await cancelScheduledWaterReminders();
  if (!enabled) return { ok: true, completed: false };

  const permissions = await Notifications.getPermissionsAsync();
  const granted =
    permissions.granted ||
    permissions.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
  if (!granted) return { ok: false, completed, reason: "permission_denied" as const };

  for (let offset = 0; offset <= WATER_REMINDER_DAYS_AHEAD; offset += 1) {
    const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset);
    const dateKey = getLocalDateKey(day);
    if (offset === 0 && completed) continue;

    for (
      let hour = WATER_REMINDER_START_HOUR;
      hour < WATER_REMINDER_END_HOUR;
      hour += 1
    ) {
      const reminderTime = new Date(
        day.getFullYear(),
        day.getMonth(),
        day.getDate(),
        hour
      );
      if (reminderTime <= now) continue;

      const body =
        offset === 0 && totalMl > 0
          ? `วันนี้คุณดื่มน้ำไปแล้ว ${totalMl.toLocaleString()} จาก ${targetMl.toLocaleString()} ml สู้ต่ออีกนิดนะ`
          : "ถึงเวลาดื่มน้ำแล้ว 💧 อย่าลืมจิบน้ำระหว่างวันนะ";

      await Notifications.scheduleNotificationAsync({
        content: {
          title: "ได้เวลาดื่มน้ำแล้ว 💧",
          body,
          sound: "default",
          data: {
            type: WATER_REMINDER_TYPE,
            date: dateKey,
            screen: "/water-log",
          },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: reminderTime,
          channelId: "water-reminders",
        },
      });
    }
  }

  return { ok: true, completed };
}

export function startWebWaterReminderTimer({
  totalMl,
  targetMl,
}: {
  totalMl: number;
  targetMl: number;
}) {
  if (
    !isWeb ||
    typeof window === "undefined" ||
    !("Notification" in window) ||
    window.Notification.permission !== "granted" ||
    totalMl >= targetMl
  ) {
    return () => {};
  }

  let timeoutId: number | undefined;
  let stopped = false;

  const scheduleNextReminder = () => {
    if (stopped) return;
    const now = new Date();
    const next = new Date(now);
    next.setMinutes(0, 0, 0);
    next.setHours(next.getHours() + 1);

    if (next.getHours() >= WATER_REMINDER_END_HOUR) {
      next.setDate(next.getDate() + 1);
      next.setHours(WATER_REMINDER_START_HOUR, 0, 0, 0);
    } else if (next.getHours() < WATER_REMINDER_START_HOUR) {
      next.setHours(WATER_REMINDER_START_HOUR, 0, 0, 0);
    }

    timeoutId = window.setTimeout(() => {
      if (stopped) return;
      const currentTime = new Date();
      const withinReminderHours =
        currentTime.getHours() >= WATER_REMINDER_START_HOUR &&
        currentTime.getHours() < WATER_REMINDER_END_HOUR;
      if (
        withinReminderHours &&
        window.Notification.permission === "granted"
      ) {
        const body =
          totalMl > 0
            ? `วันนี้คุณดื่มน้ำไปแล้ว ${totalMl.toLocaleString()} จาก ${targetMl.toLocaleString()} ml สู้ต่ออีกนิดนะ`
            : "ถึงเวลาดื่มน้ำแล้ว 💧 อย่าลืมจิบน้ำระหว่างวันนะ";
        new window.Notification("ได้เวลาดื่มน้ำแล้ว 💧", { body });
      }
      scheduleNextReminder();
    }, Math.max(next.getTime() - now.getTime(), 0));
  };

  scheduleNextReminder();
  return () => {
    stopped = true;
    if (timeoutId !== undefined) window.clearTimeout(timeoutId);
  };
}

export async function notifyWaterGoalReached({
  userId,
  date,
  previousTotalMl,
  totalMl,
  targetMl,
  enabled,
}: {
  userId: string;
  date: Date;
  previousTotalMl: number;
  totalMl: number;
  targetMl: number;
  enabled: boolean;
}) {
  if (totalMl < targetMl) return;

  const completionKey = getCompletionKey(userId, date);
  const alreadyCompleted =
    (await AsyncStorage.getItem(completionKey)) === "true";
  await AsyncStorage.setItem(completionKey, "true");

  if (!enabled || alreadyCompleted || previousTotalMl >= targetMl) return;

  if (isWeb) {
    if (
      typeof window !== "undefined" &&
      "Notification" in window &&
      window.Notification.permission === "granted"
    ) {
      new window.Notification("เยี่ยมเลย! 🎉", {
        body: "วันนี้คุณดื่มน้ำครบเป้าหมายแล้ว",
      });
    }
    return;
  }

  const permissions = await Notifications.getPermissionsAsync();
  const granted =
    permissions.granted ||
    permissions.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
  if (!granted) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "เยี่ยมเลย! 🎉",
      body: "วันนี้คุณดื่มน้ำครบเป้าหมายแล้ว",
      sound: "default",
      data: { type: WATER_COMPLETION_TYPE, screen: "/water-log" },
    },
    trigger: null,
  });
}
