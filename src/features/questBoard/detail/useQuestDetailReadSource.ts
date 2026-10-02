import { serverNow } from "@/api/serverClock";
import { useCallback, useEffect, useMemo } from "react";

import {
  useLiveQuestSnapshotQuery,
  useQuestDetailQuery,
} from "../api/questBoardQueries";
import {
  liveQuestService,
  type LiveQuestSnapshot,
} from "../live/liveQuestService";
import {
  getQuestDetailFixture,
  type BoardPreviewState,
} from "../fixtures/questBoardHarness";
import { questWorkflow } from "../workflow/questWorkflow";
import {
  getQuestDetailProjection,
  type QuestDetailProjection,
} from "./questDetailProjection";
import {
  QuestActor,
  QuestApplicationStatus,
  QuestCandidateMode,
  QuestMode,
  QuestParticipation,
  QuestStatus,
  QuestTeamStatus,
  type QuestBoardQuest,
  type QuestDetailState,
} from "../domain/types";

export type QuestDetailReadSource =
  | {
      kind: "preview";
      state: QuestDetailState | null;
    }
  | {
      kind: "live-snapshot";
      snapshot: LiveQuestSnapshot | null;
    }
  | {
      kind: "live-detail";
    };
export interface QuestDetailReadModel {
  source: QuestDetailReadSource;
  quest: QuestBoardQuest | null;
  projection: QuestDetailProjection | null;
  pending: boolean;
  error: unknown;
  refreshing: boolean;
  refresh: () => Promise<unknown>;
}

interface QuestDetailReadSourceParams {
  questId?: string;
  viewerId: string;
  previewState?: BoardPreviewState;
  explicitPreview: boolean;
  sessionReady: boolean;
}

const START_TIME_REFETCH_GRACE_MS = 2_000;
const START_TIME_REFETCH_MAX_DELAY_MS = 24 * 60 * 60 * 1_000;
const UNDERFILLED_REFETCH_INTERVAL_MS = 5_000;
const UNDERFILLED_REFETCH_WINDOW_MS = 60_000;

function isNotStartedGroupFcfsSnapshot(
  snapshot: LiveQuestSnapshot | null | undefined
): snapshot is LiveQuestSnapshot {
  return Boolean(
    snapshot &&
    snapshot.mode === QuestMode.FIRST_COME_FIRST_SERVED &&
    snapshot.participation === QuestParticipation.GROUP &&
    (snapshot.state === QuestStatus.QUEST_OPEN ||
      snapshot.state === QuestStatus.QUEST_ASSIGNED)
  );
}

export function useQuestDetailReadSource({
  questId,
  viewerId,
  previewState,
  explicitPreview,
  sessionReady,
}: QuestDetailReadSourceParams): QuestDetailReadModel {
  const liveSnapshotAvailable =
    typeof liveQuestService.getLiveSnapshot === "function";
  const canSelectLiveSnapshot =
    liveSnapshotAvailable && (!sessionReady || Boolean(viewerId));
  const liveSnapshotQuery = useLiveQuestSnapshotQuery(
    questId ?? null,
    viewerId || null,
    {},
    !explicitPreview && canSelectLiveSnapshot && sessionReady,
    (snapshot) =>
      snapshot?.state === QuestStatus.QUEST_OPEN &&
      snapshot.mode === QuestMode.FIRST_COME_FIRST_SERVED &&
      snapshot.participation === QuestParticipation.GROUP
        ? 15_000
        : (snapshot?.actor === QuestActor.CANDIDATE ||
              snapshot?.actor === QuestActor.PROSPECTIVE_WORKER) &&
            snapshot.mode === QuestCandidateMode.CANDIDATE &&
            snapshot.state === QuestStatus.QUEST_OPEN &&
            (snapshot.application?.state ===
              QuestApplicationStatus.APPLICATION_APPLIED ||
              snapshot.team?.state === QuestTeamStatus.TEAM_SUBMITTED)
          ? 15_000
          : false
  );
  const questDetailQuery = useQuestDetailQuery(
    questId ?? null,
    !explicitPreview && !canSelectLiveSnapshot
  );

  const liveSnapshot = liveSnapshotQuery.data ?? null;
  const liveSnapshotStartTime = liveSnapshot?.quest.startTime;
  const liveSnapshotIsNotStarted = isNotStartedGroupFcfsSnapshot(liveSnapshot);
  const liveSnapshotHasUnderfilled = Boolean(liveSnapshot?.underfilled);
  const refetchLiveSnapshot = liveSnapshotQuery.refetch;

  useEffect(() => {
    if (
      explicitPreview ||
      !canSelectLiveSnapshot ||
      !questId ||
      !liveSnapshotIsNotStarted ||
      liveSnapshotHasUnderfilled
    ) {
      return;
    }
    const startAt = Date.parse(liveSnapshotStartTime ?? "");
    if (!Number.isFinite(startAt)) return;
    const startDelay = startAt - serverNow();
    if (startDelay > START_TIME_REFETCH_MAX_DELAY_MS) return;

    let cancelled = false;
    let startTimer: number | undefined;
    let pollTimer: number | undefined;
    const pollUntil = startAt + UNDERFILLED_REFETCH_WINDOW_MS;
    const pollForUnderfilledState = async () => {
      if (cancelled || serverNow() >= pollUntil) return;
      const result = await refetchLiveSnapshot();
      if (cancelled) return;
      const currentSnapshot = result.data;
      if (
        currentSnapshot?.underfilled ||
        !isNotStartedGroupFcfsSnapshot(currentSnapshot) ||
        serverNow() >= pollUntil
      ) {
        return;
      }
      pollTimer = setTimeout(
        pollForUnderfilledState,
        UNDERFILLED_REFETCH_INTERVAL_MS
      );
    };
    const refetchAtStartTime = async () => {
      if (cancelled) return;
      const result = await refetchLiveSnapshot();
      if (cancelled) return;
      const currentSnapshot = result.data;
      if (
        currentSnapshot?.underfilled ||
        !isNotStartedGroupFcfsSnapshot(currentSnapshot)
      ) {
        return;
      }
      pollTimer = setTimeout(
        pollForUnderfilledState,
        UNDERFILLED_REFETCH_INTERVAL_MS
      );
    };

    startTimer = setTimeout(
      refetchAtStartTime,
      Math.max(0, startDelay + START_TIME_REFETCH_GRACE_MS)
    );
    return () => {
      cancelled = true;
      clearTimeout(startTimer);
      clearTimeout(pollTimer);
    };
  }, [
    canSelectLiveSnapshot,
    explicitPreview,
    liveSnapshotHasUnderfilled,
    liveSnapshotIsNotStarted,
    liveSnapshotStartTime,
    questId,
    refetchLiveSnapshot,
  ]);
  const fixtureState =
    explicitPreview && questId
      ? questWorkflow.getQuestDetailState(questId, viewerId)
      : null;
  const fixtureProjection = fixtureState
    ? getQuestDetailProjection(fixtureState, viewerId, questWorkflow.getNow())
    : null;
  const liveProjection = liveSnapshot
    ? getQuestDetailProjection(liveSnapshot, viewerId)
    : null;
  const fixtureQuest = explicitPreview
    ? (getQuestDetailFixture(questId, previewState) ?? null)
    : null;
  const liveQuestCandidate =
    liveProjection?.quest ?? questDetailQuery.data ?? null;
  const liveQuest =
    questId && liveQuestCandidate?.id === questId ? liveQuestCandidate : null;
  const refresh = useCallback(async (): Promise<unknown> => {
    if (explicitPreview) return undefined;
    if (canSelectLiveSnapshot) return liveSnapshotQuery.refetch();
    return questDetailQuery.refetch();
  }, [
    canSelectLiveSnapshot,
    explicitPreview,
    liveSnapshotQuery,
    questDetailQuery,
  ]);

  return useMemo(() => {
    if (explicitPreview) {
      return {
        source: {
          kind: "preview" as const,
          state: fixtureState,
        },
        quest: fixtureQuest,
        projection: fixtureProjection,
        pending: previewState === "loading",
        error:
          previewState === "error" ? new Error("Preview unavailable") : null,
        refreshing: false,
        refresh,
      };
    }

    if (canSelectLiveSnapshot) {
      return {
        source: {
          kind: "live-snapshot" as const,
          snapshot: liveSnapshot,
        },
        quest: liveQuest,
        projection: liveProjection,
        pending: Boolean(
          questId && (!sessionReady || liveSnapshotQuery.isPending)
        ),
        error: liveSnapshotQuery.error,
        refreshing: liveSnapshotQuery.isRefetching,
        refresh,
      };
    }

    return {
      source: { kind: "live-detail" as const },
      quest: liveQuest,
      projection: null,
      pending: Boolean(questId && questDetailQuery.isPending),
      error: questDetailQuery.error,
      refreshing: questDetailQuery.isRefetching,
      refresh,
    };
  }, [
    explicitPreview,
    fixtureProjection,
    fixtureQuest,
    fixtureState,
    liveProjection,
    liveQuest,
    liveSnapshot,
    canSelectLiveSnapshot,
    liveSnapshotQuery.error,
    liveSnapshotQuery.isPending,
    liveSnapshotQuery.isRefetching,
    previewState,
    questDetailQuery.error,
    questDetailQuery.isPending,
    questDetailQuery.isRefetching,
    questId,
    refresh,
    sessionReady,
  ]);
}
