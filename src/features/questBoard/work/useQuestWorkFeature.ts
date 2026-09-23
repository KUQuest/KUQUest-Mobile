import { useCallback, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useLocale } from "@/features/preferences/localeStore";

import { ApiError } from "@/api/ApiClient";
import { createQuestIdempotencyKey } from "@/api/QuestApi";
import { useSessionQuery } from "@/features/auth/sessionQueries";
import { getChatRouteParams } from "@/features/chat/chatData";
import { questWorkMessages } from "@/locales/questWorkMessages";
import { isTerminalStatus } from "@/domain/questLifecycle";
import { getRouteParam } from "@/utils";
import { useLiveQuestSnapshotQuery } from "../api/questBoardQueries";
import { liveQuestService } from "../live/liveQuestService";
import type { LiveQuestSnapshot } from "../live/liveQuestTypes";
import type { QuestStatus } from "../domain/types";

const POLL_INTERVAL_MS = 5_000;
const POLL_WINDOW_BEFORE_START_MS = 60_000;
const POLL_WINDOW_AFTER_START_MS = 120_000;

export interface QuestWorkFeatureProps {
  questId?: string;
  viewerId?: string;
  /** Compatibility alias used by existing Quest detail routes. */
  studentId?: string;
  editRequestId?: string;
}

function getErrorText(error: unknown, serverError: string): string {
  if (error instanceof ApiError && error.code)
    return `${serverError} (${error.code})`;
  if (error instanceof Error && error.message)
    return `${serverError} ${error.message}`;
  return serverError;
}

export function useQuestWorkFeature({
  questId,
  viewerId,
  studentId,
  editRequestId,
}: QuestWorkFeatureProps) {
  const router = useRouter();
  const params = useLocalSearchParams<{
    id?: string | string[];
    viewerId?: string | string[];
    studentId?: string | string[];
    editRequestId?: string | string[];
  }>();
  const routeQuestId = questId ?? getRouteParam(params.id);
  const routeViewerId =
    viewerId ??
    studentId ??
    getRouteParam(params.viewerId) ??
    getRouteParam(params.studentId);
  const resolvedEditRequestId =
    editRequestId ?? getRouteParam(params.editRequestId);
  const sessionQuery = useSessionQuery();
  const resolvedViewerId = routeViewerId ?? sessionQuery.data?.user.id;
  const { locale } = useLocale();
  const messages = questWorkMessages[locale];
  const snapshotPollingInterval = useCallback(
    (currentSnapshot: LiveQuestSnapshot | undefined): number | false => {
      if (!currentSnapshot || currentSnapshot.state !== "QUEST_ASSIGNED")
        return false;
      const startAt = new Date(currentSnapshot.quest.startTime).getTime();
      if (!Number.isFinite(startAt)) return false;
      const nowAt = Date.now();
      const pollStartAt = startAt - POLL_WINDOW_BEFORE_START_MS;
      const pollDeadline = startAt + POLL_WINDOW_AFTER_START_MS;
      if (nowAt < pollStartAt) return pollStartAt - nowAt;
      if (nowAt > pollDeadline) return false;

      const elapsedPolls = Math.floor((nowAt - pollStartAt) / POLL_INTERVAL_MS);
      const maxPolls =
        (POLL_WINDOW_BEFORE_START_MS + POLL_WINDOW_AFTER_START_MS) /
        POLL_INTERVAL_MS;
      if (elapsedPolls >= maxPolls - 1) return false;
      return POLL_INTERVAL_MS;
    },
    []
  );
  const snapshotOptions = resolvedEditRequestId
    ? { editRequestId: resolvedEditRequestId }
    : {};
  const snapshotQuery = useLiveQuestSnapshotQuery(
    routeQuestId ?? null,
    resolvedViewerId ?? null,
    snapshotOptions,
    Boolean(routeViewerId || !sessionQuery.isPending),
    snapshotPollingInterval
  );
  const snapshot = snapshotQuery.data ?? null;
  const refetchSnapshot = snapshotQuery.refetch;
  const loading =
    (!routeViewerId && sessionQuery.isPending) || snapshotQuery.isPending;
  const [editSending, setEditSending] = useState(false);
  const [editFeedback, setEditFeedback] = useState<string>();
  const [confirmationSending, setConfirmationSending] = useState(false);
  const [commandError, setCommandError] = useState<string | null>(null);
  const snapshotErrorText = snapshotQuery.error
    ? getErrorText(snapshotQuery.error, messages.serverError)
    : undefined;
  const errorText = commandError ?? snapshotErrorText;
  const stale = Boolean(snapshot && (snapshotQuery.isError || commandError));

  const refreshSnapshot = useCallback(async () => {
    const result = await refetchSnapshot();
    if (result.error) throw result.error;
    setCommandError(null);
    return result.data;
  }, [refetchSnapshot]);

  const handleBack = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace("/(tabs)");
  }, [router]);

  const respondToEdit = useCallback(
    async (decision: "EDIT_RESPONSE_ACCEPTED" | "EDIT_RESPONSE_DECLINED") => {
      if (!snapshot?.editRequest || !snapshot.capabilities.canRespondToEdit)
        return;
      setEditSending(true);
      setEditFeedback(undefined);
      try {
        await liveQuestService.respondToEditRequest(
          snapshot.editRequest.requestId,
          { decision },
          createQuestIdempotencyKey()
        );
        setEditFeedback(messages.editUpdated);
        await refreshSnapshot().catch(() => undefined);
      } catch (error) {
        setCommandError(getErrorText(error, messages.serverError));
      } finally {
        setEditSending(false);
      }
    },
    [messages, refreshSnapshot, snapshot]
  );
  const confirmCompletion = useCallback(async () => {
    if (
      !snapshot?.capabilities.canConfirmCompletion ||
      !routeQuestId ||
      confirmationSending
    )
      return;
    setConfirmationSending(true);
    setCommandError(null);
    try {
      await liveQuestService.confirmCompletion(
        routeQuestId,
        createQuestIdempotencyKey()
      );
      const refreshedSnapshot = await refreshSnapshot();
      if (
        refreshedSnapshot &&
        isTerminalStatus(refreshedSnapshot.state as QuestStatus)
      ) {
        router.replace("/my-quests");
      }
    } catch (error) {
      setCommandError(getErrorText(error, messages.serverError));
    } finally {
      setConfirmationSending(false);
    }
  }, [
    confirmationSending,
    messages,
    refreshSnapshot,
    routeQuestId,
    router,
    snapshot,
  ]);

  const openDispute = useCallback(() => {
    if (!routeQuestId) return;
    router.push(`../quest/${routeQuestId}/dispute`);
  }, [routeQuestId, router]);
  const conversationId = snapshot?.workConversation?.id;
  const canOpenChat = Boolean(
    snapshot?.capabilities.canReadWorkChat && conversationId && resolvedViewerId
  );
  const openChat = useCallback(() => {
    if (!conversationId || !routeQuestId || !resolvedViewerId) return;
    router.push({
      pathname: "/chat/[id]",
      params: getChatRouteParams({
        conversationId,
        questId: routeQuestId,
        viewerId: resolvedViewerId,
      }),
    });
  }, [conversationId, resolvedViewerId, routeQuestId, router]);

  return {
    canOpenChat,
    confirmationSending,
    editFeedback,
    editSending,
    errorText,
    handleBack,
    loading,
    locale,
    messages,
    openChat,
    openDispute,
    refreshSnapshot,
    refreshing: snapshotQuery.isRefetching,
    respondToEdit,
    resolvedQuestId: routeQuestId,
    resolvedViewerId,
    snapshot,
    stale,
    confirmCompletion,
  };
}
