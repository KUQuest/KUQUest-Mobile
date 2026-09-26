import React, { useCallback, useEffect, useMemo, useRef } from "react";
import {
  AccessibilityInfo,
  findNodeHandle,
  Pressable as RNPressable,
  TextInput as RNTextInput,
} from "react-native";

import { CircleAlert, Check, RotateCw } from "lucide-react-native";

import { cn } from "@/tw/cn";
import { Pressable, ScrollView, Text, View } from "@/tw";
import { colors } from "@/theme/colors";
import { spacing } from "@/theme/spacing";
import type { CreateQuestMessages } from "@/locales/createQuestMessages";
import type { SupportedLocale } from "@/locales/locale";
import type { CreateQuestLayoutMetrics } from "@/theme/layout";

import {
  type CreateQuestReviewView,
  type CreateQuestTagOption,
} from "../presentation/createQuestPresentation";
import { measureFieldRelativeToScroll } from "./createQuestFocus";
import type { QuestDraft } from "../domain/createQuestModel";
import type { QuestPublishCheck } from "../../questBoard/domain/types";
import {
  LOGISTICS_FIELDS,
  QUEST_DETAIL_FIELDS,
  type ChoiceOption,
  type Focusable,
  type SaveState,
  type Step,
} from "../createQuestTypes";
import styles from "./createQuestStyles";
import { CreateQuestReviewPanel } from "./CreateQuestReviewPanel";
import { QuestDetailsStep } from "./QuestDetailsStep";
import { TeamSetupStep } from "./teamSetup/TeamSetupStep";

type DraftUpdater = <K extends keyof QuestDraft>(
  field: K,
  value: QuestDraft[K]
) => void;

export function CreateQuestForm({
  candidateOptions,
  combinationHint,
  draft,
  errors,
  isCheckingPublish,
  layout,
  locale,
  logisticsExpanded,
  logisticsSummary,
  messages,
  onFixBlocker,
  onRefreshPublishCheck,
  onRetrySave,
  onRetryTags,
  onToggleLogistics,
  participationOptions,
  pendingInvalidField,
  publishCheck,
  review,
  saveErrorMessage,
  saveErrorTitle,
  saveState,
  step,
  tagLoadError,
  tagOptions,
  updateDraft,
  updateParticipation,
  useStackedChoices,
  useWideSummary,
  validationSummary,
}: {
  candidateOptions: ChoiceOption[];
  combinationHint: string;
  draft: QuestDraft;
  errors: Record<string, string>;
  isCheckingPublish: boolean;
  layout: CreateQuestLayoutMetrics;
  locale: SupportedLocale;
  logisticsExpanded: boolean;
  logisticsSummary: string;
  messages: CreateQuestMessages;
  onFixBlocker: (field: string) => void;
  onRefreshPublishCheck: () => void;
  onRetrySave: () => void;
  onToggleLogistics: () => void;
  participationOptions: ChoiceOption[];
  pendingInvalidField: string | null;
  publishCheck: QuestPublishCheck;
  review: CreateQuestReviewView;
  saveErrorMessage: string | null;
  saveErrorTitle: string;
  saveState: SaveState;
  step: Step;
  tagLoadError: boolean;
  tagOptions: CreateQuestTagOption[];
  onRetryTags: () => void;
  updateDraft: DraftUpdater;
  updateParticipation: (value: QuestDraft["participation"]) => void;
  useStackedChoices: boolean;
  useWideSummary: boolean;
  validationSummary: string | null;
}) {
  const scrollRef = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const titleRef = useRef<React.ComponentRef<typeof RNTextInput>>(null);
  const tagRef = useRef<React.ComponentRef<typeof RNPressable>>(null);
  const descriptionRef = useRef<React.ComponentRef<typeof RNTextInput>>(null);
  const conditionsRef = useRef<React.ComponentRef<typeof RNTextInput>>(null);
  const startDateRef = useRef<React.ComponentRef<typeof RNPressable>>(null);
  const deadlineRef = useRef<React.ComponentRef<typeof RNPressable>>(null);
  const locationRef = useRef<React.ComponentRef<typeof RNTextInput>>(null);
  const headcountRef = useRef<React.ComponentRef<typeof RNTextInput>>(null);
  const rewardRef = useRef<React.ComponentRef<typeof RNTextInput>>(null);
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
        if (!measured) scrollRef.current?.scrollTo({ y: 0, animated: true });
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
    focusInvalidField(pendingInvalidField);
  }, [focusInvalidField, logisticsExpanded, pendingInvalidField, step]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [step]);

  return (
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
                <Check color={colors.success} size={12} strokeWidth={2.8} />
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
            accessibilityRole="alert"
            className={styles.saveErrorCard}
            testID="create-quest-save-error"
          >
            <View className={styles.saveErrorHeader}>
              <View className={styles.saveErrorIcon}>
                <CircleAlert
                  color={colors.dangerDark}
                  size={20}
                  strokeWidth={2.2}
                />
              </View>
              <View className={styles.saveErrorCopy}>
                <Text className={styles.saveErrorTitle}>{saveErrorTitle}</Text>
                <Text className={styles.saveErrorText}>
                  {saveErrorMessage ?? messages.saveError}
                </Text>
              </View>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={messages.retrySave}
              onPress={onRetrySave}
              className={styles.saveErrorRetry}
              testID="create-quest-retry-save"
            >
              <RotateCw color={colors.dangerDark} size={16} strokeWidth={2.4} />
              <Text className={styles.saveErrorRetryText}>
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
            tagLoadError={tagLoadError}
            onRetryTags={onRetryTags}
            proofRequired={draft.proofRequired !== "none"}
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
            onToggleLogistics={onToggleLogistics}
            headcountRef={headcountRef}
            rewardRef={rewardRef}
            startDateRef={startDateRef}
            deadlineRef={deadlineRef}
            locationRef={locationRef}
            updateDraft={updateDraft}
            updateParticipation={updateParticipation}
          />
        ) : null}

        {step === 3 ? (
          <CreateQuestReviewPanel
            locale={locale}
            messages={messages}
            view={review}
            wide={useWideSummary}
            isCheckingPublish={isCheckingPublish}
            publishCheck={publishCheck}
            onFixBlocker={onFixBlocker}
            onRefreshPublishCheck={onRefreshPublishCheck}
          />
        ) : null}
      </View>
    </ScrollView>
  );
}
