import { useState } from "react";
import { Platform } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { AlertCircle, Check, ChevronLeft } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getRouteParam } from "@/utils/navigation";

import {
  chatApi,
  MESSAGE_REPORT_REASONS,
  type MessageReportReason,
} from "@/api/ChatApi";
import { Button } from "@/components/ui/Button";
import { TextArea } from "@/components/ui/TextArea";
import { useLocale } from "@/features/preferences/localeStore";
import { reportMessages } from "@/locales/reportMessages";
import { useAppTheme } from "@/features/workspace/AppThemeProvider";
import { spacing } from "@/theme/spacing";
import { cn } from "@/tw/cn";
import { KeyboardAvoidingView, Pressable, ScrollView, Text, View } from "@/tw";
import { ScreenLayout } from "@/components/layout/ScreenLayout";
import { getLocalizedErrorMessage } from "@/utils/error";
import type { ReportRouteParams } from "./reportTypes";
import styles from "./reportStyles";

type ReportRouteSearchParams = Partial<
  Record<keyof ReportRouteParams, string | string[]>
>;

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidMessageId(id?: string | null): id is string {
  if (!id || typeof id !== "string") return false;
  return UUID_REGEX.test(id.trim());
}

export default function ReportScreen() {
  const { colors } = useAppTheme();
  const router = useRouter();
  const params = useLocalSearchParams<ReportRouteSearchParams>();
  const { locale } = useLocale();
  const insets = useSafeAreaInsets();
  const messages = reportMessages[locale];

  const rawMessageId = getRouteParam(params.messageId);
  const conversationTitle = getRouteParam(params.conversationTitle);
  const senderName = getRouteParam(params.senderName);

  const [reason, setReason] = useState<MessageReportReason | null>(null);
  const [detail, setDetail] = useState("");
  const [attempted, setAttempted] = useState(false);
  const [step, setStep] = useState<"form" | "review" | "submitted">("form");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  if (!isValidMessageId(rawMessageId)) {
    return (
      <ScreenLayout
        edges={["top", "left", "right"]}
        className={styles.safeArea}
      >
        <View className={styles.header}>
          <Pressable
            accessibilityLabel={messages.back}
            accessibilityRole="button"
            className={styles.backButton}
            onPress={() => router.back()}
            testID="report-back"
          >
            <ChevronLeft
              color={colors.primaryDeep}
              size={26}
              strokeWidth={2.3}
            />
          </Pressable>
          <Text accessibilityRole="header" className={styles.headerTitle}>
            {messages.title}
          </Text>
        </View>
        <ScrollView
          className={styles.scroll}
          contentContainerClassName={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View
            accessibilityRole="alert"
            className={styles.unavailable}
            testID="report-unavailable"
          >
            <View className={styles.unavailableIcon}>
              <AlertCircle
                color={colors.textMuted}
                size={34}
                strokeWidth={2.5}
              />
            </View>
            <Text className={styles.unavailableTitle}>
              {messages.unavailableTitle}
            </Text>
            <Text className={styles.unavailableDescription}>
              {messages.unavailableDescription}
            </Text>
            <Button
              className={styles.unavailableButton}
              onPress={() => router.back()}
              testID="report-unavailable-back"
            >
              {messages.back}
            </Button>
          </View>
        </ScrollView>
      </ScreenLayout>
    );
  }

  const messageId = rawMessageId.trim();

  const contextCard =
    conversationTitle || senderName ? (
      <View className={styles.contextCard} testID="report-context">
        <Text className={styles.contextLabel}>{messages.contextLabel}</Text>
        {conversationTitle ? (
          <Text className={styles.contextItem} numberOfLines={2}>
            {messages.contextConversation(conversationTitle)}
          </Text>
        ) : null}
        {senderName ? (
          <Text className={styles.contextItem} numberOfLines={1}>
            {messages.contextSender(senderName)}
          </Text>
        ) : null}
        <Text className={styles.contextDescription}>
          {messages.contextDescription}
        </Text>
      </View>
    ) : null;

  const reasonError =
    attempted && !reason ? messages.reasonRequired : undefined;
  const detailTooLong = detail.length > 1000;
  const detailsError =
    attempted && detailTooLong ? messages.detailsTooLong : undefined;

  const handleReview = () => {
    setAttempted(true);
    if (!reason || detailTooLong) return;
    setSubmitError(null);
    setStep("review");
  };

  const handleEdit = () => {
    setSubmitError(null);
    setStep("form");
  };

  const handleSubmit = async () => {
    if (!reason || isSubmitting) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await chatApi.submitMessageReport({
        messageId,
        reason,
        detail,
      });
      setStep("submitted");
    } catch (error) {
      setSubmitError(
        getLocalizedErrorMessage(error, locale, {
          fallback: messages.submitError,
        })
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScreenLayout edges={["top", "left", "right"]} className={styles.safeArea}>
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
                {messages.backToChat}
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
              {submitError ? (
                <View
                  accessibilityRole="alert"
                  className={styles.errorBanner}
                  testID="report-error-banner"
                >
                  <Text className={styles.errorText}>{submitError}</Text>
                </View>
              ) : null}
              <View className={styles.reviewField}>
                <Text className={styles.reviewLabel}>
                  {messages.reviewReason}
                </Text>
                <Text
                  className={styles.reviewValue}
                  testID="report-review-reason"
                >
                  {reason ? messages.reasonOptions[reason] : ""}
                </Text>
              </View>
              <View className={styles.reviewField}>
                <Text className={styles.reviewLabel}>
                  {messages.reviewDetails}
                </Text>
                <Text
                  className={styles.reviewDetailsValue}
                  testID="report-review-details"
                >
                  {detail.trim() || messages.noDetails}
                </Text>
              </View>
              <View className={styles.reviewActions}>
                <Button
                  disabled={isSubmitting}
                  onPress={handleEdit}
                  testID="report-edit"
                  variant="secondary"
                >
                  {messages.edit}
                </Button>
                <Button
                  className={styles.submitButton}
                  disabled={isSubmitting}
                  onPress={handleSubmit}
                  style={{ backgroundColor: colors.danger }}
                  testID="report-submit-confirm"
                >
                  {isSubmitting
                    ? messages.submitting
                    : submitError
                      ? messages.retry
                      : messages.submit}
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
                <View className={styles.reasonField}>
                  <Text className={styles.reasonLabel}>
                    {messages.reasonLabel}
                  </Text>
                  <View
                    className={styles.choiceList}
                    accessibilityRole="radiogroup"
                  >
                    {MESSAGE_REPORT_REASONS.map((reasonKey) => {
                      const selected = reason === reasonKey;
                      const label = messages.reasonOptions[reasonKey];
                      return (
                        <Pressable
                          key={reasonKey}
                          accessibilityLabel={`${messages.reasonLabel}: ${label}`}
                          accessibilityRole="radio"
                          accessibilityState={{ selected, checked: selected }}
                          className={cn(
                            styles.choiceItem,
                            selected && styles.choiceItemSelected
                          )}
                          onPress={() => setReason(reasonKey)}
                          testID={`report-reason-${reasonKey}`}
                        >
                          <Text
                            className={cn(
                              styles.choiceLabel,
                              selected && styles.choiceLabelSelected
                            )}
                          >
                            {label}
                          </Text>
                          <View
                            className={cn(
                              styles.radioIndicator,
                              selected && styles.radioIndicatorSelected
                            )}
                          >
                            {selected ? (
                              <View className={styles.radioDot} />
                            ) : null}
                          </View>
                        </Pressable>
                      );
                    })}
                  </View>
                  {reasonError ? (
                    <Text
                      accessibilityRole="alert"
                      className={styles.reasonError}
                    >
                      {reasonError}
                    </Text>
                  ) : null}
                </View>
                <View className={styles.detailsField}>
                  <TextArea
                    error={detailsError}
                    label={messages.detailsLabel}
                    maxLength={1000}
                    onChangeText={setDetail}
                    placeholder={messages.detailsPlaceholder}
                    value={detail}
                    testID="report-details-input"
                  />
                  <Text className={styles.counter}>{detail.length}/1000</Text>
                  <Text className={styles.helper}>{messages.detailsHint}</Text>
                </View>
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
    </ScreenLayout>
  );
}
