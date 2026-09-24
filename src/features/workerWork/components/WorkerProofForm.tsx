import { useRef, useState } from "react";
import { ActivityIndicator, Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import {
  CheckCircle2,
  CircleAlert,
  CircleX,
  Clock3,
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
  "mt-ku-12 rounded-[16px] border border-ku-border-subtle bg-ku-surface p-ku-md";

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

      <View className="mt-ku-md flex-row items-baseline justify-between">
        <Text className="font-ku-semibold text-ku-body text-ku-text-strong">
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
        className="mt-ku-sm min-h-[104px] rounded-[12px] border border-ku-border bg-ku-background px-ku-12 py-ku-10 font-ku-regular text-ku-body-small text-ku-text-strong"
        editable={!submitting}
        maxLength={MAX_DESCRIPTION_LENGTH}
        multiline
        onChangeText={(value) => {
          setDescription(value);
          setNotice(null);
        }}
        placeholder={messages.descriptionPlaceholder}
        placeholderTextColor={palette.textSubtle}
        style={{ textAlignVertical: "top" }}
        testID="worker-proof-description"
        value={description}
      />

      {notice ? (
        <View
          accessibilityLiveRegion="polite"
          accessibilityRole="alert"
          className="mt-ku-12 flex-row items-start gap-ku-sm rounded-[14px] border border-ku-border-danger bg-ku-surface-danger p-ku-12"
          testID="worker-proof-notice"
        >
          <CircleAlert color={palette.dangerDark} size={18} strokeWidth={2} />
          <Text className="flex-1 font-ku-medium text-ku-body-small text-ku-danger-dark">
            {notice}
          </Text>
        </View>
      ) : null}

      <Text className="mt-ku-md text-center font-ku-regular text-ku-label text-ku-text-secondary">
        {hasProofInput ? messages.sendLockNotice : messages.proofInputRequired}
      </Text>
      <Pressable
        accessibilityLabel={messages.submitProof}
        accessibilityRole="button"
        accessibilityState={{ disabled: submitDisabled, busy: submitting }}
        className={cn(
          "mt-ku-sm min-h-[48px] flex-row items-center justify-center rounded-ku-pill bg-ku-worker px-ku-md active:bg-ku-worker-dark",
          submitDisabled && "opacity-[0.55]"
        )}
        disabled={submitDisabled}
        onPress={confirmAndSend}
        testID="worker-proof-submit"
      >
        {submitting ? (
          <ActivityIndicator color={palette.onWorker} />
        ) : (
          <Text className="font-ku-semibold text-ku-body text-ku-on-worker">
            {messages.submitProof}
          </Text>
        )}
      </Pressable>
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
        : palette.workerDeep;
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
    <View
      className="mt-ku-12 flex-row items-start gap-ku-12 rounded-[16px] border border-ku-border-subtle bg-ku-surface p-ku-md"
      testID="worker-proof-sent"
    >
      <Icon color={color} size={24} strokeWidth={2} />
      <View className="flex-1">
        <Text className="font-ku-semibold text-ku-body text-ku-text-strong">
          {messages.submittedTitle} · {statusLabel}
        </Text>
        {submittedAt ? (
          <Text className="mt-ku-2 font-ku-regular text-ku-label text-ku-text-secondary">
            {messages.submittedAt(submittedAt)}
          </Text>
        ) : null}
        <Text className="mt-ku-xs font-ku-regular text-ku-body-small text-ku-text-secondary">
          {description}
        </Text>
      </View>
    </View>
  );
}
