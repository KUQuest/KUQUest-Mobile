import { useEffect, useMemo, useState } from "react";
import { Linking, Modal } from "react-native";
import { FileText, ImageIcon, ShieldCheck, X } from "lucide-react-native";

import { Button } from "@/components/ui/Button";
import { TextArea } from "@/features/onboarding/components/TextArea";
import { useLocale } from "@/features/preferences/localeStore";
import { questBoardMessages } from "@/locales/questBoardMessages";
import { colors } from "@/theme/colors";
import { Image, Pressable, SafeAreaView, ScrollView, Text, View } from "@/tw";

import type { QuestV2ProofReviewPayload } from "@/api/QuestApi";
import type { QuestV2ProofSubmission } from "@/api/questV2Contracts";
import styles from "../questDetailStyles";

const MAX_REVIEW_REASON_LENGTH = 1000;

export interface ProofReviewModalProps {
  visible: boolean;
  proof: QuestV2ProofSubmission | null | undefined;
  dueAt?: string | null;
  onClose: () => void;
  onReview: (
    payload: QuestV2ProofReviewPayload
  ) => Promise<boolean | void> | boolean | void;
}

function formatTimestamp(
  value: string | null | undefined,
  locale: "en" | "th"
) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(locale === "th" ? "th-TH" : "en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatFileSize(sizeBytes: number | null): string {
  if (sizeBytes === null) return "";
  if (sizeBytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(sizeBytes / 1024))} KB`;
  }
  return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileKind(contentType: string): "image" | "video" | "file" {
  if (contentType.startsWith("image/")) return "image";
  if (contentType.startsWith("video/")) return "video";
  return "file";
}

export function ProofReviewModal({
  visible,
  proof,
  dueAt,
  onClose,
  onReview,
}: ProofReviewModalProps) {
  const { locale } = useLocale();
  const messages = questBoardMessages[locale];
  const [decisionMode, setDecisionMode] = useState<"review" | "not-approved">(
    "review"
  );
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  /* eslint-disable react-hooks/set-state-in-effect -- reopening the review resets local form state. */
  useEffect(() => {
    if (!visible) return;
    setDecisionMode("review");
    setReason("");
    setBusy(false);
    setError(undefined);
  }, [proof?.id, visible]);
  /* eslint-enable react-hooks/set-state-in-effect */
  const submittedAt = useMemo(
    () => formatTimestamp(proof?.submittedAt, locale),
    [locale, proof?.submittedAt]
  );
  const deadline = useMemo(
    () => formatTimestamp(dueAt, locale),
    [dueAt, locale]
  );

  if (!proof) return null;

  const runReview = async (payload: QuestV2ProofReviewPayload) => {
    if (busy) return;
    setBusy(true);
    setError(undefined);
    try {
      const result = await onReview(payload);
      if (result !== false) onClose();
      else setError(messages.errorDescription);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : messages.errorDescription
      );
    } finally {
      setBusy(false);
    }
  };

  const confirmNotApproved = () => {
    const normalizedReason = reason.trim();
    if (!normalizedReason) {
      setError(messages.proofReviewReasonRequired);
      return;
    }
    if (normalizedReason.length > MAX_REVIEW_REASON_LENGTH) {
      setError(messages.proofReviewReasonTooLong);
      return;
    }
    void runReview({
      decision: "PROOF_NOT_APPROVED",
      reason: normalizedReason,
    });
  };

  const openPreview = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch {
      setError(messages.proofReviewPreviewError);
    }
  };

  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      transparent
      visible={visible}
    >
      <Pressable
        accessibilityLabel={messages.close}
        accessibilityRole="button"
        className={styles.proofSheetBackdrop}
        onPress={onClose}
      >
        <Pressable
          accessibilityRole="none"
          accessible={false}
          accessibilityViewIsModal
          className={styles.proofSheet}
          onPress={() => undefined}
          testID="proof-review-modal"
        >
          <SafeAreaView edges={["bottom"]}>
            <View className={styles.proofSheetHeader}>
              <View className={styles.proofSheetHeaderCopy}>
                <View className="flex-row items-center gap-[8px]">
                  <ShieldCheck color={colors.primary} size={22} />
                  <Text
                    accessibilityRole="header"
                    className={styles.proofSheetTitle}
                  >
                    {messages.proofReviewTitle}
                  </Text>
                </View>
                <Text className={styles.proofSheetDescription}>
                  {messages.proofReviewDescription}
                </Text>
              </View>
              <Pressable
                accessibilityLabel={messages.close}
                accessibilityRole="button"
                className={styles.sheetCloseButton}
                onPress={onClose}
                testID="proof-review-close"
              >
                <X color={colors.textStrong} size={24} />
              </Pressable>
            </View>

            <ScrollView
              contentContainerClassName={styles.proofSheetContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View className="gap-[8px] rounded-[14px] bg-ku-surface-accent p-[14px]">
                <Text className="font-ku-medium text-ku-label text-ku-text-muted">
                  {messages.proofReviewSubmittedAt}
                </Text>
                <Text className="font-ku-semibold text-ku-body-small text-ku-text-strong">
                  {submittedAt}
                </Text>
                <Text className="mt-[4px] font-ku-medium text-ku-label text-ku-text-muted">
                  {messages.proofReviewDueAt}
                </Text>
                <Text className="font-ku-semibold text-ku-body-small text-ku-text-strong">
                  {deadline}
                </Text>
              </View>

              <View className="mt-[16px]">
                <Text className="font-ku-bold text-ku-body text-ku-text-strong">
                  {messages.proofReviewDescriptionLabel}
                </Text>
                <Text className="mt-[8px] font-ku-regular text-ku-body-small text-ku-text-secondary">
                  {proof.description?.trim() ||
                    messages.proofReviewNoDescription}
                </Text>
              </View>

              <View className="mt-[20px]">
                <Text className="font-ku-bold text-ku-body text-ku-text-strong">
                  {messages.proofReviewEvidenceLabel}
                </Text>
                {proof.files.length === 0 ? (
                  <Text className="mt-[8px] font-ku-regular text-ku-body-small text-ku-text-secondary">
                    {messages.proofReviewNoEvidence}
                  </Text>
                ) : (
                  <View className="mt-[8px] gap-[10px]">
                    {proof.files.map((file) => {
                      const kind = fileKind(file.contentType);
                      const size = formatFileSize(file.sizeBytes);
                      const fileUrl = file.url ?? undefined;
                      return (
                        <View
                          className="rounded-[14px] border border-ku-border-subtle bg-ku-surface-muted p-[10px]"
                          key={file.fileId}
                          testID={`proof-review-file-${file.position}`}
                        >
                          {fileUrl && kind === "image" ? (
                            <Pressable
                              accessibilityLabel={messages.proofReviewPreview}
                              accessibilityRole="button"
                              onPress={() => void openPreview(fileUrl)}
                            >
                              <Image
                                accessibilityLabel={messages.proofReviewPreview}
                                className="h-[160px] w-full rounded-[10px]"
                                contentFit="cover"
                                source={{ uri: fileUrl }}
                              />
                            </Pressable>
                          ) : null}
                          <View className="flex-row items-center">
                            {kind === "image" ? (
                              <ImageIcon color={colors.primary} size={20} />
                            ) : (
                              <FileText color={colors.primary} size={20} />
                            )}
                            <View className="ml-[10px] flex-1">
                              <Text className="font-ku-semibold text-ku-body-small text-ku-text-strong">
                                {messages.proofReviewFileLabel(
                                  file.position + 1,
                                  file.contentType,
                                  size
                                )}
                              </Text>
                              <Text className="mt-[2px] font-ku-regular text-ku-label text-ku-text-muted">
                                {messages.proofReviewFileStatus(
                                  file.uploadStatus
                                )}
                              </Text>
                            </View>
                            {fileUrl && kind !== "image" ? (
                              <Pressable
                                accessibilityLabel={messages.proofReviewPreview}
                                accessibilityRole="button"
                                className="rounded-ku-pill border border-ku-primary px-[10px] py-[7px]"
                                onPress={() => void openPreview(fileUrl)}
                              >
                                <Text className="font-ku-semibold text-ku-label text-ku-primary">
                                  {messages.proofReviewPreview}
                                </Text>
                              </Pressable>
                            ) : null}
                          </View>
                          {!fileUrl ? (
                            <Text className="mt-[8px] font-ku-regular text-ku-label text-ku-text-muted">
                              {messages.proofReviewPreviewUnavailable}
                            </Text>
                          ) : null}
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>

              {decisionMode === "not-approved" ? (
                <View className="mt-[20px]">
                  <TextArea
                    accessibilityLabel={messages.proofReviewReasonLabel}
                    label={messages.proofReviewReasonLabel}
                    maxLength={MAX_REVIEW_REASON_LENGTH}
                    onChangeText={setReason}
                    placeholder={messages.proofReviewReasonPlaceholder}
                    testID="proof-review-reason-input"
                    value={reason}
                  />
                </View>
              ) : null}

              {error ? (
                <Text
                  accessibilityRole="alert"
                  className={styles.proofValidation}
                  testID="proof-review-error"
                >
                  {error}
                </Text>
              ) : null}
            </ScrollView>

            <View
              className={styles.proofSheetActions}
              pointerEvents={busy ? "none" : "auto"}
            >
              {decisionMode === "not-approved" ? (
                <>
                  <Button
                    disabled={busy}
                    onPress={() => {
                      setDecisionMode("review");
                      setError(undefined);
                    }}
                    testID="proof-review-back"
                    variant="secondary"
                  >
                    {messages.cancel}
                  </Button>
                  <Button
                    disabled={busy}
                    onPress={confirmNotApproved}
                    testID="proof-review-confirm-not-approve"
                  >
                    {messages.proofReviewConfirmNotApproved}
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    disabled={busy}
                    onPress={() => setDecisionMode("not-approved")}
                    testID="proof-review-not-approve"
                    variant="secondary"
                  >
                    {messages.proofReviewDoNotApprove}
                  </Button>
                  <Button
                    disabled={busy}
                    onPress={() =>
                      void runReview({ decision: "PROOF_APPROVED" })
                    }
                    testID="proof-review-approve"
                  >
                    {messages.proofReviewApprove}
                  </Button>
                </>
              )}
            </View>
          </SafeAreaView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
