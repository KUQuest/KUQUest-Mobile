import { Film, ImagePlus, X } from "lucide-react-native";

import { Image, Pressable, Text, View } from "@/tw";
import type { UploadAsset } from "@/api/fileUpload";
import type { WorkerWorkMessages } from "@/locales/workerWorkMessages";
import type { ThemeColors } from "@/theme/colors";

export interface ProofFile extends UploadAsset {
  key: string;
  name: string;
  kind: "image" | "video";
}

export interface ProofFilePickerProps {
  files: readonly ProofFile[];
  maxFiles: number;
  disabled: boolean;
  messages: WorkerWorkMessages;
  palette: ThemeColors;
  onAdd: () => void;
  onRemove: (key: string) => void;
}

const tile =
  "h-[104px] w-[104px] overflow-hidden rounded-[14px] border border-ku-border-subtle bg-ku-surface-muted";

export function ProofFilePicker({
  files,
  maxFiles,
  disabled,
  messages,
  palette,
  onAdd,
  onRemove,
}: ProofFilePickerProps) {
  const canAdd = files.length < maxFiles && !disabled;
  return (
    <View>
      <View className="flex-row items-baseline justify-between">
        <Text
          accessibilityRole="header"
          className="font-ku-semibold text-ku-body text-ku-text-strong"
        >
          {messages.filesHeading}
        </Text>
        <Text className="font-ku-medium text-ku-label text-ku-text-secondary">
          {messages.filesCount(files.length, maxFiles)}
        </Text>
      </View>
      <Text className="mt-ku-2 font-ku-regular text-ku-label text-ku-text-secondary">
        {messages.filesHint}
      </Text>
      <View className="mt-ku-12 flex-row flex-wrap gap-ku-sm">
        {files.map((file) => (
          <View className={tile} key={file.key} testID="worker-proof-file">
            {file.kind === "image" ? (
              <Image
                accessibilityLabel={file.name}
                className="h-full w-full"
                contentFit="cover"
                source={{ uri: file.uri }}
              />
            ) : (
              <View
                accessibilityLabel={`${messages.videoFile} ${file.name}`}
                className="flex-1 items-center justify-center gap-ku-xs px-ku-sm"
              >
                <Film color={palette.primaryDeep} size={24} strokeWidth={2} />
                <Text
                  className="text-center font-ku-medium text-ku-caption text-ku-text-secondary"
                  numberOfLines={2}
                >
                  {file.name}
                </Text>
              </View>
            )}
            {!disabled ? (
              <Pressable
                accessibilityLabel={messages.removeFile(file.name)}
                accessibilityRole="button"
                className="absolute top-ku-0 right-ku-0 h-[48px] w-[48px] items-end justify-start p-ku-6"
                hitSlop={0}
                onPress={() => onRemove(file.key)}
                testID={`worker-proof-remove-${file.key}`}
              >
                <View className="h-[28px] w-[28px] items-center justify-center rounded-ku-pill border border-ku-border bg-ku-surface">
                  <X color={palette.textStrong} size={15} strokeWidth={2.6} />
                </View>
              </Pressable>
            ) : null}
          </View>
        ))}
        {canAdd ? (
          <Pressable
            accessibilityLabel={messages.addFiles}
            accessibilityRole="button"
            className="h-[104px] w-[104px] items-center justify-center gap-ku-xs rounded-[14px] border-2 border-dashed border-ku-border-accent bg-ku-surface active:bg-ku-surface-muted"
            onPress={onAdd}
            testID="worker-proof-add-files"
          >
            <ImagePlus color={palette.primary} size={24} strokeWidth={2} />
            <Text className="font-ku-semibold text-ku-label text-ku-primary">
              {messages.addFiles}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
