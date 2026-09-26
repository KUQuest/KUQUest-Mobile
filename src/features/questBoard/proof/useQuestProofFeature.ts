import { useCallback, useEffect, useMemo, useState } from "react";

import { showConfirmModal } from "@/components/ui/SweetAlert";
import { useLocalSearchParams, useRouter } from "expo-router";

import { createQuestIdempotencyKey } from "@/api/QuestApi";
import type { UploadAsset } from "@/api/fileUpload";
import type { QuestV2ProofSubmission } from "@/api/questV2Contracts";
import { useSessionQuery } from "@/features/auth/sessionQueries";
import { useLocale } from "@/features/preferences/localeStore";
import { questBoardMessages } from "@/locales/questBoardMessages";
import { questWorkMessages } from "@/locales/questWorkMessages";
import { formatRelativeRemaining, getRouteParam } from "@/utils";
import { getLocalizedErrorMessage } from "@/utils/error";

import { useLiveQuestSnapshotQuery } from "../api/questBoardQueries";
import { liveQuestService } from "../live/liveQuestService";
import type { LiveQuestSnapshot } from "../live/liveQuestTypes";
import type { ProofDraftAsset } from "./components/ProofSubmissionSheet";
import {
  QuestNextAction,
  QuestProofStatus,
  QuestStatus,
} from "../domain/types";

interface QuestProofFeatureOptions {
  questId?: string;
  viewerId?: string;
  onReturnToWorkHub?: () => void;
}

function ownProof(
  snapshot: LiveQuestSnapshot,
  viewerId: string
): QuestV2ProofSubmission | null {
  return (
    snapshot.proofs.find(
      (proof) =>
        proof.submittedByUserId === viewerId ||
        proof.workerId === viewerId ||
        (snapshot.team?.id !== undefined && proof.teamId === snapshot.team.id)
    ) ?? null
  );
}

function toUploadAssets(assets: ProofDraftAsset[]): UploadAsset[] {
  return assets.map(({ uri, name, type }) => ({ uri, name, type }));
}

export function useQuestProofFeature({
  questId,
  viewerId,
  onReturnToWorkHub,
}: QuestProofFeatureOptions) {
  const router = useRouter();
  const goBack = useCallback(() => router.back(), [router]);
  const params = useLocalSearchParams<{
    id?: string | string[];
    viewerId?: string | string[];
    studentId?: string | string[];
  }>();
  const { locale } = useLocale();
  const messages = questBoardMessages[locale];
  const workMessages = questWorkMessages[locale];
  const resolvedQuestId = questId ?? getRouteParam(params.id);
  const explicitViewerId =
    viewerId ??
    getRouteParam(params.viewerId) ??
    getRouteParam(params.studentId);
  const sessionQuery = useSessionQuery();
  const resolvedViewerId = explicitViewerId ?? sessionQuery.data?.user.id;
  const snapshotPollingInterval = useCallback(
    (currentSnapshot: LiveQuestSnapshot | undefined): number | false => {
      if (!currentSnapshot || !resolvedViewerId) return false;
      const currentStatus = ownProof(currentSnapshot, resolvedViewerId)?.status;
      return currentSnapshot.nextAction === QuestNextAction.WAIT_FOR_START ||
        currentStatus === QuestProofStatus.PROOF_PENDING
        ? 10_000
        : false;
    },
    [resolvedViewerId]
  );
  const snapshotQuery = useLiveQuestSnapshotQuery(
    resolvedQuestId ?? null,
    resolvedViewerId ?? null,
    {},
    true,
    snapshotPollingInterval
  );
  const snapshot = snapshotQuery.data;
  const loading = snapshotQuery.isPending;
  const refreshing = snapshotQuery.isRefetching;
  const { refetch: refetchSnapshot } = snapshotQuery;
  const [sheetOpen, setSheetOpen] = useState(false);
  const [draftAssets, setDraftAssets] = useState<ProofDraftAsset[]>([]);
  const [retryAssets, setRetryAssets] = useState<
    Record<number, ProofDraftAsset>
  >({});
  const [now, setNow] = useState(() => Date.now());
  const [commandError, setCommandError] = useState<string | null>(null);
  const snapshotError = snapshotQuery.error
    ? getLocalizedErrorMessage(snapshotQuery.error, locale, {
        fallback: messages.manageSnapshotError,
      })
    : undefined;
  const error = commandError ?? snapshotError;

  useEffect(() => {
    if (!snapshot?.dueAt) return undefined;
    const timer = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, [snapshot?.dueAt]);

  const proof = useMemo(
    () =>
      snapshot && resolvedViewerId
        ? ownProof(snapshot, resolvedViewerId)
        : null,
    [resolvedViewerId, snapshot]
  );
  const isDraft = Boolean(
    proof && proof.submittedAt === null && proof.status === null
  );
  const status = proof?.status;
  const isLocked = Boolean(proof?.submittedAt);
  const countdown = formatRelativeRemaining(snapshot?.dueAt ?? null, now);

  const refreshAuthoritatively =
    useCallback(async (): Promise<LiveQuestSnapshot> => {
      if (!resolvedQuestId || !resolvedViewerId) {
        throw new Error(messages.manageSnapshotError);
      }
      const result = await refetchSnapshot();
      if (result.error) throw result.error;
      if (!result.data) throw new Error(messages.manageSnapshotError);
      setCommandError(null);
      return result.data;
    }, [
      messages.manageSnapshotError,
      refetchSnapshot,
      resolvedQuestId,
      resolvedViewerId,
    ]);

  const saveDraft = useCallback(
    async (assets: ProofDraftAsset[], note: string) => {
      if (!resolvedQuestId || !resolvedViewerId) {
        throw new Error(messages.manageSnapshotError);
      }
      if (!snapshot?.capabilities.canSubmitProof) {
        throw new Error(messages.manageSnapshotError);
      }
      const key = createQuestIdempotencyKey();
      const normalizedNote = note.trim();
      if (proof && isDraft) {
        await liveQuestService.updateProofDraft(
          resolvedQuestId,
          proof.id,
          assets.length > 0
            ? {
                assets: toUploadAssets(assets),
                description: normalizedNote || undefined,
              }
            : { description: normalizedNote, fileIds: proof.fileIds },
          key
        );
      } else {
        const uploadAssets = toUploadAssets(assets);
        await liveQuestService.createProofDraft(
          resolvedQuestId,
          uploadAssets.length > 0
            ? { assets: uploadAssets, description: normalizedNote || undefined }
            : { description: normalizedNote },
          key
        );
      }
      setDraftAssets([]);
      if (assets.length > 0) {
        setRetryAssets((current) => {
          const next = { ...current };
          assets.forEach((asset, index) => {
            next[index] = asset;
          });
          return next;
        });
      }
      await refreshAuthoritatively();
    },
    [
      isDraft,
      messages.manageSnapshotError,
      proof,
      refreshAuthoritatively,
      resolvedQuestId,
      resolvedViewerId,
      snapshot?.capabilities.canSubmitProof,
    ]
  );

  const submitDraft = useCallback(
    async (
      pendingAssets: ProofDraftAsset[] = draftAssets,
      pendingNote = ""
    ) => {
      if (!resolvedQuestId || !resolvedViewerId) {
        throw new Error(messages.manageSnapshotError);
      }
      if (!snapshot?.capabilities.canSubmitProof) {
        throw new Error(messages.manageSnapshotError);
      }
      let submission = proof;
      const normalizedNote = pendingNote.trim();
      if (submission && isDraft) {
        submission = await liveQuestService.updateProofDraft(
          resolvedQuestId,
          submission.id,
          pendingAssets.length > 0
            ? {
                assets: toUploadAssets(pendingAssets),
                description: normalizedNote || undefined,
              }
            : { description: normalizedNote, fileIds: submission.fileIds },
          createQuestIdempotencyKey()
        );
      } else if (!submission) {
        const uploadAssets = toUploadAssets(pendingAssets);
        if (uploadAssets.length === 0 && !normalizedNote) {
          throw new Error(messages.proofContentRequired);
        }
        submission = await liveQuestService.createProofDraft(
          resolvedQuestId,
          uploadAssets.length > 0
            ? { assets: uploadAssets, description: normalizedNote || undefined }
            : { description: normalizedNote },
          createQuestIdempotencyKey()
        );
      }
      if (!submission) throw new Error(messages.proofContentRequired);
      await liveQuestService.submitProofDraft(
        resolvedQuestId,
        submission.id,
        createQuestIdempotencyKey()
      );
      await refreshAuthoritatively();
      setDraftAssets([]);
      setSheetOpen(false);
      onReturnToWorkHub?.();
      if (!onReturnToWorkHub) router.replace("/my-quests");
    },
    [
      draftAssets,
      isDraft,
      messages.manageSnapshotError,
      messages.proofContentRequired,
      onReturnToWorkHub,
      proof,
      refreshAuthoritatively,
      resolvedQuestId,
      resolvedViewerId,
      router,
      snapshot?.capabilities.canSubmitProof,
    ]
  );

  const deleteDraft = useCallback(async () => {
    if (
      !resolvedQuestId ||
      !proof ||
      !isDraft ||
      !snapshot?.capabilities.canSubmitProof
    ) {
      return;
    }
    await liveQuestService.deleteProofDraft(
      resolvedQuestId,
      proof.id,
      createQuestIdempotencyKey()
    );
    await refreshAuthoritatively();
    setSheetOpen(false);
  }, [
    isDraft,
    proof,
    refreshAuthoritatively,
    resolvedQuestId,
    snapshot?.capabilities.canSubmitProof,
  ]);

  const retryUpload = useCallback(
    async (position: number) => {
      if (
        !resolvedQuestId ||
        !proof ||
        !isDraft ||
        !snapshot?.capabilities.canSubmitProof
      ) {
        return;
      }
      const asset = retryAssets[position] ?? draftAssets[position];
      if (!asset) throw new Error(workMessages.retryFailedProofFile);
      await liveQuestService.updateProofDraft(
        resolvedQuestId,
        proof.id,
        {
          assets: [{ uri: asset.uri, name: asset.name, type: asset.type }],
          retryPosition: position,
          description: proof.description ?? undefined,
        },
        createQuestIdempotencyKey()
      );
      await refreshAuthoritatively();
    },
    [
      draftAssets,
      isDraft,
      proof,
      refreshAuthoritatively,
      resolvedQuestId,
      retryAssets,
      workMessages.retryFailedProofFile,
      snapshot?.capabilities.canSubmitProof,
    ]
  );

  const confirmCompletion = useCallback(() => {
    if (
      !resolvedQuestId ||
      !snapshot ||
      snapshot.proofRequired ||
      snapshot.state !== QuestStatus.QUEST_IN_PROGRESS ||
      !snapshot.capabilities.canConfirmCompletion
    ) {
      return;
    }
    showConfirmModal({
      title: messages.confirmCompletion,
      message: messages.confirmCompletionDescription,
      confirmLabel: messages.confirmCompletion,
      cancelLabel: messages.cancel,
      onConfirm: () => {
        void liveQuestService
          .confirmCompletion(resolvedQuestId, createQuestIdempotencyKey())
          .then(() => refreshAuthoritatively())
          .then(() => {
            onReturnToWorkHub?.();
            if (!onReturnToWorkHub) router.replace("/my-quests");
          })
          .catch((caught) =>
            setCommandError(
              getLocalizedErrorMessage(caught, locale, {
                fallback: messages.manageSnapshotError,
              })
            )
          );
      },
    });
  }, [
    locale,
    messages,
    onReturnToWorkHub,
    refreshAuthoritatively,
    resolvedQuestId,
    router,
    snapshot,
  ]);

  const statusLabel =
    status === QuestProofStatus.PROOF_APPROVED
      ? messages.statusLabel(QuestProofStatus.PROOF_APPROVED)
      : status === QuestProofStatus.PROOF_NOT_APPROVED
        ? messages.statusLabel(QuestProofStatus.PROOF_NOT_APPROVED)
        : status === QuestProofStatus.PROOF_PENDING
          ? messages.proofPending
          : isDraft
            ? messages.proofSubmissionTitle
            : messages.proofBannerTitle;

  return {
    countdown,
    confirmCompletion,
    deleteDraft,
    draftAssets,
    error,
    isDraft,
    isLocked,
    loading,
    messages,
    proof,
    refreshAuthoritatively,
    refreshing,
    resolvedQuestId,
    resolvedViewerId,
    retryAssets,
    retryUpload,
    saveDraft,
    setSheetOpen,
    sheetOpen,
    snapshot,
    status,
    statusLabel,
    submitDraft,
    goBack,
  };
}
