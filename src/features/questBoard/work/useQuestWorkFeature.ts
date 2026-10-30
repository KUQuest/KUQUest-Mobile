import { serverNow } from "@/api/serverClock";
import { useCallback, useRef, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useLocale } from "@/features/preferences/localeStore";

import { ApiError } from "@/api/ApiClient";
import { createQuestIdempotencyKey } from "@/api/QuestApi";
import { useSessionQuery } from "@/features/auth/sessionQueries";
import { getChatRouteParams } from "@/features/chat/chatData";
import { questWorkMessages } from "@/locales/questWorkMessages";
import { isTerminalStatus } from "@/domain/questLifecycle";
import { getRouteParam } from "@/utils";
import { getLocalizedErrorMessage } from "@/utils/error";
import {
  useConfirmCompletionMutation,
  useLiveQuestSnapshotQuery,
  useRespondToEditMutation,
  useStartWorkMutation,
  useSubmitTeamRewardAllocationMutation,
} from "../api/questBoardQueries";
import { useFileDispute } from "../dispute/useFileDispute";
import type { LiveQuestSnapshot } from "../live/liveQuestTypes";
import { QuestEditResponseDecision, QuestStatus } from "../domain/types";

const POLL_INTERVAL_MS = 5_000;
// Keep delays below the signed 32-bit timer limit to avoid a 1ms clamp.
const MAX_TIMER_INTERVAL_MS = 2_147_000_000;

/** Start Work rejections that mean the local Quest/Assignment view is stale. */
const START_WORK_RELOAD_CODES: Record<string, true> = {
  START_WORK_ALREADY_RECORDED: true,
  ASSIGNMENT_NOT_FOUND: true,
  QUEST_NOT_ASSIGNED: true,
  QUEST_NOT_FOUND: true,
};

export interface QuestWorkFeatureProps {
  questId?: string;
  viewerId?: string;
  /** Compatibility alias used by existing Quest detail routes. */
  studentId?: string;
}

export function useQuestWorkFeature({
  questId,
  viewerId,
  studentId,
}: QuestWorkFeatureProps) {
  const router = useRouter();
  const params = useLocalSearchParams<{
    id?: string | string[];
    viewerId?: string | string[];
    studentId?: string | string[];
  }>();
  const routeQuestId = questId ?? getRouteParam(params.id);
  const routeViewerId =
    viewerId ??
    studentId ??
    getRouteParam(params.viewerId) ??
    getRouteParam(params.studentId);
  const sessionQuery = useSessionQuery();
  const resolvedViewerId = routeViewerId ?? sessionQuery.data?.user.id;
  const { locale } = useLocale();
  const messages = questWorkMessages[locale];
  const startWorkMutation = useStartWorkMutation();
  const respondToEditMutation = useRespondToEditMutation();
  const confirmCompletionMutation = useConfirmCompletionMutation();
  const submitAllocationMutation = useSubmitTeamRewardAllocationMutation();
  const snapshotPollingInterval = useCallback(
    (currentSnapshot: LiveQuestSnapshot | undefined): number | false => {
      if (
        !currentSnapshot ||
        currentSnapshot.state !== QuestStatus.QUEST_ASSIGNED
      ) {
        return false;
      }
      const startAt = Date.parse(currentSnapshot.quest.startTime);
      const dueAt = Date.parse(currentSnapshot.dueAt ?? "");
      const now = serverNow();
      if (
        !Number.isFinite(startAt) ||
        !Number.isFinite(dueAt) ||
        now >= dueAt
      ) {
        return false;
      }
      // A required starter who can act needs one final refresh at dueAt; the
      // failure transition must not depend on the Server emitting a socket
      // event. Other required starters are polled until the Quest transitions.
      const nextRefreshMs = currentSnapshot.capabilities.canStartWork
        ? dueAt - now
        : Math.max(startAt - now, POLL_INTERVAL_MS);
      return Math.min(nextRefreshMs, MAX_TIMER_INTERVAL_MS);
    },
    []
  );
  const snapshotQuery = useLiveQuestSnapshotQuery(
    routeQuestId ?? null,
    resolvedViewerId ?? null,
    {},
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
  const [startWorkSending, setStartWorkSending] = useState(false);
  const [recordedStartedAt, setRecordedStartedAt] = useState<string | null>(
    null
  );
  // Kept across a failed delivery so a retry replays the same command.
  const startWorkKeyRef = useRef<string | null>(null);
  const allocationKeyRef = useRef<{ body: string; key: string } | null>(null);
  const [commandError, setCommandError] = useState<string | null>(null);
  const snapshotErrorText = snapshotQuery.error
    ? getLocalizedErrorMessage(snapshotQuery.error, locale, {
        fallback: messages.serverError,
      })
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
    async (decision: QuestEditResponseDecision) => {
      if (
        !resolvedViewerId ||
        !snapshot?.editRequest ||
        !snapshot.capabilities.canRespondToEdit
      ) {
        return;
      }
      setEditSending(true);
      setEditFeedback(undefined);
      try {
        await respondToEditMutation.mutateAsync({
          questId: routeQuestId ?? snapshot.quest.id,
          viewerId: resolvedViewerId,
          requestId: snapshot.editRequest.requestId,
          decision,
          idempotencyKey: createQuestIdempotencyKey(),
        });
        setEditFeedback(messages.editUpdated);
        await refreshSnapshot().catch(() => undefined);
      } catch (error) {
        setCommandError(
          getLocalizedErrorMessage(error, locale, {
            fallback: messages.serverError,
          })
        );
      } finally {
        setEditSending(false);
      }
    },
    [
      locale,
      messages,
      refreshSnapshot,
      respondToEditMutation,
      resolvedViewerId,
      routeQuestId,
      snapshot,
    ]
  );
  const confirmCompletion = useCallback(async () => {
    if (
      !snapshot?.capabilities.canConfirmCompletion ||
      !routeQuestId ||
      !resolvedViewerId ||
      confirmationSending
    )
      return;
    setConfirmationSending(true);
    setCommandError(null);
    try {
      await confirmCompletionMutation.mutateAsync({
        questId: routeQuestId,
        viewerId: resolvedViewerId,
        idempotencyKey: createQuestIdempotencyKey(),
      });
      const refreshedSnapshot = await refreshSnapshot();
      if (
        refreshedSnapshot &&
        isTerminalStatus(refreshedSnapshot.state as QuestStatus)
      ) {
        router.replace("/my-quests");
      }
    } catch (error) {
      setCommandError(
        getLocalizedErrorMessage(error, locale, {
          fallback: messages.serverError,
        })
      );
    } finally {
      setConfirmationSending(false);
    }
  }, [
    confirmationSending,
    confirmCompletionMutation,
    locale,
    messages,
    refreshSnapshot,
    resolvedViewerId,
    routeQuestId,
    router,
    snapshot,
  ]);

  const startWork = useCallback(async () => {
    if (
      !snapshot?.capabilities.canStartWork ||
      !routeQuestId ||
      !resolvedViewerId ||
      startWorkSending
    )
      return;
    const idempotencyKey = (startWorkKeyRef.current ??=
      createQuestIdempotencyKey());
    setStartWorkSending(true);
    setCommandError(null);
    try {
      const result = await startWorkMutation.mutateAsync({
        questId: routeQuestId,
        viewerId: resolvedViewerId,
        idempotencyKey,
      });
      startWorkKeyRef.current = null;
      setRecordedStartedAt(result.startedAt);
      await refreshSnapshot().catch(() => undefined);
    } catch (error) {
      if (!(error instanceof ApiError) || error.status >= 500) {
        // Outcome unknown: the next press retries with the same key.
        setCommandError(
          getLocalizedErrorMessage(error, locale, {
            fallback: messages.serverError,
          })
        );
        return;
      }
      startWorkKeyRef.current = null;
      if (START_WORK_RELOAD_CODES[error.code]) {
        await refreshSnapshot().catch((refreshError: unknown) =>
          setCommandError(
            getLocalizedErrorMessage(refreshError, locale, {
              fallback: messages.serverError,
            })
          )
        );
        return;
      }
      const startWorkErrors: Record<string, string> = {
        START_WORK_NOT_AVAILABLE: messages.startWorkNotAvailable,
        START_WORK_DEADLINE_PASSED: messages.startWorkDeadlinePassed,
        START_WORK_NOT_REQUIRED: messages.startWorkNotRequired,
      };
      setCommandError(
        startWorkErrors[error.code] ??
          getLocalizedErrorMessage(error, locale, {
            fallback: messages.serverError,
          })
      );
    } finally {
      setStartWorkSending(false);
    }
  }, [
    locale,
    messages,
    refreshSnapshot,
    routeQuestId,
    snapshot,
    startWorkMutation,
    startWorkSending,
    resolvedViewerId,
  ]);

  const submitTeamRewardAllocation = useCallback(
    async (
      teammateShares: { memberId: string; percentageBasisPoints: number }[]
    ) => {
      if (
        !routeQuestId ||
        !resolvedViewerId ||
        !snapshot?.teamRewardAllocation?.viewerIsLeader
      )
        return;
      setCommandError(null);
      const body = JSON.stringify(teammateShares);
      if (!allocationKeyRef.current || allocationKeyRef.current.body !== body) {
        allocationKeyRef.current = { body, key: createQuestIdempotencyKey() };
      }
      try {
        await submitAllocationMutation.mutateAsync({
          questId: routeQuestId,
          viewerId: resolvedViewerId,
          teammateShares,
          idempotencyKey: allocationKeyRef.current.key,
        });
      } catch (error) {
        const refreshed = await refreshSnapshot().catch(() => null);
        if (
          refreshed?.teamRewardAllocation &&
          refreshed.teamRewardAllocation.status !== "PENDING"
        ) {
          allocationKeyRef.current = null;
          return;
        }
        setCommandError(
          getLocalizedErrorMessage(error, locale, {
            fallback: messages.serverError,
          })
        );
        return;
      }

      try {
        const refreshed = await refreshSnapshot();
        if (
          refreshed?.teamRewardAllocation &&
          refreshed.teamRewardAllocation.status !== "PENDING"
        ) {
          allocationKeyRef.current = null;
        } else {
          setCommandError(messages.serverError);
        }
      } catch (error) {
        setCommandError(
          getLocalizedErrorMessage(error, locale, {
            fallback: messages.serverError,
          })
        );
      }
    },
    [
      locale,
      messages.serverError,
      refreshSnapshot,
      resolvedViewerId,
      routeQuestId,
      snapshot?.teamRewardAllocation?.viewerIsLeader,
      submitAllocationMutation,
    ]
  );

  const { confirmFileDispute } = useFileDispute();
  const openDispute = useCallback(() => {
    if (routeQuestId) confirmFileDispute(routeQuestId);
  }, [confirmFileDispute, routeQuestId]);
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
  // Push, not replace: the Work Hub stays mounted so an unsent proof draft survives.
  const openQuestDetail = useCallback(() => {
    if (!routeQuestId) return;
    router.push({ pathname: "/quest/[id]", params: { id: routeQuestId } });
  }, [routeQuestId, router]);

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
    openQuestDetail,
    openDispute,
    recordedStartedAt,
    refreshSnapshot,
    refreshing: snapshotQuery.isRefetching,
    respondToEdit,
    resolvedQuestId: routeQuestId,
    resolvedViewerId,
    snapshot,
    stale,
    confirmCompletion,
    startWork,
    startWorkSending,
    submitTeamRewardAllocation,
    allocationSending: submitAllocationMutation.isPending,
  };
}
