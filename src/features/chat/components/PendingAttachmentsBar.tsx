import { ActivityIndicator } from "react-native";
import { X } from "lucide-react-native";

import { useLocale } from "@/features/preferences/localeStore";
import { chatMessages } from "@/locales/chatMessages";
import { Image, Pressable, ScrollView, Text, View } from "@/tw";
import { useAppTheme } from "@/features/workspace/AppThemeProvider";
import styles from "../chatStyles";

export interface PendingAttachmentItem {
  id: string;
  uri: string;
  name: string;
  type: string;
  uploading?: boolean;
  rateLimited?: boolean;
}

export function PendingAttachmentsBar({
  attachments,
  onRemove,
  onRetry,
}: {
  attachments: PendingAttachmentItem[];
  onRemove: (id: string) => void;
  onRetry: (id: string) => void;
}) {
  const { colors } = useAppTheme();
  const { locale } = useLocale();
  const messages = chatMessages[locale];

  if (attachments.length === 0) {
    return null;
  }
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      className={styles.pendingAttachmentsBar}
    >
      {attachments.map((item) => (
        <View
          key={item.id}
          className={
            item.rateLimited
              ? "relative min-h-[96px] w-[240px] rounded-ku-control border border-ku-border-accent bg-ku-surface-muted p-ku-sm"
              : styles.pendingAttachmentChip
          }
        >
          {!item.rateLimited ? (
            <Image
              source={{ uri: item.uri }}
              className={styles.pendingAttachmentImage}
              resizeMode="cover"
            />
          ) : null}
          {item.uploading ? (
            <View className={styles.pendingAttachmentUploading}>
              <ActivityIndicator size="small" color={colors.onPrimary} />
            </View>
          ) : null}
          {item.rateLimited ? (
            <View className="gap-ku-xs">
              <Text>{messages.attachmentRateLimited}</Text>
              <Pressable
                accessibilityLabel={messages.retryAttachment}
                accessibilityRole="button"
                className="min-h-[48px] min-w-[48px] items-center justify-center"
                onPress={() => onRetry(item.id)}
              >
                <Text>{messages.retryAttachment}</Text>
              </Pressable>
            </View>
          ) : null}
          <Pressable
            accessibilityLabel={messages.removeAttachment(item.name)}
            accessibilityRole="button"
            hitSlop={14}
            testID={"remove-pending-attachment-" + item.id}
            className={styles.pendingAttachmentRemove}
            onPress={() => onRemove(item.id)}
          >
            <X color={colors.onPrimary} size={12} strokeWidth={2.5} />
          </Pressable>
        </View>
      ))}
    </ScrollView>
  );
}
