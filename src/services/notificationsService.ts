import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { Platform } from "react-native";
import { apiRequest } from "./apiClient";

const PUSH_TOKEN_KEY = "@push_token_v1";

/**
 * Check if we're running in Expo Go (which doesn't support push on Android in SDK 53+).
 * In Expo Go, Constants.appOwnership === "expo".
 */
function isExpoGo(): boolean {
  return Constants.appOwnership === "expo";
}

/**
 * Lazy-load expo-notifications only when needed to avoid errors on Expo Go Android.
 */
async function getNotificationsModule() {
  const Notifications = await import("expo-notifications");
  return Notifications;
}

/**
 * Requests push notification permission and registers the Expo push token
 * with the backend. Safe to call after every login — the backend deduplicates
 * tokens per user via $addToSet.
 *
 * Silently no-ops on web, in Expo Go on Android, or when the user denies permission.
 */
export async function registerPushToken(): Promise<void> {
  // Push tokens are only meaningful on physical devices / simulators.
  // Web does not support Expo push notifications.
  if (Platform.OS === "web") return;

  // Expo Go on Android doesn't support push notifications (SDK 53+).
  // Skip gracefully — the app still works, just without push.
  if (Platform.OS === "android" && isExpoGo()) return;

  try {
    const Notifications = await getNotificationsModule();

    // Request permission — shows the system prompt on first call.
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      // User declined — don't throw, just skip silently.
      return;
    }

    // getExpoPushTokenAsync requires a projectId in SDK 49+.
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId;

    const tokenData = projectId
      ? await Notifications.getExpoPushTokenAsync({ projectId })
      : await Notifications.getExpoPushTokenAsync();

    const token = tokenData.data;

    // Persist locally so we can remove it on logout.
    await AsyncStorage.setItem(PUSH_TOKEN_KEY, token);

    await apiRequest("/notifications/device-token", {
      method: "POST",
      auth: true,
      body: { token },
    });
  } catch {
    // Never let notification setup crash the login flow.
  }
}

/**
 * Removes the stored push token from the backend on logout so the user
 * stops receiving notifications after signing out.
 */
export async function unregisterPushToken(): Promise<void> {
  if (Platform.OS === "web") return;

  // Skip on Expo Go Android since we never registered in the first place.
  if (Platform.OS === "android" && isExpoGo()) return;

  try {
    const token = await AsyncStorage.getItem(PUSH_TOKEN_KEY);
    if (!token) return;

    await apiRequest("/notifications/device-token", {
      method: "DELETE",
      auth: true,
      body: { token },
    });

    await AsyncStorage.removeItem(PUSH_TOKEN_KEY);
  } catch {
    // Best-effort — don't block logout.
  }
}

/**
 * Configure how notifications are presented while the app is in the foreground.
 * Call this once at app startup (e.g. in the root _layout).
 * Lazy-loads to avoid errors on Expo Go Android.
 */
export async function configureNotificationHandler(): Promise<void> {
  // Skip on web and Expo Go Android.
  if (Platform.OS === "web") return;
  if (Platform.OS === "android" && isExpoGo()) return;

  try {
    const Notifications = await getNotificationsModule();
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  } catch {
    // Silently fail if notifications can't be configured.
  }
}
