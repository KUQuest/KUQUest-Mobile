import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { useEffect, useSyncExternalStore } from "react";
import { Platform } from "react-native";

import { sessionKeys } from "@/features/auth/sessionQueries";
import type { AuthSession } from "@/features/auth/types";
import { invalidateQuestReads } from "@/features/questBoard/api/questBoardQueries";
import { invalidateNotificationQueries } from "@/features/notifications/inbox/notificationQueries";
import {
  MEMBER_PUSH_ROUTE,
  parseMemberPushPayload,
  parsePushPayload,
  routeForPush,
} from "./pushPayload";
import { QuestV2PushTypeValue } from "@/api/questV2Contracts";
import { createPushRegistrationManager, isPushEnabled } from "./pushNative";
import "./pushTask";

/** Registers the Android push device while signed in and routes notification taps. */
export function PushNotificationHost() {
  const router = useRouter();
  const queryClient = useQueryClient();
  // Read the cache directly: clearSessionCache() drops queries without
  // notifying observers, so a useQuery observer here would keep a stale viewer.
  const queryCache = queryClient.getQueryCache();
  const viewerId = useSyncExternalStore(
    (onChange) => queryCache.subscribe(onChange),
    () =>
      queryClient.getQueryData<AuthSession | null>(sessionKeys.detail())?.user
        .id
  );

  useEffect(() => {
    if (Platform.OS !== "android" || !viewerId || !isPushEnabled()) return;
    const manager = createPushRegistrationManager(Device.isDevice);
    void manager.start().catch(() => undefined);
    return () => manager.stop();
  }, [viewerId]);

  useEffect(() => {
    if (Platform.OS !== "android" || !viewerId) return;
    const open = (response: Notifications.NotificationResponse) => {
      const data = response.notification.request.content.data;
      if (parseMemberPushPayload(data)) {
        void invalidateNotificationQueries(queryClient);
        router.push(MEMBER_PUSH_ROUTE);
        return;
      }
      const payload = parsePushPayload(data);
      if (!payload) return;
      void invalidateQuestReads(
        queryClient,
        payload.questId,
        viewerId,
        payload.type === QuestV2PushTypeValue.UNDERFILLED_DECISION_PENDING
          ? "hirer"
          : "worker"
      );
      router.push(routeForPush(payload));
    };
    const initial = Notifications.getLastNotificationResponse();
    if (initial) {
      Notifications.clearLastNotificationResponse();
      open(initial);
    }
    const subscription =
      Notifications.addNotificationResponseReceivedListener(open);
    return () => subscription.remove();
  }, [queryClient, router, viewerId]);

  return null;
}
