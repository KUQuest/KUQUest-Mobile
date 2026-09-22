import { useCallback, useRef, useState } from "react";
import type { RefObject } from "react";

import { createQuestIdempotencyKey } from "@/api/QuestApi";
import { useWalletQuery } from "@/features/wallet/api/walletQueries";
import { useLocale } from "@/features/preferences/localeStore";
import {
  useCreateQuestMutation,
  usePublishEditQuestMutation,
  usePublishImageUploadMutation,
  usePublishQuestMutation,
  useQuestPublishCheckQuery,
} from "./api/createQuestQueries";
import {
  adaptV2PublishCheck,
  getHeadcountForParticipation,
  getQuestApiErrorMessage,
  getQuestPublishCheck,
  toQuestV2Payload,
  type QuestDraft,
} from "./createQuestModel";
import { deleteQuestDraft } from "./createQuestPersistence";
import type {
  CompletionState,
  SaveErrorIntent,
  Step,
} from "./createQuestTypes";
import type { PublishedQuestRefValue } from "./useQuestPersistence";
import { liveQuestService } from "../questBoard/liveQuestService";
import type { QuestPublishCheck } from "../questBoard/types";
function getPublishErrorMessage(error: unknown, locale: "en" | "th"): string {
  const errorCode = (error as { code?: unknown } | null)?.code;
  if (typeof errorCode === "string" && errorCode)
    return getQuestApiErrorMessage(errorCode, locale);
  return error instanceof Error
    ? error.message
    : "Unable to publish the Quest.";
}
function derivePublishCheck(
  data: Parameters<typeof adaptV2PublishCheck>[0] | undefined,
  draft: QuestDraft
): QuestPublishCheck | null {
  if (!data) return null;
  try {
    return adaptV2PublishCheck(data);
  } catch {
    return getQuestPublishCheck(draft);
  }
}

export function useQuestPublish({
  editQuestId,
  step,
  completedState,
  draftHydrated,
  draftStorageKey,
  draft,
  draftIdRef,
  draftRevisionRef,
  publishedQuestRef,
  saveRequestRef,
  setSaveErrorIntent,
  enabled = true,
}: {
  editQuestId?: string;
  step: Step;
  completedState: CompletionState | null;
  draftHydrated: boolean;
  draftStorageKey: string | null;
  draft: QuestDraft;
  draftIdRef: RefObject<string | null>;
  draftRevisionRef: RefObject<number>;
  publishedQuestRef: RefObject<PublishedQuestRefValue | null>;
  saveRequestRef: RefObject<number>;
  setSaveErrorIntent: (intent: SaveErrorIntent | null) => void;
  enabled?: boolean;
}) {
  const { locale } = useLocale();
  const walletQuery = useWalletQuery();
  const [cleanupError, setCleanupError] = useState<string | null>(null);
  const [publishCheckQuestId, setPublishCheckQuestId] = useState<string | null>(
    null
  );
  const publishCheckQuestIdRef = useRef<string | null>(null);
  const [isPreparingPublishCheck, setIsPreparingPublishCheck] = useState(false);
  const publishCheckRequestRef = useRef(0);
  const syncInFlightRef = useRef<Promise<string | null> | null>(null);
  const opIdempotencyKeyRef = useRef<string | null>(null);
  const serverSavedRevisionRef = useRef(-1);
  const publishCheckEnabled =
    enabled && step === 3 && draftHydrated && !completedState;
  const publishCheckQuery = useQuestPublishCheckQuery(
    publishCheckQuestId,
    publishCheckEnabled
  );
  const refetchPublishCheck = publishCheckQuery.refetch;
  const publishCheck =
    derivePublishCheck(publishCheckQuery.data, draft) ??
    (publishCheckQuery.error ? getQuestPublishCheck(draft) : null);
  const setPublishCheck = useCallback((next: QuestPublishCheck | null) => {
    if (next !== null) return;
    publishCheckRequestRef.current += 1;
    publishCheckQuestIdRef.current = null;
    setPublishCheckQuestId(null);
    setIsPreparingPublishCheck(false);
  }, []);
  const isCheckingPublish =
    isPreparingPublishCheck ||
    publishCheckQuery.isFetching ||
    (publishCheckQuestId !== null &&
      publishCheckQuery.data == null &&
      publishCheckQuery.error == null);
  const createMutation = useCreateQuestMutation();
  const imageUploadMutation = usePublishImageUploadMutation();
  const editMutation = usePublishEditQuestMutation();
  const publishMutation = usePublishQuestMutation();

  // One key per pending logical operation: a failed create or update keeps it so
  // the next press replays the same Idempotency-Key instead of minting a new one.
  const takeOperationKey = useCallback(() => {
    if (!opIdempotencyKeyRef.current) {
      opIdempotencyKeyRef.current = createQuestIdempotencyKey();
    }
    return opIdempotencyKeyRef.current;
  }, []);
  const resetCreateIdempotencyKey = useCallback(() => {
    opIdempotencyKeyRef.current = null;
    serverSavedRevisionRef.current = -1;
  }, []);

  const syncServerQuest = useCallback(
    async (
      draftToSync: QuestDraft,
      fallbackQuestId?: string
    ): Promise<string | null> => {
      if (!draftStorageKey) return null;
      const normalizedDraft = {
        ...draftToSync,
        headcount: getHeadcountForParticipation(
          draftToSync.participation,
          draftToSync.headcount
        ),
      };
      const existing = publishedQuestRef.current;
      let questId = existing?.questId ?? fallbackQuestId;
      const revisionAtStart = draftRevisionRef.current;
      const requestIdAtStart = saveRequestRef.current;
      if (questId) {
        if (
          existing &&
          existing.questId === questId &&
          revisionAtStart !== serverSavedRevisionRef.current &&
          existing.version != null
        ) {
          const edited = await editMutation.mutateAsync({
            questId,
            version: existing.version,
            payload: toQuestV2Payload(normalizedDraft),
            idempotencyKey: takeOperationKey(),
          });
          if (requestIdAtStart !== saveRequestRef.current) return null;
          opIdempotencyKeyRef.current = null;
          serverSavedRevisionRef.current = revisionAtStart;
          publishedQuestRef.current = { ...existing, version: edited.version };
        }
      } else {
        const created = await createMutation.mutateAsync({
          payload: toQuestV2Payload(normalizedDraft),
          idempotencyKey: takeOperationKey(),
        });
        if (requestIdAtStart !== saveRequestRef.current) return null;
        questId = created.id;
        if (normalizedDraft.imageUris && normalizedDraft.imageUris.length > 0) {
          try {
            await imageUploadMutation.mutateAsync({
              questId,
              imageUris: normalizedDraft.imageUris,
            });
          } catch (imageError) {
            console.warn("Failed to upload quest images:", imageError);
          }
        }
        if (requestIdAtStart !== saveRequestRef.current) return null;
        opIdempotencyKeyRef.current = null;
        serverSavedRevisionRef.current = revisionAtStart;
        publishedQuestRef.current = {
          questId,
          version: created.version,
          storageKey: draftStorageKey,
          editQuestId,
        };
      }
      return questId ?? null;
    },
    [
      createMutation,
      draftRevisionRef,
      draftStorageKey,
      editMutation,
      editQuestId,
      imageUploadMutation,
      publishedQuestRef,
      saveRequestRef,
      takeOperationKey,
    ]
  );

  // Single-flight: a second press joins the running sync instead of starting a
  // duplicate create/update. React Query's isPending cannot serve this role —
  // it is still false within the tick that started the mutation.
  const ensureServerQuest = useCallback(
    (
      draftToSync: QuestDraft,
      fallbackQuestId?: string
    ): Promise<string | null> => {
      if (syncInFlightRef.current) return syncInFlightRef.current;
      const promise = (async () => {
        try {
          return await syncServerQuest(draftToSync, fallbackQuestId);
        } finally {
          syncInFlightRef.current = null;
        }
      })();
      syncInFlightRef.current = promise;
      return promise;
    },
    [syncServerQuest]
  );

  const refreshPublishCheck = useCallback(async () => {
    if (!enabled || !draftHydrated || !draftStorageKey) return;
    const requestId = ++publishCheckRequestRef.current;
    setIsPreparingPublishCheck(true);
    try {
      const questId = await ensureServerQuest(draft, editQuestId);
      if (!questId || requestId !== publishCheckRequestRef.current) return;
      if (publishCheckQuestIdRef.current === questId) {
        const result = await refetchPublishCheck();
        if (requestId !== publishCheckRequestRef.current) return;
        if (result.error) throw result.error;
      } else {
        publishCheckQuestIdRef.current = questId;
        setPublishCheckQuestId(questId);
      }
    } catch {
      // A failed sync must not block navigation: the Review card falls back to
      // the locally derived check, and publishing re-verifies server-side.
    } finally {
      if (requestId === publishCheckRequestRef.current) {
        setIsPreparingPublishCheck(false);
      }
    }
  }, [
    draft,
    draftHydrated,
    draftStorageKey,
    editQuestId,
    enabled,
    ensureServerQuest,
    refetchPublishCheck,
  ]);

  const publishQuest = useCallback(
    async (draftToPublish: QuestDraft): Promise<boolean> => {
      if (!enabled) return false;
      const requestId = ++saveRequestRef.current;
      setSaveErrorIntent(null);
      setCleanupError(null);
      try {
        if (!draftStorageKey) {
          setSaveErrorIntent({ state: "OPEN", completesFlow: true });
          return false;
        }

        let publishIdempotencyKey =
          publishedQuestRef.current?.publishIdempotencyKey;
        const hasMatchingPublishedQuest =
          publishedQuestRef.current?.storageKey === draftStorageKey &&
          publishedQuestRef.current?.editQuestId === editQuestId;

        if (!hasMatchingPublishedQuest) {
          publishIdempotencyKey = undefined;
        }

        // Unconditional sync: this is the only place that pushes a draft edit
        // made after entering Review onto the server copy. No fallback quest id —
        // in local-draft mode `editQuestId` is a SecureStore draft id, never a
        // server quest id.
        const publishedQuestId = await ensureServerQuest(draftToPublish);
        if (!publishedQuestId) {
          setSaveErrorIntent({ state: "OPEN", completesFlow: true });
          return false;
        }

        if (!publishIdempotencyKey) {
          publishIdempotencyKey = createQuestIdempotencyKey();
          publishedQuestRef.current = {
            questId: publishedQuestId,
            version: publishedQuestRef.current?.version,
            storageKey: draftStorageKey,
            editQuestId,
            publishIdempotencyKey,
          };
        }

        const check = await liveQuestService.getPublishCheck(publishedQuestId);
        if (!check.canPublish) {
          const reason =
            check.blockingReasons.map((blocker) => blocker.message).join(" ") ||
            "The Quest is not ready to publish.";
          throw new Error(reason);
        }

        const published = await publishMutation.mutateAsync({
          questId: publishedQuestId,
          idempotencyKey: publishIdempotencyKey,
        });
        if (published.state !== "QUEST_OPEN") {
          throw new Error("The server did not open the Quest.");
        }

        const activeDraftId = draftIdRef.current;
        if (activeDraftId) {
          try {
            await deleteQuestDraft(draftStorageKey, activeDraftId);
          } catch (error) {
            setCleanupError(
              error instanceof Error
                ? error.message
                : "Unable to clear the Quest draft."
            );
            setSaveErrorIntent({ state: "OPEN", completesFlow: true });
            return false;
          }
        }
        if (requestId !== saveRequestRef.current) return false;
        publishedQuestRef.current = null;
        opIdempotencyKeyRef.current = null;
        serverSavedRevisionRef.current = -1;
        setSaveErrorIntent(null);
        return true;
      } catch {
        if (requestId !== saveRequestRef.current) return false;
        setSaveErrorIntent({ state: "OPEN", completesFlow: true });
        return false;
      }
    },
    [
      draftIdRef,
      draftStorageKey,
      editQuestId,
      enabled,
      ensureServerQuest,
      publishMutation,
      publishedQuestRef,
      saveRequestRef,
      setSaveErrorIntent,
    ]
  );

  const publishPending =
    createMutation.isPending ||
    editMutation.isPending ||
    imageUploadMutation.isPending ||
    publishMutation.isPending;
  const publishError =
    publishMutation.error ??
    editMutation.error ??
    createMutation.error ??
    imageUploadMutation.error;

  return {
    publishCheck,
    setPublishCheck,
    walletBalances: walletQuery.data ?? null,
    isCheckingPublish,
    publishQuest,
    refreshPublishCheck,
    resetCreateIdempotencyKey,
    saveState: publishPending
      ? "saving"
      : cleanupError || publishError
        ? "error"
        : publishMutation.isSuccess
          ? "saved"
          : "idle",
    saveErrorMessage: cleanupError
      ? cleanupError
      : publishError
        ? getPublishErrorMessage(publishError, locale)
        : null,
    savingAction: publishPending ? ("OPEN" as const) : null,
    resetSaveState: () => {
      setCleanupError(null);
      createMutation.reset();
      editMutation.reset();
      imageUploadMutation.reset();
      publishMutation.reset();
    },
  };
}
