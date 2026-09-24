import { useMutation } from "@tanstack/react-query";
import { useCallback, useEffect, useRef } from "react";
import type { Dispatch, RefObject, SetStateAction } from "react";

import { createQuestIdempotencyKey, questApi } from "@/api/QuestApi";
import type { QuestV2Image } from "@/api/questV2Contracts";
import { QuestStatus } from "@/domain/questLifecycle";
import { useLocale } from "@/features/preferences/localeStore";
import { createQuestMessages } from "@/locales/createQuestMessages";

import {
  useCancelQuestMutation,
  useDeleteQuestImageMutation,
  useEditQuestMutation,
  usePublishQuestMutation,
  useQuestDetailQuery,
  useUploadQuestImagesMutation,
} from "../api/createQuestQueries";
import {
  getHeadcountForParticipation,
  type QuestDraft,
} from "../domain/createQuestModel";
import {
  questDetailToDraft,
  toQuestV2Payload,
} from "../api/createQuestApiAdapter";
import type {
  CompletionState,
  SaveErrorIntent,
  Step,
} from "../createQuestTypes";
import { getPublishErrorMessage } from "../publish/useQuestPublish";

export interface UseQuestEditOptions {
  questId?: string;
  draftChangedRef: RefObject<boolean>;
  setDraft: Dispatch<SetStateAction<QuestDraft>>;
  setStep: Dispatch<SetStateAction<Step>>;
}

export type CancelQuestResult = { ok: true } | { ok: false; message: string };

type SaveVariables = {
  draft: QuestDraft;
  state: CompletionState;
  idempotencyKey: string;
};

export function useQuestEdit({
  questId,
  draftChangedRef,
  setDraft,
  setStep,
}: UseQuestEditOptions) {
  const { locale } = useLocale();
  const versionRef = useRef<number | null>(null);
  // Reused until publish succeeds so a retried publish replays, not duplicates.
  const publishKeyRef = useRef<string | null>(null);
  const existingImagesRef = useRef<QuestV2Image[]>([]);
  const detailQuery = useQuestDetailQuery(questId);
  const deleteImageMutation = useDeleteQuestImageMutation();
  const uploadImagesMutation = useUploadQuestImagesMutation();
  const editMutation = useEditQuestMutation();
  const cancelMutation = useCancelQuestMutation();
  const publishMutation = usePublishQuestMutation();

  useEffect(() => {
    if (!questId) return;
    draftChangedRef.current = false;
    // A save refetches the detail; hydrating a version this screen already
    // holds would reset the wizard to step 1 mid-flow (e.g. after a publish
    // blocker). Only a newer server version replaces the local draft.
    if (!detailQuery.data || detailQuery.data.version === versionRef.current) {
      return;
    }
    versionRef.current = detailQuery.data.version;
    existingImagesRef.current = detailQuery.data.images
      .slice()
      .sort((left, right) => left.position - right.position);
    setDraft(questDetailToDraft(detailQuery.data));
    setStep(1);
  }, [detailQuery.data, draftChangedRef, questId, setDraft, setStep]);

  const draftHydrated =
    Boolean(questId) && Boolean(detailQuery.data) && !detailQuery.isFetching;

  const retryDraftLoad = useCallback(() => {
    void detailQuery.refetch();
  }, [detailQuery]);

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
        gallery = await deleteImageMutation.mutateAsync({
          questId,
          imageId: image.imageId,
          idempotencyKey: createQuestIdempotencyKey(),
        });
        existingImagesRef.current = gallery;
      }

      const localUris = imageUris.filter((uri) => !originalUrls.has(uri));
      if (localUris.length > 0) {
        gallery = await uploadImagesMutation.mutateAsync({
          questId,
          assets: localUris.map((uri) => ({ uri })),
          idempotencyKey: createQuestIdempotencyKey(),
        });
        existingImagesRef.current = gallery;
      }

      return gallery;
    },
    [deleteImageMutation, questId, uploadImagesMutation]
  );

  const saveMutation = useMutation({
    mutationFn: async ({
      draft: draftToSave,
      state,
      idempotencyKey,
    }: SaveVariables) => {
      if (!questId || versionRef.current === null) {
        throw new Error("The Quest is not ready to be saved.");
      }
      const normalizedDraft = {
        ...draftToSave,
        headcount: getHeadcountForParticipation(
          draftToSave.participation,
          draftToSave.headcount
        ),
      };
      const updated = await editMutation.mutateAsync({
        questId,
        version: versionRef.current,
        payload: toQuestV2Payload(normalizedDraft),
        idempotencyKey,
      });
      versionRef.current = updated.version;
      const gallery = await syncImages(normalizedDraft.imageUris);
      if (state === "OPEN") {
        const messages = createQuestMessages[locale];
        const check = await questApi.getPublishCheck(questId);
        if (!check.canPublish) {
          const [blocker] = check.blockingReasons;
          throw Object.assign(
            new Error(blocker?.message ?? messages.publishCheckBlocked),
            { code: blocker?.code }
          );
        }
        publishKeyRef.current ??= createQuestIdempotencyKey();
        const published = await publishMutation.mutateAsync({
          questId,
          idempotencyKey: publishKeyRef.current,
        });
        if (published.state !== QuestStatus.QUEST_OPEN) {
          throw new Error(messages.publishError);
        }
        publishKeyRef.current = null;
      }
      return { gallery, state };
    },
  });

  const saveDraft = useCallback(
    async (
      draftToSave: QuestDraft,
      state: CompletionState = "DRAFT",
      _completesFlow = false
    ): Promise<boolean> => {
      try {
        const result = await saveMutation.mutateAsync({
          draft: draftToSave,
          state,
          idempotencyKey: createQuestIdempotencyKey(),
        });
        setDraft((current) => ({
          ...current,
          imageUris: result.gallery.map((image) => image.url),
        }));
        return true;
      } catch {
        return false;
      }
    },
    [saveMutation, setDraft]
  );
  // Stable identity: the commit hook memoizes on it.
  const publishQuest = useCallback(
    (draftToPublish: QuestDraft) => saveDraft(draftToPublish, "OPEN"),
    [saveDraft]
  );

  const cancelQuest = useCallback(async (): Promise<CancelQuestResult> => {
    if (!questId) {
      return { ok: false, message: "The Quest ID is missing." };
    }

    try {
      await cancelMutation.mutateAsync({
        questId,
        idempotencyKey: createQuestIdempotencyKey(),
      });
      return { ok: true };
    } catch (error) {
      return {
        ok: false,
        message:
          error instanceof Error
            ? error.message
            : "Unable to cancel the Quest.",
      };
    }
  }, [cancelMutation, questId]);

  const saveState = saveMutation.isPending
    ? "saving"
    : saveMutation.isSuccess
      ? "saved"
      : saveMutation.isError
        ? "error"
        : "idle";
  const failedState = saveMutation.isError
    ? (saveMutation.variables?.state ?? null)
    : null;
  const saveErrorIntent: SaveErrorIntent | null = failedState
    ? { state: failedState, completesFlow: true }
    : null;

  return {
    draftHydrated,
    draftLoadError: Boolean(detailQuery.error),
    retryDraftLoad,
    isDraft: detailQuery.data?.state === QuestStatus.QUEST_DRAFT,
    saveState,
    saveErrorIntent,
    saveErrorMessage:
      saveMutation.error && failedState === "OPEN"
        ? getPublishErrorMessage(saveMutation.error, locale)
        : (saveMutation.error?.message ?? null),
    savingAction: saveMutation.isPending
      ? (saveMutation.variables?.state ?? null)
      : null,
    cancelState: cancelMutation.isPending
      ? "cancelling"
      : cancelMutation.isError
        ? "error"
        : "idle",
    cancelQuest,
    publishQuest,
    saveDraft,
    resetSaveState: saveMutation.reset,
  };
}
