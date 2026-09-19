import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  AccessibilityInfo,
  Alert,
  findNodeHandle,
  Platform,
  Pressable as RNPressable,
  TextInput as RNTextInput,
  useWindowDimensions,
} from "react-native";
import { cn } from "@/tw/cn";
import {
  Image,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "@/tw";
import { ScreenLayout } from "@/components/layout/ScreenLayout";
import * as ImagePicker from "expo-image-picker";
import {
  Check,
  ChevronRight,
  CircleAlert,
  Clock3,
  ImagePlus,
  MapPin,
  Tag,
  UserRound,
  UserRoundCheck,
  UsersRound,
  X,
} from "lucide-react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

import { Button } from "@/components/ui/Button";
import { ChoiceGroup } from "./components/ChoiceGroup";
import { CreateQuestHeader } from "./components/CreateQuestHeader";
import { DateTimeField } from "./components/DateTimeField";
import { FieldLabel } from "./components/FieldLabel";
import { LogisticsSection } from "./components/LogisticsSection";
import { ModeSummary } from "./components/ModeSummary";
import { QuestDetailsStep } from "./components/QuestDetailsStep";
import { SectionHeading } from "./components/SectionHeading";
import { TeamSetupStep } from "./components/TeamSetupStep";
import { SchedulePickerModal } from "./components/SchedulePickerModal";
import { useSchedulePicker } from "./useSchedulePicker";
import { QuestTopUpModal } from "@/components/ui/QuestFundingSummary";
import { CreateQuestSkeleton } from "./components/CreateQuestSkeleton";
import { QuestSetupOverview } from "./components/QuestSetupOverview";
import { ReviewActionButton } from "./components/ReviewActionButton";
import { formatSatang } from "@/domain/satang";
import { Input } from "@/features/onboarding/components/Input";
import { Select } from "@/features/onboarding/components/Select";
import { TextArea } from "@/features/onboarding/components/TextArea";
import { useLocale } from "@/features/preferences/localeStore";
import { useWorkerTagsQuery } from "@/features/workerHome/api/workerHomeQueries";
import { createQuestMessages } from "@/locales/createQuestMessages";
import { colors } from "@/theme/colors";
import { getCreateQuestLayoutMetrics } from "@/theme/layout";
import { spacing } from "@/theme/spacing";
import styles from "./createQuestStyles";
import {
  formatDraftReward,
  getHeadcountForParticipation,
  getQuestPublishCheck,
  initialDraft,
  isQuestDraftDirty,
  MAX_REWARD_THB,
  TIME_PATTERN,
  validateQuestDraftStep,
  type QuestDraft,
} from "./createQuestModel";
import { deleteQuestDraft } from "./createQuestPersistence";
import { measureFieldRelativeToScroll } from "./createQuestFocus";
import { formatDate, formatDateTime } from "./createQuestDates";
import {
  LOGISTICS_FIELDS,
  QUEST_DETAIL_FIELDS,
  type CompletionState,
  type Focusable,
  type Step,
} from "./createQuestTypes";
import {
  useQuestPersistence,
  type PublishedQuestRefValue,
} from "./useQuestPersistence";
import { useQuestPublish } from "./useQuestPublish";
import { useQuestEdit } from "./useQuestEdit";
import { MAX_QUEST_IMAGES } from "../questBoard/types";
export interface CreateQuestScreenProps {
  editQuestId?: string;
  editMode?: boolean;
}

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
  const draftChangedRef = useRef(false);
  const scrollRef = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const titleRef = useRef<React.ComponentRef<typeof RNTextInput>>(null);
  const tagRef = useRef<React.ComponentRef<typeof RNPressable>>(null);
  const descriptionRef = useRef<React.ComponentRef<typeof RNTextInput>>(null);
  const conditionsRef = useRef<React.ComponentRef<typeof RNTextInput>>(null);
  const startDateRef = useRef<React.ComponentRef<typeof RNPressable>>(null);
  const deadlineRef = useRef<React.ComponentRef<typeof RNPressable>>(null);
  const locationRef = useRef<React.ComponentRef<typeof RNTextInput>>(null);
  const headcountRef = useRef<React.ComponentRef<typeof RNTextInput>>(null);
  const [step, setStep] = useState<Step>(() =>
    editMode ? 1 : editQuestId ? 2 : 1
  );
  const rewardRef = useRef<React.ComponentRef<typeof RNTextInput>>(null);
  const [draft, setDraft] = useState<QuestDraft>(initialDraft);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [validationSummary, setValidationSummary] = useState<string | null>(
    null
  );
  const [imageError, setImageError] = useState<string | undefined>();
  const [completedState, setCompletedState] = useState<CompletionState | null>(
    null
  );
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [logisticsExpanded, setLogisticsExpanded] = useState(false);
  const [pendingInvalidField, setPendingInvalidField] = useState<string | null>(
    null
  );
  const focusedInvalidFieldRef = useRef<string | null>(null);
  const publishedQuestRef = useRef<PublishedQuestRefValue | null>(null);

  const {
    draftIdRef: localDraftIdRef,
    draftHydrated: localDraftHydrated,
    draftStorageKey: localDraftStorageKey,
    draftLoadError: localDraftLoadError,
    retryDraftLoad: retryLocalDraftLoad,
    saveState: localSaveState,
    resetSaveState: resetLocalSaveState,
    saveErrorIntent: localSaveErrorIntent,
    setSaveErrorIntent: setLocalSaveErrorIntent,
    saveErrorMessage: localSaveErrorMessage,
    savingAction: localSavingAction,
    skipPersistRef,
    saveTimerRef,
    saveRequestRef,
    saveDraft: saveLocalDraft,
  } = useQuestPersistence({
    editQuestId: editMode ? undefined : editQuestId,
    step,
    completedState,
    draft,
    draftChangedRef,
    publishedQuestRef,
    setDraft,
    setStep,
    setCompletedState,
    enabled: !editMode,
  });

  const editState = useQuestEdit({
    questId: editMode ? editQuestId : undefined,
    draftChangedRef,
    setDraft,
    setStep,
  });
  const draftIdRef = localDraftIdRef;
  const draftHydrated = editMode ? editState.draftHydrated : localDraftHydrated;
  const draftStorageKey = localDraftStorageKey;
  const draftLoadError = editMode
    ? editState.draftLoadError
    : localDraftLoadError;
  const retryDraftLoad = editMode
    ? editState.retryDraftLoad
    : retryLocalDraftLoad;
  const localOrEditSaveState = editMode ? editState.saveState : localSaveState;
  const localOrEditSaveErrorMessage = editMode
    ? editState.saveErrorMessage
    : localSaveErrorMessage;
  const localOrEditSavingAction = editMode
    ? editState.savingAction
    : localSavingAction;
  const saveErrorIntent = localSaveErrorIntent;
  const setSaveErrorIntent = setLocalSaveErrorIntent;
  const saveDraft = editMode ? editState.saveDraft : saveLocalDraft;

  const {
    publishCheck,
    setPublishCheck,
    walletBalances,
    isCheckingPublish,
    publishQuest,
    refreshPublishCheck,
    saveState: publishSaveState,
    saveErrorMessage: publishSaveErrorMessage,
    savingAction: publishSavingAction,
    resetSaveState: resetPublishSaveState,
  } = useQuestPublish({
    editQuestId: editMode ? undefined : editQuestId,
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
    enabled: !editMode,
  });

  const saveState =
    !editMode && publishSaveState !== "idle"
      ? publishSaveState
      : localOrEditSaveState;
  const saveErrorMessage =
    !editMode && publishSaveErrorMessage
      ? publishSaveErrorMessage
      : localOrEditSaveErrorMessage;
  const savingAction =
    !editMode && publishSavingAction
      ? publishSavingAction
      : localOrEditSavingAction;
  const resetSaveState = () => {
    resetLocalSaveState();
    resetPublishSaveState();
    editState.resetSaveState();
  };
  const workerTagsQuery = useWorkerTagsQuery();
  const liveTags = useMemo(
    () => workerTagsQuery.data ?? [],
    [workerTagsQuery.data]
  );

  const tagOptions = useMemo(() => {
    if (liveTags.length > 0) {
      return liveTags.map((tag) => ({
        label: tag.name,
        shortLabel: tag.name,
        value: tag.id,
      }));
    }
    return [
      {
        label:
          locale === "th" ? "การออกแบบและงานสร้างสรรค์" : "Design & creative",
        shortLabel: locale === "th" ? "การออกแบบ" : "Design",
        value: "design",
      },
      {
        label: locale === "th" ? "เทคโนโลยี" : "Technology",
        shortLabel: locale === "th" ? "เทคโนโลยี" : "Technology",
        value: "technology",
      },
      {
        label: locale === "th" ? "การสอนพิเศษ" : "Tutoring",
        shortLabel: locale === "th" ? "ติว" : "Tutoring",
        value: "tutoring",
      },
      {
        label: locale === "th" ? "ชีวิตในมหาวิทยาลัย" : "Campus life",
        shortLabel: locale === "th" ? "ชีวิตมหาวิทยาลัย" : "Campus life",
        value: "campus-life",
      },
    ];
  }, [liveTags, locale]);
  const candidateOptions = useMemo(
    () => [
      {
        value: "FIRST_COME_FIRST_SERVED" as const,
        label: messages.instantAccept,
        description: messages.instantAcceptDescription,
        icon: Clock3,
      },
      {
        value: "CANDIDATE" as const,
        label: messages.selectCandidate,
        description: messages.selectCandidateDescription,
        icon: UserRoundCheck,
      },
    ],
    [messages]
  );
  const participationOptions = useMemo(
    () => [
      {
        value: "SINGLE" as const,
        label: messages.singleFormat,
        description: messages.singleFormatDescription,
        icon: UserRound,
      },
      {
        value: "GROUP" as const,
        label: messages.teamFormat,
        description: messages.teamFormatDescription,
        icon: UsersRound,
      },
    ],
    [messages]
  );

  const updateDraft = <K extends keyof QuestDraft>(
    field: K,
    value: QuestDraft[K]
  ) => {
    draftChangedRef.current = true;
    skipPersistRef.current = false;
    publishedQuestRef.current = null;
    setDraft((current) => ({ ...current, [field]: value }));
    resetSaveState();
    setSaveErrorIntent(null);
    setPublishCheck(null);
    setValidationSummary(null);
    setPendingInvalidField(null);
    setErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const {
    activeField: scheduleField,
    pickerMode,
    pickerValue: schedulePickerValue,
    minimumDate: schedulePickerMinimum,
    openPicker: openSchedulePicker,
    closePicker: closeSchedulePicker,
    handleChange: handleDateChange,
    confirmIos: confirmIosScheduleValue,
  } = useSchedulePicker({ draft, updateDraft });

  const updateParticipation = (value: QuestDraft["participation"]) => {
    draftChangedRef.current = true;
    skipPersistRef.current = false;
    publishedQuestRef.current = null;
    setDraft((current) => ({
      ...current,
      participation: value,
      headcount: getHeadcountForParticipation(value, current.headcount),
    }));
    resetSaveState();
    setSaveErrorIntent(null);
    setPublishCheck(null);
    setValidationSummary(null);
    setPendingInvalidField(null);
    setErrors((current) => {
      const next = { ...current };
      delete next.headcount;
      return next;
    });
  };

  const focusRefs = useMemo<Record<string, React.RefObject<Focusable | null>>>(
    () => ({
      title: titleRef,
      tag: tagRef,
      description: descriptionRef,
      conditions: conditionsRef,
      startDate: startDateRef,
      deadline: deadlineRef,
      startTime: startDateRef,
      endTime: deadlineRef,
      location: locationRef,
      headcount: headcountRef,
      wage: rewardRef,
    }),
    []
  );

  const focusInvalidField = useCallback(
    (field: string) => {
      const focus = () => {
        const target = focusRefs[field]?.current;
        if (!target) return;
        const reactTag = findNodeHandle(target);
        if (reactTag) void AccessibilityInfo.setAccessibilityFocus(reactTag);
        if ("focus" in target && typeof target.focus === "function")
          target.focus();
        const nativeScrollRef = scrollRef.current?.getNativeScrollRef();
        const measured = nativeScrollRef
          ? measureFieldRelativeToScroll(
              target,
              nativeScrollRef,
              (_x, y) =>
                scrollRef.current?.scrollTo({
                  y: Math.max(0, y - 24),
                  animated: true,
                }),
              () => scrollRef.current?.scrollTo({ y: 0, animated: true })
            )
          : false;
        if (!measured) {
          scrollRef.current?.scrollTo({ y: 0, animated: true });
        }
      };
      if (typeof globalThis.requestIdleCallback === "function") {
        globalThis.requestIdleCallback(focus, { timeout: 250 });
      } else {
        setTimeout(focus, 0);
      }
    },
    [focusRefs]
  );

  useEffect(() => {
    if (!pendingInvalidField) return;
    const targetStep = pendingInvalidField in QUEST_DETAIL_FIELDS ? 1 : 2;
    if (step !== targetStep) return;
    if (pendingInvalidField in LOGISTICS_FIELDS && !logisticsExpanded) return;
    if (focusedInvalidFieldRef.current === pendingInvalidField) return;
    focusedInvalidFieldRef.current = pendingInvalidField;
    focusInvalidField(pendingInvalidField);
  }, [focusInvalidField, logisticsExpanded, pendingInvalidField, step]);

  const validateStep = (currentStep: Step): boolean => {
    const findings = validateQuestDraftStep(draft, currentStep, new Date());
    const codeMessages: Record<string, string> = {
      "title:required": messages.titleError,
      "tag:required": messages.questTagError,
      "description:required": messages.descriptionError,
      "conditions:required": messages.completionCriteriaError,
      "startDate:required": messages.startDateError,
      "startDate:startDatePast": messages.startDatePastError,
      "deadline:required": messages.deadlineError,
      "deadline:deadlineOrder": messages.deadlineOrderError,
      "startTime:required": messages.startTimeError,
      "startTime:format": messages.startTimeError,
      "endTime:required": messages.endTimeError,
      "endTime:format": messages.endTimeError,
      "endTime:timeOrder": messages.timeOrderError,
      "location:required": messages.locationError,
      "headcount:required": messages.headcountError,
      "headcount:bounds": messages.headcountError,
      "wage:empty": messages.rewardEmptyError,
      "wage:format": messages.rewardFormatError,
      "wage:bounds": messages.rewardBoundsError(MAX_REWARD_THB),
    };
    const nextErrors: Record<string, string> = {};
    for (const { field, code } of findings) {
      nextErrors[field] = codeMessages[`${field}:${code}`];
    }

    setErrors(nextErrors);
    const firstErrorKey = Object.keys(nextErrors)[0];
    if (firstErrorKey) {
      const fieldLabels: Record<string, string> = {
        title: messages.titleLabel,
        tag: messages.questTag,
        description: messages.description,
        conditions: messages.completionCriteria,
        startDate: messages.startDate,
        deadline: messages.deadline,
        startTime: messages.startTime,
        endTime: messages.endTime,
        location: messages.location,
        headcount: messages.headcount,
        wage: messages.rewardPerPerson,
      };
      const firstError = `${fieldLabels[firstErrorKey] ?? messages.title}: ${nextErrors[firstErrorKey]}`;
      setValidationSummary(firstError);
      AccessibilityInfo.announceForAccessibility(firstError);
      if (currentStep === 2 && firstErrorKey in LOGISTICS_FIELDS)
        setLogisticsExpanded(true);
      if (currentStep !== step) {
        setStep(currentStep);
        scrollRef.current?.scrollTo({ y: 0, animated: false });
      }
      focusedInvalidFieldRef.current = null;
      setPendingInvalidField(firstErrorKey);
    } else {
      setValidationSummary(null);
    }

    return Object.keys(nextErrors).length === 0;
  };

  const goNext = () => {
    if (!validateStep(step)) return;
    if (step < 3) {
      setStep((current) => (current + 1) as Step);
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    }
  };

  const goToStep = (target: Step) => {
    if (target >= step) return;
    setPendingInvalidField(null);
    setStep(target);
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  };

  const finishQuest = async (state: CompletionState) => {
    if (!validateStep(2)) return;
    const check = reviewPublishCheck;
    if (!editMode) setPublishCheck(check);
    if (!editMode && state === "OPEN" && !check.canPublish) {
      const firstBlocker = check.blockers[0];
      if (firstBlocker) setValidationSummary(messages.publishCheckBlocked);
      return;
    }

    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    if (!editMode && state === "OPEN") {
      const published = await publishQuest(draft);
      if (published) setCompletedState("OPEN");
      return;
    }
    const saved = await saveDraft(draft, "DRAFT", true);
    if (saved) setCompletedState("DRAFT");
  };

  const retrySave = () => {
    if (editMode) {
      void saveDraft(draft, "DRAFT", true).then((saved) => {
        if (saved) setCompletedState("DRAFT");
      });
      return;
    }
    const intent = saveErrorIntent;
    if (intent?.state === "OPEN") {
      void publishQuest(draft).then((published) => {
        if (published && intent.completesFlow) setCompletedState("OPEN");
      });
      return;
    }
    void saveDraft(draft, "DRAFT", intent?.completesFlow ?? false).then(
      (saved) => {
        if (saved && intent?.completesFlow) setCompletedState("DRAFT");
      }
    );
  };

  const leaveCreateFlow = () => {
    if (editMode && editQuestId) {
      router.replace({
        pathname: "/quest/[id]",
        params: { id: editQuestId, mode: "post" },
      });
      return;
    }
    router.replace("/(tabs)");
  };

  const confirmCancel = () => {
    if (!editMode) return;
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
    } else {
      setStep((current) => (current - 1) as Step);
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    }
  };

  const pickImages = async () => {
    setImageError(undefined);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsMultipleSelection: true,
        selectionLimit: MAX_QUEST_IMAGES,
        quality: 0.6,
      });
      if (!result.canceled)
        updateDraft(
          "imageUris",
          result.assets.slice(0, MAX_QUEST_IMAGES).map((asset) => asset.uri)
        );
    } catch {
      setImageError(messages.imageError);
    }
  };

  const removeImage = (index: number) => {
    setDraft((current) => ({
      ...current,
      imageUris: current.imageUris.filter(
        (_, imageIndex) => imageIndex !== index
      ),
    }));
    setImageError(undefined);
  };

  const resetDraft = async () => {
    saveRequestRef.current += 1;
    publishedQuestRef.current = null;
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    skipPersistRef.current = true;
    draftChangedRef.current = false;
    try {
      if (draftStorageKey) {
        const activeDraftId = draftIdRef.current;
        if (activeDraftId) {
          await deleteQuestDraft(draftStorageKey, activeDraftId);
        }
      }
    } catch {
      setSaveErrorIntent({ state: "DRAFT", completesFlow: false });
    }
    draftIdRef.current = null;
    setDraft(initialDraft);
    setErrors({});
    setValidationSummary(null);
    setImageError(undefined);
    resetSaveState();
    setPublishCheck(null);
    setLogisticsExpanded(false);
    setPendingInvalidField(null);
    setStep(1);
    setCompletedState(null);
  };

  const combinationHint = useMemo(() => {
    if (draft.participation === "SINGLE")
      return draft.candidateMode === "FIRST_COME_FIRST_SERVED"
        ? messages.singleFirstComeHint
        : messages.singleCandidateHint;
    return draft.candidateMode === "FIRST_COME_FIRST_SERVED"
      ? messages.groupFirstComeHint
      : messages.groupCandidateHint;
  }, [draft.candidateMode, draft.participation, messages]);
  const proofRequired = draft.proofRequired !== "none";

  const reviewPublishCheck = publishCheck ?? getQuestPublishCheck(draft);
  const missingSatang = Math.max(
    0,
    reviewPublishCheck.escrow.totalRequiredSatang -
      (walletBalances?.spendingBalanceSatang ?? 0)
  );
  const summary = useMemo(
    () => [
      { label: messages.summary.title, value: draft.title || "—" },
      { label: messages.summary.description, value: draft.description || "—" },
      {
        label: messages.summary.completionCriteria,
        value: draft.conditions || "—",
      },
      {
        label: messages.summary.proof,
        value: proofRequired ? messages.required : messages.notNeeded,
      },
      {
        label: messages.summary.schedule,
        value:
          draft.startDate && draft.deadline && draft.startTime && draft.endTime
            ? `${formatDate(draft.startDate, locale, messages.notSelected)} · ${draft.startTime}–${draft.endTime} → ${formatDate(draft.deadline, locale, messages.notSelected)}`
            : messages.notSelected,
      },
      {
        label: messages.summary.location,
        value:
          draft.locationMode === "ONLINE"
            ? messages.online
            : draft.location || messages.notSelected,
      },
      {
        label: messages.summary.images,
        value: draft.imageUris.length
          ? messages.selectedImages(draft.imageUris.length)
          : messages.noImages,
      },
      {
        label: messages.summary.reward,
        value: draft.wage
          ? `${formatDraftReward(draft, locale)} / ${locale === "th" ? "คน" : "person"}`
          : messages.notSelected,
      },
    ],
    [draft, locale, messages, proofRequired]
  );

  const selectedQuestTag =
    tagOptions.find((option) => option.value === draft.tag)?.shortLabel ??
    messages.notSelected;
  const selectedTeamSize =
    draft.participation === "SINGLE"
      ? messages.teamSizeValue("1")
      : draft.headcount
        ? messages.teamSizeValue(draft.headcount)
        : messages.notSelected;
  const selectedAcceptanceMethod =
    draft.candidateMode === "CANDIDATE"
      ? messages.selectCandidate
      : messages.instantAccept;
  const logisticsSummary =
    draft.startDate && draft.deadline && draft.startTime && draft.endTime
      ? messages.logisticsSummaryComplete(
          `${formatDate(draft.startDate, locale, messages.notSelected)} · ${draft.startTime}–${draft.endTime}`,
          draft.locationMode === "ONLINE"
            ? messages.online
            : draft.location || messages.notSelected
        )
      : messages.logisticsSummary;
  const useStackedChoices = width < 430 || fontScale >= 1.15;
  const useWideSummary = layout.isExpanded || width >= 430;
  const useStackedActions = width < 340 || fontScale >= 1.15;

  if (!draftHydrated && saveState !== "error") {
    return (
      <ScreenLayout
        edges={["top", "left", "right"]}
        className={styles.safeArea}
      >
        <StatusBar style="light" />
        <CreateQuestHeader
          messages={messages}
          step={step}
          onBackPress={goBack}
          onHelpPress={showHelp}
          onStepPress={goToStep}
          title={editMode ? messages.editTitle : undefined}
          subtitle={editMode ? messages.editHeaderSubtitle : undefined}
        />
        <View className={styles.surface}>
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
        </View>
      </ScreenLayout>
    );
  }

  if (completedState) {
    const published = !editMode && completedState === "OPEN";
    return (
      <ScreenLayout
        edges={["top", "left", "right"]}
        className={styles.safeArea}
      >
        <StatusBar style="light" />
        <CreateQuestHeader
          messages={messages}
          step={3}
          onBackPress={() => setCompletedState(null)}
          onHelpPress={showHelp}
          onStepPress={goToStep}
          title={editMode ? messages.editTitle : undefined}
          subtitle={editMode ? messages.editHeaderSubtitle : undefined}
        />
        <View className={styles.surface}>
          <View className={styles.successState}>
            <View className={styles.successIcon}>
              <Check color={colors.primary} size={32} strokeWidth={2.5} />
            </View>
            <Text accessibilityRole="header" className={styles.successTitle}>
              {editMode
                ? messages.updatedQuestTitle
                : published
                  ? messages.publishedQuestTitle
                  : messages.savedDraftTitle}
            </Text>
            <Text className={styles.successDescription}>
              {editMode
                ? messages.updatedQuestDescription
                : published
                  ? messages.publishedQuestDescription
                  : messages.savedDraftDescription}
            </Text>
            {editMode ? (
              <Button onPress={leaveCreateFlow} className={styles.fullButton}>
                {messages.backToQuest}
              </Button>
            ) : (
              <>
                <Button
                  onPress={() => void resetDraft()}
                  className={styles.fullButton}
                >
                  {published
                    ? messages.createNewQuest
                    : messages.createAnotherDraft}
                </Button>
                <Button
                  variant="secondary"
                  onPress={leaveCreateFlow}
                  className={styles.fullButton}
                >
                  {messages.viewQuestBoard}
                </Button>
              </>
            )}
          </View>
        </View>
      </ScreenLayout>
    );
  }
  const isSaving = saveState === "saving";
  const nextLabel = step === 2 ? messages.reviewQuest : messages.next;

  return (
    <ScreenLayout edges={["top", "left", "right"]} className={styles.safeArea}>
      <StatusBar style="light" />
      <CreateQuestHeader
        messages={messages}
        step={step}
        onBackPress={goBack}
        onHelpPress={showHelp}
        onStepPress={goToStep}
        title={editMode ? messages.editTitle : undefined}
        subtitle={editMode ? messages.editHeaderSubtitle : undefined}
      />
      <View className={styles.surface}>
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <ScrollView
            ref={scrollRef}
            className="flex-1"
            contentContainerStyle={{
              paddingBottom: spacing.xl,
              paddingHorizontal: layout.horizontalPadding,
              paddingTop: spacing.lg,
            }}
            keyboardDismissMode="on-drag"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View
              style={{
                alignSelf: "center",
                width: layout.isExpanded ? layout.contentMaxWidth : "100%",
              }}
            >
              {validationSummary ? (
                <View
                  accessibilityRole="alert"
                  accessibilityLiveRegion="assertive"
                  className={styles.validationSummary}
                >
                  <View className={styles.validationIcon}>
                    <CircleAlert
                      color={colors.dangerDark}
                      size={19}
                      strokeWidth={2.3}
                    />
                  </View>
                  <Text className={styles.validationSummaryText}>
                    {validationSummary}
                  </Text>
                </View>
              ) : null}
              {saveState === "saving" || saveState === "saved" ? (
                <View
                  accessibilityLiveRegion="polite"
                  className={styles.autosaveStatus}
                >
                  {saveState === "saved" ? (
                    <View className={styles.autosaveSavedIcon}>
                      <Check
                        color={colors.success}
                        size={12}
                        strokeWidth={2.8}
                      />
                    </View>
                  ) : (
                    <View className={styles.autosaveSavingDot} />
                  )}
                  <Text
                    className={cn(
                      styles.autosaveText,
                      saveState === "saved" && styles.autosaveSavedText
                    )}
                  >
                    {saveState === "saved"
                      ? messages.autosaveSaved
                      : messages.autosaveSaving}
                  </Text>
                </View>
              ) : null}
              {saveState === "error" ? (
                <View
                  accessibilityLiveRegion="assertive"
                  className={styles.saveErrorCard}
                  testID="create-quest-save-error"
                >
                  <CircleAlert
                    color={colors.dangerDark}
                    size={22}
                    strokeWidth={2.2}
                  />
                  <View className={styles.saveErrorCopy}>
                    <Text className={styles.saveErrorText}>
                      {saveErrorMessage ?? messages.saveError}
                    </Text>
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={messages.retrySave}
                    onPress={retrySave}
                    className={styles.retryButton}
                    testID="create-quest-retry-save"
                  >
                    <Text className={styles.retryButtonText}>
                      {messages.retrySave}
                    </Text>
                  </Pressable>
                </View>
              ) : null}
              {step === 1 ? (
                <QuestDetailsStep
                  messages={messages}
                  draft={draft}
                  errors={errors}
                  tagOptions={tagOptions}
                  proofRequired={proofRequired}
                  titleRef={titleRef}
                  tagRef={tagRef}
                  descriptionRef={descriptionRef}
                  conditionsRef={conditionsRef}
                  updateDraft={updateDraft}
                />
              ) : null}

              {step === 2 ? (
                <TeamSetupStep
                  messages={messages}
                  draft={draft}
                  errors={errors}
                  locale={locale}
                  participationOptions={participationOptions}
                  candidateOptions={candidateOptions}
                  combinationHint={combinationHint}
                  useStackedChoices={useStackedChoices}
                  logisticsExpanded={logisticsExpanded}
                  logisticsSummary={logisticsSummary}
                  onToggleLogistics={() =>
                    setLogisticsExpanded((current) => !current)
                  }
                  imageError={imageError}
                  setImageError={setImageError}
                  headcountRef={headcountRef}
                  rewardRef={rewardRef}
                  startDateRef={startDateRef}
                  deadlineRef={deadlineRef}
                  locationRef={locationRef}
                  openSchedulePicker={openSchedulePicker}
                  pickImages={pickImages}
                  removeImage={removeImage}
                  updateDraft={updateDraft}
                  updateParticipation={updateParticipation}
                />
              ) : null}

              {step === 3 ? (
                <>
                  <QuestSetupOverview
                    messages={messages}
                    questTag={selectedQuestTag}
                    teamSize={selectedTeamSize}
                    acceptanceMethod={selectedAcceptanceMethod}
                    wide={useWideSummary}
                  />
                  <View className={styles.sectionCard}>
                    <SectionHeading
                      icon={Check}
                      title={messages.review}
                      description={messages.questSummaryLabel}
                    />
                    <View className={styles.summaryCard}>
                      {summary.map((item) => (
                        <View key={item.label} className={styles.summaryRow}>
                          <Text className={styles.summaryLabel}>
                            {item.label}
                          </Text>
                          <Text className={styles.summaryValue}>
                            {item.value}
                          </Text>
                        </View>
                      ))}
                    </View>
                    <View
                      accessibilityRole={
                        reviewPublishCheck.canPublish ? undefined : "alert"
                      }
                      accessibilityLiveRegion={
                        reviewPublishCheck.canPublish ? "polite" : "assertive"
                      }
                      accessibilityState={{ busy: isCheckingPublish }}
                      className={cn(
                        styles.publishCheckCard,
                        !reviewPublishCheck.canPublish &&
                          styles.publishCheckCardBlocked
                      )}
                      testID="create-quest-publish-check"
                    >
                      <Text className={styles.publishCheckTitle}>
                        {messages.publishCheckTitle}
                      </Text>
                      <Text
                        className={cn(
                          styles.publishCheckStatus,
                          !reviewPublishCheck.canPublish &&
                            styles.publishCheckStatusBlocked
                        )}
                      >
                        {reviewPublishCheck.canPublish
                          ? messages.publishCheckReady
                          : messages.publishCheckBlocked}
                      </Text>
                      <View className={styles.escrowRows}>
                        <View className={styles.escrowRow}>
                          <Text className={styles.escrowLabel}>
                            {messages.rewardPool}
                          </Text>
                          <Text className={styles.escrowValue}>
                            {formatDraftReward(draft, locale)} ×{" "}
                            {reviewPublishCheck.escrow.headcount} ={" "}
                            {formatSatang(
                              reviewPublishCheck.escrow.rewardPoolSatang,
                              locale
                            )}
                          </Text>
                        </View>
                        <View className={styles.escrowRow}>
                          <Text className={styles.escrowLabel}>
                            {messages.platformFee}
                          </Text>
                          <Text className={styles.escrowValue}>
                            {formatSatang(
                              reviewPublishCheck.escrow.platformFeeSatang,
                              locale
                            )}
                          </Text>
                        </View>
                        <View className={styles.escrowRow}>
                          <Text className={styles.escrowLabel}>
                            {messages.escrowTotal}
                          </Text>
                          <Text className={styles.escrowValue}>
                            {formatSatang(
                              reviewPublishCheck.escrow.totalRequiredSatang,
                              locale
                            )}
                          </Text>
                        </View>
                      </View>
                      <Text className={styles.publishCheckNote}>
                        {messages.escrowDescription}
                      </Text>
                      {reviewPublishCheck.warnings.length > 0 ? (
                        <Text className={styles.publishCheckNote}>
                          {messages.publishCheckWarning}
                        </Text>
                      ) : null}
                      {!reviewPublishCheck.canPublish ? (
                        <View testID="create-quest-blocking-guidance">
                          {reviewPublishCheck.blockers.map((blocker) =>
                            blocker === "INSUFFICIENT_SPENDING_BALANCE" ? (
                              <View key={blocker}>
                                <Text className={styles.publishCheckNote}>
                                  {messages.blockingGuidance.INSUFFICIENT_SPENDING_BALANCE(
                                    formatSatang(missingSatang, locale)
                                  )}
                                </Text>
                                <Pressable
                                  accessibilityRole="button"
                                  accessibilityLabel={messages.topUpAction}
                                  className={cn(
                                    styles.retryButton,
                                    styles.publishCheckNote
                                  )}
                                  onPress={() => setShowTopUpModal(true)}
                                  testID="create-quest-top-up-button"
                                >
                                  <Text className={styles.retryButtonText}>
                                    {messages.topUpAction}
                                  </Text>
                                </Pressable>
                              </View>
                            ) : (
                              <Text
                                className={styles.publishCheckNote}
                                key={blocker}
                              >
                                {(
                                  messages.blockingGuidance as unknown as Record<
                                    string,
                                    string
                                  >
                                )[blocker] ?? blocker}
                              </Text>
                            )
                          )}
                        </View>
                      ) : null}
                    </View>
                  </View>
                </>
              ) : null}
            </View>
          </ScrollView>

          <View
            className={cn(
              styles.actionBar,
              useStackedActions && styles.actionBarStacked
            )}
            style={{
              alignItems: useStackedActions ? "stretch" : "center",
              flexDirection: useStackedActions ? "column" : "row",
              paddingBottom: Math.max(spacing.sm, insets.bottom + spacing.xs),
            }}
          >
            {editMode ? (
              <Pressable
                accessibilityLabel={
                  editState.cancelState === "cancelling"
                    ? messages.cancellingQuest
                    : messages.cancelQuest
                }
                accessibilityRole="button"
                accessibilityState={{
                  disabled: isSaving || editState.cancelState === "cancelling",
                }}
                className={cn(
                  "min-h-[44px] items-center justify-center rounded-[12px] border border-ku-danger px-[12px]",
                  useStackedActions ? "w-full" : "flex-1"
                )}
                disabled={isSaving || editState.cancelState === "cancelling"}
                onPress={confirmCancel}
                testID="edit-quest-cancel"
              >
                <Text className="font-ku-semibold text-ku-danger">
                  {editState.cancelState === "cancelling"
                    ? messages.cancellingQuest
                    : messages.cancelQuest}
                </Text>
              </Pressable>
            ) : null}
            {step < 3 ? (
              <Button
                disabled={isSaving}
                onPress={goNext}
                className={styles.nextButtonFull}
                accessibilityLabel={nextLabel}
              >
                <View className={styles.buttonContent}>
                  <Text className={styles.primaryButtonText}>{nextLabel}</Text>
                  <ChevronRight
                    color={colors.white}
                    size={20}
                    strokeWidth={2.5}
                  />
                </View>
              </Button>
            ) : (
              <>
                {editMode ? (
                  <ReviewActionButton
                    accessibilityLabel={
                      savingAction === "DRAFT"
                        ? messages.savingChanges
                        : messages.saveChanges
                    }
                    disabled={isSaving}
                    label={
                      savingAction === "DRAFT"
                        ? messages.savingChanges
                        : messages.saveChanges
                    }
                    onPress={() => void finishQuest("DRAFT")}
                    stacked={useStackedActions}
                    testID="edit-quest-save"
                    variant="primary"
                  />
                ) : (
                  <>
                    <ReviewActionButton
                      accessibilityLabel={
                        savingAction === "DRAFT"
                          ? messages.savingDraft
                          : messages.saveDraft
                      }
                      disabled={isSaving}
                      label={
                        savingAction === "DRAFT"
                          ? messages.savingDraft
                          : messages.saveDraft
                      }
                      onPress={() => void finishQuest("DRAFT")}
                      stacked={useStackedActions}
                      testID="create-quest-save-draft"
                      variant="secondary"
                    />
                    <ReviewActionButton
                      accessibilityLabel={
                        savingAction === "OPEN"
                          ? messages.publishingQuest
                          : messages.publishQuest
                      }
                      disabled={isSaving || !reviewPublishCheck.canPublish}
                      label={
                        savingAction === "OPEN"
                          ? messages.publishingQuest
                          : messages.publishQuest
                      }
                      onPress={() => void finishQuest("OPEN")}
                      stacked={useStackedActions}
                      testID="create-quest-save-preview"
                      variant="primary"
                    />
                  </>
                )}
              </>
            )}
          </View>
        </KeyboardAvoidingView>
      </View>

      <SchedulePickerModal
        messages={messages}
        visible={scheduleField !== null}
        field={scheduleField}
        mode={pickerMode}
        value={schedulePickerValue}
        minimumDate={schedulePickerMinimum}
        onChange={handleDateChange}
        onConfirmIos={confirmIosScheduleValue}
        onClose={closeSchedulePicker}
      />

      <QuestTopUpModal
        visible={showTopUpModal}
        onClose={() => setShowTopUpModal(false)}
        onSuccess={() => {
          void refreshPublishCheck();
        }}
        locale={locale}
        suggestedAmountSatang={missingSatang}
      />
    </ScreenLayout>
  );
}
