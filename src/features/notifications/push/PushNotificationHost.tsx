import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { useEffect } from "react";
import { Platform } from "react-native";

import { useSessionQuery } from "@/features/auth/sessionQueries";
import { invalidateQuestReads } from "@/features/questBoard/api/questBoardQueries";
import { parsePushPayload, routeForPush } from "./pushPayload";
import { QuestV2PushTypeValue } from "@/api/questV2Contracts";
import { createPushRegistrationManager } from "./pushNative";
import "./pushTask";

/** Registers the Android push device while signed in and routes notification taps. */
export function PushNotificationHost() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const sessionQuery = useSessionQuery({ enabled: false });
  const viewerId = sessionQuery.data?.user.id;

  useEffect(() => {
    if (Platform.OS !== "android" || !viewerId) return;
    const manager = createPushRegistrationManager(Device.isDevice);
    void manager.start().catch(() => undefined);
    return () => manager.stop();
  }, [viewerId]);

  useEffect(() => {
    if (Platform.OS !== "android" || !viewerId) return;
    const open = (response: Notifications.NotificationResponse) => {
      const payload = parsePushPayload(
        response.notification.request.content.data
      );
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
