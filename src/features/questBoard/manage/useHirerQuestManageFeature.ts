import { useCallback, useState } from "react";

import {
  showConfirmModal,
  showErrorAlert,
  showSweetAlert,
  SweetAlertVariant,
} from "@/components/ui/SweetAlert";
import { useRouter } from "expo-router";

import { createQuestIdempotencyKey } from "@/api/QuestApi";
import { useSessionQuery } from "@/features/auth/sessionQueries";
import { getChatRouteParams } from "@/features/chat/chatData";
import { useLocale } from "@/features/preferences/localeStore";
import {
  useCancelQuestMutation,
  useCreateEditRequestMutation,
  useDecideUnderfilledMutation,
  useLiveQuestSnapshotQuery,
  useSelectApplicationMutation,
  useSelectCandidateTeamMutation,
} from "@/features/questBoard/api/questBoardQueries";
import { isTerminalStatus } from "@/domain/questLifecycle";
import { formatSatang } from "@/domain/satang";
import { myQuestMessages } from "@/locales/myQuestMessages";
import { questBoardMessages } from "@/locales/questBoardMessages";
import { getLocalizedErrorMessage } from "@/utils/error";
import {
  isHirerActor,
  QuestEditRequestStatus,
  QuestMode,
  QuestParticipation,
  QuestProofStatus,
  QuestStatus,
  type QuestUnderfilledDecision,
} from "../domain/types";

export function useHirerQuestManageFeature(questId?: string) {
  const router = useRouter();
  const { locale } = useLocale();
  const messages = questBoardMessages[locale];
  const cancelMessages = myQuestMessages[locale];
  const viewerId = useSessionQuery().data?.user.id || "";
  const [candidateOpen, setCandidateOpen] = useState(false);
  const [underfilledOpen, setUnderfilledOpen] = useState(false);
  const [conditionEditOpen, setConditionEditOpen] = useState(false);
  const [editRequestId, setEditRequestId] = useState<string>();
  const [conditionEditSubmitting, setConditionEditSubmitting] = useState(false);
  const [conditionEditError, setConditionEditError] = useState<string>();
  const snapshotQuery = useLiveQuestSnapshotQuery(
    questId ?? null,
    viewerId || null,
    editRequestId ? { editRequestId } : undefined
  );
  const selectApplicationMutation = useSelectApplicationMutation();
  const selectCandidateTeamMutation = useSelectCandidateTeamMutation();
  const decideUnderfilledMutation = useDecideUnderfilledMutation();
  const cancelQuestMutation = useCancelQuestMutation();
  const createEditRequestMutation = useCreateEditRequestMutation();
  const snapshot = snapshotQuery.data;
  const refetchSnapshot = snapshotQuery.refetch;
  const viewerCommand = useCallback(
    async (run: (key: string) => Promise<unknown>): Promise<boolean> => {
      if (!questId || !viewerId) return false;
      try {
        await run(createQuestIdempotencyKey());
        return true;
      } catch (caught) {
        await refetchSnapshot();
        showErrorAlert(messages.actionFailedTitle, caught);
        return false;
      }
    },
    [messages, questId, refetchSnapshot, viewerId]
  );
  const error = snapshotQuery.error
    ? getLocalizedErrorMessage(snapshotQuery.error, locale, {
        fallback: messages.manageSnapshotError,
      })
    : undefined;
  const originalConditionItems = snapshot?.quest.condition.items
    .slice()
    .sort((a, b) => a.position - b.position)
    .map((item) => item.text);
  const pendingProof = snapshot?.proofs.find(
    (proof) => proof.status === QuestProofStatus.PROOF_PENDING
  );
  const terminal = snapshot ? isTerminalStatus(snapshot.state) : false;
  // Settlement per the cancellation matrix in quest-lifecycle-contract.md.
  const cancelDescription =
    snapshot?.state === QuestStatus.QUEST_OPEN
      ? cancelMessages.cancelOpenDescription
      : snapshot?.state === QuestStatus.QUEST_ASSIGNED
        ? cancelMessages.cancelAssignedDescription
        : snapshot?.state === QuestStatus.QUEST_IN_PROGRESS
          ? cancelMessages.cancelInProgressDescription
          : undefined;
  const canReviewCandidateProposals =
    isHirerActor(snapshot?.actor) &&
    snapshot.mode === QuestMode.CANDIDATE &&
    (snapshot.participation === QuestParticipation.GROUP
      ? snapshot.capabilities.canSelectTeam
      : snapshot.capabilities.canSelectCandidate);
  const canProposeConditionEdit =
    isHirerActor(snapshot?.actor) &&
    snapshot.state === QuestStatus.QUEST_ASSIGNED &&
    snapshot.capabilities.canRequestEdit &&
    snapshot.editRequest?.status !==
      QuestEditRequestStatus.EDIT_REQUEST_PENDING;
  const openChat = () => {
    if (!snapshot?.workConversation || !viewerId) return;
    router.push({
      pathname: "/chat/[id]",
      params: getChatRouteParams({
        conversationId: snapshot.workConversation.id,
        questId: snapshot.quest.id,
        viewerId,
        questTitle: snapshot.quest.title,
      }),
    });
  };
  const selectApplication = (id: string) =>
    snapshot &&
    void viewerCommand((key) =>
      selectApplicationMutation.mutateAsync({
        questId: snapshot.quest.id,
        applicationId: id,
        viewerId,
        idempotencyKey: key,
      })
    );
  const selectTeam = (id: string) =>
    snapshot &&
    void viewerCommand((key) =>
      selectCandidateTeamMutation.mutateAsync({
        questId: snapshot.quest.id,
        teamId: id,
        viewerId,
        idempotencyKey: key,
      })
    );
  const cancel = () => {
    if (!snapshot) return;
    showConfirmModal({
      title: cancelMessages.cancelConfirmTitle,
      message: cancelDescription ?? "",
      confirmLabel: cancelMessages.cancelQuest,
      cancelLabel: cancelMessages.keepQuest,
      onConfirm: () =>
        void viewerCommand((key) =>
          cancelQuestMutation
            .mutateAsync({
              questId: snapshot.quest.id,
              viewerId,
              idempotencyKey: key,
            })
            .then((outcome) => {
              const settlement = [
                outcome.paidSatang > 0 &&
                  cancelMessages.cancelPaidWorkers(
                    formatSatang(outcome.paidSatang, locale)
                  ),
                outcome.refundedSatang > 0 &&
                  cancelMessages.cancelRefunded(
                    formatSatang(outcome.refundedSatang, locale)
                  ),
              ].filter(Boolean);
              showSweetAlert({
                title: cancelMessages.cancelSuccessTitle,
                message: settlement.join("\n"),
                variant: SweetAlertVariant.Success,
              });
            })
        ),
    });
  };
  const reviewProof = () => {
    if (!snapshot || !pendingProof || !snapshot.capabilities.canReviewProof)
      return;
    router.push({
      pathname: "/quest/[id]/proof-review",
      params: { id: snapshot.quest.id },
    });
  };
  const submitConditionEdit = (items: string[]) => {
    if (!snapshot) return;
    setConditionEditSubmitting(true);
    setConditionEditError(undefined);
    createEditRequestMutation
      .mutateAsync({
        questId: snapshot.quest.id,
        payload: { condition: { items } },
        viewerId,
        idempotencyKey: createQuestIdempotencyKey(),
      })
      .then((request) => {
        setEditRequestId(request.requestId);
        setConditionEditOpen(false);
      })
      .catch((caught) => {
        setConditionEditError(
          getLocalizedErrorMessage(caught, locale, {
            fallback: messages.conditionEditSubmitError,
          })
        );
        return snapshotQuery.refetch();
      })
      .finally(() => setConditionEditSubmitting(false));
  };
  const decideUnderfilled = (decision: QuestUnderfilledDecision) => {
    if (!snapshot) return;
    setUnderfilledOpen(false);
    void viewerCommand((key) =>
      decideUnderfilledMutation.mutateAsync({
        questId: snapshot.quest.id,
        decision,
        viewerId,
        idempotencyKey: key,
      })
    );
  };

  return {
    router,
    locale,
    messages,
    viewerId,
    snapshotQuery,
    snapshot,
    error,
    originalConditionItems,
    pendingProof,
    terminal,
    cancelDescription,
    canReviewCandidateProposals,
    canProposeConditionEdit,
    candidateOpen,
    setCandidateOpen,
    underfilledOpen,
    setUnderfilledOpen,
    conditionEditOpen,
    setConditionEditOpen,
    conditionEditSubmitting,
    conditionEditError,
    decideUnderfilled,
    openChat,
    selectApplication,
    selectTeam,
    cancel,
    reviewProof,
    submitConditionEdit,
  };
}
