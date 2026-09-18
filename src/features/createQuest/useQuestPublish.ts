import { useCallback, useEffect, useRef, useState } from "react";
import type { RefObject } from "react";

import { createQuestIdempotencyKey } from "@/api/QuestApi";
import { useWalletQuery } from "@/features/wallet/api/walletQueries";
import { useLocale } from "@/features/preferences/localeStore";
import {
  useCreateQuestMutation,
  usePublishEditQuestMutation,
  usePublishImageUploadMutation,
  usePublishQuestMutation,
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

export function useQuestPublish({
  editQuestId,
  step,
  completedState,
  draftHydrated,
  draftStorageKey,
  draft,
  draftIdRef,
  draftChangedRef,
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
  draftChangedRef: RefObject<boolean>;
  publishedQuestRef: RefObject<PublishedQuestRefValue | null>;
  saveRequestRef: RefObject<number>;
  setSaveErrorIntent: (intent: SaveErrorIntent | null) => void;
  enabled?: boolean;
}) {
  const { locale } = useLocale();
  const walletQuery = useWalletQuery();
  const [cleanupError, setCleanupError] = useState<string | null>(null);
  const [publishCheck, setPublishCheck] = useState<QuestPublishCheck | null>(
    null
  );
  const [isCheckingPublish, setIsCheckingPublish] = useState(false);
  const publishCheckRequestRef = useRef(0);
  const createMutation = useCreateQuestMutation();
  const imageUploadMutation = usePublishImageUploadMutation();
  const editMutation = usePublishEditQuestMutation();
  const publishMutation = usePublishQuestMutation();

  const publishQuest = useCallback(
    async (draftToPublish: QuestDraft): Promise<boolean> => {
      const requestId = ++saveRequestRef.current;
      setSaveErrorIntent(null);
      setCleanupError(null);
      try {
        if (!draftStorageKey) {
          setSaveErrorIntent({ state: "OPEN", completesFlow: true });
          return false;
        }

        let publishedQuestId = publishedQuestRef.current?.questId;
        let createIdempotencyKey =
          publishedQuestRef.current?.createIdempotencyKey;
        let publishIdempotencyKey =
          publishedQuestRef.current?.publishIdempotencyKey;
        const hasMatchingPublishedQuest =
          publishedQuestRef.current?.storageKey === draftStorageKey &&
          publishedQuestRef.current?.editQuestId === editQuestId;

        if (!hasMatchingPublishedQuest) {
          createIdempotencyKey = undefined;
          publishIdempotencyKey = undefined;
        }

        if (!publishedQuestId) {
          const normalizedDraft = {
            ...draftToPublish,
            headcount: getHeadcountForParticipation(
              draftToPublish.participation,
              draftToPublish.headcount
            ),
          };
          createIdempotencyKey = createQuestIdempotencyKey();
          const created = await createMutation.mutateAsync({
            payload: toQuestV2Payload(normalizedDraft),
            idempotencyKey: createIdempotencyKey,
          });
          publishedQuestId = created.id;
          if (
            normalizedDraft.imageUris &&
            normalizedDraft.imageUris.length > 0
          ) {
            try {
              await imageUploadMutation.mutateAsync({
                questId: publishedQuestId,
                imageUris: normalizedDraft.imageUris,
              });
            } catch (imageError) {
              console.warn("Failed to upload quest images:", imageError);
            }
          }
          publishIdempotencyKey = createQuestIdempotencyKey();
          publishedQuestRef.current = {
            questId: publishedQuestId,
            version: created.version,
            storageKey: draftStorageKey,
            editQuestId,
            createIdempotencyKey,
            publishIdempotencyKey,
          };
        }

        if (!publishIdempotencyKey) {
          publishIdempotencyKey = createQuestIdempotencyKey();
          publishedQuestRef.current = {
            questId: publishedQuestId,
            version: publishedQuestRef.current?.version,
            storageKey: draftStorageKey,
            editQuestId,
            createIdempotencyKey,
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
        setSaveErrorIntent(null);
        return true;
      } catch {
        if (requestId !== saveRequestRef.current) return false;
        setSaveErrorIntent({ state: "OPEN", completesFlow: true });
        return false;
      }
    },
    [
      createMutation,
      draftIdRef,
      draftStorageKey,
      editQuestId,
      imageUploadMutation,
      publishMutation,
      publishedQuestRef,
      saveRequestRef,
      setSaveErrorIntent,
    ]
  );

  const refreshPublishCheck = useCallback(async () => {
    if (!enabled || !draftHydrated || !draftStorageKey) return;
    const requestId = ++publishCheckRequestRef.current;
    setIsCheckingPublish(true);
    try {
      const normalizedDraft = {
        ...draft,
        headcount: getHeadcountForParticipation(
          draft.participation,
          draft.headcount
        ),
      };
      const existing = publishedQuestRef.current;
      let questId = existing?.questId ?? editQuestId;
      if (questId) {
        if (
          existing &&
          existing.questId === questId &&
          draftChangedRef.current &&
          existing.version != null
        ) {
          const edited = await editMutation.mutateAsync({
            questId,
            version: existing.version,
            payload: toQuestV2Payload(normalizedDraft),
          });
          if (requestId !== publishCheckRequestRef.current) return;
          publishedQuestRef.current = { ...existing, version: edited.version };
        }
      } else {
        const createIdempotencyKey = createQuestIdempotencyKey();
        const created = await createMutation.mutateAsync({
          payload: toQuestV2Payload(normalizedDraft),
          idempotencyKey: createIdempotencyKey,
        });
        if (requestId !== publishCheckRequestRef.current) return;
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
        publishedQuestRef.current = {
          questId,
          version: created.version,
          storageKey: draftStorageKey,
          editQuestId,
          createIdempotencyKey,
        };
      }

      const check = await liveQuestService.getPublishCheck(questId);
      if (requestId !== publishCheckRequestRef.current) return;
      setPublishCheck(adaptV2PublishCheck(check));
    } catch {
      if (requestId !== publishCheckRequestRef.current) return;
      setPublishCheck(getQuestPublishCheck(draft));
    } finally {
      if (requestId === publishCheckRequestRef.current)
        setIsCheckingPublish(false);
    }
  }, [
    draft,
    draftChangedRef,
    draftHydrated,
    draftStorageKey,
    editMutation,
    editQuestId,
    enabled,
    imageUploadMutation,
    publishedQuestRef,
    createMutation,
  ]);

  useEffect(() => {
    if (!enabled || step !== 3 || !draftHydrated || completedState) return;
    const timer = setTimeout(() => {
      void refreshPublishCheck();
    }, 0);
    return () => clearTimeout(timer);
  }, [completedState, draftHydrated, enabled, refreshPublishCheck, step]);

  const publishPending =
    createMutation.isPending ||
    imageUploadMutation.isPending ||
    publishMutation.isPending;
  const publishError =
    publishMutation.error ?? createMutation.error ?? imageUploadMutation.error;

  return {
    publishCheck,
    setPublishCheck,
    walletBalances: walletQuery.data ?? null,
    isCheckingPublish,
    publishQuest,
    refreshPublishCheck,
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
      imageUploadMutation.reset();
      publishMutation.reset();
    },
  };
}
