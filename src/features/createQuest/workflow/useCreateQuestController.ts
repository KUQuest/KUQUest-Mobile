import { useCallback, useEffect, useMemo, useRef } from "react";
import { AccessibilityInfo, Alert, useWindowDimensions } from "react-native";
import { useNavigation, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useLocale } from "@/features/preferences/localeStore";
import { useWorkerTagsQuery } from "@/features/workerHome/api/workerHomeQueries";
import { createQuestMessages } from "@/locales/createQuestMessages";
import { getCreateQuestLayoutMetrics } from "@/theme/layout";

import {
  getCreateQuestChoiceOptions,
  getCreateQuestCombinationHint,
  getCreateQuestReviewView,
  getCreateQuestTagOptions,
} from "../presentation/createQuestPresentation";
import { deleteQuestDraft } from "../draft/createQuestPersistence";
import {
  getQuestPublishCheck,
  isQuestDraftDirty,
  type QuestDraft,
} from "../domain/createQuestModel";
import { validateCreateQuestStep } from "../presentation/createQuestValidation";
import {
  getInitialCreateQuestStep,
  getNextCreateQuestStep,
  isServerEditMode,
  resolveCreateQuestFlowMode,
} from "./createQuestWorkflow";
import type {
  CompletionState,
  SaveErrorIntent,
  SaveState,
  Step,
} from "../createQuestTypes";
import { LOGISTICS_FIELDS, QUEST_DETAIL_FIELDS } from "../createQuestTypes";
import {
  useQuestPersistence,
  type PublishedQuestRefValue,
} from "../draft/useQuestPersistence";
import { useQuestPublish } from "../publish/useQuestPublish";
import { useQuestEdit } from "../edit/useQuestEdit";
import { useCreateQuestCommit } from "./useCreateQuestCommit";
import { useCreateQuestDraft } from "../draft/useCreateQuestDraft";
import { useCreateQuestWizard } from "./useCreateQuestWizard";

export interface CreateQuestScreenProps {
  editQuestId?: string;
  editMode?: boolean;
}

type DraftUpdater = <K extends keyof QuestDraft>(
  field: K,
  value: QuestDraft[K]
) => void;

export function useCreateQuestController({
  editQuestId,
  editMode = false,
}: CreateQuestScreenProps = {}) {
  const router = useRouter();
  const navigation = useNavigation();
  const { locale } = useLocale();
  const messages = createQuestMessages[locale];
  const { width, fontScale } = useWindowDimensions();
  const layout = getCreateQuestLayoutMetrics(width);
  const insets = useSafeAreaInsets();
  const mode = useMemo(
    () => resolveCreateQuestFlowMode({ editMode, editQuestId }),
    [editMode, editQuestId]
  );
  const publishedQuestRef = useRef<PublishedQuestRefValue | null>(null);
  const allowLeaveRef = useRef(false);
  const unsavedChangesRef = useRef(false);

  const draftState = useCreateQuestDraft();
  const wizard = useCreateQuestWizard({
    initialStep: getInitialCreateQuestStep(mode),
  });
  const {
    draft,
    setDraft,
    errors,
    setErrors,
    validationSummary,
    setValidationSummary,
    draftChangedRef,
    draftRevisionRef,
  } = draftState;
  const {
    step,
    setStep,
    completedState,
    setCompletedState,
    logisticsExpanded,
    setLogisticsExpanded,
    pendingInvalidField,
    setPendingInvalidField,
  } = wizard;

  const localPersistence = useQuestPersistence({
    editQuestId: mode.kind === "local-draft" ? mode.draftId : undefined,
    step,
    draftChangedRef,
    draftRevisionRef,
    setDraft,
    setStep,
    setCompletedState,
    enabled: !isServerEditMode(mode),
  });
  const editState = useQuestEdit({
    questId: isServerEditMode(mode) ? mode.questId : undefined,
    draftChangedRef,
    setDraft,
    setStep,
  });
  const publishState = useQuestPublish({
    editQuestId: mode.kind === "local-draft" ? mode.draftId : undefined,
    step,
    completedState,
    draftHydrated: isServerEditMode(mode)
      ? editState.draftHydrated
      : localPersistence.draftHydrated,
    draftStorageKey: localPersistence.draftStorageKey,
    draft,
    draftIdRef: localPersistence.draftIdRef,
    draftRevisionRef,
    publishedQuestRef,
    saveRequestRef: localPersistence.saveRequestRef,
    setSaveErrorIntent: localPersistence.setSaveErrorIntent,
    enabled: !isServerEditMode(mode),
  });

  const draftHydrated = isServerEditMode(mode)
    ? editState.draftHydrated
    : localPersistence.draftHydrated;
  const draftStorageKey = localPersistence.draftStorageKey;
  const draftLoadError = isServerEditMode(mode)
    ? editState.draftLoadError
    : localPersistence.draftLoadError;
  const retryDraftLoad = isServerEditMode(mode)
    ? editState.retryDraftLoad
    : localPersistence.retryDraftLoad;
  const saveState: SaveState = (
    isServerEditMode(mode)
      ? editState.saveState
      : publishState.saveState !== "idle"
        ? publishState.saveState
        : localPersistence.saveState
  ) as SaveState;
  const saveErrorMessage = isServerEditMode(mode)
    ? editState.saveErrorMessage
    : (publishState.saveErrorMessage ?? localPersistence.saveErrorMessage);
  const savingAction = isServerEditMode(mode)
    ? editState.savingAction
    : (publishState.savingAction ?? localPersistence.savingAction);
  const cancelState = editState.cancelState as "cancelling" | "error" | "idle";
  const saveErrorIntent: SaveErrorIntent | null = isServerEditMode(mode)
    ? editState.saveErrorIntent
    : localPersistence.saveErrorIntent;
  // A server Quest that is still a Draft finishes like a new Quest: Review
  // offers Publish. Published Quests only save changes.
  const publishable = !isServerEditMode(mode) || editState.isDraft;
  const resetSaveState = useCallback(() => {
    localPersistence.resetSaveState();
    publishState.resetSaveState();
    editState.resetSaveState();
  }, [editState, localPersistence, publishState]);

  // Dirty state is mode-relative: a local draft is dirty when it diverges from
  // the blank form; a server edit is dirty only while changes have not reached
  // the server (draftChangedRef clears on load and after a successful save).
  // A completion state means the content is already persisted either way.
  const hasUnsavedChanges = () => {
    if (completedState) return false;
    if (isServerEditMode(mode)) return draftChangedRef.current;
    return isQuestDraftDirty(draft);
  };

  const requestLeaveConfirmation = useCallback(
    (onLeave: () => void) => {
      const serverEdit = isServerEditMode(mode);
      Alert.alert(
        serverEdit ? messages.unsavedTitle : messages.discardTitle,
        serverEdit ? messages.unsavedMessage : messages.discardDescription,
        [
          { text: messages.keepEditing, style: "cancel" },
          { text: messages.discard, style: "destructive", onPress: onLeave },
        ]
      );
    },
    [messages, mode]
  );

  useEffect(() => {
    // A successful server save means nothing is pending, even before the
    // post-save detail refetch lands and re-hydrates the draft.
    if (isServerEditMode(mode) && editState.saveState === "saved") {
      draftChangedRef.current = false;
    }
  }, [draftChangedRef, editState.saveState, mode]);

  useEffect(() => {
    unsavedChangesRef.current = hasUnsavedChanges();
  });

  useEffect(
    () =>
      navigation.addListener("beforeRemove", (event) => {
        // System Back and any other route removal must confirm like the header
        // does; explicit leave (discard/save/cancel) flows arm this once.
        if (!unsavedChangesRef.current || allowLeaveRef.current) {
          allowLeaveRef.current = false;
          return;
        }
        event.preventDefault();
        requestLeaveConfirmation(() => {
          allowLeaveRef.current = true;
          navigation.dispatch(event.data.action);
        });
      }),
    [navigation, requestLeaveConfirmation]
  );

  const workerTagsQuery = useWorkerTagsQuery();
  const liveTags = useMemo(
    () => workerTagsQuery.data ?? [],
    [workerTagsQuery.data]
  );
  const tagOptions = useMemo(
    () => getCreateQuestTagOptions(liveTags, locale),
    [liveTags, locale]
  );
  const { participationOptions, candidateOptions } = useMemo(
    () => getCreateQuestChoiceOptions(messages),
    [messages]
  );

  // Editing the draft only invalidates derived state. It must never reset a save
  // mutation (indicator churn) and it issues no request: nulling the publish-check
  // quest id disables that query.
  const invalidateDraftDerivatives = () => {
    publishState.setPublishCheck(null);
    setValidationSummary(null);
    setPendingInvalidField(null);
  };

  const updateDraft: DraftUpdater = <K extends keyof QuestDraft>(
    field: K,
    value: QuestDraft[K]
  ) => {
    draftState.updateDraft(field, value);
    invalidateDraftDerivatives();
  };

  const updateParticipation = (value: QuestDraft["participation"]) => {
    draftState.updateParticipation(value);
    invalidateDraftDerivatives();
  };

  const validateStep = (currentStep: Step): boolean => {
    const result = validateCreateQuestStep(
      draft,
      currentStep,
      new Date(),
      messages
    );
    setErrors(result.errors);

    if (result.firstErrorField) {
      setValidationSummary(result.summary);
      AccessibilityInfo.announceForAccessibility(result.summary ?? "");
      if (currentStep === 2 && result.firstErrorField in LOGISTICS_FIELDS) {
        setLogisticsExpanded(true);
      }
      if (currentStep !== step) setStep(currentStep);
      setPendingInvalidField(result.firstErrorField);
    } else {
      setValidationSummary(null);
      setPendingInvalidField(null);
    }

    return result.firstErrorField === null;
  };

  // Authoritative double-tap guard: the action bar's `disabled={isSaving}` only
  // applies after a re-render, so a rapid second press would otherwise re-enter.
  const actionInFlightRef = useRef(false);
  const runExclusive = useCallback(async (action: () => Promise<unknown>) => {
    if (actionInFlightRef.current) return;
    actionInFlightRef.current = true;
    try {
      await action();
    } finally {
      actionInFlightRef.current = false;
    }
  }, []);

  const goNext = async () => {
    if (!validateStep(step)) return;
    const targetStep = getNextCreateQuestStep(step);
    if (!targetStep) return;
    if (!isServerEditMode(mode)) {
      const saved = await localPersistence.saveDraft(
        draft,
        "DRAFT",
        false,
        targetStep
      );
      if (!saved) return;
      if (targetStep === 3) await publishState.refreshPublishCheck();
    }
    wizard.advance();
  };

  const goToStep = (targetStep: Step) => {
    wizard.selectPreviousStep(targetStep);
  };

  // Jump back to the step that owns a publish blocker. Local validation wins
  // when it already explains the problem; server-only blockers still land on
  // the owning field.
  const fixPublishBlocker = (field: string) => {
    const targetStep: Step = field in QUEST_DETAIL_FIELDS ? 1 : 2;
    if (!validateStep(targetStep)) return;
    wizard.selectPreviousStep(targetStep);
    if (field in LOGISTICS_FIELDS) setLogisticsExpanded(true);
    setPendingInvalidField(field);
  };

  const reviewPublishCheck =
    publishState.publishCheck ?? getQuestPublishCheck(draft);
  const activeSaveDraft = isServerEditMode(mode)
    ? editState.saveDraft
    : localPersistence.saveDraft;
  const commit = useCreateQuestCommit({
    draft,
    onCompleted: setCompletedState,
    publishCheck: reviewPublishCheck,
    publishQuest: isServerEditMode(mode)
      ? editState.publishQuest
      : publishState.publishQuest,
    saveDraft: activeSaveDraft,
    saveErrorIntent,
  });

  const finishQuest = async (state: CompletionState) => {
    if (!validateStep(2)) return;
    if (state === "OPEN" && !reviewPublishCheck.canPublish) {
      setValidationSummary(messages.publishCheckBlocked);
      return;
    }
    return commit.finish(state);
  };

  const leaveCreateFlow = () => {
    allowLeaveRef.current = true;
    if (isServerEditMode(mode) && mode.questId) {
      router.replace({
        pathname: "/quest/[id]",
        params: { id: mode.questId, mode: "post" },
      });
      return;
    }
    router.replace("/(tabs)");
  };

  const confirmCancel = () => {
    if (!isServerEditMode(mode)) return;
    Alert.alert(messages.cancelQuestTitle, messages.cancelQuestDescription, [
      { text: messages.cancelQuestKeep, style: "cancel" },
      {
        text: messages.cancelQuestConfirm,
        style: "destructive",
        onPress: () => {
          void editState.cancelQuest().then((result) => {
            if (!result.ok) {
              Alert.alert(messages.cancelQuestTitle, result.message);
              return;
            }
            Alert.alert(
              messages.cancelledQuestTitle,
              messages.cancelledQuestDescription,
              [{ text: messages.back, onPress: leaveCreateFlow }]
            );
          });
        },
      },
    ]);
  };

  const showHelp = () =>
    Alert.alert(messages.helpTitle, messages.helpDescription, [
      { text: messages.helpAction },
    ]);

  const goBack = () => {
    setPendingInvalidField(null);
    if (step === 1) {
      if (hasUnsavedChanges()) {
        requestLeaveConfirmation(leaveCreateFlow);
        return;
      }
      leaveCreateFlow();
      return;
    }
    wizard.retreat();
  };

  const resetDraft = async () => {
    const draftId = localPersistence.prepareDraftReset();
    publishedQuestRef.current = null;
    publishState.resetCreateIdempotencyKey();
    draftChangedRef.current = false;
    try {
      if (draftStorageKey && draftId) {
        await deleteQuestDraft(draftStorageKey, draftId);
      }
    } catch {
      localPersistence.setSaveErrorIntent({
        state: "DRAFT",
        completesFlow: false,
      });
    }
    draftState.resetDraft();
    resetSaveState();
    publishState.setPublishCheck(null);
    setLogisticsExpanded(false);
    setPendingInvalidField(null);
    wizard.resetWizard(mode);
  };

  const review = useMemo(
    () =>
      getCreateQuestReviewView({
        draft,
        locale,
        messages,
        publishCheck: reviewPublishCheck,
        spendingBalanceSatang:
          publishState.walletBalances?.spendingBalanceSatang ?? 0,
        tagOptions,
      }),
    [
      draft,
      locale,
      messages,
      publishState.walletBalances?.spendingBalanceSatang,
      reviewPublishCheck,
      tagOptions,
    ]
  );
  const combinationHint = useMemo(
    () => getCreateQuestCombinationHint(draft, messages),
    [draft, messages]
  );
  const useStackedChoices = width < 340 || fontScale >= 1.3;
  const useWideSummary = layout.isExpanded || width >= 430;
  const useStackedActions = width < 340 || fontScale >= 1.15;

  const frameTitle = isServerEditMode(mode) ? messages.editTitle : undefined;
  const frameSubtitle = isServerEditMode(mode)
    ? messages.editHeaderSubtitle
    : undefined;
  const [firstBlocker, ...otherBlockers] = review.blockers;
  const publishBlockedHint = firstBlocker
    ? otherBlockers.length > 0
      ? `${firstBlocker.message} ${messages.moreBlockers(otherBlockers.length)}`
      : firstBlocker.message
    : null;

  return {
    frame: {
      messages,
      step,
      onBackPress: goBack,
      onHelpPress: showHelp,
      onStepPress: goToStep,
      title: frameTitle,
      subtitle: frameSubtitle,
    },
    content: {
      draftHydrated,
      draftLoadError,
      retryDraftLoad,
      saveState,
      layout,
      useStackedActions,
      completedState,
      onDismissCompletion: () => setCompletedState(null),
      mode,
      onLeave: leaveCreateFlow,
      onReset: resetDraft,
    },
    formProps: {
      candidateOptions,
      combinationHint,
      draft,
      errors,
      isCheckingPublish: publishState.isCheckingPublish,
      layout,
      locale,
      logisticsExpanded,
      logisticsSummary: review.logisticsSummary,
      messages,
      onFixBlocker: fixPublishBlocker,
      onRefreshPublishCheck: () =>
        void runExclusive(publishState.refreshPublishCheck),
      onRetrySave: () => void runExclusive(commit.retry),
      onToggleLogistics: () => setLogisticsExpanded((current) => !current),
      participationOptions,
      pendingInvalidField,
      publishCheck: reviewPublishCheck,
      review,
      saveErrorMessage,
      saveErrorTitle:
        saveErrorIntent?.state === "OPEN"
          ? messages.publishErrorTitle
          : messages.saveErrorTitle,
      saveState,
      step,
      tagOptions,
      updateDraft,
      updateParticipation,
      useStackedChoices,
      useWideSummary,
      validationSummary,
    },
    actionBarProps: {
      bottomInset: insets.bottom,
      cancelState,
      isSaving: saveState === "saving",
      messages,
      mode,
      publishBlockedHint,
      publishable,
      publishCanPublish: reviewPublishCheck.canPublish,
      savingAction,
      step,
      stacked: useStackedActions,
      onCancel: confirmCancel,
      onNext: () => void runExclusive(goNext),
      onPublish: () => void runExclusive(() => finishQuest("OPEN")),
      onSaveDraft: () => void runExclusive(() => finishQuest("DRAFT")),
    },
  };
}
