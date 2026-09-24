import { useRef, useState } from "react";
import { ActivityIndicator, Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import {
  CheckCircle2,
  CircleAlert,
  CircleX,
  Clock3,
  Info,
  Send,
} from "lucide-react-native";

import { Pressable, Text, TextInput, View } from "@/tw";
import { cn } from "@/tw/cn";
import { formatTimestampDateTime } from "@/domain/datetime";
import type { LiveQuestSnapshot } from "@/features/questBoard/live/liveQuestTypes";
import { useLocale } from "@/features/preferences/localeStore";
import {
  ProofFileUploadError,
  useSubmitProofMutation,
} from "../api/workerWorkQueries";
import { useAppTheme } from "@/features/workspace/AppThemeProvider";
import {
  workerWorkMessages,
  type WorkerWorkMessages,
} from "@/locales/workerWorkMessages";
import type { ThemeColors } from "@/theme/colors";
import { latestSentProof } from "../workerWorkProjection";
import { ProofFilePicker, type ProofFile } from "./ProofFilePicker";

const MAX_PROOF_FILES = 5;
const MAX_PROOF_FILE_BYTES = 10 * 1024 * 1024;
const MAX_DESCRIPTION_LENGTH = 1000;

const card =
  "gap-ku-md rounded-ku-card border border-ku-border bg-ku-surface p-ku-md";
const sentCard =
  "flex-row items-start gap-ku-12 rounded-ku-card border border-ku-border bg-ku-surface p-ku-md";
const sentIcon =
  "h-[40px] w-[40px] items-center justify-center rounded-ku-pill";

export interface WorkerProofFormProps {
  questId: string;
  viewerId: string;
  snapshot: LiveQuestSnapshot;
  /** Refreshes the owning Work Hub after a Proof Submission is sent. */
  onSubmitted?: () => Promise<unknown> | void;
}

/**
 * Inline proof submission for the Worker's Work Hub. Renders the sent
 * Proof Submission status once one exists, the form while the Worker can
 * submit, and nothing otherwise.
 */
export function WorkerProofForm({
  questId,
  viewerId,
  snapshot,
  onSubmitted,
}: WorkerProofFormProps) {
  const { colors: palette } = useAppTheme();
  const { locale } = useLocale();
  const messages = workerWorkMessages[locale];
  const proofMutation = useSubmitProofMutation();

  const [files, setFiles] = useState<ProofFile[]>([]);
  const [description, setDescription] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const fileKeySeed = useRef(0);

  const sentProof = latestSentProof(snapshot.proofs);
  if (sentProof) {
    return (
      <SentProofCard
        messages={messages}
        palette={palette}
        status={sentProof.status}
        submittedAt={
          sentProof.submittedAt
            ? formatTimestampDateTime(sentProof.submittedAt, locale)
            : null
        }
      />
    );
  }
  if (!snapshot.proofRequired || !snapshot.capabilities.canSubmitProof) {
    return null;
  }

  const submitting = proofMutation.isPending;
  const hasProofInput = files.length > 0 || description.trim().length > 0;
  const submitDisabled = submitting || !hasProofInput;

  const pickFiles = async () => {
    const remaining = MAX_PROOF_FILES - files.length;
    if (remaining <= 0) {
      setNotice(messages.fileLimitReached);
      return;
    }
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images", "videos"],
        allowsMultipleSelection: true,
        selectionLimit: remaining,
        quality: 0.8,
      });
      if (result.canceled || !result.assets) return;
      const tooLarge: string[] = [];
      const picked: ProofFile[] = [];
      for (const asset of result.assets) {
        const kind = asset.type === "video" ? "video" : "image";
        const name =
          asset.fileName ??
          `proof-${Date.now()}.${kind === "video" ? "mp4" : "jpg"}`;
        if (asset.fileSize && asset.fileSize > MAX_PROOF_FILE_BYTES) {
          tooLarge.push(name);
          continue;
        }
        fileKeySeed.current += 1;
        picked.push({
          key: `proof-file-${fileKeySeed.current}`,
          uri: asset.uri,
          name,
          type:
            asset.mimeType ?? (kind === "video" ? "video/mp4" : "image/jpeg"),
          kind,
        });
      }
      const accepted = picked.slice(0, remaining);
      setFiles((current) => [...current, ...accepted]);
      setNotice(
        tooLarge.length > 0
          ? messages.fileTooLarge(tooLarge.join(", "))
          : picked.length > accepted.length
            ? messages.fileLimitReached
            : null
      );
    } catch {
      setNotice(messages.pickerError);
    }
  };

  const sendProof = async () => {
    setNotice(null);
    try {
      await proofMutation.mutateAsync({
        questId,
        viewerId,
        assets: files.map(({ uri, name, type }) => ({ uri, name, type })),
        description: description.trim() || undefined,
      });
      setFiles([]);
      setDescription("");
      await onSubmitted?.();
    } catch (error) {
      setNotice(
        error instanceof ProofFileUploadError
          ? messages.uploadFailed(error.failedCount)
          : messages.submitFailed
      );
    }
  };

  const confirmAndSend = () => {
    if (submitDisabled) return;
    Alert.alert(messages.confirmSubmitTitle, messages.confirmSubmitMessage, [
      { text: messages.cancel, style: "cancel" },
      { text: messages.confirm, onPress: () => void sendProof() },
    ]);
  };

  return (
    <View className={card} testID="worker-proof-form">
      <ProofFilePicker
        disabled={submitting}
        files={files}
        maxFiles={MAX_PROOF_FILES}
        messages={messages}
        onAdd={() => void pickFiles()}
        onRemove={(key) => {
          setFiles((current) => current.filter((file) => file.key !== key));
          setNotice(null);
        }}
        palette={palette}
      />

      <View className="gap-ku-sm">
        <View className="flex-row items-center justify-between gap-ku-sm">
          <Text className="flex-1 font-ku-semibold text-ku-body text-ku-text-strong">
            {messages.descriptionLabel}
          </Text>
          <Text className="font-ku-medium text-ku-label text-ku-text-secondary">
            {messages.descriptionCount(
              description.length,
              MAX_DESCRIPTION_LENGTH
            )}
          </Text>
        </View>
        <TextInput
          accessibilityLabel={messages.descriptionLabel}
          className="min-h-[112px] rounded-ku-field border border-ku-border bg-ku-surface px-ku-12 py-ku-10 font-ku-regular text-ku-body-small text-ku-text-strong"
          editable={!submitting}
          maxLength={MAX_DESCRIPTION_LENGTH}
          multiline
          onChangeText={(value) => {
            setDescription(value);
            setNotice(null);
          }}
          placeholder={messages.descriptionPlaceholder}
          placeholderTextColor={palette.textMuted}
          style={{ textAlignVertical: "top" }}
          testID="worker-proof-description"
          value={description}
        />
      </View>

      {notice ? (
        <View
          accessibilityLiveRegion="polite"
          accessibilityRole="alert"
          className="flex-row items-start gap-ku-sm rounded-ku-field border border-ku-border-danger bg-ku-surface-danger p-ku-12"
          testID="worker-proof-notice"
        >
          <CircleAlert color={palette.dangerDark} size={18} strokeWidth={2} />
          <Text className="flex-1 font-ku-medium text-ku-body-small text-ku-danger-dark">
            {notice}
          </Text>
        </View>
      ) : null}

      <View className="gap-ku-sm border-t border-ku-divider pt-ku-md">
        <View className="flex-row items-start gap-ku-sm">
          <Info color={palette.textSecondary} size={16} strokeWidth={2} />
          <Text className="flex-1 font-ku-regular text-ku-label text-ku-text-secondary">
            {hasProofInput
              ? messages.sendLockNotice
              : messages.proofInputRequired}
          </Text>
        </View>
        <Pressable
          accessibilityLabel={messages.submitProof}
          accessibilityRole="button"
          accessibilityState={{ disabled: submitDisabled, busy: submitting }}
          className={cn(
            "min-h-[48px] flex-row items-center justify-center gap-ku-sm rounded-ku-pill px-ku-md",
            submitDisabled
              ? "bg-ku-surface-high"
              : "bg-ku-worker-dark active:bg-ku-worker-deep"
          )}
          disabled={submitDisabled}
          onPress={confirmAndSend}
          testID="worker-proof-submit"
        >
          {submitting ? (
            <ActivityIndicator color={palette.onWorker} />
          ) : (
            <>
              <Send
                color={submitDisabled ? palette.textMuted : palette.onWorker}
                size={18}
                strokeWidth={2}
              />
              <Text
                className={cn(
                  "font-ku-semibold text-ku-body",
                  submitDisabled ? "text-ku-text-muted" : "text-ku-on-worker"
                )}
              >
                {messages.submitProof}
              </Text>
            </>
          )}
        </Pressable>
      </View>
    </View>
  );
}

function SentProofCard({
  messages,
  palette,
  status,
  submittedAt,
}: {
  messages: WorkerWorkMessages;
  palette: ThemeColors;
  status: "PROOF_PENDING" | "PROOF_APPROVED" | "PROOF_NOT_APPROVED" | null;
  submittedAt: string | null;
}) {
  const Icon =
    status === "PROOF_APPROVED"
      ? CheckCircle2
      : status === "PROOF_NOT_APPROVED"
        ? CircleX
        : Clock3;
  const color =
    status === "PROOF_APPROVED"
      ? palette.success
      : status === "PROOF_NOT_APPROVED"
        ? palette.dangerDark
        : palette.workerDark;
  const sentIconTone =
    status === "PROOF_APPROVED"
      ? "bg-ku-surface-success"
      : status === "PROOF_NOT_APPROVED"
        ? "bg-ku-surface-danger"
        : "bg-ku-worker-subtle";
  const description =
    status === "PROOF_APPROVED"
      ? messages.proofApprovedDescription
      : status === "PROOF_NOT_APPROVED"
        ? messages.proofNotApprovedDescription
        : messages.proofPendingDescription;
  const statusLabel =
    status === "PROOF_APPROVED"
      ? messages.status.completed
      : status === "PROOF_NOT_APPROVED"
        ? messages.status.incomplete
        : messages.status.proofPending;
  return (
    <View className={sentCard} testID="worker-proof-sent">
      <View className={cn(sentIcon, sentIconTone)}>
        <Icon color={color} size={22} strokeWidth={2} />
      </View>
      <View className="min-w-0 flex-1 gap-ku-xs">
        <Text className="font-ku-semibold text-ku-body text-ku-text-strong">
          {messages.submittedTitle} · {statusLabel}
        </Text>
        {submittedAt ? (
          <Text className="font-ku-regular text-ku-label text-ku-text-secondary">
            {messages.submittedAt(submittedAt)}
          </Text>
        ) : null}
        <Text className="font-ku-regular text-ku-body-small text-ku-text-secondary">
          {description}
        </Text>
      </View>
    </View>
  );
}
