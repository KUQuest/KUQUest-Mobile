import { useEffect, useMemo, useState } from "react";
import { Modal } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { File } from "expo-file-system";
import { FileText, ImagePlus, RotateCcw, Trash2, X } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components/ui/Button";
import { TextArea } from "@/features/onboarding/components/TextArea";
import { useLocale } from "@/locales/LocaleProvider";
import { questBoardMessages } from "@/locales/questBoardMessages";
import { colors } from "@/theme/colors";
import { cn } from "@/tw/cn";
import { Pressable, SafeAreaView, ScrollView, Text, View } from "@/tw";

import type { UploadAsset } from "@/api/fileUpload";
import type { QuestV2ProofSubmission } from "@/api/questV2Contracts";
import { MAX_PROOF_ATTACHMENTS, MAX_PROOF_NOTE_LENGTH } from "../types";
import styles from "../questDetailStyles";

export const MAX_PROOF_FILE_SIZE_BYTES = 10 * 1024 * 1024;

export interface ProofDraftAsset extends UploadAsset {
  sizeBytes?: number;
}
const EMPTY_DRAFT_ASSETS: ProofDraftAsset[] = [];

export interface ProofSubmissionSheetProps {
  visible?: boolean;
  onClose: () => void;
  /** Legacy callback retained for fixture/component tests. */
  onSubmit?: (imageUris: string[], note: string) => boolean;
  retryAssets?: Record<number, ProofDraftAsset>;
  proof?: QuestV2ProofSubmission | null;
  draftAssets?: ProofDraftAsset[];
  onSaveDraft?: (
    assets: ProofDraftAsset[],
    note: string
  ) => Promise<void> | void;
  onSubmitDraft?: (
    assets?: ProofDraftAsset[],
    note?: string
  ) => Promise<void> | void;
  onDeleteDraft?: () => Promise<void> | void;
  onRetryUpload?: (position: number) => Promise<void> | void;
  loading?: boolean;
  locked?: boolean;
  error?: string;
}

function fileLabel(asset: ProofDraftAsset): string {
  return (
    asset.name ?? asset.uri.split("/").pop()?.split("?")[0] ?? "Proof file"
  );
}

export function ProofSubmissionSheet({
  onClose,
  onSubmit,
  visible = true,
  proof,
  draftAssets = EMPTY_DRAFT_ASSETS,
  onSaveDraft,
  onDeleteDraft,
  onSubmitDraft,
  onRetryUpload,
  loading = false,
  locked = false,
  error,
}: ProofSubmissionSheetProps) {
  const insets = useSafeAreaInsets();
  const { locale } = useLocale();
  const messages = questBoardMessages[locale];
  const saveDraftLabel = locale === "th" ? "บันทึกฉบับร่าง" : "Save draft";
  const [note, setNote] = useState("");
  const [assets, setAssets] = useState<ProofDraftAsset[]>(draftAssets);
  const [attempted, setAttempted] = useState(false);
  const [pickerError, setPickerError] = useState<string | undefined>();
  const [actionError, setActionError] = useState<string | undefined>();
  const [busyAction, setBusyAction] = useState<
    "save" | "delete" | "submit" | number | undefined
  >();

  const isLive = Boolean(onSaveDraft || onSubmitDraft || proof);
  const serverFiles: QuestV2ProofSubmission["files"] = proof?.files ?? [];
  const totalAttachments = serverFiles.length + assets.length;
  const remainingAttachments = Math.max(
    0,
    MAX_PROOF_ATTACHMENTS - totalAttachments
  );
  const hasContent = Boolean(
    note.trim() || assets.length > 0 || serverFiles.length > 0
  );
  const hasFailedUploads = serverFiles.some(
    (file) => file.uploadStatus === "PROOF_FILE_FAILED"
  );
  const canSubmit = hasContent && !hasFailedUploads && !locked && !loading;
  const displayedError = actionError ?? error;

  /* eslint-disable react-hooks/set-state-in-effect -- opening the sheet must reset its draft from the latest props. */
  useEffect(() => {
    if (!visible) return;
    setNote(proof?.description ?? "");
    setAssets(draftAssets);
    setAttempted(false);
    setPickerError(undefined);
    setActionError(undefined);
  }, [draftAssets, proof?.description, proof?.id, visible]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const failedFiles = useMemo(
    () =>
      serverFiles.filter((file) => file.uploadStatus === "PROOF_FILE_FAILED"),
    [serverFiles]
  );

  const handleClose = () => {
    if (!isLive) {
      setNote("");
      setAssets([]);
      setAttempted(false);
      setPickerError(undefined);
      setActionError(undefined);
    }
    onClose();
  };

  const handlePickFiles = async () => {
    if (remainingAttachments === 0 || locked || loading) return;
    setPickerError(undefined);
    try {
      const result = await File.pickFileAsync({
        mimeTypes: ["image/*", "application/pdf", "video/*"],
        multipleFiles: true,
      });
      if (result.canceled) return;
      const oversized = result.result.find(
        (file) => file.size > MAX_PROOF_FILE_SIZE_BYTES
      );
      if (oversized) {
        setPickerError("Each proof file must be 10 MB or smaller.");
        return;
      }
      const selectedAssets: ProofDraftAsset[] = result.result.map((file) => ({
        uri: file.uri,
        name: file.name,
        type: file.type || undefined,
        sizeBytes: file.size,
      }));
      setAssets((current) => {
        const existing = new Set(current.map((asset) => asset.uri));
        return [
          ...current,
          ...selectedAssets.filter((asset) => !existing.has(asset.uri)),
        ].slice(0, remainingAttachments);
      });
    } catch {
      try {
        const legacyResult = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ["images", "videos"],
          allowsMultipleSelection: true,
          selectionLimit: remainingAttachments,
          quality: 0.8,
        });
        if (legacyResult.canceled) return;
        const selectedAssets: ProofDraftAsset[] = legacyResult.assets
          .filter(
            (asset: ImagePicker.ImagePickerAsset) =>
              asset.fileSize === undefined ||
              asset.fileSize <= MAX_PROOF_FILE_SIZE_BYTES
          )
          .map((asset: ImagePicker.ImagePickerAsset) => ({
            uri: asset.uri,
            name: asset.fileName ?? undefined,
            type: asset.mimeType ?? undefined,
            sizeBytes: asset.fileSize ?? undefined,
          }));
        setAssets((current) =>
          [...current, ...selectedAssets].slice(0, remainingAttachments)
        );
      } catch {
        setPickerError(messages.proofImagePickerError);
      }
    }
  };

  const runAction = async (
    action: "save" | "delete" | "submit",
    callback: (() => Promise<void> | void) | undefined
  ) => {
    if (!callback || loading) return;
    setBusyAction(action);
    setActionError(undefined);
    try {
      await callback();
    } catch (caught) {
      setActionError(
        caught instanceof Error ? caught.message : messages.errorDescription
      );
    } finally {
      setBusyAction(undefined);
    }
  };

  const handleSubmit = () => {
    setAttempted(true);
    if (!canSubmit) return;
    if (isLive && onSubmitDraft) {
      void runAction("submit", () => onSubmitDraft(assets, note.trim()));
      return;
    }
    if (
      onSubmit?.(
        assets.map((asset) => asset.uri),
        note.trim()
      )
    ) {
      setNote("");
      setAssets([]);
      setAttempted(false);
      setPickerError(undefined);
    }
  };

  return (
    <Modal
      animationType="slide"
      onRequestClose={handleClose}
      transparent
      visible={visible}
    >
      <Pressable className={styles.proofSheetBackdrop} onPress={handleClose}>
        <Pressable
          accessibilityViewIsModal
          className={styles.proofSheet}
          onPress={() => undefined}
        >
          <SafeAreaView edges={["bottom"]}>
            <View className={styles.proofSheetHeader}>
              <View className={styles.proofSheetHeaderCopy}>
                <Text
                  accessibilityRole="header"
                  className={styles.proofSheetTitle}
                >
                  {proof?.submittedAt || locked
                    ? messages.proofBannerTitle
                    : messages.proofSubmissionTitle}
                </Text>
                <Text className={styles.proofSheetDescription}>
                  {locked
                    ? messages.proofPending
                    : messages.proofSubmissionDescription}
                </Text>
              </View>
              <Pressable
                accessibilityLabel={messages.close}
                accessibilityRole="button"
                className={styles.sheetCloseButton}
                onPress={handleClose}
                testID="proof-submission-close"
              >
                <X color={colors.textStrong} size={24} />
              </Pressable>
            </View>
            <ScrollView
              contentContainerClassName={styles.proofSheetContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              testID="proof-submission-sheet"
            >
              <TextArea
                accessibilityLabel={messages.proofDescriptionLabel}
                editable={!locked && !loading}
                label={messages.proofDescriptionLabel}
                maxLength={MAX_PROOF_NOTE_LENGTH}
                onChangeText={setNote}
                placeholder={messages.proofDescriptionPlaceholder}
                value={note}
              />
              <Text className={styles.proofSheetHelper}>
                {messages.proofLockDescription}
              </Text>
              <Pressable
                accessibilityLabel={messages.addProofImages}
                accessibilityRole="button"
                accessibilityState={{
                  disabled: remainingAttachments === 0 || locked || loading,
                }}
                className={cn(
                  styles.proofAttachmentTrigger,
                  (remainingAttachments === 0 || locked || loading) &&
                    styles.proofAttachmentTriggerDisabled
                )}
                disabled={remainingAttachments === 0 || locked || loading}
                onPress={() => void handlePickFiles()}
                testID="proof-add-images"
              >
                <ImagePlus color={colors.primary} size={20} strokeWidth={2.2} />
                <Text className={styles.proofAttachmentTriggerText}>
                  {messages.addProofImages}
                </Text>
              </Pressable>
              <Text className={styles.proofAttachmentCount}>
                {messages.proofAttachmentCount(
                  totalAttachments,
                  MAX_PROOF_ATTACHMENTS
                )}
              </Text>
              {assets.length > 0 ? (
                <View className="mt-[10px] gap-[8px]">
                  {assets.map((asset, index) => (
                    <View
                      className="flex-row items-center rounded-[12px] bg-ku-surface-muted px-[10px] py-[9px]"
                      key={asset.uri}
                    >
                      <FileText color={colors.primary} size={18} />
                      <Text
                        className="ml-[8px] flex-1 font-ku-medium text-ku-label text-ku-text-strong"
                        numberOfLines={1}
                      >
                        {fileLabel(asset)}
                      </Text>
                      {!locked ? (
                        <Pressable
                          accessibilityLabel={messages.removeProofImage(
                            index + 1
                          )}
                          accessibilityRole="button"
                          onPress={() =>
                            setAssets((current) =>
                              current.filter(
                                (_, fileIndex) => fileIndex !== index
                              )
                            )
                          }
                          testID={`proof-remove-image-${index}`}
                        >
                          <X color={colors.textMuted} size={18} />
                        </Pressable>
                      ) : null}
                    </View>
                  ))}
                </View>
              ) : null}
              {serverFiles.length > 0 ? (
                <View className="mt-[10px] gap-[8px]">
                  {serverFiles.map((file) => (
                    <View
                      className="flex-row items-center rounded-[12px] bg-ku-surface-muted px-[10px] py-[9px]"
                      key={file.fileId}
                    >
                      <FileText
                        color={
                          file.uploadStatus === "PROOF_FILE_FAILED"
                            ? colors.danger
                            : colors.primary
                        }
                        size={18}
                      />
                      <Text
                        className="ml-[8px] flex-1 font-ku-medium text-ku-label text-ku-text-strong"
                        numberOfLines={1}
                      >
                        {file.contentType || "Proof file"} ·{" "}
                        {file.uploadStatus
                          .replace("PROOF_FILE_", "")
                          .toLowerCase()}
                      </Text>
                      {file.uploadStatus === "PROOF_FILE_FAILED" &&
                      onRetryUpload ? (
                        <Pressable
                          accessibilityLabel={messages.retry}
                          accessibilityRole="button"
                          disabled={busyAction !== undefined || loading}
                          onPress={() => {
                            setBusyAction(file.position);
                            setActionError(undefined);
                            void Promise.resolve(onRetryUpload(file.position))
                              .catch((caught) => {
                                setActionError(
                                  caught instanceof Error
                                    ? caught.message
                                    : messages.errorDescription
                                );
                              })
                              .finally(() => setBusyAction(undefined));
                          }}
                        >
                          <RotateCcw color={colors.primary} size={18} />
                        </Pressable>
                      ) : null}
                    </View>
                  ))}
                </View>
              ) : null}
              {failedFiles.length > 0 ? (
                <Text className="mt-[8px] font-ku-medium text-ku-label text-ku-danger">
                  {messages.retry}
                </Text>
              ) : null}
              {attempted && !hasContent ? (
                <Text
                  accessibilityRole="alert"
                  className={styles.proofValidation}
                >
                  {messages.proofContentRequired}
                </Text>
              ) : null}
              {pickerError ? (
                <Text
                  accessibilityRole="alert"
                  className={styles.proofValidation}
                >
                  {pickerError}
                </Text>
              ) : null}
              {displayedError ? (
                <Text
                  accessibilityRole="alert"
                  className={styles.proofValidation}
                >
                  {displayedError}
                </Text>
              ) : null}
            </ScrollView>
            <View
              className={styles.proofSheetActions}
              style={{ paddingBottom: Math.max(insets.bottom, 16) }}
            >
              <Button
                onPress={handleClose}
                testID="proof-submission-cancel"
                variant="secondary"
              >
                {messages.cancel}
              </Button>
              {isLive &&
              proof &&
              !proof.submittedAt &&
              !locked &&
              onDeleteDraft ? (
                <Button
                  disabled={busyAction !== undefined || loading}
                  onPress={() => void runAction("delete", onDeleteDraft)}
                  testID="proof-delete-draft"
                  variant="secondary"
                >
                  <Trash2 color={colors.primary} size={18} />
                </Button>
              ) : null}
              {isLive && onSaveDraft && !locked ? (
                <Button
                  disabled={busyAction !== undefined || loading}
                  onPress={() =>
                    void runAction("save", () =>
                      onSaveDraft(assets, note.trim())
                    )
                  }
                  testID="proof-save-draft"
                  variant="secondary"
                >
                  {saveDraftLabel}
                </Button>
              ) : null}
              <Button
                disabled={!canSubmit || busyAction !== undefined}
                onPress={handleSubmit}
                testID="proof-submit"
              >
                {messages.submitProof}
              </Button>
            </View>
          </SafeAreaView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
