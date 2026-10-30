import { useCallback, useEffect, useMemo, useState } from "react";
import { FileText, ImageIcon } from "lucide-react-native";

import { showErrorAlert } from "@/components/ui/SweetAlert";
import { ImageViewerModal } from "@/components/ui/ImageViewerModal";
import { formatTimestamp } from "@/domain/datetime";
import { useLocale } from "@/features/preferences/localeStore";
import { questBoardMessages } from "@/locales/questBoardMessages";
import { useAppTheme } from "@/features/workspace/AppThemeProvider";
import { QuestProofFileStatus } from "@/features/questBoard/domain/types";
import { Image, Pressable, Text, View } from "@/tw";
import type { QuestV2ProofSubmission } from "@/api/questV2Contracts";

import {
  downloadAndShareProofFile,
  getProofFileLinkForUse,
  isUsableProofFileLink,
  openProofFile,
  ProofFileAccessError,
  type UsableProofFileLink,
} from "./proofFileService";
import { formatProofFileSize } from "./proofFileUtils";

function isImage(contentType: string | null): boolean {
  return contentType?.startsWith("image/") ?? false;
}

export interface ProofSubmissionFilesProps {
  proof: QuestV2ProofSubmission;
}

/** Ready files for a FULL-visible, already-sent Proof Submission. */
export function ProofSubmissionFiles({ proof }: ProofSubmissionFilesProps) {
  const { locale } = useLocale();
  const messages = questBoardMessages[locale];
  const [viewingFile, setViewingFile] = useState<{
    label: string;
    url: string;
  } | null>(null);

  if (proof.visibility !== "FULL" || proof.files.length === 0) return null;

  return (
    <>
      <View className="gap-ku-sm" testID={`proof-submission-files-${proof.id}`}>
        <Text
          accessibilityRole="header"
          className="font-ku-semibold text-ku-body-small text-ku-text-strong"
        >
          {messages.proofReviewEvidenceLabel}
        </Text>
        {proof.files.map((file) => (
          <ProofSubmissionFileRow
            file={file}
            key={`${proof.id}-${file.fileId ?? `position-${file.position}`}`}
            onViewImage={(label, url) => setViewingFile({ label, url })}
            proofId={proof.id}
            questId={proof.questId}
          />
        ))}
      </View>
      <ImageViewerModal
        closeLabel={messages.close}
        fileName={viewingFile?.label}
        imageAccessibilityLabel={viewingFile?.label ?? ""}
        imageUrl={viewingFile?.url ?? null}
        onClose={() => setViewingFile(null)}
        visible={Boolean(viewingFile)}
      />
    </>
  );
}

interface ProofSubmissionFileRowProps {
  questId: string;
  proofId: string;
  file: QuestV2ProofSubmission["files"][number];
  onViewImage: (label: string, url: string) => void;
}

function ProofSubmissionFileRow({
  questId,
  proofId,
  file,
  onViewImage,
}: ProofSubmissionFileRowProps) {
  const { colors } = useAppTheme();
  const { locale } = useLocale();
  const messages = questBoardMessages[locale];
  const [resolvedLink, setResolvedLink] = useState<UsableProofFileLink | null>(
    null
  );
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentLink = resolvedLink ?? file;
  const hasUsableLink = isUsableProofFileLink(currentLink);
  const hasLinkCandidate = Boolean(currentLink.url);
  const ready =
    file.uploadStatus === QuestProofFileStatus.PROOF_FILE_READY &&
    file.fileId !== null;
  const image = isImage(file.contentType);
  const target = useMemo(
    () => ({ questId, proofSubmissionId: proofId, file }),
    [file, proofId, questId]
  );
  const label = messages.proofReviewFileLabel(
    file.position + 1,
    file.contentType,
    formatProofFileSize(file.sizeBytes)
  );

  const resolveLink = useCallback(async () => {
    if (!ready) return null;
    try {
      const link = await getProofFileLinkForUse(target, currentLink);
      setError(null);
      setResolvedLink(link);
      return link;
    } catch (caught) {
      setError(
        caught instanceof ProofFileAccessError &&
          caught.reason === "unavailable"
          ? messages.proofReviewPreviewUnavailable
          : messages.proofReviewPreviewError
      );
      return null;
    }
  }, [currentLink, messages, ready, target]);

  useEffect(() => {
    if (!ready || !image || hasUsableLink) return;
    const refreshTimer = setTimeout(() => void resolveLink(), 0);
    return () => clearTimeout(refreshTimer);
  }, [hasUsableLink, image, ready, resolveLink]);

  const openFile = async () => {
    setIsBusy(true);
    try {
      if (image) {
        const link = await resolveLink();
        if (!link) return;
        onViewImage(label, link.url);
        return;
      }
      const link = await openProofFile(target, currentLink);
      setError(null);
      setResolvedLink(link);
    } catch (caught) {
      setError(
        caught instanceof ProofFileAccessError &&
          caught.reason === "unavailable"
          ? messages.proofReviewPreviewUnavailable
          : messages.proofReviewPreviewError
      );
    } finally {
      setIsBusy(false);
    }
  };

  const downloadFile = async () => {
    if (!ready || isBusy) return;
    setIsBusy(true);
    setError(null);
    try {
      await downloadAndShareProofFile(target, currentLink);
    } catch (caught) {
      const message =
        caught instanceof ProofFileAccessError
          ? caught.reason === "sharing-unavailable"
            ? messages.proofReviewSharingUnavailable
            : messages.proofReviewPreviewUnavailable
          : messages.proofReviewDownloadError;
      showErrorAlert(messages.proofReviewDownloadErrorTitle, message);
    } finally {
      setIsBusy(false);
    }
  };

  const Icon = image ? ImageIcon : FileText;

  return (
    <View
      className="gap-ku-xs rounded-ku-card border border-ku-border-subtle bg-ku-surface-muted p-ku-12"
      testID={`proof-submission-file-${proofId}-${file.position}`}
    >
      {image && hasUsableLink ? (
        <Pressable
          accessibilityLabel={`${messages.proofReviewPreview}: ${label}`}
          accessibilityRole="button"
          accessibilityState={{ busy: isBusy, disabled: isBusy }}
          disabled={isBusy}
          onPress={() => void openFile()}
          testID={`proof-submission-image-zoom-${proofId}-${file.position}`}
        >
          <Image
            accessible={false}
            className="h-[196px] w-full rounded-ku-card"
            contentFit="cover"
            source={{ uri: currentLink.url }}
            testID={`proof-submission-inline-image-${proofId}-${file.position}`}
          />
        </Pressable>
      ) : null}
      <View className="flex-row items-start gap-ku-sm">
        <Icon color={colors.primary} size={20} />
        <View className="min-w-0 flex-1 gap-ku-2">
          <Text className="font-ku-semibold text-ku-body-small text-ku-text-strong">
            {label}
          </Text>
          <Text className="font-ku-regular text-ku-label text-ku-text-secondary">
            {messages.proofReviewFileStatus(file.uploadStatus)}
          </Text>
          {hasUsableLink ? (
            <Text className="font-ku-regular text-ku-label text-ku-text-secondary">
              {messages.proofReviewFileExpiresAt(
                formatTimestamp(currentLink.urlExpiresAt, locale, "")
              )}
            </Text>
          ) : null}
        </View>
      </View>
      {ready && hasLinkCandidate ? (
        <View className="flex-row flex-wrap gap-ku-xs">
          {!image ? (
            <Pressable
              accessibilityLabel={`${messages.proofReviewPreview}: ${label}`}
              accessibilityRole="button"
              accessibilityState={{ busy: isBusy, disabled: isBusy }}
              className="min-h-[48px] items-center justify-center self-start rounded-ku-control border border-ku-primary px-ku-12"
              disabled={isBusy}
              onPress={() => void openFile()}
              testID={`proof-submission-open-file-${proofId}-${file.position}`}
            >
              <Text className="font-ku-semibold text-ku-label text-ku-primary">
                {messages.proofReviewPreview}
              </Text>
            </Pressable>
          ) : null}
          <Pressable
            accessibilityLabel={`${messages.proofReviewDownload}: ${label}`}
            accessibilityRole="button"
            accessibilityState={{ busy: isBusy, disabled: isBusy }}
            className="min-h-[48px] items-center justify-center self-start rounded-ku-control border border-ku-primary px-ku-12"
            disabled={isBusy}
            onPress={() => void downloadFile()}
            testID={`proof-submission-download-${proofId}-${file.position}`}
          >
            <Text className="font-ku-semibold text-ku-label text-ku-primary">
              {isBusy
                ? messages.proofReviewDownloading
                : messages.proofReviewDownload}
            </Text>
          </Pressable>
          {image && !hasUsableLink ? (
            <Pressable
              accessibilityLabel={`${messages.proofReviewFileRefresh}: ${label}`}
              accessibilityRole="button"
              accessibilityState={{ busy: isBusy, disabled: isBusy }}
              className="min-h-[48px] items-center justify-center self-start rounded-ku-control border border-ku-primary px-ku-12"
              disabled={isBusy}
              onPress={() => {
                setIsBusy(true);
                void resolveLink().finally(() => setIsBusy(false));
              }}
              testID={`proof-submission-refresh-file-${proofId}-${file.position}`}
            >
              <Text className="font-ku-semibold text-ku-label text-ku-primary">
                {isBusy ? messages.loading : messages.proofReviewFileRefresh}
              </Text>
            </Pressable>
          ) : null}
        </View>
      ) : ready && !hasLinkCandidate ? (
        <Pressable
          accessibilityLabel={`${messages.proofReviewFileRefresh}: ${label}`}
          accessibilityRole="button"
          accessibilityState={{ busy: isBusy, disabled: isBusy }}
          className="min-h-[48px] items-center justify-center self-start rounded-ku-control border border-ku-primary px-ku-12"
          disabled={isBusy}
          onPress={() => {
            setIsBusy(true);
            void resolveLink().finally(() => setIsBusy(false));
          }}
          testID={`proof-submission-refresh-file-${proofId}-${file.position}`}
        >
          <Text className="font-ku-semibold text-ku-label text-ku-primary">
            {isBusy ? messages.loading : messages.proofReviewFileRefresh}
          </Text>
        </Pressable>
      ) : null}
      {ready && !hasUsableLink && !error ? (
        <Text className="font-ku-regular text-ku-label text-ku-text-secondary">
          {messages.proofReviewPreviewUnavailable}
        </Text>
      ) : null}
      {error ? (
        <Text
          accessibilityRole="alert"
          className="font-ku-regular text-ku-label text-ku-danger-dark"
        >
          {error}
        </Text>
      ) : null}
    </View>
  );
}
