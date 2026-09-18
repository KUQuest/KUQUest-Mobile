import { useCallback, useEffect, useRef, useState } from "react";
import type { Dispatch, RefObject, SetStateAction } from "react";

import { createQuestIdempotencyKey, questApi } from "@/api/QuestApi";
import type { QuestV2Image } from "@/api/questV2Contracts";

import {
  getHeadcountForParticipation,
  questDetailToDraft,
  toQuestV2Payload,
  type QuestDraft,
} from "./createQuestModel";
import type { CompletionState, SaveState, Step } from "./createQuestTypes";

export interface UseQuestEditOptions {
  questId?: string;
  draftChangedRef: RefObject<boolean>;
  setDraft: Dispatch<SetStateAction<QuestDraft>>;
  setStep: Dispatch<SetStateAction<Step>>;
}

export function useQuestEdit({
  questId,
  draftChangedRef,
  setDraft,
  setStep,
}: UseQuestEditOptions) {
  const [draftHydrated, setDraftHydrated] = useState(false);
  const [draftLoadError, setDraftLoadError] = useState(false);
  const [draftLoadAttempt, setDraftLoadAttempt] = useState(0);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [saveErrorMessage, setSaveErrorMessage] = useState<string | null>(null);
  const [savingAction, setSavingAction] = useState<CompletionState | null>(
    null
  );
  const versionRef = useRef<number | null>(null);
  const existingImagesRef = useRef<QuestV2Image[]>([]);
  const saveRequestRef = useRef(0);

  const loadQuest = useCallback(async () => {
    if (!questId) return;

    setDraftHydrated(false);
    setDraftLoadError(false);
    draftChangedRef.current = false;

    try {
      const detail = await questApi.getDetail(questId);
      versionRef.current = detail.version;
      existingImagesRef.current = detail.images
        .slice()
        .sort((left, right) => left.position - right.position);
      setDraft(questDetailToDraft(detail));
      setStep(1);
      setDraftHydrated(true);
    } catch {
      setDraftLoadError(true);
      setDraftHydrated(false);
    }
  }, [draftChangedRef, questId, setDraft, setStep]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadQuest();
    }, 0);
    return () => clearTimeout(timer);
  }, [draftLoadAttempt, loadQuest]);

  const retryDraftLoad = useCallback(() => {
    setDraftLoadError(false);
    setDraftHydrated(false);
    setDraftLoadAttempt((attempt) => attempt + 1);
  }, []);

  const syncImages = useCallback(
    async (imageUris: string[]): Promise<QuestV2Image[]> => {
      if (!questId) return [];

      let gallery = existingImagesRef.current;
      const originalUrls = new Set(gallery.map((image) => image.url));
      const desiredRemoteUrls = new Set(
        imageUris.filter((uri) => originalUrls.has(uri))
      );
      const removedImages = gallery.filter(
        (image) => !desiredRemoteUrls.has(image.url)
      );

      for (const image of removedImages) {
        gallery = await questApi.deleteQuestImage(
          questId,
          image.imageId,
          createQuestIdempotencyKey()
        );
        existingImagesRef.current = gallery;
      }

      const localUris = imageUris.filter((uri) => !originalUrls.has(uri));
      if (localUris.length > 0) {
        gallery = await questApi.uploadQuestImages(
          questId,
          localUris.map((uri) => ({ uri })),
          createQuestIdempotencyKey()
        );
        existingImagesRef.current = gallery;
      }

      return gallery;
    },
    [questId]
  );

  const saveDraft = useCallback(
    async (
      draftToSave: QuestDraft,
      state: CompletionState = "DRAFT",
      _completesFlow = false
    ): Promise<boolean> => {
      const requestId = ++saveRequestRef.current;
      setSaveState("saving");
      setSavingAction(state);
      setSaveErrorMessage(null);

      const version = versionRef.current;
      if (!questId || version === null) {
        setSaveState("error");
        setSaveErrorMessage("The Quest is not ready to be saved.");
        setSavingAction(null);
        return false;
      }

      try {
        const normalizedDraft = {
          ...draftToSave,
          headcount: getHeadcountForParticipation(
            draftToSave.participation,
            draftToSave.headcount
          ),
        };
        const updated = await questApi.editQuest(
          questId,
          version,
          toQuestV2Payload(normalizedDraft),
          createQuestIdempotencyKey()
        );
        const gallery = await syncImages(normalizedDraft.imageUris);
        if (requestId !== saveRequestRef.current) return false;

        versionRef.current = updated.version;
        setDraft((current) => ({
          ...current,
          imageUris: gallery.map((image) => image.url),
        }));
        setSaveState("saved");
        setSaveErrorMessage(null);
        setSavingAction(null);
        return true;
      } catch (error) {
        if (requestId !== saveRequestRef.current) return false;
        setSaveState("error");
        setSaveErrorMessage(
          error instanceof Error ? error.message : "Unable to save the Quest."
        );
        setSavingAction(null);
        return false;
      }
    },
    [questId, setDraft, syncImages]
  );

  return {
    draftHydrated,
    draftLoadError,
    retryDraftLoad,
    saveState,
    setSaveState,
    saveErrorMessage,
    setSaveErrorMessage,
    savingAction,
    setSavingAction,
    saveDraft,
  };
}
