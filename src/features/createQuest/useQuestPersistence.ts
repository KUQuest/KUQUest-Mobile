import { useMutation } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Dispatch, RefObject, SetStateAction } from "react";

import {
  createQuestDraftId,
  getQuestDraftStorageKey,
  loadQuestDraft,
  persistQuestDraft,
} from "./createQuestPersistence";
import {
  getHeadcountForParticipation,
  type QuestDraft,
} from "./createQuestModel";
import type {
  CompletionState,
  SaveErrorIntent,
  Step,
} from "./createQuestTypes";

export interface PublishedQuestRefValue {
  questId: string;
  version?: number;
  storageKey: string;
  editQuestId?: string;
  createIdempotencyKey?: string;
  publishIdempotencyKey?: string;
}

export function useQuestPersistence({
  editQuestId,
  step,
  completedState,
  draft,
  draftChangedRef,
  publishedQuestRef,
  setDraft,
  setStep,
  setCompletedState,
  enabled = true,
}: {
  editQuestId?: string;
  step: Step;
  completedState: CompletionState | null;
  draft: QuestDraft;
  draftChangedRef: RefObject<boolean>;
  publishedQuestRef: RefObject<PublishedQuestRefValue | null>;
  setDraft: Dispatch<SetStateAction<QuestDraft>>;
  setStep: Dispatch<SetStateAction<Step>>;
  setCompletedState: Dispatch<SetStateAction<CompletionState | null>>;
  enabled?: boolean;
}) {
  const draftIdRef = useRef<string | null>(editQuestId ?? null);
  const [loadState, setLoadState] = useState<{
    storageKey: string | null;
    hydrated: boolean;
    error: boolean;
  }>({ storageKey: null, hydrated: false, error: false });
  const draftHydrated = loadState.hydrated;
  const draftStorageKey = loadState.storageKey;
  const draftLoadError = loadState.error;
  const [saveErrorIntent, setSaveErrorIntent] =
    useState<SaveErrorIntent | null>(null);
  const skipPersistRef = useRef(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveRequestRef = useRef(0);
  const saveMutation = useMutation<
    void,
    Error,
    {
      draftId: string;
      draft: QuestDraft;
      state: CompletionState;
      step: Step;
    }
  >({
    mutationFn: async ({
      draftId,
      draft: draftToSave,
      state,
      step: saveStep,
    }) => {
      if (!draftStorageKey) {
        throw new Error("The Quest draft is not ready to be saved.");
      }
      await persistQuestDraft(
        draftStorageKey,
        draftId,
        draftToSave,
        saveStep,
        state
      );
    },
  });

  const [loadAttempt, setLoadAttempt] = useState(0);

  useEffect(() => {
    if (!enabled) return undefined;

    let active = true;
    publishedQuestRef.current = null;
    draftChangedRef.current = false;
    skipPersistRef.current = true;
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }

    void (async () => {
      try {
        const storageKey = await getQuestDraftStorageKey();
        const snapshot = await loadQuestDraft(
          storageKey,
          draftIdRef.current ?? undefined
        );
        if (!active) return;
        if (snapshot && !draftChangedRef.current) {
          setDraft({
            ...snapshot.draft,
            headcount: getHeadcountForParticipation(
              snapshot.draft.participation,
              snapshot.draft.headcount
            ),
          });
          setStep(snapshot.step);
          setCompletedState(snapshot.state === "OPEN" ? "OPEN" : null);
        }
        setLoadState({ storageKey, hydrated: true, error: false });
      } catch {
        if (!active) return;
        skipPersistRef.current = false;
        setLoadState({ storageKey: null, hydrated: false, error: true });
      }
    })();

    return () => {
      active = false;
    };
  }, [
    draftChangedRef,
    editQuestId,
    enabled,
    loadAttempt,
    publishedQuestRef,
    setCompletedState,
    setDraft,
    setStep,
  ]);

  const saveDraft = useCallback(
    async (
      draftToSave: QuestDraft,
      state: CompletionState = "DRAFT",
      completesFlow = false
    ): Promise<boolean> => {
      const requestId = ++saveRequestRef.current;
      saveMutation.reset();
      setSaveErrorIntent(null);
      const activeDraftId = draftIdRef.current ?? createQuestDraftId();
      draftIdRef.current = activeDraftId;
      const normalizedDraft = {
        ...draftToSave,
        headcount: getHeadcountForParticipation(
          draftToSave.participation,
          draftToSave.headcount
        ),
      };
      try {
        await saveMutation.mutateAsync({
          draftId: activeDraftId,
          draft: normalizedDraft,
          state,
          step,
        });
        if (requestId !== saveRequestRef.current) return false;
        setSaveErrorIntent(null);
        return true;
      } catch {
        if (requestId !== saveRequestRef.current) return false;
        setSaveErrorIntent({ state, completesFlow });
        return false;
      }
    },
    [saveMutation, setSaveErrorIntent, step]
  );

  useEffect(() => {
    if (!enabled || !draftHydrated || !draftStorageKey || completedState)
      return undefined;
    if (skipPersistRef.current) {
      skipPersistRef.current = false;
      return undefined;
    }

    clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveTimerRef.current = null;
      void saveDraft(draft);
    }, 400);

    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }
    };
  }, [
    completedState,
    draft,
    draftHydrated,
    draftStorageKey,
    enabled,
    saveDraft,
    step,
  ]);

  const retryDraftLoad = useCallback(() => {
    setLoadAttempt((value) => value + 1);
  }, []);
  const cancelPendingSave = useCallback(() => {
    if (!saveTimerRef.current) return;
    clearTimeout(saveTimerRef.current);
    saveTimerRef.current = null;
  }, []);

  const prepareDraftReset = useCallback(() => {
    cancelPendingSave();
    saveRequestRef.current += 1;
    skipPersistRef.current = true;
    const draftId = draftIdRef.current;
    draftIdRef.current = null;
    return draftId;
  }, [cancelPendingSave]);

  const saveState = saveMutation.isPending
    ? "saving"
    : saveMutation.isSuccess
      ? "saved"
      : saveMutation.isError
        ? "error"
        : "idle";
  const saveErrorMessage = saveMutation.error?.message ?? null;
  const savingAction = saveMutation.isPending
    ? (saveMutation.variables?.state ?? null)
    : null;

  return {
    draftIdRef,
    draftHydrated,
    draftStorageKey,
    draftLoadError,
    retryDraftLoad,
    saveState,
    saveErrorIntent,
    setSaveErrorIntent,
    saveErrorMessage,
    savingAction,
    skipPersistRef,
    saveTimerRef,
    saveRequestRef,
    saveDraft,
    cancelPendingSave,
    prepareDraftReset,
    resetSaveState: saveMutation.reset,
  };
}
