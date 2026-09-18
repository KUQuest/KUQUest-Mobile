import { useCallback, useEffect, useRef, useState } from "react";
import type { Dispatch, RefObject, SetStateAction } from "react";

import { createQuestIdempotencyKey } from "@/api/QuestApi";
import { walletApi, type WalletBalances } from "@/api/WalletApi";
import { useLocale } from "@/features/preferences/localeStore";
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
  SaveState,
  Step,
} from "./createQuestTypes";
import type { QuestPublishCheck } from "../questBoard/types";
import { liveQuestService } from "../questBoard/liveQuestService";
import type { PublishedQuestRefValue } from "./useQuestPersistence";

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
  setSaveState,
  setSaveErrorIntent,
  setSaveErrorMessage,
  setSavingAction,
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
  setSaveState: Dispatch<SetStateAction<SaveState>>;
  setSaveErrorIntent: Dispatch<SetStateAction<SaveErrorIntent | null>>;
  setSaveErrorMessage: Dispatch<SetStateAction<string | null>>;
  setSavingAction: Dispatch<SetStateAction<CompletionState | null>>;
  enabled?: boolean;
}) {
  const { locale } = useLocale();
  const [publishCheck, setPublishCheck] = useState<QuestPublishCheck | null>(
    null
  );
  const [walletBalances, setWalletBalances] = useState<WalletBalances | null>(
    null
  );
  const [isCheckingPublish, setIsCheckingPublish] = useState(false);
  const publishCheckRequestRef = useRef(0);

  const publishQuest = useCallback(
    async (draftToPublish: QuestDraft): Promise<boolean> => {
      const requestId = ++saveRequestRef.current;
      setSaveState("saving");
      setSavingAction("OPEN");
      setSaveErrorIntent(null);
      setSaveErrorMessage(null);
      try {
        if (!draftStorageKey) {
          setSaveState("error");
          setSaveErrorIntent({ state: "OPEN", completesFlow: true });
          setSavingAction(null);
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
          const created = await liveQuestService.createQuest(
            toQuestV2Payload(normalizedDraft),
            createIdempotencyKey
          );
          publishedQuestId = created.id;
          if (
            normalizedDraft.imageUris &&
            normalizedDraft.imageUris.length > 0
          ) {
            try {
              await liveQuestService.uploadImages(
                publishedQuestId,
                normalizedDraft.imageUris
              );
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

        const published = await liveQuestService.publishQuest(
          publishedQuestId,
          publishIdempotencyKey
        );
        if (published.state !== "QUEST_OPEN") {
          throw new Error("The server did not open the Quest.");
        }

        if (!publishedQuestId) {
          throw new Error("The Quest could not be published.");
        }

        const activeDraftId = draftIdRef.current;
        if (activeDraftId)
          await deleteQuestDraft(draftStorageKey, activeDraftId);
        if (requestId !== saveRequestRef.current) return false;
        publishedQuestRef.current = null;
        setSaveState("saved");
        setSaveErrorIntent(null);
        setSaveErrorMessage(null);
        setSavingAction(null);
        return true;
      } catch (error) {
        if (requestId !== saveRequestRef.current) return false;
        setSaveState("error");
        const errorCode = (error as { code?: unknown } | null)?.code;
        setSaveErrorMessage(
          typeof errorCode === "string" && errorCode
            ? getQuestApiErrorMessage(errorCode, locale)
            : error instanceof Error
              ? error.message
              : "Unable to publish the Quest."
        );
        setSaveErrorIntent({ state: "OPEN", completesFlow: true });
        setSavingAction(null);
        return false;
      }
    },
    [
      draftIdRef,
      draftStorageKey,
      editQuestId,
      locale,
      publishedQuestRef,
      saveRequestRef,
      setSaveErrorIntent,
      setSaveErrorMessage,
      setSavingAction,
      setSaveState,
    ]
  );
  const refreshPublishCheck = useCallback(async () => {
    if (!enabled || !draftHydrated || !draftStorageKey) return;
    const requestId = ++publishCheckRequestRef.current;
    setIsCheckingPublish(true);
    try {
      try {
        setWalletBalances(await walletApi.getWallet());
      } catch {
        setWalletBalances(null);
      }

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
          const edited = await liveQuestService.editQuest(
            questId,
            existing.version,
            toQuestV2Payload(normalizedDraft)
          );
          if (requestId !== publishCheckRequestRef.current) return;
          publishedQuestRef.current = { ...existing, version: edited.version };
        }
      } else {
        const createIdempotencyKey = createQuestIdempotencyKey();
        const created = await liveQuestService.createQuest(
          toQuestV2Payload(normalizedDraft),
          createIdempotencyKey
        );
        if (requestId !== publishCheckRequestRef.current) return;
        questId = created.id;
        if (normalizedDraft.imageUris && normalizedDraft.imageUris.length > 0) {
          try {
            await liveQuestService.uploadImages(
              questId,
              normalizedDraft.imageUris
            );
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
      // Prototype/offline mode: fall back to the local publish check.
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
    editQuestId,
    enabled,
    publishedQuestRef,
  ]);

  useEffect(() => {
    if (!enabled || step !== 3 || !draftHydrated || completedState) return;
    const timer = setTimeout(() => {
      void refreshPublishCheck();
    }, 0);
    return () => clearTimeout(timer);
  }, [completedState, draftHydrated, enabled, refreshPublishCheck, step]);

  return {
    publishCheck,
    setPublishCheck,
    walletBalances,
    isCheckingPublish,
    publishQuest,
    refreshPublishCheck,
  };
}
