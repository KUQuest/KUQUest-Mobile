import { useMutation } from "@tanstack/react-query";
import { useCallback, useEffect, useRef } from "react";
import type { Dispatch, RefObject, SetStateAction } from "react";

import { createQuestIdempotencyKey } from "@/api/QuestApi";
import type { QuestV2Image } from "@/api/questV2Contracts";

import {
  useCancelQuestMutation,
  useDeleteQuestImageMutation,
  useEditQuestMutation,
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
import type { CompletionState, Step } from "../createQuestTypes";

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
  const versionRef = useRef<number | null>(null);
  const existingImagesRef = useRef<QuestV2Image[]>([]);
  const detailQuery = useQuestDetailQuery(questId);
  const deleteImageMutation = useDeleteQuestImageMutation();
  const uploadImagesMutation = useUploadQuestImagesMutation();
  const editMutation = useEditQuestMutation();
  const cancelMutation = useCancelQuestMutation();

  useEffect(() => {
    if (!questId) return;
    draftChangedRef.current = false;
    if (!detailQuery.data) return;
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
      const gallery = await syncImages(normalizedDraft.imageUris);
      return { updated, gallery, state };
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
        versionRef.current = result.updated.version;
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

  return {
    draftHydrated,
    draftLoadError: Boolean(detailQuery.error),
    retryDraftLoad,
    saveState,
    saveErrorMessage: saveMutation.error?.message ?? null,
    savingAction: saveMutation.isPending
      ? (saveMutation.variables?.state ?? null)
      : null,
    cancelState: cancelMutation.isPending
      ? "cancelling"
      : cancelMutation.isError
        ? "error"
        : "idle",
    cancelQuest,
    saveDraft,
    resetSaveState: saveMutation.reset,
  };
}
