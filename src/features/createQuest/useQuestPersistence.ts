import { useCallback, useEffect, useRef, useState } from "react";
import type { Dispatch, MutableRefObject, SetStateAction } from "react";

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
  SaveState,
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
}: {
  editQuestId?: string;
  step: Step;
  completedState: CompletionState | null;
  draft: QuestDraft;
  draftChangedRef: MutableRefObject<boolean>;
  publishedQuestRef: MutableRefObject<PublishedQuestRefValue | null>;
  setDraft: Dispatch<SetStateAction<QuestDraft>>;
  setStep: Dispatch<SetStateAction<Step>>;
  setCompletedState: Dispatch<SetStateAction<CompletionState | null>>;
}) {
  const draftIdRef = useRef<string | null>(editQuestId ?? null);
  const [draftHydrated, setDraftHydrated] = useState(false);
  const [draftStorageKey, setDraftStorageKey] = useState<string | null>(null);
  const [draftLoadAttempt, setDraftLoadAttempt] = useState(0);
  const [draftLoadError, setDraftLoadError] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [saveErrorIntent, setSaveErrorIntent] =
    useState<SaveErrorIntent | null>(null);
  const [saveErrorMessage, setSaveErrorMessage] = useState<string | null>(null);
  const [savingAction, setSavingAction] = useState<CompletionState | null>(
    null
  );
  const skipPersistRef = useRef(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveRequestRef = useRef(0);

  const saveDraft = useCallback(
    async (
      draftToSave: QuestDraft,
      state: CompletionState = "DRAFT",
      completesFlow = false
    ): Promise<boolean> => {
      const requestId = ++saveRequestRef.current;
      setSaveState("saving");
      setSavingAction(state);
      setSaveErrorIntent(null);
      setSaveErrorMessage(null);
      try {
        if (!draftStorageKey) {
          setSaveState("error");
          setSaveErrorIntent({ state, completesFlow });
          setSavingAction(null);
          return false;
        }
        const activeDraftId = draftIdRef.current ?? createQuestDraftId();
        draftIdRef.current = activeDraftId;
        const normalizedDraft = {
          ...draftToSave,
          headcount: getHeadcountForParticipation(
            draftToSave.participation,
            draftToSave.headcount
          ),
        };
        await persistQuestDraft(
          draftStorageKey,
          activeDraftId,
          normalizedDraft,
          step,
          state
        );
        if (requestId !== saveRequestRef.current) return false;
        setSaveState("saved");
        setSaveErrorIntent(null);
        setSavingAction(null);
        return true;
      } catch (error) {
        if (requestId !== saveRequestRef.current) return false;
        setSaveState("error");
        setSaveErrorMessage(
          error instanceof Error
            ? error.message
            : "Unable to save the Quest draft."
        );
        setSaveErrorIntent({ state, completesFlow });
        setSavingAction(null);
        return false;
      }
    },
    [draftStorageKey, step]
  );

  useEffect(() => {
    let active = true;
    publishedQuestRef.current = null;
    draftChangedRef.current = false;
    skipPersistRef.current = true;
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }

    void (async () => {
      setDraftHydrated(false);
      setDraftLoadError(false);
      setDraftStorageKey(null);
      try {
        const storageKey = await getQuestDraftStorageKey();
        const snapshot = await loadQuestDraft(
          storageKey,
          draftIdRef.current ?? undefined
        );
        if (!active) return;

        setDraftStorageKey(storageKey);
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
        setDraftHydrated(true);
      } catch {
        if (!active) return;
        skipPersistRef.current = false;
        setDraftLoadError(true);
        setDraftHydrated(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [
    draftChangedRef,
    draftLoadAttempt,
    editQuestId,
    publishedQuestRef,
    setCompletedState,
    setDraft,
    setStep,
  ]);

  useEffect(() => {
    if (!draftHydrated || !draftStorageKey || completedState) return undefined;
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
    saveDraft,
    skipPersistRef,
    step,
  ]);

  const retryDraftLoad = () => {
    setDraftLoadError(false);
    setDraftHydrated(false);
    setDraftLoadAttempt((attempt) => attempt + 1);
  };

  return {
    draftIdRef,
    draftHydrated,
    draftStorageKey,
    draftLoadError,
    retryDraftLoad,
    saveState,
    setSaveState,
    saveErrorIntent,
    setSaveErrorIntent,
    saveErrorMessage,
    setSaveErrorMessage,
    savingAction,
    setSavingAction,
    skipPersistRef,
    saveTimerRef,
    saveRequestRef,
    saveDraft,
  };
}
