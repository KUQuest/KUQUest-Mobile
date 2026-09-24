import { useCallback } from "react";
import { Alert } from "react-native";

import { ApiError } from "@/api/ApiClient";
import { createQuestIdempotencyKey } from "@/api/QuestApi";
import type { UploadAsset } from "@/api/fileUpload";
import {
  useApplyQuestMutation,
  useCreateCandidateInquiryMutation,
  useCreateCandidateTeamMutation,
  useDecideUnderfilledMutation,
  useJoinCandidateTeamMutation,
  useJoinQuestMutation,
  useLeaveCandidateTeamMutation,
  useRejectApplicationMutation,
  useRejectCandidateTeamMutation,
  useRegenerateCandidateTeamCodeMutation,
  useRemoveCandidateTeamMemberMutation,
  useRespondUnderfilledConsentMutation,
  useSelectApplicationMutation,
  useSelectCandidateTeamMutation,
  useSubmitCandidateTeamMutation,
  useUpdateCandidateTeamMutation,
  useUploadCandidateTeamFileMutation,
  useWithdrawApplicationMutation,
} from "../api/questBoardQueries";
import {
  getQuestDetailLiveTeam,
  type QuestDetailLiveActionContext,
  type QuestDetailLiveActions,
} from "./questDetailActions";

function getLiveActionError(error: unknown, fallback: string): string {
  if (error instanceof ApiError) return `${error.code}: ${error.message}`;
  return error instanceof Error ? error.message : fallback;
}

export function useQuestDetailLiveActions(
  context: QuestDetailLiveActionContext
): QuestDetailLiveActions {
  const joinQuestMutation = useJoinQuestMutation();
  const applyQuestMutation = useApplyQuestMutation();
  const withdrawApplicationMutation = useWithdrawApplicationMutation();
  const createCandidateInquiryMutation = useCreateCandidateInquiryMutation();
  const selectApplicationMutation = useSelectApplicationMutation();
  const rejectApplicationMutation = useRejectApplicationMutation();
  const selectCandidateTeamMutation = useSelectCandidateTeamMutation();
  const rejectCandidateTeamMutation = useRejectCandidateTeamMutation();
  const createCandidateTeamMutation = useCreateCandidateTeamMutation();
  const joinCandidateTeamMutation = useJoinCandidateTeamMutation();
  const leaveCandidateTeamMutation = useLeaveCandidateTeamMutation();
  const removeCandidateTeamMemberMutation =
    useRemoveCandidateTeamMemberMutation();
  const regenerateCandidateTeamCodeMutation =
    useRegenerateCandidateTeamCodeMutation();
  const updateCandidateTeamMutation = useUpdateCandidateTeamMutation();
  const submitCandidateTeamMutation = useSubmitCandidateTeamMutation();
  const uploadCandidateTeamFileMutation = useUploadCandidateTeamFileMutation();
  const decideUnderfilledMutation = useDecideUnderfilledMutation();
  const respondUnderfilledConsentMutation =
    useRespondUnderfilledConsentMutation();

  const {
    questId,
    viewerId,
    quest,
    projectionCapabilities: capabilities,
    liveSnapshot,
    messages,
    refresh,
    transitions,
  } = context;
  const { beginLiveAction, endLiveAction } = transitions;

  const runLiveAction = useCallback(
    async <T>(
      actionName: string,
      action: () => Promise<T>,
      fallbackError: string
    ): Promise<T | undefined> => {
      if (!beginLiveAction(actionName)) return undefined;
      try {
        return await action();
      } catch (error) {
        Alert.alert(messages.details, getLiveActionError(error, fallbackError));
        return undefined;
      } finally {
        endLiveAction();
      }
    },
    [beginLiveAction, endLiveAction, messages.details]
  );

  const join = useCallback(
    () =>
      runLiveAction(
        "join",
        () => {
          if (!questId)
            return Promise.reject(new Error("Quest ID is required"));
          return joinQuestMutation.mutateAsync({ questId, viewerId });
        },
        "Failed to join quest"
      ),
    [joinQuestMutation, questId, runLiveAction, viewerId]
  );
  const apply = useCallback(
    () =>
      runLiveAction(
        "apply",
        () => {
          if (!questId)
            return Promise.reject(new Error("Quest ID is required"));
          return applyQuestMutation.mutateAsync({
            questId,
            viewerId,
            idempotencyKey: createQuestIdempotencyKey(),
          });
        },
        "Failed to apply"
      ),
    [applyQuestMutation, questId, runLiveAction, viewerId]
  );
  const withdraw = useCallback(
    (applicationId: string) =>
      runLiveAction(
        "withdraw",
        () => {
          if (!questId)
            return Promise.reject(new Error("Quest ID is required"));
          return withdrawApplicationMutation.mutateAsync({
            questId,
            applicationId,
            viewerId,
            idempotencyKey: createQuestIdempotencyKey(),
          });
        },
        "Failed to withdraw application"
      ),
    [questId, runLiveAction, viewerId, withdrawApplicationMutation]
  );
  const createCandidateInquiry = useCallback(
    async (targetQuestId: string) => {
      const inquiry =
        await createCandidateInquiryMutation.mutateAsync(targetQuestId);
      return { id: inquiry.id };
    },
    [createCandidateInquiryMutation]
  );
  const selectProposal = useCallback(
    (proposalId: string) =>
      runLiveAction(
        "select-candidate",
        () => {
          if (!questId || !liveSnapshot)
            return Promise.reject(new Error("Quest snapshot is required"));
          return liveSnapshot.participation === "GROUP"
            ? selectCandidateTeamMutation.mutateAsync({
                questId,
                teamId: proposalId,
                viewerId,
                idempotencyKey: createQuestIdempotencyKey(),
              })
            : selectApplicationMutation.mutateAsync({
                questId,
                applicationId: proposalId,
                viewerId,
                idempotencyKey: createQuestIdempotencyKey(),
              });
        },
        "Failed to select candidate proposal"
      ),
    [
      liveSnapshot,
      questId,
      runLiveAction,
      selectApplicationMutation,
      selectCandidateTeamMutation,
      viewerId,
    ]
  );
  const rejectProposal = useCallback(
    (proposalId: string) =>
      runLiveAction<unknown>(
        "reject-candidate",
        () => {
          if (!questId || !liveSnapshot)
            return Promise.reject(new Error("Quest snapshot is required"));
          return liveSnapshot.participation === "GROUP"
            ? rejectCandidateTeamMutation.mutateAsync({
                questId,
                teamId: proposalId,
                viewerId,
                idempotencyKey: createQuestIdempotencyKey(),
              })
            : rejectApplicationMutation.mutateAsync({
                questId,
                applicationId: proposalId,
                viewerId,
                idempotencyKey: createQuestIdempotencyKey(),
              });
        },
        "Failed to reject candidate proposal"
      ),
    [
      liveSnapshot,
      questId,
      rejectApplicationMutation,
      rejectCandidateTeamMutation,
      runLiveAction,
      viewerId,
    ]
  );
  const openUnderfilled = useCallback(async () => {
    if (liveSnapshot?.underfilled) return liveSnapshot.underfilled;
    const result = await runLiveAction(
      "underfilled-load",
      refresh,
      "Failed to load underfilled Quest status"
    );
    if (result && typeof result === "object" && "data" in result) {
      const data = result.data;
      return data && typeof data === "object" && "underfilled" in data
        ? data.underfilled
        : null;
    }
    return null;
  }, [liveSnapshot, refresh, runLiveAction]);
  const decideUnderfilled = useCallback(
    (decision: "PROCEED" | "CANCEL") =>
      runLiveAction(
        "underfilled-decision",
        () => {
          if (!questId)
            return Promise.reject(new Error("Quest ID is required"));
          return decideUnderfilledMutation.mutateAsync({
            questId,
            decision,
            viewerId,
            idempotencyKey: createQuestIdempotencyKey(),
          });
        },
        "Failed to update underfilled Quest decision"
      ),
    [decideUnderfilledMutation, questId, runLiveAction, viewerId]
  );
  const respondUnderfilled = useCallback(
    (decision: "ACCEPT" | "DECLINE") =>
      runLiveAction(
        "underfilled-consent",
        () => {
          if (!questId)
            return Promise.reject(new Error("Quest ID is required"));
          return respondUnderfilledConsentMutation.mutateAsync({
            questId,
            decision,
            viewerId,
            idempotencyKey: createQuestIdempotencyKey(),
          });
        },
        "Failed to respond to underfilled consent"
      ),
    [questId, respondUnderfilledConsentMutation, runLiveAction, viewerId]
  );
  const createTeam = useCallback(
    () =>
      runLiveAction(
        "create-team",
        () => {
          if (!questId || !capabilities?.canCreateTeam)
            return Promise.reject(new Error("Team creation is unavailable"));
          return createCandidateTeamMutation.mutateAsync({
            questId,
            payload: {
              name: `${quest?.title ?? "Quest"} Team`,
              headcount: quest?.headcount ?? 2,
            },
            viewerId,
            idempotencyKey: createQuestIdempotencyKey(),
          });
        },
        "Failed to create Quest Team"
      ),
    [
      capabilities?.canCreateTeam,
      createCandidateTeamMutation,
      quest?.headcount,
      quest?.title,
      questId,
      runLiveAction,
      viewerId,
    ]
  );
  const liveTeam = getQuestDetailLiveTeam(liveSnapshot);
  const liveStartTime = liveSnapshot?.quest.startTime;
  const joinTeam = useCallback(
    (teamId: string, joinCode: string) =>
      runLiveAction(
        "join-team",
        () => {
          if (
            !questId ||
            !capabilities?.canJoinTeam ||
            !liveStartTime ||
            Date.now() >= Date.parse(liveStartTime)
          ) {
            return Promise.reject(new Error("Team joining is unavailable"));
          }
          return joinCandidateTeamMutation.mutateAsync({
            questId,
            teamId,
            joinCode: joinCode.toUpperCase(),
            viewerId,
            idempotencyKey: createQuestIdempotencyKey(),
          });
        },
        "Failed to join Quest Team"
      ),
    [
      capabilities?.canJoinTeam,
      joinCandidateTeamMutation,
      liveStartTime,
      questId,
      runLiveAction,
      viewerId,
    ]
  );
  const leaveTeam = useCallback(
    (teamId: string) =>
      runLiveAction(
        "leave-team",
        () => {
          if (!questId || !capabilities?.canLeaveTeam)
            return Promise.reject(new Error("Leaving the team is unavailable"));
          return leaveCandidateTeamMutation.mutateAsync({
            questId,
            teamId,
            viewerId,
            idempotencyKey: createQuestIdempotencyKey(),
          });
        },
        "Failed to leave Quest Team"
      ),
    [
      capabilities?.canLeaveTeam,
      leaveCandidateTeamMutation,
      questId,
      runLiveAction,
      viewerId,
    ]
  );
  const removeTeamMember = useCallback(
    (teamId: string, memberId: string) =>
      runLiveAction(
        "remove-team-member",
        () => {
          if (!questId || !capabilities?.canRemoveTeamMember)
            return Promise.reject(
              new Error("Removing a team member is unavailable")
            );
          return removeCandidateTeamMemberMutation.mutateAsync({
            questId,
            teamId,
            memberId,
            viewerId,
            idempotencyKey: createQuestIdempotencyKey(),
          });
        },
        "Failed to remove team member"
      ),
    [
      capabilities?.canRemoveTeamMember,
      questId,
      removeCandidateTeamMemberMutation,
      runLiveAction,
      viewerId,
    ]
  );
  const regenerateTeamCode = useCallback(
    (teamId: string) =>
      runLiveAction(
        "regenerate-team-code",
        () => {
          if (!questId || !capabilities?.canRegenerateTeamCode)
            return Promise.reject(
              new Error("Regenerating the team code is unavailable")
            );
          return regenerateCandidateTeamCodeMutation.mutateAsync({
            questId,
            teamId,
            viewerId,
            idempotencyKey: createQuestIdempotencyKey(),
          });
        },
        "Failed to regenerate team join code"
      ),
    [
      capabilities?.canRegenerateTeamCode,
      questId,
      regenerateCandidateTeamCodeMutation,
      runLiveAction,
      viewerId,
    ]
  );
  const updateTeamName = useCallback(
    (teamId: string, name: string) => {
      const trimmedName = name.trim();
      if (!trimmedName) return Promise.resolve(undefined);
      return runLiveAction(
        "update-team",
        () => {
          if (!questId || !capabilities?.canUpdateTeam)
            return Promise.reject(
              new Error("Updating the team is unavailable")
            );
          return updateCandidateTeamMutation.mutateAsync({
            questId,
            teamId,
            payload: { name: trimmedName },
            viewerId,
            idempotencyKey: createQuestIdempotencyKey(),
          });
        },
        "Failed to update Quest Team name"
      );
    },
    [
      capabilities?.canUpdateTeam,
      questId,
      runLiveAction,
      updateCandidateTeamMutation,
      viewerId,
    ]
  );
  const submitTeam = useCallback(
    (teamId: string, payload?: { text?: string; fileIds?: string[] }) =>
      runLiveAction(
        "submit-team",
        async () => {
          if (!questId) throw new Error("Quest ID is required");
          return submitCandidateTeamMutation.mutateAsync({
            questId,
            teamId,
            payload,
            viewerId,
            idempotencyKey: createQuestIdempotencyKey(),
          });
        },
        "Failed to submit Quest Team"
      ),
    [questId, runLiveAction, submitCandidateTeamMutation, viewerId]
  );
  const uploadTeamFile = useCallback(
    async (asset: UploadAsset) => {
      if (!questId || !liveTeam) throw new Error("No active team");
      const uploaded = await uploadCandidateTeamFileMutation.mutateAsync({
        questId,
        teamId: liveTeam.id,
        asset,
        viewerId,
        idempotencyKey: createQuestIdempotencyKey(),
      });
      return {
        id: uploaded.fileId,
        name: uploaded.fileName,
        sizeBytes: uploaded.sizeBytes,
      };
    },
    [liveTeam, questId, uploadCandidateTeamFileMutation, viewerId]
  );

  return {
    join,
    apply,
    withdraw,
    createCandidateInquiry,
    selectProposal,
    rejectProposal,
    openUnderfilled,
    decideUnderfilled,
    respondUnderfilled,
    createTeam,
    joinTeam,
    leaveTeam,
    removeTeamMember,
    regenerateTeamCode,
    updateTeamName,
    submitTeam,
    uploadTeamFile,
  };
}
