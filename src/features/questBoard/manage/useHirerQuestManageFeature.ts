import { useCallback, useEffect, useRef, useState } from "react";

import {
  showConfirmModal,
  showErrorAlert,
  showSweetAlert,
  SweetAlertVariant,
} from "@/components/ui/SweetAlert";
import { useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@/api/ApiClient";

import { createQuestIdempotencyKey } from "@/api/QuestApi";
import { liveQuestService } from "@/features/questBoard/live/liveQuestService";
import type { QuestV2CancelPreview } from "@/api/questV2Contracts";
import { useSessionQuery } from "@/features/auth/sessionQueries";
import { getChatRouteParams } from "@/features/chat/chatData";
import { useLocale } from "@/features/preferences/localeStore";
import { groupQuestMessages } from "@/locales/groupQuestMessages";
import {
  questBoardKeys,
  setQuestEditRequestId,
  useCancelQuestMutation,
  useCreateEditRequestMutation,
  useDecideUnderfilledMutation,
  useLiveQuestSnapshotQuery,
  useSelectApplicationMutation,
  useSelectCandidateTeamMutation,
} from "@/features/questBoard/api/questBoardQueries";
import { subscribeToHirerQuestEvents } from "@/features/questBoard/live/questEvents";
import { isTerminalStatus } from "@/domain/questLifecycle";
import { getCancelTier } from "./cancelQuestGuardrail";
import { formatSatang } from "@/domain/satang";
import { myQuestMessages } from "@/locales/myQuestMessages";
import { questBoardMessages } from "@/locales/questBoardMessages";
import { getLocalizedErrorMessage } from "@/utils/error";
import { useCandidateSelection } from "@/features/questBoard/useCandidateSelection";
import {
  isHirerActor,
  QuestEditRequestStatus,
  QuestMode,
  QuestParticipation,
  QuestProofStatus,
  QuestStatus,
  type QuestUnderfilledDecision,
  QuestUnderfilledState,
} from "../domain/types";

const REFETCH_CHANGE_TYPES: Record<string, true> = {
  ASSIGNMENT_JOINED: true,
  ASSIGNMENT_STARTED: true,
  PROOF_SUBMITTED: true,
  QUEST_AUTO_CANCELLED: true,
  PROOF_REVIEWED: true,
  PROOF_AUTO_APPROVED: true,
  QUEST_FAILED: true,
  DISPUTE_WINDOW_OPENED: true,
  DISPUTE_WINDOW_CLOSED: true,
  DISPUTE_CASE_UPDATED: true,
};

export function useHirerQuestManageFeature(questId?: string) {
  const router = useRouter();
  const { locale } = useLocale();
  const messages = questBoardMessages[locale];
  const groupMessages = groupQuestMessages[locale];
  const cancelMessages = myQuestMessages[locale];
  const viewerId = useSessionQuery().data?.user.id || "";
  const [candidateOpen, setCandidateOpen] = useState(false);
  const [underfilledOpen, setUnderfilledOpen] = useState(false);
  const [conditionEditOpen, setConditionEditOpen] = useState(false);
  const [guardrailTier, setGuardrailTier] = useState<2 | 3 | null>(null);
  const [cancelPreview, setCancelPreview] =
    useState<QuestV2CancelPreview | null>(null);
  const [cancelPreviewText, setCancelPreviewText] = useState<string | null>(
    null
  );
  const [commandBusy, setCommandBusy] = useState(false);
  const [conditionEditSubmitting, setConditionEditSubmitting] = useState(false);
  const [conditionEditError, setConditionEditError] = useState<string>();
  const snapshotQuery = useLiveQuestSnapshotQuery(
    questId ?? null,
    viewerId || null
  );
  const queryClient = useQueryClient();
  useEffect(() => {
    if (!questId || !viewerId) return;
    return subscribeToHirerQuestEvents((event) => {
      if (event.questId !== questId) return;
      const underfilledPending =
        event.changeType ===
          QuestUnderfilledState.UNDERFILLED_DECISION_PENDING &&
        Boolean(event.expiresAt);
      if (!underfilledPending && !REFETCH_CHANGE_TYPES[event.changeType]) {
        return;
      }
      void queryClient.invalidateQueries({
        queryKey: questBoardKeys.liveSnapshotScope(questId, viewerId),
      });
    });
  }, [questId, queryClient, viewerId]);
  const selectApplicationMutation = useSelectApplicationMutation();
  const selectCandidateTeamMutation = useSelectCandidateTeamMutation();
  const decideUnderfilledMutation = useDecideUnderfilledMutation();
  const cancelQuestMutation = useCancelQuestMutation();
  const createEditRequestMutation = useCreateEditRequestMutation();
  const inFlightRef = useRef(false);
  const keyRef = useRef<{ scope: string; key: string } | null>(null);
  const selection = useCandidateSelection({
    questId: snapshotQuery.data?.quest.id,
    messages,
    groupMessages,
    flightRef: inFlightRef,
    onSelect: ({ kind, proposalId }) => {
      const snapshot = snapshotQuery.data;
      if (!snapshot)
        return Promise.reject(new Error("Quest snapshot is required"));
      const scope = `select-${kind}:${proposalId}`;
      const key =
        keyRef.current?.scope === scope
          ? keyRef.current.key
          : createQuestIdempotencyKey();
      keyRef.current = { scope, key };
      return kind === "application"
        ? selectApplicationMutation.mutateAsync({
            questId: snapshot.quest.id,
            applicationId: proposalId,
            viewerId,
            idempotencyKey: key,
          })
        : selectCandidateTeamMutation.mutateAsync({
            questId: snapshot.quest.id,
            teamId: proposalId,
            viewerId,
            idempotencyKey: key,
          });
    },
    onSuccess: () => {
      keyRef.current = null;
      setCandidateOpen(false);
    },
    onError: async (caught) => {
      if (
        caught instanceof ApiError &&
        caught.status >= 400 &&
        caught.status < 500
      ) {
        keyRef.current = null;
      }
      await refetchSnapshot();
      showErrorAlert(messages.actionFailedTitle, caught);
    },
    onBusyChange: setCommandBusy,
  });
  const snapshot = snapshotQuery.data;
  const refetchSnapshot = snapshotQuery.refetch;
  const viewerCommand = useCallback(
    async (
      scope: string,
      run: (key: string) => Promise<unknown>
    ): Promise<boolean> => {
      if (!questId || !viewerId || inFlightRef.current) return false;
      inFlightRef.current = true;
      setCommandBusy(true);
      const key =
        keyRef.current?.scope === scope
          ? keyRef.current.key
          : createQuestIdempotencyKey();
      keyRef.current = { scope, key };
      try {
        await run(key);
        keyRef.current = null;
        return true;
      } catch (caught) {
        if (
          caught instanceof ApiError &&
          caught.status >= 400 &&
          caught.status < 500
        ) {
          keyRef.current = null;
        }
        await refetchSnapshot();
        showErrorAlert(messages.actionFailedTitle, caught);
        return false;
      } finally {
        inFlightRef.current = false;
        setCommandBusy(false);
      }
    },
    [messages, questId, refetchSnapshot, viewerId]
  );
  const isNotFound =
    snapshotQuery.error instanceof ApiError &&
    snapshotQuery.error.status === 404;
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
    snapshot?.state === QuestStatus.QUEST_DRAFT
      ? cancelMessages.cancelDraftDescription
      : snapshot?.state === QuestStatus.QUEST_OPEN
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
    selection.confirmSelection({ kind: "application", proposalId: id });
  const selectTeam = (id: string) =>
    selection.confirmSelection({ kind: "team", proposalId: id });
  const runCancel = (preview: QuestV2CancelPreview | null) => {
    if (!snapshot) return;
    let stale = false;
    void viewerCommand("cancel", async (key) => {
      const outcome = await cancelQuestMutation
        .mutateAsync({
          questId: snapshot.quest.id,
          viewerId,
          idempotencyKey: key,
          previewVersion: preview?.previewVersion,
        })
        .catch((caught: unknown) => {
          // Money did not move; the Hirer must confirm the new amounts.
          if (
            caught instanceof ApiError &&
            caught.code === "CANCEL_PREVIEW_STALE"
          ) {
            stale = true;
            return null;
          }
          throw caught;
        });
      if (!outcome) return;
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
    }).then(() => {
      if (stale) void cancel(cancelMessages.cancelPreviewStale);
    });
  };
  const cancel = async (notice?: string) => {
    if (!snapshot) return;
    const tier = getCancelTier(snapshot.state);
    if (tier === null) return;
    // The preview is an aid: if it fails, the real cancel still enforces rules.
    const preview = await Promise.resolve()
      .then(() => liveQuestService.getCancelPreview(snapshot.quest.id))
      .then((value) => value ?? null)
      .catch(() => null);
    const text = [
      notice,
      preview
        ? cancelMessages.cancelPreviewLine(
            formatSatang(preview.paidSatang, locale),
            formatSatang(preview.refundedSatang, locale)
          )
        : null,
    ]
      .filter(Boolean)
      .join("\n");
    setCancelPreview(preview);
    setCancelPreviewText(text || null);
    if (tier === 1) {
      showConfirmModal({
        title: cancelMessages.cancelConfirmTitle,
        message: [cancelDescription, text].filter(Boolean).join("\n\n"),
        confirmLabel: cancelMessages.cancelQuest,
        cancelLabel: cancelMessages.keepQuest,
        onConfirm: () => runCancel(preview),
      });
      return;
    }
    setGuardrailTier(tier);
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
    if (!snapshot || conditionEditSubmitting || inFlightRef.current) return;
    setConditionEditSubmitting(true);
    setConditionEditError(undefined);
    void viewerCommand("edit-request", async (key) => {
      try {
        const request = await createEditRequestMutation.mutateAsync({
          questId: snapshot.quest.id,
          payload: { condition: { items } },
          viewerId,
          idempotencyKey: key,
        });
        setQuestEditRequestId(
          queryClient,
          snapshot.quest.id,
          request.requestId
        );
        setConditionEditOpen(false);
      } catch (caught) {
        setConditionEditError(
          getLocalizedErrorMessage(caught, locale, {
            fallback: messages.conditionEditSubmitError,
          })
        );
        throw caught;
      }
    }).finally(() => setConditionEditSubmitting(false));
  };
  const confirmGuardrailCancel = () => {
    setGuardrailTier(null);
    runCancel(cancelPreview);
  };
  const decideUnderfilled = (decision: QuestUnderfilledDecision) => {
    if (!snapshot) return;
    setUnderfilledOpen(false);
    void viewerCommand(`underfilled:${decision}`, (key) =>
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
    isNotFound,
    error,
    originalConditionItems,
    pendingProof,
    terminal,
    cancelDescription,
    cancelPreviewText,
    guardrailTier,
    commandBusy,
    setGuardrailTier,
    confirmGuardrailCancel,
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
