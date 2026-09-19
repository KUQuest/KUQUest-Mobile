import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

import { createQuestIdempotencyKey } from "@/api/QuestApi";
import { type UploadAsset } from "@/api/fileUpload";
import type { QuestV2ProofSubmission } from "@/api/questV2Contracts";
import { ScreenLayout } from "@/components/layout/ScreenLayout";
import { TopBar } from "@/components/ui/TopBar";
import { useLocale } from "@/features/preferences/localeStore";
import { questBoardMessages } from "@/locales/questBoardMessages";
import { colors } from "@/theme/colors";
import { ScrollView, Text, View } from "@/tw";

import { useSessionQuery } from "@/features/auth/sessionQueries";
import { useLiveQuestSnapshotQuery } from "./api/questBoardQueries";
import { QuestProofActionSection } from "./components/QuestProofActionSection";
import { QuestProofStatusCard } from "./components/QuestProofStatusCard";
import { QuestProofSummaryCard } from "./components/QuestProofSummaryCard";
import {
  ProofSubmissionSheet,
  type ProofDraftAsset,
} from "./components/ProofSubmissionSheet";
import { liveQuestService, type LiveQuestSnapshot } from "./liveQuestService";

export interface QuestProofScreenProps {
  questId?: string;
  viewerId?: string;
  onReturnToWorkHub?: () => void;
}

function routeValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function formatRemaining(dueAt: string | null, now: number): string | null {
  if (!dueAt) return null;
  const remaining = new Date(dueAt).getTime() - now;
  if (!Number.isFinite(remaining)) return null;
  if (remaining <= 0) return "Due now";
  const minutes = Math.floor(remaining / 60_000);
  const days = Math.floor(minutes / (60 * 24));
  const hours = Math.floor((minutes % (60 * 24)) / 60);
  const mins = minutes % 60;
  if (days > 0) return `${days}d ${hours}h remaining`;
  if (hours > 0) return `${hours}h ${mins}m remaining`;
  return `${mins}m remaining`;
}

function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim()) return error.message;
  return fallback;
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

export default function QuestProofScreen({
  questId,
  viewerId,
  onReturnToWorkHub,
}: QuestProofScreenProps) {
  const router = useRouter();
  const params = useLocalSearchParams<{
    id?: string | string[];
    viewerId?: string | string[];
    studentId?: string | string[];
  }>();
  const { locale } = useLocale();
  const messages = questBoardMessages[locale];
  const resolvedQuestId = questId ?? routeValue(params.id);
  const explicitViewerId =
    viewerId ?? routeValue(params.viewerId) ?? routeValue(params.studentId);
  const sessionQuery = useSessionQuery();
  const resolvedViewerId = explicitViewerId ?? sessionQuery.data?.user.id;
  const snapshotPollingInterval = useCallback(
    (currentSnapshot: LiveQuestSnapshot | undefined): number | false => {
      if (!currentSnapshot || !resolvedViewerId) return false;
      const currentStatus = ownProof(currentSnapshot, resolvedViewerId)?.status;
      return currentSnapshot.nextAction === "WAIT_FOR_START" ||
        currentStatus === "PROOF_PENDING"
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
    ? errorMessage(snapshotQuery.error, messages.errorDescription)
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
  const countdown = formatRemaining(snapshot?.dueAt ?? null, now);

  const refreshAuthoritatively =
    useCallback(async (): Promise<LiveQuestSnapshot> => {
      if (!resolvedQuestId || !resolvedViewerId)
        throw new Error(messages.errorDescription);
      const result = await refetchSnapshot();
      if (result.error) throw result.error;
      if (!result.data) throw new Error(messages.errorDescription);
      setCommandError(null);
      return result.data;
    }, [
      messages.errorDescription,
      refetchSnapshot,
      resolvedQuestId,
      resolvedViewerId,
    ]);

  const saveDraft = useCallback(
    async (assets: ProofDraftAsset[], note: string) => {
      if (!resolvedQuestId || !resolvedViewerId)
        throw new Error(messages.errorDescription);
      if (!snapshot?.capabilities.canSubmitProof) {
        throw new Error(messages.errorDescription);
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
            : {
                description: normalizedNote,
                fileIds: proof.fileIds,
              },
          key
        );
      } else {
        const uploadAssets = toUploadAssets(assets);
        if (uploadAssets.length > 0) {
          await liveQuestService.createProofDraft(
            resolvedQuestId,
            {
              assets: uploadAssets,
              description: normalizedNote || undefined,
            },
            key
          );
        } else {
          await liveQuestService.createProofDraft(
            resolvedQuestId,
            { description: normalizedNote },
            key
          );
        }
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
      messages.errorDescription,
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
      if (!resolvedQuestId || !resolvedViewerId)
        throw new Error(messages.errorDescription);
      if (!snapshot?.capabilities.canSubmitProof) {
        throw new Error(messages.errorDescription);
      }
      let submission = proof;
      const normalizedNote = pendingNote.trim();
      if (submission && isDraft) {
        submission =
          pendingAssets.length > 0
            ? await liveQuestService.updateProofDraft(
                resolvedQuestId,
                submission.id,
                {
                  assets: toUploadAssets(pendingAssets),
                  description: normalizedNote || undefined,
                },
                createQuestIdempotencyKey()
              )
            : await liveQuestService.updateProofDraft(
                resolvedQuestId,
                submission.id,
                {
                  description: normalizedNote,
                  fileIds: submission.fileIds,
                },
                createQuestIdempotencyKey()
              );
      } else if (!submission) {
        const uploadAssets = toUploadAssets(pendingAssets);
        if (uploadAssets.length === 0 && !normalizedNote)
          throw new Error(messages.proofContentRequired);
        submission =
          uploadAssets.length > 0
            ? await liveQuestService.createProofDraft(
                resolvedQuestId,
                {
                  assets: uploadAssets,
                  description: normalizedNote || undefined,
                },
                createQuestIdempotencyKey()
              )
            : await liveQuestService.createProofDraft(
                resolvedQuestId,
                { description: normalizedNote },
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
      messages.errorDescription,
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
    )
      return;
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
      )
        return;
      const asset = retryAssets[position] ?? draftAssets[position];
      if (!asset)
        throw new Error("Choose the failed file again before retrying.");
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
      snapshot?.capabilities.canSubmitProof,
    ]
  );

  const confirmCompletion = useCallback(() => {
    const questIdForService = resolvedQuestId;
    if (
      !questIdForService ||
      !snapshot ||
      snapshot.proofRequired ||
      snapshot.state !== "QUEST_IN_PROGRESS" ||
      !snapshot.capabilities.canConfirmCompletion
    )
      return;
    Alert.alert(
      messages.confirmCompletion,
      messages.confirmCompletionDescription,
      [
        { text: messages.cancel, style: "cancel" },
        {
          text: messages.confirmCompletion,
          onPress: () => {
            void liveQuestService
              .confirmCompletion(questIdForService, createQuestIdempotencyKey())
              .then(() => refreshAuthoritatively())
              .then(() => {
                onReturnToWorkHub?.();
                if (!onReturnToWorkHub) router.replace("/my-quests");
              })
              .catch((caught) =>
                setCommandError(errorMessage(caught, messages.errorDescription))
              );
          },
        },
      ]
    );
  }, [
    messages,
    onReturnToWorkHub,
    refreshAuthoritatively,
    resolvedQuestId,
    router,
    snapshot,
  ]);

  const statusLabel =
    status === "PROOF_APPROVED"
      ? messages.statusLabel("PROOF_APPROVED")
      : status === "PROOF_NOT_APPROVED"
        ? messages.statusLabel("PROOF_NOT_APPROVED")
        : status === "PROOF_PENDING"
          ? messages.proofPending
          : isDraft
            ? messages.proofSubmissionTitle
            : messages.proofBannerTitle;

  if (!resolvedQuestId || !resolvedViewerId) {
    return (
      <ScreenLayout
        edges={["top", "left", "right", "bottom"]}
        className="flex-1 bg-ku-background"
      >
        <TopBar
          onBackPress={() => router.back()}
          title={messages.proofBannerTitle}
        />
        <View className="flex-1 items-center justify-center px-[24px]">
          <Text className="text-center text-ku-body text-ku-text-secondary">
            {messages.errorDescription}
          </Text>
        </View>
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout
      edges={["top", "left", "right", "bottom"]}
      className="flex-1 bg-ku-background"
    >
      <TopBar
        onBackPress={() => router.back()}
        title={messages.proofBannerTitle}
      />
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.primary} />
          <Text className="mt-[12px] text-ku-body text-ku-text-secondary">
            {messages.loading}
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerClassName="px-[20px] pb-[40px]"
          showsVerticalScrollIndicator={false}
        >
          <QuestProofSummaryCard
            countdown={countdown}
            description={
              snapshot?.proofRequired
                ? messages.proofRequiredDescription
                : messages.proofNotNeededDescription
            }
            error={error}
            title={snapshot?.quest.title ?? messages.proofBannerTitle}
          />

          <QuestProofStatusCard
            description={proof?.description}
            icon={
              status === "PROOF_APPROVED"
                ? "approved"
                : status === "PROOF_NOT_APPROVED"
                  ? "not-approved"
                  : status === "PROOF_PENDING"
                    ? "pending"
                    : "draft"
            }
            label={statusLabel}
            lockDescription={
              isDraft ? messages.proofLockDescription : undefined
            }
            pendingDescription={
              status === "PROOF_PENDING" ? messages.proofPending : undefined
            }
            terminalDescription={
              status === "PROOF_NOT_APPROVED"
                ? messages.terminalDescription
                : undefined
            }
          />

          {snapshot?.proofRequired ? (
            <QuestProofActionSection
              canSubmit={
                snapshot.capabilities.canSubmitProof && (isDraft || !proof)
              }
              onOpenSubmission={() => setSheetOpen(true)}
              onRefresh={() => void refreshAuthoritatively()}
              refreshing={refreshing}
              retryLabel={messages.retry}
              submitLabel={messages.submitProof}
              variant="proof"
            />
          ) : snapshot ? (
            <QuestProofActionSection
              canConfirm={snapshot.capabilities.canConfirmCompletion}
              confirmLabel={messages.confirmCompletion}
              description={messages.confirmCompletionDescription}
              onConfirm={confirmCompletion}
              refreshing={refreshing}
              variant="completion"
            />
          ) : null}
        </ScrollView>
      )}

      <ProofSubmissionSheet
        retryAssets={retryAssets}
        draftAssets={draftAssets}
        error={error}
        loading={refreshing}
        locked={isLocked}
        onClose={() => setSheetOpen(false)}
        onDeleteDraft={
          proof && isDraft && snapshot?.capabilities.canSubmitProof
            ? deleteDraft
            : undefined
        }
        onRetryUpload={
          proof && isDraft && snapshot?.capabilities.canSubmitProof
            ? retryUpload
            : undefined
        }
        onSaveDraft={saveDraft}
        onSubmitDraft={submitDraft}
        proof={proof}
        visible={Boolean(
          sheetOpen &&
          snapshot?.capabilities.canSubmitProof &&
          (isDraft || !proof)
        )}
      />
    </ScreenLayout>
  );
}
