import React, { useCallback, useMemo, useRef } from "react";
import {
  AccessibilityInfo,
  Alert,
  Platform,
  useWindowDimensions,
} from "react-native";
import { CircleAlert } from "lucide-react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components/ui/Button";
import { useLocale } from "@/features/preferences/localeStore";
import { useWorkerTagsQuery } from "@/features/workerHome/api/workerHomeQueries";
import { createQuestMessages } from "@/locales/createQuestMessages";
import { colors } from "@/theme/colors";
import { getCreateQuestLayoutMetrics } from "@/theme/layout";
import { KeyboardAvoidingView, Text, View } from "@/tw";

import { CreateQuestActionBar } from "./components/CreateQuestActionBar";
import { CreateQuestCompletionState } from "./components/CreateQuestCompletionState";
import { CreateQuestForm } from "./components/CreateQuestForm";
import { CreateQuestFrame } from "./components/CreateQuestFrame";
import { CreateQuestSkeleton } from "./components/CreateQuestSkeleton";
import {
  getCreateQuestChoiceOptions,
  getCreateQuestCombinationHint,
  getCreateQuestReviewView,
  getCreateQuestTagOptions,
} from "./createQuestPresentation";
import { deleteQuestDraft } from "./createQuestPersistence";
import {
  getQuestPublishCheck,
  isQuestDraftDirty,
  type QuestDraft,
} from "./createQuestModel";
import { validateCreateQuestStep } from "./createQuestValidation";
import {
  getInitialCreateQuestStep,
  getNextCreateQuestStep,
  isServerEditMode,
  resolveCreateQuestFlowMode,
} from "./createQuestWorkflow";
import styles from "./createQuestStyles";
import type {
  CompletionState,
  SaveErrorIntent,
  SaveState,
  Step,
} from "./createQuestTypes";
import { LOGISTICS_FIELDS } from "./createQuestTypes";
import {
  useQuestPersistence,
  type PublishedQuestRefValue,
} from "./useQuestPersistence";
import { useQuestPublish } from "./useQuestPublish";
import { useQuestEdit } from "./useQuestEdit";
import { useCreateQuestCommit } from "./useCreateQuestCommit";
import { useCreateQuestDraft } from "./useCreateQuestDraft";
import { useCreateQuestWizard } from "./useCreateQuestWizard";

export interface CreateQuestScreenProps {
  editQuestId?: string;
  editMode?: boolean;
}

type DraftUpdater = <K extends keyof QuestDraft>(
  field: K,
  value: QuestDraft[K]
) => void;

export default function CreateQuestScreen({
  editQuestId,
  editMode = false,
}: CreateQuestScreenProps = {}) {
  const router = useRouter();
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
  const saveErrorIntent: SaveErrorIntent | null =
    localPersistence.saveErrorIntent;
  const resetSaveState = useCallback(() => {
    localPersistence.resetSaveState();
    publishState.resetSaveState();
    editState.resetSaveState();
  }, [editState, localPersistence, publishState]);

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

  const reviewPublishCheck =
    publishState.publishCheck ?? getQuestPublishCheck(draft);
  const activeSaveDraft = isServerEditMode(mode)
    ? editState.saveDraft
    : localPersistence.saveDraft;
  const commit = useCreateQuestCommit({
    draft,
    mode,
    onCompleted: setCompletedState,
    publishCheck: reviewPublishCheck,
    publishQuest: publishState.publishQuest,
    saveDraft: activeSaveDraft,
    saveErrorIntent,
  });

  const finishQuest = async (state: CompletionState) => {
    if (!validateStep(2)) return;
    if (
      !isServerEditMode(mode) &&
      state === "OPEN" &&
      !reviewPublishCheck.canPublish
    ) {
      setValidationSummary(messages.publishCheckBlocked);
      return;
    }
    return commit.finish(state);
  };

  const leaveCreateFlow = () => {
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
    Alert.alert(messages.helpTitle, messages.helpDescription);

  const goBack = () => {
    setPendingInvalidField(null);
    if (step === 1) {
      if (isQuestDraftDirty(draft)) {
        Alert.alert(messages.discardTitle, messages.discardDescription, [
          { text: messages.keepEditing, style: "cancel" },
          {
            text: messages.discard,
            style: "destructive",
            onPress: leaveCreateFlow,
          },
        ]);
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
  const useStackedChoices = width < 430 || fontScale >= 1.15;
  const useWideSummary = layout.isExpanded || width >= 430;
  const useStackedActions = width < 340 || fontScale >= 1.15;

  const frameTitle = isServerEditMode(mode) ? messages.editTitle : undefined;
  const frameSubtitle = isServerEditMode(mode)
    ? messages.editHeaderSubtitle
    : undefined;

  if (!draftHydrated && saveState !== "error") {
    return (
      <CreateQuestFrame
        messages={messages}
        step={step}
        onBackPress={goBack}
        onHelpPress={showHelp}
        onStepPress={goToStep}
        title={frameTitle}
        subtitle={frameSubtitle}
      >
        {draftLoadError ? (
          <View className={styles.loadErrorState}>
            <View className={styles.loadErrorIcon}>
              <CircleAlert
                color={colors.dangerDark}
                size={26}
                strokeWidth={2.2}
              />
            </View>
            <Text accessibilityRole="alert" className={styles.loadErrorText}>
              {messages.loadDraftError}
            </Text>
            <Button onPress={retryDraftLoad} className={styles.fullButton}>
              {messages.retryLoadDraft}
            </Button>
          </View>
        ) : (
          <CreateQuestSkeleton
            horizontalPadding={layout.horizontalPadding}
            contentMaxWidth={
              layout.isExpanded ? layout.contentMaxWidth : "100%"
            }
            loadingLabel={messages.loadingDraft}
            stackedActions={useStackedActions}
            step={step}
          />
        )}
      </CreateQuestFrame>
    );
  }

  if (completedState) {
    return (
      <CreateQuestFrame
        messages={messages}
        step={3}
        onBackPress={() => setCompletedState(null)}
        onHelpPress={showHelp}
        onStepPress={goToStep}
        title={frameTitle}
        subtitle={frameSubtitle}
      >
        <CreateQuestCompletionState
          completedState={completedState}
          messages={messages}
          mode={mode}
          onLeave={leaveCreateFlow}
          onReset={resetDraft}
        />
      </CreateQuestFrame>
    );
  }

  return (
    <CreateQuestFrame
      messages={messages}
      step={step}
      onBackPress={goBack}
      onHelpPress={showHelp}
      onStepPress={goToStep}
      title={frameTitle}
      subtitle={frameSubtitle}
    >
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <CreateQuestForm
          candidateOptions={candidateOptions}
          combinationHint={combinationHint}
          draft={draft}
          errors={errors}
          isCheckingPublish={publishState.isCheckingPublish}
          layout={layout}
          locale={locale}
          logisticsExpanded={logisticsExpanded}
          logisticsSummary={review.logisticsSummary}
          messages={messages}
          onRefreshPublishCheck={() =>
            void runExclusive(publishState.refreshPublishCheck)
          }
          onRetrySave={() => void runExclusive(commit.retry)}
          onToggleLogistics={() => setLogisticsExpanded((current) => !current)}
          participationOptions={participationOptions}
          pendingInvalidField={pendingInvalidField}
          publishCheck={reviewPublishCheck}
          review={review}
          saveErrorMessage={saveErrorMessage}
          saveState={saveState}
          step={step}
          tagOptions={tagOptions}
          updateDraft={updateDraft}
          updateParticipation={updateParticipation}
          useStackedChoices={useStackedChoices}
          useWideSummary={useWideSummary}
          validationSummary={validationSummary}
        />
        <CreateQuestActionBar
          bottomInset={insets.bottom}
          cancelState={cancelState}
          isSaving={saveState === "saving"}
          messages={messages}
          mode={mode}
          publishCanPublish={reviewPublishCheck.canPublish}
          savingAction={savingAction}
          step={step}
          stacked={useStackedActions}
          onCancel={confirmCancel}
          onNext={() => void runExclusive(goNext)}
          onPublish={() => void runExclusive(() => finishQuest("OPEN"))}
          onSaveDraft={() => void runExclusive(() => finishQuest("DRAFT"))}
        />
      </KeyboardAvoidingView>
    </CreateQuestFrame>
  );
}
