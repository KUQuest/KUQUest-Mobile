import { useState } from "react";
import { Modal } from "react-native";
import { ShieldCheck, X } from "lucide-react-native";

import { Button } from "@/components/ui/Button";
import { TextArea } from "@/components/ui/TextArea";
import type { QuestV2CompletionConfirmationReviewPayload } from "@/api/QuestApi";
import { useLocale } from "@/features/preferences/localeStore";
import { useAppTheme } from "@/features/workspace/AppThemeProvider";
import { questBoardMessages } from "@/locales/questBoardMessages";
import {
  KeyboardAvoidingView,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  View,
} from "@/tw";
import { formatTimestamp } from "@/domain/datetime";
import type { CompletionConfirmationReviewRow } from "../completionConfirmationReviewRows";
import styles from "../../styles/questDetailStyles";
import { QuestCompletionConfirmationStatus } from "../../domain/types";

export interface CompletionConfirmationReviewModalProps {
  row: CompletionConfirmationReviewRow | null;
  busy: boolean;
  error?: string;
  onClose: () => void;
  onReview: (
    payload: QuestV2CompletionConfirmationReviewPayload
  ) => Promise<boolean>;
}

export function CompletionConfirmationReviewModal({
  row,
  busy,
  error,
  onClose,
  onReview,
}: CompletionConfirmationReviewModalProps) {
  const { locale } = useLocale();
  const { colors } = useAppTheme();
  const messages = questBoardMessages[locale];
  const [reason, setReason] = useState("");
  const [decisionMode, setDecisionMode] = useState<"review" | "not-approved">(
    "review"
  );
  const [validationError, setValidationError] = useState<string>();

  if (!row) return null;
  const submittedAt = formatTimestamp(row.confirmation.confirmedAt, locale, "");
  const deadline = formatTimestamp(
    row.confirmation.reviewDeadlineAt,
    locale,
    ""
  );
  const submit = async (
    payload: QuestV2CompletionConfirmationReviewPayload
  ) => {
    setValidationError(undefined);
    if (await onReview(payload)) onClose();
  };
  const confirmNotApproved = () => {
    const trimmedReason = reason.trim();
    if (!trimmedReason) {
      setValidationError(messages.proofReviewReasonRequired);
      return;
    }
    if (trimmedReason.length > 1000) {
      setValidationError(messages.proofReviewReasonTooLong);
      return;
    }
    void submit({
      decision:
        QuestCompletionConfirmationStatus.COMPLETION_CONFIRMATION_NOT_APPROVED,
      reason: trimmedReason,
    });
  };

  return (
    <Modal animationType="slide" onRequestClose={onClose} transparent visible>
      <Pressable
        accessibilityLabel={messages.close}
        accessibilityRole="button"
        className={styles.proofSheetBackdrop}
        onPress={onClose}
      >
        <KeyboardAvoidingView behavior="padding" className="flex-1 justify-end">
          <Pressable
            accessibilityRole="none"
            accessible={false}
            accessibilityViewIsModal
            className={styles.proofSheet}
            onPress={() => undefined}
            testID="completion-confirmation-review-modal"
          >
            <SafeAreaView className="shrink" edges={["bottom"]}>
              <View className={styles.proofSheetHeader}>
                <View className={styles.proofSheetHeaderCopy}>
                  <View className="flex-row items-center gap-ku-sm">
                    <ShieldCheck color={colors.primary} size={22} />
                    <Text
                      accessibilityRole="header"
                      className={styles.proofSheetTitle}
                    >
                      {messages.completionReviewTitle}
                    </Text>
                  </View>
                </View>
                <Pressable
                  accessibilityLabel={messages.close}
                  accessibilityRole="button"
                  className={styles.completionReviewCloseButton}
                  onPress={onClose}
                  testID="completion-confirmation-review-close"
                >
                  <X color={colors.textStrong} size={24} />
                </Pressable>
              </View>
              <ScrollView
                className="max-h-[70vh] px-ku-lg"
                contentContainerClassName="gap-ku-md pb-ku-md"
                keyboardShouldPersistTaps="handled"
              >
                <Text
                  accessibilityRole="header"
                  className="font-ku-bold text-ku-body text-ku-text-strong"
                >
                  {row.kind === "team"
                    ? messages.completionReviewTeamFallback
                    : (row.name ?? messages.completionReviewWorkerFallback)}
                </Text>
                <Text className="font-ku-regular text-ku-body-small text-ku-text-secondary">
                  {messages.completionReviewDescription}
                </Text>
                {submittedAt ? (
                  <Text className="font-ku-regular text-ku-body-small text-ku-text-secondary">
                    {`${messages.completionReviewSentAt}: ${submittedAt}`}
                  </Text>
                ) : null}
                {deadline ? (
                  <Text className="font-ku-regular text-ku-body-small text-ku-text-secondary">
                    {`${messages.completionReviewDeadline}: ${deadline}`}
                  </Text>
                ) : null}
                {decisionMode === "not-approved" ? (
                  <TextArea
                    accessibilityLabel={messages.proofReviewReasonLabel}
                    label={messages.proofReviewReasonLabel}
                    maxLength={1000}
                    onChangeText={setReason}
                    placeholder={messages.proofReviewReasonPlaceholder}
                    testID="completion-confirmation-review-reason"
                    value={reason}
                  />
                ) : null}
                {validationError || error ? (
                  <Text
                    accessibilityRole="alert"
                    className="font-ku-medium text-ku-body-small text-ku-danger-dark"
                    testID="completion-confirmation-review-error"
                  >
                    {validationError ?? error}
                  </Text>
                ) : null}
              </ScrollView>
              <View className="flex-row gap-ku-sm px-ku-lg pt-ku-sm">
                {decisionMode === "not-approved" ? (
                  <>
                    <Button
                      className="flex-1"
                      disabled={busy}
                      onPress={() => {
                        setDecisionMode("review");
                        setValidationError(undefined);
                      }}
                      variant="secondary"
                    >
                      {messages.cancel}
                    </Button>
                    <Button
                      className="flex-1"
                      disabled={busy}
                      onPress={confirmNotApproved}
                      testID="completion-confirmation-review-confirm-not-approved"
                    >
                      {messages.proofReviewConfirmNotApproved}
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      className="flex-1"
                      disabled={busy}
                      onPress={() => {
                        setDecisionMode("not-approved");
                        setValidationError(undefined);
                      }}
                      variant="secondary"
                      testID="completion-confirmation-review-not-approved"
                    >
                      {messages.proofReviewDoNotApprove}
                    </Button>
                    <Button
                      className="flex-1"
                      disabled={busy}
                      onPress={() =>
                        void submit({
                          decision:
                            QuestCompletionConfirmationStatus.COMPLETION_CONFIRMATION_APPROVED,
                        })
                      }
                      testID="completion-confirmation-review-approve"
                    >
                      {messages.proofReviewApprove}
                    </Button>
                  </>
                )}
              </View>
            </SafeAreaView>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}
