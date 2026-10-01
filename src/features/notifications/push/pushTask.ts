import { AppState, Platform } from "react-native";
import * as Notifications from "expo-notifications";
import * as TaskManager from "expo-task-manager";

import { secureStorage } from "@/infrastructure/storage/keyValueStorage";
import { useLocaleStore } from "@/features/preferences/localeStore";
import {
  hasHandledTransition,
  localizedPushCopy,
  markTransitionHandled,
  parsePushPayload,
  PUSH_CHANNEL_ID,
} from "./pushPayload";

const PUSH_TASK_NAME = "KUQUEST_PUSH_DATA_TASK";

/** Task payload for a data-only FCM message carries the data map as a JSON string. */
function readTaskData(data: unknown): unknown {
  const dataString = (data as { data?: { dataString?: unknown } } | null)?.data
    ?.dataString;
  if (typeof dataString !== "string") return null;
  try {
    return JSON.parse(dataString);
  } catch {
    return null;
  }
}

/**
 * Presents a localized OS notification for a data-only push. Foreground
 * sessions are skipped: the in-app notice coordinator already covers them.
 */
export async function presentIncomingPush(raw: unknown): Promise<void> {
  const payload = parsePushPayload(raw);
  if (!payload || AppState.currentState === "active") return;
  if (await hasHandledTransition(secureStorage, payload.transitionId)) return;
  await useLocaleStore.getState().hydrateLocale();
  const copy = localizedPushCopy(payload, useLocaleStore.getState().locale);
  if (!copy) return;
  await Notifications.scheduleNotificationAsync({
    content: { title: copy.title, body: copy.body, data: payload },
    trigger: { channelId: PUSH_CHANNEL_ID },
  });
  await markTransitionHandled(secureStorage, payload.transitionId);
}

// Must run at module scope: the OS starts the JS bundle headless for the task.
if (Platform.OS === "android") {
  TaskManager.defineTask<Notifications.NotificationTaskPayload>(
    PUSH_TASK_NAME,
    async ({ data }) => {
      // Notification taps also reach this task; those are routed by the host hook.
      if (!data || "actionIdentifier" in data) return;
      await presentIncomingPush(readTaskData(data)).catch(() => undefined);
    }
  );
  void Notifications.registerTaskAsync(PUSH_TASK_NAME).catch(() => undefined);
}
