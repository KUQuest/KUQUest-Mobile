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
  type StoredQuestDraft,
} from "../domain/createQuestModel";
import type {
  CompletionState,
  SaveErrorIntent,
  Step,
} from "../createQuestTypes";

type Publication = Partial<
  Pick<
    StoredQuestDraft,
    "serverQuestId" | "createIdempotencyKey" | "publishIdempotencyKey"
  >
>;

export interface PublishedQuestRefValue {
  questId: string;
  version?: number;
  storageKey: string;
  editQuestId?: string;
  publishIdempotencyKey?: string;
}

export function useQuestPersistence({
  editQuestId,
  step,
  draftChangedRef,
  draftRevisionRef,
  setDraft,
  setStep,
  setCompletedState,
  enabled = true,
}: {
  editQuestId?: string;
  step: Step;
  draftChangedRef: RefObject<boolean>;
  draftRevisionRef: RefObject<number>;
  setDraft: Dispatch<SetStateAction<QuestDraft>>;
  setStep: Dispatch<SetStateAction<Step>>;
  setCompletedState: Dispatch<SetStateAction<CompletionState | null>>;
  enabled?: boolean;
}) {
  const latestRef = useRef<{
    draft: QuestDraft;
    step: Step;
    state: CompletionState;
  } | null>(null);
  const publicationRef = useRef<Publication>({});
  const [publication, setPublication] = useState<Publication>({});
  const writeChainRef = useRef<Promise<void>>(Promise.resolve());
  const enqueueWrite = useCallback((write: () => Promise<void>) => {
    const queued = writeChainRef.current.catch(() => undefined).then(write);
    writeChainRef.current = queued;
    return queued;
  }, []);
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
      await enqueueWrite(() =>
        persistQuestDraft(
          draftStorageKey,
          draftId,
          draftToSave,
          saveStep,
          state,
          publicationRef.current
        )
      );
    },
  });

  const [loadAttempt, setLoadAttempt] = useState(0);

  useEffect(() => {
    if (!enabled) return undefined;

    let active = true;
    draftChangedRef.current = false;

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
        if (snapshot) {
          latestRef.current = {
            draft: snapshot.draft,
            step: snapshot.step,
            state: snapshot.state,
          };
          publicationRef.current = {
            serverQuestId: snapshot.serverQuestId,
            createIdempotencyKey: snapshot.createIdempotencyKey,
            publishIdempotencyKey: snapshot.publishIdempotencyKey,
          };
          setPublication(publicationRef.current);
        }
        setLoadState({ storageKey, hydrated: true, error: false });
      } catch {
        if (!active) return;
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
    setCompletedState,
    setDraft,
    setStep,
  ]);

  const saveDraft = useCallback(
    async (
      draftToSave: QuestDraft,
      state: CompletionState = "DRAFT",
      completesFlow = false,
      stepOverride?: Step
    ): Promise<boolean> => {
      const requestId = ++saveRequestRef.current;
      const revisionAtStart = draftRevisionRef.current;
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
      const saveStep = stepOverride ?? step;
      latestRef.current = { draft: normalizedDraft, step: saveStep, state };
      try {
        await saveMutation.mutateAsync({
          draftId: activeDraftId,
          draft: normalizedDraft,
          state,
          step: saveStep,
        });
        if (requestId !== saveRequestRef.current) return false;
        if (draftRevisionRef.current === revisionAtStart) {
          draftChangedRef.current = false;
        }
        setSaveErrorIntent(null);
        return true;
      } catch {
        if (requestId !== saveRequestRef.current) return false;
        setSaveErrorIntent({ state, completesFlow });
        return false;
      }
    },
    [draftChangedRef, draftRevisionRef, saveMutation, setSaveErrorIntent, step]
  );

  const persistPublication = useCallback(
    async (patch: Publication): Promise<void> => {
      const latest = latestRef.current;
      const activeDraftId = draftIdRef.current;
      if (!draftStorageKey || !activeDraftId || !latest) {
        throw new Error("The Quest draft is not ready to be saved.");
      }
      const publication = { ...publicationRef.current, ...patch };
      publicationRef.current = publication;
      setPublication(publication);
      await enqueueWrite(() =>
        persistQuestDraft(
          draftStorageKey,
          activeDraftId,
          latest.draft,
          latest.step,
          latest.state,
          publication
        )
      );
    },
    [draftStorageKey, enqueueWrite]
  );

  const retryDraftLoad = useCallback(() => {
    setLoadAttempt((value) => value + 1);
  }, []);

  const prepareDraftReset = useCallback(() => {
    saveRequestRef.current += 1;
    const draftId = draftIdRef.current;
    draftIdRef.current = null;
    latestRef.current = null;
    publicationRef.current = {};
    setPublication({});
    return draftId;
  }, []);

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
    saveRequestRef,
    saveDraft,
    publication,
    persistPublication,

    prepareDraftReset,
    resetSaveState: saveMutation.reset,
  };
}
