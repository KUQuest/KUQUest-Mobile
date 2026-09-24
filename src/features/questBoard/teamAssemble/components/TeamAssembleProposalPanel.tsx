import { ActivityIndicator, Pressable, Text, TextInput, View } from "@/tw";
import { FileText, ImagePlus, Trash2 } from "lucide-react-native";
import type { GroupQuestMessages } from "@/locales/groupQuestMessages";
import { useAppTheme } from "@/features/workspace/AppThemeProvider";
import type { ProposalFileItem } from "../types";
import styles from "../groupQuestStyles";
export interface TeamAssembleProposalPanelProps {
  messages: GroupQuestMessages;
  files: readonly ProposalFileItem[];
  text: string;
  isPickingFile: boolean;
  filePickError: string | null;
  onTextChange: (text: string) => void;
  onRemoveFile: (fileId: string) => void;
  onPickFiles: () => void | Promise<void>;
}

export function TeamAssembleProposalPanel({
  messages,
  files,
  text,
  isPickingFile,
  filePickError,
  onTextChange,
  onRemoveFile,
  onPickFiles,
}: TeamAssembleProposalPanelProps) {
  const { colors } = useAppTheme();
  return (
    <View className={styles.section} testID="team-assemble-proposal-section">
      <View className={styles.sectionHeader}>
        <Text accessibilityRole="header" className={styles.sectionTitle}>
          {messages.proposalTitle}
        </Text>
        {files.length > 0 ? (
          <Text className={styles.sectionMeta}>
            {messages.fileCount(files.length)}
          </Text>
        ) : null}
      </View>
      <Text className={styles.helper}>{messages.proposalHelper}</Text>
      <View className="mt-ku-sm rounded-[18px] border border-ku-border bg-ku-surface p-ku-12">
        <TextInput
          accessibilityLabel={messages.proposalNoteLabel}
          className="min-h-[72px] font-ku-regular text-ku-body text-ku-text-strong"
          multiline
          numberOfLines={3}
          onChangeText={onTextChange}
          placeholder={messages.proposalNotePlaceholder}
          placeholderTextColor={colors.textFaint}
          testID="team-proposal-text-input"
          textAlignVertical="top"
          value={text}
        />
      </View>
      <View className="mt-ku-10 gap-ku-sm">
        {files.map((file) => (
          <View
            key={file.id}
            className="flex-row items-center justify-between rounded-[14px] border border-ku-border-subtle bg-ku-surface-muted px-ku-12 py-ku-sm"
            testID={`team-proposal-file-${file.id}`}
          >
            <View className="min-w-0 flex-1 flex-row items-center pr-ku-sm">
              <FileText color={colors.primary} size={18} strokeWidth={2} />
              <View className="ml-ku-sm min-w-0 flex-1">
                <Text
                  className="font-ku-medium text-ku-body-small text-ku-text-strong"
                  numberOfLines={1}
                >
                  {file.name}
                </Text>
                {file.sizeBytes ? (
                  <Text className="font-ku-regular text-ku-label text-ku-text-secondary">
                    {Math.round(file.sizeBytes / 1024)} KB
                  </Text>
                ) : null}
              </View>
            </View>
            <Pressable
              accessibilityLabel={messages.removeFile(file.name)}
              accessibilityRole="button"
              className="items-center justify-center p-ku-6"
              onPress={() => onRemoveFile(file.id)}
              testID={`team-remove-file-${file.id}`}
            >
              <Trash2 color={colors.dangerDark} size={16} strokeWidth={2} />
            </Pressable>
          </View>
        ))}
        <Pressable
          accessibilityLabel={messages.attachFile}
          accessibilityRole="button"
          className="min-h-[44px] flex-row items-center justify-center gap-ku-6 rounded-[14px] border border-dashed border-ku-primary px-ku-12 py-ku-sm"
          disabled={isPickingFile}
          onPress={onPickFiles}
          testID="team-pick-file-button"
        >
          {isPickingFile ? (
            <ActivityIndicator color={colors.primary} size="small" />
          ) : (
            <>
              <ImagePlus color={colors.primary} size={18} strokeWidth={2.2} />
              <Text className="font-ku-semibold text-ku-label text-ku-primary">
                {messages.attachFile}
              </Text>
            </>
          )}
        </Pressable>
        {filePickError ? (
          <Text className="mt-ku-2 font-ku-regular text-ku-label text-ku-danger-dark">
            {filePickError}
          </Text>
        ) : null}
      </View>
    </View>
  );
}
