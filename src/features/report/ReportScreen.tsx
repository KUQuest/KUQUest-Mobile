import { useState } from "react";
import { Modal, Platform } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Check, ChevronLeft, ChevronRight } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components/ui/Button";
import { TextArea } from "@/features/onboarding/components/TextArea";
import { useLocale } from "@/locales/LocaleProvider";
import { reportMessages } from "@/locales/reportMessages";
import { colors } from "@/theme/colors";
import { spacing } from "@/theme/spacing";
import { cn } from "@/tw/cn";
import {
  KeyboardAvoidingView,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  View,
} from "@/tw";
import {
  REPORT_TOPIC_VALUES,
  type ReportRouteParams,
  type ReportSource,
  type ReportTopic,
} from "./reportTypes";
import styles from "./reportStyles";

type ReportRouteSearchParams = Partial<
  Record<keyof ReportRouteParams, string | string[]>
>;

function getSingleRouteParam(value: unknown): string | undefined {
  if (typeof value === "string" && value) return value;
  if (Array.isArray(value)) return getSingleRouteParam(value[0]);
  return undefined;
}

export default function ReportScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<ReportRouteSearchParams>();
  const { locale } = useLocale();
  const insets = useSafeAreaInsets();
  const messages = reportMessages[locale];
  const sourceParam = getSingleRouteParam(params.source);
  const source: ReportSource | undefined =
    sourceParam === "chat" || sourceParam === "quest" ? sourceParam : undefined;
  const questTitle = getSingleRouteParam(params.questTitle);
  const contextType =
    source === "chat"
      ? messages.chatContextLabel
      : source === "quest"
        ? messages.questContextLabel
        : undefined;
  const topicOptions = REPORT_TOPIC_VALUES.map((value) => ({
    value,
    label: messages.topicOptions[value],
  }));
  const contextCard =
    source || questTitle ? (
      <View className={styles.contextCard} testID="report-context">
        <Text className={styles.contextLabel}>{messages.contextLabel}</Text>
        {contextType ? (
          <Text className={styles.contextType}>{contextType}</Text>
        ) : null}
        {questTitle ? (
          <Text className={styles.contextTitle} numberOfLines={2}>
            {questTitle}
          </Text>
        ) : null}
        <Text className={styles.contextDescription}>
          {messages.contextDescription}
        </Text>
      </View>
    ) : null;
  const successAction =
    source === "chat" ? messages.backToChat : messages.backToQuest;
  const [topics, setTopics] = useState<ReportTopic[]>([]);
  const [draftTopics, setDraftTopics] = useState<ReportTopic[]>([]);
  const [details, setDetails] = useState("");
  const [attempted, setAttempted] = useState(false);
  const [topicPickerOpen, setTopicPickerOpen] = useState(false);
  const [step, setStep] = useState<"form" | "review" | "submitted">("form");
  const selectedTopicLabels = topics.map(
    (topic) => messages.topicOptions[topic]
  );
  const topicSelectionSummary = topics.length
    ? messages.topicSelectedCount(topics.length)
    : messages.topicPlaceholder;
  const topicError =
    attempted && topics.length === 0 ? messages.topicRequired : undefined;
  const detailsError =
    attempted && !details.trim() ? messages.detailsRequired : undefined;

  const openTopicPicker = () => {
    setDraftTopics(topics);
    setTopicPickerOpen(true);
  };

  const closeTopicPicker = () => {
    setTopicPickerOpen(false);
  };

  const toggleTopic = (value: ReportTopic) => {
    setDraftTopics((currentTopics) =>
      currentTopics.includes(value)
        ? currentTopics.filter((topic) => topic !== value)
        : [...currentTopics, value]
    );
  };

  const confirmTopicSelection = () => {
    setTopics(draftTopics);
    setTopicPickerOpen(false);
  };

  const handleReview = () => {
    setAttempted(true);
    if (topics.length === 0 || !details.trim()) return;

    setStep("review");
  };

  const handleSubmit = () => {
    setStep("submitted");
  };

  return (
    <SafeAreaView edges={["top", "left", "right"]} className={styles.safeArea}>
      <View className={styles.header}>
        <Pressable
          accessibilityLabel={messages.back}
          accessibilityRole="button"
          className={styles.backButton}
          onPress={() => router.back()}
          testID="report-back"
        >
          <ChevronLeft color={colors.primaryDeep} size={26} strokeWidth={2.3} />
        </Pressable>
        <Text accessibilityRole="header" className={styles.headerTitle}>
          {messages.title}
        </Text>
      </View>

      <KeyboardAvoidingView
        className={styles.keyboardAvoiding}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {step === "submitted" ? (
          <ScrollView
            className={styles.scroll}
            contentContainerClassName={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {contextCard}
            <View
              accessibilityRole="alert"
              className={styles.success}
              testID="report-success"
            >
              <View className={styles.successIcon}>
                <Check color={colors.success} size={34} strokeWidth={2.5} />
              </View>
              <Text className={styles.successTitle}>
                {messages.successTitle}
              </Text>
              <Text className={styles.successDescription}>
                {messages.successDescription}
              </Text>
              <Button
                className={styles.successButton}
                onPress={() => router.back()}
                testID="report-success-back"
              >
                {successAction}
              </Button>
            </View>
          </ScrollView>
        ) : step === "review" ? (
          <ScrollView
            className={styles.scroll}
            contentContainerClassName={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {contextCard}
            <Text className={styles.intro}>{messages.reviewIntro}</Text>
            <View className={styles.reviewCard} testID="report-review">
              <View className={styles.reviewField}>
                <Text className={styles.reviewLabel}>
                  {messages.reviewTopic}
                </Text>
                <View
                  className={styles.reviewTags}
                  testID="report-review-topics"
                >
                  {selectedTopicLabels.map((label) => (
                    <View key={label} className={styles.reviewTag}>
                      <Text className={styles.reviewTagText}>{label}</Text>
                    </View>
                  ))}
                </View>
              </View>
              <View className={styles.reviewField}>
                <Text className={styles.reviewLabel}>
                  {messages.reviewDetails}
                </Text>
                <Text className={styles.reviewDetailsValue}>
                  {details.trim()}
                </Text>
              </View>
              <View className={styles.reviewActions}>
                <Button
                  onPress={() => setStep("form")}
                  testID="report-edit"
                  variant="secondary"
                >
                  {messages.edit}
                </Button>
                <Button
                  className={styles.submitButton}
                  onPress={handleSubmit}
                  style={{ backgroundColor: colors.danger }}
                  testID="report-submit-confirm"
                >
                  {messages.submit}
                </Button>
              </View>
            </View>
          </ScrollView>
        ) : (
          <>
            <ScrollView
              className={styles.scroll}
              contentContainerClassName={styles.content}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {contextCard}
              <Text className={styles.intro}>{messages.intro}</Text>
              <View className={styles.form}>
                <View className={styles.topicField}>
                  <Text className={styles.topicLabel}>
                    {messages.topicLabel}
                  </Text>
                  <Pressable
                    accessibilityLabel={`${messages.topicLabel}: ${topicSelectionSummary}`}
                    accessibilityRole="button"
                    accessibilityState={{ expanded: topicPickerOpen }}
                    className={cn(
                      styles.topicTrigger,
                      topicError && styles.topicTriggerError
                    )}
                    onPress={openTopicPicker}
                    testID="report-topic-trigger"
                  >
                    <Text
                      className={cn(
                        styles.topicTriggerText,
                        topics.length === 0 && styles.topicTriggerPlaceholder
                      )}
                    >
                      {topicSelectionSummary}
                    </Text>
                    <ChevronRight
                      color={colors.textMuted}
                      size={20}
                      strokeWidth={2.2}
                    />
                  </Pressable>
                  {topics.length > 0 ? (
                    <View
                      className={styles.selectedTopics}
                      testID="report-selected-topics"
                    >
                      {selectedTopicLabels.map((label) => (
                        <View key={label} className={styles.selectedTopicTag}>
                          <Text className={styles.selectedTopicTagText}>
                            {label}
                          </Text>
                        </View>
                      ))}
                    </View>
                  ) : null}
                  {topicError ? (
                    <Text
                      accessibilityRole="alert"
                      className={styles.topicError}
                    >
                      {topicError}
                    </Text>
                  ) : null}
                </View>
                <TextArea
                  error={detailsError}
                  label={messages.detailsLabel}
                  maxLength={1000}
                  onChangeText={setDetails}
                  placeholder={messages.detailsPlaceholder}
                  value={details}
                />
                <Text className={styles.helper}>{messages.detailsHint}</Text>
              </View>
            </ScrollView>
            <View
              className={styles.actionBar}
              style={{ paddingBottom: Math.max(insets.bottom, spacing.md) }}
            >
              <Button onPress={handleReview} testID="report-submit">
                {messages.review}
              </Button>
            </View>
          </>
        )}
      </KeyboardAvoidingView>

      <Modal
        animationType="slide"
        onRequestClose={closeTopicPicker}
        visible={topicPickerOpen}
      >
        <SafeAreaView
          accessibilityViewIsModal
          className={styles.topicPicker}
          edges={["top", "bottom"]}
          testID="report-topic-picker"
        >
          <View className={styles.topicPickerHeader}>
            <Pressable
              accessibilityLabel={messages.close}
              accessibilityRole="button"
              className={styles.topicPickerBack}
              onPress={closeTopicPicker}
              testID="report-topic-picker-close"
            >
              <ChevronLeft
                color={colors.primaryDeep}
                size={26}
                strokeWidth={2.3}
              />
            </Pressable>
            <Text
              accessibilityRole="header"
              className={styles.topicPickerTitle}
            >
              {messages.topicPickerTitle}
            </Text>
            <View className={styles.topicPickerHeaderSpacer} />
          </View>
          <ScrollView
            className={styles.topicPickerScroll}
            contentContainerClassName={styles.topicPickerContent}
            showsVerticalScrollIndicator={false}
          >
            <Text className={styles.topicPickerDescription}>
              {messages.topicPickerDescription}
            </Text>
            <View className={styles.topicTagList}>
              {topicOptions.map(({ value, label }) => {
                const selected = draftTopics.includes(value);
                return (
                  <Pressable
                    accessibilityLabel={`${messages.topicLabel}: ${label}`}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: selected }}
                    className={cn(
                      styles.topicTag,
                      selected && styles.topicTagSelected
                    )}
                    key={value}
                    onPress={() => toggleTopic(value)}
                    testID={`report-topic-${value}`}
                  >
                    <Text
                      className={cn(
                        styles.topicTagText,
                        selected && styles.topicTagTextSelected
                      )}
                    >
                      {label}
                    </Text>
                    {selected ? (
                      <View className={styles.topicTagCheck}>
                        <Check
                          color={colors.primary}
                          size={18}
                          strokeWidth={2.5}
                        />
                      </View>
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
          <View
            className={styles.topicPickerFooter}
            style={{ paddingBottom: Math.max(insets.bottom, spacing.md) }}
          >
            <Button
              onPress={confirmTopicSelection}
              testID="report-topic-picker-done"
            >
              {messages.topicPickerDone}
            </Button>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
