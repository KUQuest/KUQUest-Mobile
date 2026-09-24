import { useMemo, useState } from "react";
import { Linking } from "react-native";
import { FileText, ImageIcon } from "lucide-react-native";

import { Button } from "@/components/ui/Button";
import { ImageViewerModal } from "@/components/ui/ImageViewerModal";
import { TextArea } from "@/components/ui/TextArea";
import { useLocale } from "@/features/preferences/localeStore";
import { questBoardMessages } from "@/locales/questBoardMessages";
import { colors } from "@/theme/colors";
import { Image, Pressable, ScrollView, Text, View } from "@/tw";

import type { QuestV2ProofReviewPayload } from "@/api/QuestApi";
import type { QuestV2ProofSubmission } from "@/api/questV2Contracts";
import styles from "../../styles/questDetailStyles";
import { formatTimestamp } from "@/domain/datetime";

const MAX_REVIEW_REASON_LENGTH = 1000;

export interface ProofReviewPanelProps {
  proof: QuestV2ProofSubmission;
  dueAt?: string | null;
  /** Called after the Server accepted the decision. */
  onDone: () => void;
  onReview: (
    payload: QuestV2ProofReviewPayload
  ) => Promise<boolean | void> | boolean | void;
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

/**
 * Proof evidence plus the approve / do-not-approve decision form. Mount it
 * with `key={proof.id}` so a different Proof starts with a fresh form.
 */
export function ProofReviewPanel({
  proof,
  dueAt,
  onDone,
  onReview,
}: ProofReviewPanelProps) {
  const { locale } = useLocale();
  const messages = questBoardMessages[locale];
  const [decisionMode, setDecisionMode] = useState<"review" | "not-approved">(
    "review"
  );
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [viewingImage, setViewingImage] = useState<{
    fileName: string;
    url: string;
  } | null>(null);
  const submittedAt = useMemo(
    () => formatTimestamp(proof.submittedAt, locale, "—"),
    [locale, proof.submittedAt]
  );
  const deadline = useMemo(
    () => formatTimestamp(dueAt, locale, "—"),
    [dueAt, locale]
  );

  const runReview = async (payload: QuestV2ProofReviewPayload) => {
    if (busy) return;
    setBusy(true);
    setError(undefined);
    try {
      const result = await onReview(payload);
      if (result !== false) onDone();
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
    <>
      <ScrollView
        className="shrink"
        contentContainerClassName={styles.proofSheetContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="gap-ku-sm rounded-[14px] bg-ku-surface-accent p-ku-14">
          <Text className="font-ku-medium text-ku-label text-ku-text-muted">
            {messages.proofReviewSubmittedAt}
          </Text>
          <Text className="font-ku-semibold text-ku-body-small text-ku-text-strong">
            {submittedAt}
          </Text>
          <Text className="mt-ku-xs font-ku-medium text-ku-label text-ku-text-muted">
            {messages.proofReviewDueAt}
          </Text>
          <Text className="font-ku-semibold text-ku-body-small text-ku-text-strong">
            {deadline}
          </Text>
        </View>

        <View className="mt-ku-md">
          <Text className="font-ku-bold text-ku-body text-ku-text-strong">
            {messages.proofReviewDescriptionLabel}
          </Text>
          <Text className="mt-ku-sm font-ku-regular text-ku-body-small text-ku-text-secondary">
            {proof.description?.trim() || messages.proofReviewNoDescription}
          </Text>
        </View>

        <View className="mt-ku-20">
          <Text className="font-ku-bold text-ku-body text-ku-text-strong">
            {messages.proofReviewEvidenceLabel}
          </Text>
          {proof.files.length === 0 ? (
            <Text className="mt-ku-sm font-ku-regular text-ku-body-small text-ku-text-secondary">
              {messages.proofReviewNoEvidence}
            </Text>
          ) : (
            <View className="mt-ku-sm gap-ku-10">
              {proof.files.map((file) => {
                const kind = fileKind(file.contentType);
                const size = formatFileSize(file.sizeBytes);
                const fileUrl = file.url ?? undefined;
                const fileLabel = messages.proofReviewFileLabel(
                  file.position + 1,
                  file.contentType,
                  size
                );
                return (
                  <View
                    className="rounded-[14px] border border-ku-border-subtle bg-ku-surface-muted p-ku-10"
                    key={file.fileId}
                    testID={`proof-review-file-${file.position}`}
                  >
                    {fileUrl && kind === "image" ? (
                      <Pressable
                        accessibilityLabel={`${messages.proofReviewPreview}: ${fileLabel}`}
                        accessibilityRole="button"
                        onPress={() =>
                          setViewingImage({ fileName: fileLabel, url: fileUrl })
                        }
                        testID={`proof-review-preview-${file.position}`}
                      >
                        <Image
                          accessible={false}
                          className={styles.questImageFeatured}
                          testID={`proof-review-image-${file.position}`}
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
                      <View className="ml-ku-10 flex-1">
                        <Text className="font-ku-semibold text-ku-body-small text-ku-text-strong">
                          {fileLabel}
                        </Text>
                        <Text className="mt-ku-2 font-ku-regular text-ku-label text-ku-text-muted">
                          {messages.proofReviewFileStatus(file.uploadStatus)}
                        </Text>
                      </View>
                      {fileUrl && kind !== "image" ? (
                        <Pressable
                          accessibilityLabel={messages.proofReviewPreview}
                          accessibilityRole="button"
                          className="rounded-ku-pill border border-ku-primary px-ku-10 py-ku-7"
                          onPress={() => void openPreview(fileUrl)}
                        >
                          <Text className="font-ku-semibold text-ku-label text-ku-primary">
                            {messages.proofReviewPreview}
                          </Text>
                        </Pressable>
                      ) : null}
                    </View>
                    {!fileUrl ? (
                      <Text className="mt-ku-sm font-ku-regular text-ku-label text-ku-text-muted">
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
          <View className="mt-ku-20">
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

      <View className={styles.proofSheetActions}>
        {decisionMode === "not-approved" ? (
          <>
            <Button
              className="w-auto flex-1"
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
              className="w-auto flex-1"
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
              className="w-auto flex-1"
              disabled={busy}
              onPress={() => setDecisionMode("not-approved")}
              testID="proof-review-not-approve"
              variant="secondary"
            >
              {messages.proofReviewDoNotApprove}
            </Button>
            <Button
              className="w-auto flex-1"
              disabled={busy}
              onPress={() => void runReview({ decision: "PROOF_APPROVED" })}
              testID="proof-review-approve"
            >
              {messages.proofReviewApprove}
            </Button>
          </>
        )}
      </View>
      <ImageViewerModal
        closeLabel={messages.close}
        fileName={viewingImage?.fileName}
        imageAccessibilityLabel={
          viewingImage?.fileName ?? messages.proofReviewEvidenceLabel
        }
        imageUrl={viewingImage?.url ?? null}
        onClose={() => setViewingImage(null)}
        visible={viewingImage !== null}
      />
    </>
  );
}
