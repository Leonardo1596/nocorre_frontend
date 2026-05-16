import {
  LocalNotifications
} from "@capacitor/local-notifications";

export async function requestNotificationPermission() {
  const permission =
    await LocalNotifications.requestPermissions();

  console.log(
    "Notification permission:",
    permission
  );

  return permission;
}