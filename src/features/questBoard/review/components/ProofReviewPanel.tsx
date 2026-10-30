import { useMemo, useRef, useState } from "react";
import type { ComponentRef } from "react";
import { Modal } from "react-native";
import { FileText, ImageIcon } from "lucide-react-native";

import { Button } from "@/components/ui/Button";
import { ImageViewerModal } from "@/components/ui/ImageViewerModal";
import { TextArea } from "@/components/ui/TextArea";
import { useLocale } from "@/features/preferences/localeStore";
import { questBoardMessages } from "@/locales/questBoardMessages";
import { useAppTheme } from "@/features/workspace/AppThemeProvider";
import { QuestProofFileStatus } from "@/features/questBoard/domain/types";
import { showErrorAlert } from "@/components/ui/SweetAlert";
import {
  Image,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  Text,
  View,
} from "@/tw";

import type { QuestV2ProofReviewPayload } from "@/api/QuestApi";
import type { QuestV2ProofSubmission } from "@/api/questV2Contracts";
import styles from "../../styles/questDetailStyles";
import { formatTimestamp } from "@/domain/datetime";
import { getLocalizedErrorMessage } from "@/utils/error";
import { formatProofFileSize } from "../../shared/proofFileUtils";
import {
  downloadAndShareProofFile,
  getProofFileLinkForUse,
  isUsableProofFileLink,
  openProofFile,
  ProofFileAccessError,
  type UsableProofFileLink,
} from "../../shared/proofFileService";

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

function fileKind(contentType: string | null): "image" | "video" | "file" {
  if (contentType?.startsWith("image/")) return "image";
  if (contentType?.startsWith("video/")) return "video";
  return "file";
}

/**
 * Proof evidence and decision actions. The non-approval reason is collected
 * in a separate dialog. Mount it with `key={proof.id}` to reset between proofs.
 */
export function ProofReviewPanel({
  proof,
  dueAt,
  onDone,
  onReview,
}: ProofReviewPanelProps) {
  const { colors } = useAppTheme();
  const { locale } = useLocale();
  const messages = questBoardMessages[locale];
  const [reason, setReason] = useState("");
  const [reasonDialogVisible, setReasonDialogVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [viewingImage, setViewingImage] = useState<{
    fileName: string;
    url: string;
  } | null>(null);
  const [resolvedFileLinks, setResolvedFileLinks] = useState<
    Record<string, UsableProofFileLink>
  >({});
  const [downloadingFileIds, setDownloadingFileIds] = useState<Set<string>>(
    () => new Set()
  );
  const [resolvingFileIds, setResolvingFileIds] = useState<Set<string>>(
    () => new Set()
  );
  const reasonDialogScrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
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
      if (result !== false) {
        setReasonDialogVisible(false);
        onDone();
      } else setError(messages.manageSnapshotError);
    } catch (caught) {
      setError(
        getLocalizedErrorMessage(caught, locale, {
          fallback: messages.manageSnapshotError,
        })
      );
    } finally {
      setBusy(false);
    }
  };

  const openReasonDialog = () => {
    setError(undefined);
    setReasonDialogVisible(true);
  };

  const closeReasonDialog = () => {
    if (busy) return;
    setError(undefined);
    setReasonDialogVisible(false);
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

  const resolveFileLink = async (
    file: QuestV2ProofSubmission["files"][number]
  ) => {
    if (!file.fileId) throw new ProofFileAccessError("unavailable");
    setResolvingFileIds((current) => new Set(current).add(file.fileId!));
    try {
      const link = await getProofFileLinkForUse(
        { questId: proof.questId, proofSubmissionId: proof.id, file },
        resolvedFileLinks[file.fileId] ?? file
      );
      setResolvedFileLinks((current) => ({
        ...current,
        [file.fileId!]: link,
      }));
      return link;
    } finally {
      setResolvingFileIds((current) => {
        const next = new Set(current);
        next.delete(file.fileId!);
        return next;
      });
    }
  };

  const openPreview = async (file: QuestV2ProofSubmission["files"][number]) => {
    const fileId = file.fileId;
    if (!fileId) {
      setError(messages.proofReviewPreviewUnavailable);
      return;
    }
    setResolvingFileIds((current) => new Set(current).add(fileId));
    try {
      const link = await openProofFile(
        { questId: proof.questId, proofSubmissionId: proof.id, file },
        resolvedFileLinks[fileId] ?? file
      );
      setResolvedFileLinks((current) => ({
        ...current,
        [fileId]: link,
      }));
    } catch (caught) {
      setError(
        caught instanceof ProofFileAccessError &&
          caught.reason === "unavailable"
          ? messages.proofReviewPreviewUnavailable
          : messages.proofReviewPreviewError
      );
    } finally {
      setResolvingFileIds((current) => {
        const next = new Set(current);
        next.delete(fileId);
        return next;
      });
    }
  };

  const openImage = async (
    file: QuestV2ProofSubmission["files"][number],
    fileName: string
  ) => {
    try {
      const link = await resolveFileLink(file);
      setViewingImage({ fileName, url: link.url });
    } catch (caught) {
      setError(
        caught instanceof ProofFileAccessError &&
          caught.reason === "unavailable"
          ? messages.proofReviewPreviewUnavailable
          : messages.proofReviewPreviewError
      );
    }
  };

  const downloadProofFile = async (
    file: QuestV2ProofSubmission["files"][number]
  ) => {
    const fileId = file.fileId;
    if (!fileId || downloadingFileIds.has(fileId)) return;
    setDownloadingFileIds((current) => new Set(current).add(fileId));
    try {
      await downloadAndShareProofFile(
        { questId: proof.questId, proofSubmissionId: proof.id, file },
        resolvedFileLinks[fileId] ?? file
      );
    } catch (caught) {
      const message =
        caught instanceof ProofFileAccessError
          ? caught.reason === "sharing-unavailable"
            ? messages.proofReviewSharingUnavailable
            : messages.proofReviewPreviewUnavailable
          : messages.proofReviewDownloadError;
      showErrorAlert(messages.proofReviewDownloadErrorTitle, message);
    } finally {
      setDownloadingFileIds((current) => {
        const next = new Set(current);
        next.delete(fileId);
        return next;
      });
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
                const size = formatProofFileSize(file.sizeBytes);
                const fileLink = resolvedFileLinks[file.fileId ?? ""] ?? file;
                const fileUrl = isUsableProofFileLink(fileLink)
                  ? fileLink.url
                  : undefined;
                const fileLabel = messages.proofReviewFileLabel(
                  file.position + 1,
                  file.contentType,
                  size
                );
                const fileId = file.fileId ?? "";
                const isDownloading = downloadingFileIds.has(fileId);
                const isResolving = resolvingFileIds.has(fileId);
                const ready =
                  file.uploadStatus === QuestProofFileStatus.PROOF_FILE_READY &&
                  file.fileId !== null;
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
                        accessibilityState={{
                          busy: isResolving,
                          disabled: isResolving,
                        }}
                        disabled={isResolving}
                        onPress={() => void openImage(file, fileLabel)}
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
                        <Text className="mt-ku-2 font-ku-regular text-ku-label text-ku-text-secondary">
                          {messages.proofReviewFileStatus(file.uploadStatus)}
                        </Text>
                      </View>
                      <View className="flex-row items-center gap-ku-xs">
                        {ready && kind !== "image" ? (
                          <Pressable
                            accessibilityLabel={`${messages.proofReviewPreview}: ${fileLabel}`}
                            accessibilityRole="button"
                            accessibilityState={{
                              busy: isResolving,
                              disabled: isResolving,
                            }}
                            className="min-h-[48px] items-center justify-center rounded-ku-control border border-ku-primary px-ku-10"
                            disabled={isResolving}
                            onPress={() => void openPreview(file)}
                            testID={`proof-review-preview-${file.position}`}
                          >
                            <Text className="font-ku-semibold text-ku-label text-ku-primary">
                              {messages.proofReviewPreview}
                            </Text>
                          </Pressable>
                        ) : null}
                        {ready ? (
                          <Pressable
                            accessibilityLabel={`${messages.proofReviewDownload}: ${fileLabel}`}
                            accessibilityRole="button"
                            accessibilityState={{
                              busy: isDownloading,
                              disabled: isDownloading,
                            }}
                            className="min-h-[48px] items-center justify-center rounded-ku-pill border border-ku-primary px-ku-10"
                            disabled={isDownloading}
                            onPress={() => void downloadProofFile(file)}
                            testID={`proof-review-download-${file.position}`}
                          >
                            <Text className="font-ku-semibold text-ku-label text-ku-primary">
                              {isDownloading
                                ? messages.proofReviewDownloading
                                : messages.proofReviewDownload}
                            </Text>
                          </Pressable>
                        ) : null}
                        {ready && kind === "image" && !fileUrl ? (
                          <Pressable
                            accessibilityLabel={`${messages.proofReviewFileRefresh}: ${fileLabel}`}
                            accessibilityRole="button"
                            accessibilityState={{
                              busy: isResolving,
                              disabled: isResolving,
                            }}
                            className="min-h-[48px] items-center justify-center rounded-ku-pill border border-ku-primary px-ku-10"
                            disabled={isResolving}
                            onPress={() => void openImage(file, fileLabel)}
                            testID={`proof-review-refresh-file-${file.position}`}
                          >
                            <Text className="font-ku-semibold text-ku-label text-ku-primary">
                              {isResolving
                                ? messages.loading
                                : messages.proofReviewFileRefresh}
                            </Text>
                          </Pressable>
                        ) : null}
                      </View>
                    </View>
                    {!fileUrl ? (
                      <Text className="mt-ku-sm font-ku-regular text-ku-label text-ku-text-secondary">
                        {messages.proofReviewPreviewUnavailable}
                      </Text>
                    ) : null}
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {error && !reasonDialogVisible ? (
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
        <Button
          className="w-auto flex-1"
          disabled={busy}
          onPress={openReasonDialog}
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
      <Modal
        animationType="fade"
        onRequestClose={closeReasonDialog}
        transparent
        visible={reasonDialogVisible}
      >
        <Pressable
          accessible={false}
          className={styles.proofReviewReasonBackdrop}
          onPress={closeReasonDialog}
        >
          <KeyboardAvoidingView
            behavior="padding"
            className="flex-1 justify-center"
          >
            <Pressable
              accessibilityRole="none"
              accessible={false}
              accessibilityViewIsModal
              className={styles.proofReviewReasonDialog}
              onPress={() => undefined}
              testID="proof-review-reason-dialog"
            >
              <ScrollView
                ref={reasonDialogScrollRef}
                className="shrink"
                contentContainerClassName={styles.proofReviewReasonContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                testID="proof-review-reason-scroll"
              >
                <Text
                  accessibilityRole="header"
                  className={styles.proofReviewReasonTitle}
                >
                  {messages.proofReviewDoNotApprove}
                </Text>
                <TextArea
                  accessibilityLabel={messages.proofReviewReasonLabel}
                  editable={!busy}
                  label={messages.proofReviewReasonLabel}
                  maxLength={MAX_REVIEW_REASON_LENGTH}
                  onChangeText={(value) => {
                    setReason(value);
                    if (error) setError(undefined);
                  }}
                  onFocus={() =>
                    reasonDialogScrollRef.current?.scrollToEnd({
                      animated: true,
                    })
                  }
                  placeholder={messages.proofReviewReasonPlaceholder}
                  testID="proof-review-reason-input"
                  value={reason}
                />
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
              <View className={styles.proofReviewReasonActions}>
                <Button
                  disabled={busy}
                  onPress={confirmNotApproved}
                  testID="proof-review-confirm-not-approved"
                >
                  {messages.proofReviewConfirmNotApproved}
                </Button>
                <Button
                  disabled={busy}
                  onPress={closeReasonDialog}
                  testID="proof-review-cancel-not-approved"
                  variant="secondary"
                >
                  {messages.cancel}
                </Button>
              </View>
            </Pressable>
          </KeyboardAvoidingView>
        </Pressable>
      </Modal>
    </>
  );
}
