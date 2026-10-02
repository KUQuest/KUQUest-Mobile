import { useMemo, useRef, useState } from "react";
import { Linking } from "react-native";
import type { ComponentRef } from "react";
import { FileText, ImageIcon } from "lucide-react-native";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";

import { Button } from "@/components/ui/Button";
import { ImageViewerModal } from "@/components/ui/ImageViewerModal";
import { TextArea } from "@/components/ui/TextArea";
import { useLocale } from "@/features/preferences/localeStore";
import { useSessionQuery } from "@/features/auth/sessionQueries";
import { useProofFileLinksQuery } from "@/features/questBoard/api/questBoardQueries";
import { questBoardMessages } from "@/locales/questBoardMessages";
import { useAppTheme } from "@/features/workspace/AppThemeProvider";
import { showErrorAlert } from "@/components/ui/SweetAlert";
import { Image, Pressable, ScrollView, Text, View } from "@/tw";

import type { QuestV2ProofReviewPayload } from "@/api/QuestApi";
import type {
  QuestV2ProofFileLink,
  QuestV2ProofSubmission,
} from "@/api/questV2Contracts";
import styles from "../../styles/questDetailStyles";
import { formatTimestamp } from "@/domain/datetime";
import { getLocalizedErrorMessage } from "@/utils/error";

const MAX_REVIEW_REASON_LENGTH = 1000;

function fileMimeType(contentType: string | null): string {
  return contentType?.split(";")[0]?.trim() || "application/octet-stream";
}

function fileUti(mimeType: string): string {
  return (
    {
      "application/pdf": "com.adobe.pdf",
      "image/gif": "com.compuserve.gif",
      "image/jpeg": "public.jpeg",
      "image/png": "public.png",
      "image/heic": "public.heic",
      "video/mp4": "public.mpeg-4",
      "video/quicktime": "com.apple.quicktime-movie",
    }[mimeType] ?? "public.data"
  );
}

function downloadName(
  fileId: string | null,
  position: number,
  mimeType: string
) {
  const rawExtension = mimeType.split("/")[1]?.replace("jpeg", "jpg");
  const extension =
    rawExtension && /^[a-z0-9.+-]+$/i.test(rawExtension) ? rawExtension : "bin";
  const safeFileId = fileId?.replace(/[^a-z0-9_-]/gi, "_") ?? `${position + 1}`;
  return `proof-${safeFileId}.${extension}`;
}

function isExpiredLinkError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const value = error as {
    status?: unknown;
    statusCode?: unknown;
    message?: unknown;
  };
  if (
    value.status === 403 ||
    value.status === 404 ||
    value.statusCode === 403 ||
    value.statusCode === 404
  )
    return true;
  return (
    typeof value.message === "string" && /\b(?:403|404)\b/.test(value.message)
  );
}

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

function fileKind(contentType: string | null): "image" | "video" | "file" {
  if (contentType?.startsWith("image/")) return "image";
  if (contentType?.startsWith("video/")) return "video";
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
  const { colors } = useAppTheme();
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
  const [downloadingFileIds, setDownloadingFileIds] = useState<Set<string>>(
    () => new Set()
  );
  const viewerId = useSessionQuery().data?.user.id ?? null;
  const scrollViewRef = useRef<ComponentRef<typeof ScrollView>>(null);
  const fileLinksQuery = useProofFileLinksQuery(proof.questId, viewerId, proof);
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
      else setError(messages.manageSnapshotError);
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

  const downloadProofFile = async (
    file: QuestV2ProofSubmission["files"][number]
  ) => {
    const fileId = file.fileId;
    const url = file.url;
    if (!fileId || !url || downloadingFileIds.has(fileId)) return;
    setDownloadingFileIds((current) => new Set(current).add(fileId));
    const mimeType = fileMimeType(file.contentType);
    const destination = new File(
      Paths.cache,
      downloadName(fileId, file.position, mimeType)
    );
    try {
      if (!(await Sharing.isAvailableAsync())) {
        showErrorAlert(
          messages.proofReviewDownloadErrorTitle,
          messages.proofReviewSharingUnavailable
        );
        return;
      }
      let downloaded;
      try {
        downloaded = await File.downloadFileAsync(url, destination, {
          idempotent: true,
        });
      } catch (caught) {
        if (!isExpiredLinkError(caught)) throw caught;
        const refreshed = await fileLinksQuery.refetch();
        const freshUrl = refreshed.data?.find(
          (link: QuestV2ProofFileLink) => link.fileId === fileId
        )?.url;
        if (!freshUrl) throw caught;
        downloaded = await File.downloadFileAsync(freshUrl, destination, {
          idempotent: true,
        });
      }
      await Sharing.shareAsync(downloaded.uri, {
        mimeType,
        UTI: fileUti(mimeType),
      });
    } catch {
      showErrorAlert(
        messages.proofReviewDownloadErrorTitle,
        messages.proofReviewDownloadError
      );
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
        ref={scrollViewRef}
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
                const isDownloading = downloadingFileIds.has(file.fileId ?? "");
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
                      <View className="flex-row items-center gap-ku-xs">
                        {fileUrl && kind !== "image" ? (
                          <Pressable
                            accessibilityLabel={`${messages.proofReviewPreview}: ${fileLabel}`}
                            accessibilityRole="button"
                            className="rounded-ku-pill border border-ku-primary px-ku-10 py-ku-7"
                            onPress={() => void openPreview(fileUrl)}
                          >
                            <Text className="font-ku-semibold text-ku-label text-ku-primary">
                              {messages.proofReviewPreview}
                            </Text>
                          </Pressable>
                        ) : null}
                        {fileUrl ? (
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
                      </View>
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
              onFocus={() =>
                scrollViewRef.current?.scrollToEnd({ animated: true })
              }
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
