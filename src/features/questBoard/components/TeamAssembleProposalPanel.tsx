import React from "react";

import { ActivityIndicator, Pressable, Text, TextInput, View } from "@/tw";
import { FileText, ImagePlus, Trash2 } from "lucide-react-native";
import type { SupportedLocale } from "@/locales/locale";
import { colors } from "@/theme/colors";
import type { ProposalFileItem } from "./TeamAssembleSheet";
import styles from "./groupQuestStyles";
export interface TeamAssembleProposalPanelProps {
  locale: SupportedLocale;
  files: readonly ProposalFileItem[];
  text: string;
  isPickingFile: boolean;
  filePickError: string | null;
  onTextChange: (text: string) => void;
  onRemoveFile: (fileId: string) => void;
  onPickFiles: () => void | Promise<void>;
}

export function TeamAssembleProposalPanel({
  locale,
  files,
  text,
  isPickingFile,
  filePickError,
  onTextChange,
  onRemoveFile,
  onPickFiles,
}: TeamAssembleProposalPanelProps) {
  const thai = locale === "th";
  return (
    <View className={styles.section} testID="team-assemble-proposal-section">
      <View className={styles.sectionHeader}>
        <Text accessibilityRole="header" className={styles.sectionTitle}>
          {thai ? "ข้อเสนอและเอกสารแนบ" : "Proposal & Supporting Files"}
        </Text>
        {files.length > 0 ? (
          <Text className={styles.sectionMeta}>
            {thai ? `${files.length} ไฟล์` : `${files.length} files`}
          </Text>
        ) : null}
      </View>
      <Text className={styles.helper}>
        {thai
          ? "เพิ่มรายละเอียดหรือแนบเอกสารเพื่อประกอบการพิจารณา"
          : "Add a proposal note and supporting documents or images"}
      </Text>
      <View className="mt-[8px] rounded-[18px] border border-ku-border bg-ku-surface p-[12px]">
        <TextInput
          accessibilityLabel={thai ? "ข้อความเสนอตัว" : "Proposal note"}
          className="min-h-[72px] font-ku-regular text-ku-body text-ku-text-strong"
          multiline
          numberOfLines={3}
          onChangeText={onTextChange}
          placeholder={
            thai
              ? "ข้อความเสนอตัวหรือรายละเอียดเพิ่มเติม (ไม่บังคับ)"
              : "Proposal note or message (optional)"
          }
          placeholderTextColor={colors.textFaint}
          testID="team-proposal-text-input"
          textAlignVertical="top"
          value={text}
        />
      </View>
      <View className="mt-[10px] gap-[8px]">
        {files.map((file) => (
          <View
            key={file.id}
            className="flex-row items-center justify-between rounded-[14px] border border-ku-border-subtle bg-ku-surface-muted px-[12px] py-[8px]"
            testID={`team-proposal-file-${file.id}`}
          >
            <View className="min-w-0 flex-1 flex-row items-center pr-[8px]">
              <FileText color={colors.primary} size={18} strokeWidth={2} />
              <View className="ml-[8px] min-w-0 flex-1">
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
              accessibilityLabel={
                thai ? `ลบไฟล์ ${file.name}` : `Remove file ${file.name}`
              }
              accessibilityRole="button"
              className="items-center justify-center p-[6px]"
              onPress={() => onRemoveFile(file.id)}
              testID={`team-remove-file-${file.id}`}
            >
              <Trash2 color={colors.dangerDark} size={16} strokeWidth={2} />
            </Pressable>
          </View>
        ))}
        <Pressable
          accessibilityLabel={
            thai ? "แนบไฟล์หรือรูปภาพ" : "Attach file or image"
          }
          accessibilityRole="button"
          className="min-h-[44px] flex-row items-center justify-center gap-[6px] rounded-[14px] border border-dashed border-ku-primary px-[12px] py-[8px]"
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
                {thai ? "แนบเอกสารหรือรูปภาพ" : "Attach file or image"}
              </Text>
            </>
          )}
        </Pressable>
        {filePickError ? (
          <Text className="mt-[2px] font-ku-regular text-ku-label text-ku-danger-dark">
            {filePickError}
          </Text>
        ) : null}
      </View>
    </View>
  );
}
