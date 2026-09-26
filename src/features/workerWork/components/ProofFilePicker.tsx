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
  "h-[88px] w-[88px] overflow-hidden rounded-ku-field border border-ku-border bg-ku-surface-raised";

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
    <View className="gap-ku-12">
      <View className="gap-ku-2">
        <View className="flex-row items-center justify-between gap-ku-sm">
          <Text
            accessibilityRole="header"
            className="flex-1 font-ku-semibold text-ku-body text-ku-text-strong"
          >
            {messages.filesHeading}
          </Text>
          <Text className="rounded-ku-pill bg-ku-surface-raised px-ku-sm py-ku-2 font-ku-medium text-ku-label text-ku-text-secondary">
            {messages.filesCount(files.length, maxFiles)}
          </Text>
        </View>
        <Text className="font-ku-regular text-ku-label text-ku-text-secondary">
          {messages.filesHint}
        </Text>
      </View>
      <View className="flex-row flex-wrap gap-ku-sm">
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
                <Film color={palette.workerDark} size={22} strokeWidth={2} />
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
                <View className="h-[28px] w-[28px] items-center justify-center rounded-ku-pill bg-ku-surface">
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
            className="h-[88px] w-[88px] items-center justify-center gap-ku-xs rounded-ku-field border border-dashed border-ku-worker-border bg-ku-worker-subtle active:bg-ku-surface-raised"
            onPress={onAdd}
            testID="worker-proof-add-files"
          >
            <ImagePlus color={palette.workerDark} size={22} strokeWidth={2} />
            <Text className="font-ku-semibold text-ku-label text-ku-worker-dark">
              {messages.addFiles}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
