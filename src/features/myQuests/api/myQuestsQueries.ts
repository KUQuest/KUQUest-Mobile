import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import {
  subscribeToHirerQuestEvents,
  subscribeToWorkerAssignmentEvents,
} from "@/features/questBoard/live/questEvents";
import { myQuestService } from "../myQuestService";
export const myQuestsKeys = {
  all: ["myQuests"] as const,
  hirer: () => [...myQuestsKeys.all, "hirer"] as const,
  hirerProofReviewableIds: (proofQuestIds: readonly string[]) =>
    [...myQuestsKeys.hirer(), "proof-review", proofQuestIds] as const,
  hirerCompletionReviewableIds: (completionQuestIds: readonly string[]) =>
    [...myQuestsKeys.hirer(), "completion-review", completionQuestIds] as const,
  worker: (viewerId: string) =>
    [...myQuestsKeys.all, "worker", viewerId] as const,
  workerCandidateApplications: (viewerId: string) =>
    [...myQuestsKeys.worker(viewerId), "candidateApplications"] as const,
};

export function useMyHirerQuestsQuery(enabled = true) {
  const queryClient = useQueryClient();
  const query = useQuery({
    enabled,
    queryKey: myQuestsKeys.hirer(),
    queryFn: ({ signal }) => myQuestService.listAllMyHirerQuests({ signal }),
  });
  const hasSnapshot = query.data !== undefined;

  useEffect(() => {
    if (!enabled || !hasSnapshot) return;
    const invalidate = () => {
      void queryClient.invalidateQueries({ queryKey: myQuestsKeys.hirer() });
    };
    return subscribeToHirerQuestEvents(invalidate, invalidate);
  }, [enabled, hasSnapshot, queryClient]);

  return query;
}

export function useMyHirerProofReviewableIdsQuery(
  proofQuestIds: readonly string[],
  enabled = true
) {
  const queryClient = useQueryClient();
  const query = useQuery({
    enabled: proofQuestIds.length > 0 && enabled,
    queryKey: myQuestsKeys.hirerProofReviewableIds(proofQuestIds),
    queryFn: ({ signal }) =>
      myQuestService.listMyHirerProofReviewableQuestIds(proofQuestIds, {
        signal,
      }),
  });
  const hasData = query.data !== undefined;

  useEffect(() => {
    if (!enabled || proofQuestIds.length === 0 || !hasData) return;
    const invalidate = () => {
      void queryClient.invalidateQueries({
        queryKey: myQuestsKeys.hirerProofReviewableIds(proofQuestIds),
      });
    };
    return subscribeToHirerQuestEvents(invalidate, invalidate);
  }, [enabled, proofQuestIds, hasData, queryClient]);

  return query;
}

export function useMyHirerCompletionReviewableIdsQuery(
  completionQuestIds: readonly string[],
  enabled = true
) {
  const queryClient = useQueryClient();
  const query = useQuery({
    enabled: completionQuestIds.length > 0 && enabled,
    queryKey: myQuestsKeys.hirerCompletionReviewableIds(completionQuestIds),
    queryFn: ({ signal }) =>
      myQuestService.listMyHirerCompletionReviewableQuestIds(
        completionQuestIds,
        { signal }
      ),
  });
  const hasData = query.data !== undefined;

  useEffect(() => {
    if (!enabled || completionQuestIds.length === 0 || !hasData) return;
    const invalidate = () => {
      void queryClient.invalidateQueries({
        queryKey: myQuestsKeys.hirerCompletionReviewableIds(completionQuestIds),
      });
    };
    return subscribeToHirerQuestEvents(invalidate, invalidate);
  }, [enabled, completionQuestIds, hasData, queryClient]);

  return query;
}

export function useMyWorkerQuestSnapshotsQuery(
  viewerId: string | null,
  enabled = true
) {
  const queryClient = useQueryClient();
  const query = useQuery({
    enabled: Boolean(viewerId) && enabled,
    queryKey: myQuestsKeys.worker(viewerId ?? ""),
    queryFn: ({ signal }) => {
      if (!viewerId) {
        throw new Error("A viewer ID is required");
      }
      return myQuestService.listMyWorkerQuestSnapshots(viewerId, "all", {
        signal,
      });
    },
  });
  useEffect(() => {
    if (!enabled || !viewerId) return;
    const invalidate = () => {
      void queryClient.invalidateQueries({
        queryKey: myQuestsKeys.worker(viewerId),
      });
    };
    return subscribeToWorkerAssignmentEvents(invalidate, invalidate);
  }, [enabled, queryClient, viewerId]);
  return query;
}

export function useMyWorkerCandidateApplicationsQuery(
  viewerId: string | null,
  enabled = true
) {
  return useQuery({
    enabled: Boolean(viewerId) && enabled,
    queryKey: myQuestsKeys.workerCandidateApplications(viewerId ?? ""),
    queryFn: ({ signal }) => {
      if (!viewerId) {
        throw new Error("A viewer ID is required");
      }
      return myQuestService.listMyWorkerCandidateApplications({ signal });
    },
  });
}
