import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  CheckCircle2,
  Clock3,
  FileCheck2,
  LockKeyhole,
  Send,
  ShieldAlert,
} from "lucide-react-native";

import { createQuestIdempotencyKey } from "@/api/QuestApi";
import { type UploadAsset } from "@/api/fileUpload";
import type { QuestV2ProofSubmission } from "@/api/questV2Contracts";
import { Button } from "@/components/ui/Button";
import { TopBar } from "@/components/ui/TopBar";
import { useLocale } from "@/locales/LocaleProvider";
import { questBoardMessages } from "@/locales/questBoardMessages";
import { colors } from "@/theme/colors";
import { ScrollView, SafeAreaView, Text, View } from "@/tw";

import { authService } from "../auth/AuthService";
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

const PRIVATE_FILE_ID_BLOCKER =
  "This draft includes newly selected files, but the documented API does not provide a private File ID upload endpoint. Your selected files were kept in this draft.";

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
  const [sessionViewerId, setSessionViewerId] = useState<string>();
  const resolvedViewerId = explicitViewerId ?? sessionViewerId;
  const [snapshot, setSnapshot] = useState<LiveQuestSnapshot>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string>();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [draftAssets, setDraftAssets] = useState<ProofDraftAsset[]>([]);
  const [retryAssets, setRetryAssets] = useState<
    Record<number, ProofDraftAsset>
  >({});
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (explicitViewerId) return undefined;
    let active = true;
    void authService
      .getSession()
      .then((session) => {
        if (active && session?.user.id) setSessionViewerId(session.user.id);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [explicitViewerId]);

  const loadSnapshot = useCallback(
    async (background = false): Promise<LiveQuestSnapshot | undefined> => {
      if (!resolvedQuestId || !resolvedViewerId) return undefined;
      if (background) setRefreshing(true);
      else setLoading(true);
      try {
        const next = await liveQuestService.getLiveSnapshot(
          resolvedQuestId,
          resolvedViewerId
        );
        setSnapshot(next);
        setError(undefined);
        return next;
      } catch (caught) {
        setError(errorMessage(caught, messages.errorDescription));
        return undefined;
      } finally {
        if (background) setRefreshing(false);
        else setLoading(false);
      }
    },
    [messages.errorDescription, resolvedQuestId, resolvedViewerId]
  );

  /* eslint-disable react-hooks/set-state-in-effect -- the initial async load intentionally updates request state. */
  useEffect(() => {
    void loadSnapshot();
  }, [loadSnapshot]);
  /* eslint-enable react-hooks/set-state-in-effect */

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
  useEffect(() => {
    if (
      !snapshot ||
      (snapshot.nextAction !== "WAIT_FOR_START" && status !== "PROOF_PENDING")
    ) {
      return undefined;
    }
    const timer = setInterval(() => {
      void loadSnapshot(true);
    }, 10_000);
    return () => clearInterval(timer);
  }, [loadSnapshot, snapshot, status]);

  const refreshAuthoritatively =
    useCallback(async (): Promise<LiveQuestSnapshot> => {
      if (!resolvedQuestId || !resolvedViewerId)
        throw new Error(messages.errorDescription);
      const next = await liveQuestService.refreshLiveSnapshot(
        resolvedQuestId,
        resolvedViewerId
      );
      setSnapshot(next);
      setError(undefined);
      return next;
    }, [messages.errorDescription, resolvedQuestId, resolvedViewerId]);

  const saveDraft = useCallback(
    async (assets: ProofDraftAsset[], note: string) => {
      if (!resolvedQuestId || !resolvedViewerId)
        throw new Error(messages.errorDescription);
      if (!snapshot?.capabilities.canSubmitProof) {
        throw new Error(messages.errorDescription);
      }
      const key = createQuestIdempotencyKey();
      if (proof && isDraft) {
        if (assets.length > 0) throw new Error(PRIVATE_FILE_ID_BLOCKER);
        await liveQuestService.updateProofDraft(
          resolvedQuestId,
          proof.id,
          {
            description: note,
            fileIds: proof.fileIds,
          },
          key
        );
      } else {
        const uploadAssets: UploadAsset[] = assets.map(
          ({ uri, name, type }) => ({ uri, name, type })
        );
        if (uploadAssets.length > 0) {
          await liveQuestService.createProofDraft(
            resolvedQuestId,
            { assets: uploadAssets, description: note },
            key
          );
        } else {
          await liveQuestService.createProofDraft(
            resolvedQuestId,
            { description: note },
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
      if (submission && isDraft) {
        if (pendingAssets.length > 0) throw new Error(PRIVATE_FILE_ID_BLOCKER);
        submission = await liveQuestService.updateProofDraft(
          resolvedQuestId,
          submission.id,
          {
            description: pendingNote,
            fileIds: submission.fileIds,
          },
          createQuestIdempotencyKey()
        );
      } else if (!submission) {
        const uploadAssets: UploadAsset[] = pendingAssets.map(
          ({ uri, name, type }) => ({ uri, name, type })
        );
        if (uploadAssets.length === 0 && !pendingNote.trim())
          throw new Error(messages.proofContentRequired);
        submission =
          uploadAssets.length > 0
            ? await liveQuestService.createProofDraft(
                resolvedQuestId,
                { assets: uploadAssets, description: pendingNote },
                createQuestIdempotencyKey()
              )
            : await liveQuestService.createProofDraft(
                resolvedQuestId,
                { description: pendingNote },
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
            setRefreshing(true);
            void liveQuestService
              .confirmCompletion(questIdForService, createQuestIdempotencyKey())
              .then(() => refreshAuthoritatively())
              .then(() => {
                onReturnToWorkHub?.();
                if (!onReturnToWorkHub) router.replace("/my-quests");
              })
              .catch((caught) =>
                setError(errorMessage(caught, messages.errorDescription))
              )
              .finally(() => setRefreshing(false));
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
      <SafeAreaView className="bg-ku-background flex-1">
        <TopBar
          onBackPress={() => router.back()}
          title={messages.proofBannerTitle}
        />
        <View className="flex-1 items-center justify-center px-[24px]">
          <Text className="text-ku-text-secondary text-ku-body text-center">
            {messages.errorDescription}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="bg-ku-background flex-1">
      <TopBar
        onBackPress={() => router.back()}
        title={messages.proofBannerTitle}
      />
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.primary} />
          <Text className="text-ku-text-secondary text-ku-body mt-[12px]">
            {messages.loading}
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerClassName="pb-[40px] px-[20px]"
          showsVerticalScrollIndicator={false}
        >
          <View className="bg-ku-surface-accent border-ku-border-accent rounded-[18px] border mt-[20px] p-[16px]">
            <Text className="text-ku-text-strong font-ku-bold text-ku-title-small">
              {snapshot?.quest.title ?? messages.proofBannerTitle}
            </Text>
            <Text className="text-ku-text-secondary font-ku-regular text-ku-body-small mt-[6px]">
              {snapshot?.proofRequired
                ? messages.proofRequiredDescription
                : messages.proofNotNeededDescription}
            </Text>
            {countdown ? (
              <View className="items-center flex-row mt-[14px]">
                <Clock3 color={colors.primary} size={18} />
                <Text className="text-ku-primary font-ku-semibold text-ku-body-small ml-[7px]">
                  {countdown}
                </Text>
              </View>
            ) : null}
          </View>

          {error ? (
            <View className="bg-ku-surface-danger border-ku-border-danger rounded-[14px] border flex-row items-start mt-[12px] p-[12px]">
              <ShieldAlert color={colors.danger} size={20} />
              <Text
                accessibilityRole="alert"
                className="text-ku-danger flex-1 font-ku-medium text-ku-body-small ml-[8px]"
              >
                {error}
              </Text>
            </View>
          ) : null}

          <View className="bg-ku-card border-ku-border rounded-[18px] border mt-[16px] p-[16px]">
            <View className="items-center flex-row">
              {status === "PROOF_APPROVED" ? (
                <CheckCircle2 color={colors.success} size={22} />
              ) : status === "PROOF_NOT_APPROVED" ? (
                <ShieldAlert color={colors.danger} size={22} />
              ) : status === "PROOF_PENDING" ? (
                <LockKeyhole color={colors.primary} size={22} />
              ) : (
                <FileCheck2 color={colors.primary} size={22} />
              )}
              <Text className="text-ku-text-strong font-ku-bold text-ku-subtitle ml-[8px]">
                {statusLabel}
              </Text>
            </View>
            {proof?.description ? (
              <Text className="text-ku-text-secondary text-ku-body-small mt-[12px]">
                {proof.description}
              </Text>
            ) : null}
            {status === "PROOF_PENDING" ? (
              <Text className="text-ku-text-secondary text-ku-body-small mt-[10px]">
                {messages.proofPending}
              </Text>
            ) : null}
            {status === "PROOF_NOT_APPROVED" ? (
              <Text className="text-ku-text-secondary text-ku-body-small mt-[10px]">
                {messages.terminalDescription}
              </Text>
            ) : null}
            {isDraft ? (
              <Text className="text-ku-text-secondary text-ku-body-small mt-[10px]">
                {messages.proofLockDescription}
              </Text>
            ) : null}
          </View>

          {snapshot?.proofRequired ? (
            <View className="mt-[18px] gap-[10px]">
              {snapshot.capabilities.canSubmitProof && (isDraft || !proof) ? (
                <Button
                  onPress={() => setSheetOpen(true)}
                  testID="open-proof-submission"
                >
                  <Send color={colors.white} size={18} />
                  <Text className="text-ku-white font-ku-semibold text-ku-body ml-[8px]">
                    {messages.submitProof}
                  </Text>
                </Button>
              ) : null}
              <Button
                disabled={refreshing}
                onPress={() => void loadSnapshot(true)}
                testID="proof-refresh"
                variant="secondary"
              >
                {messages.retry}
              </Button>
            </View>
          ) : snapshot ? (
            <View className="mt-[18px]">
              <Text className="text-ku-text-secondary text-ku-body-small mb-[10px]">
                {messages.confirmCompletionDescription}
              </Text>
              {snapshot.capabilities.canConfirmCompletion ? (
                <Button
                  disabled={refreshing}
                  onPress={confirmCompletion}
                  testID="confirm-proof-free-completion"
                >
                  {messages.confirmCompletion}
                </Button>
              ) : null}
            </View>
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
    </SafeAreaView>
  );
}
