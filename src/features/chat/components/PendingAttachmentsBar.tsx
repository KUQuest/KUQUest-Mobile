import React from "react";
import { ActivityIndicator } from "react-native";
import { X } from "lucide-react-native";

import { Image, Pressable, ScrollView, View } from "@/tw";
import { colors } from "@/theme/colors";
import styles from "../chatStyles";

export interface PendingAttachmentItem {
  id: string;
  uri: string;
  name: string;
  uploading?: boolean;
}

export function PendingAttachmentsBar({
  attachments,
  onRemove,
}: {
  attachments: PendingAttachmentItem[];
  onRemove: (id: string) => void;
}) {
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
        <View key={item.id} className={styles.pendingAttachmentChip}>
          <Image
            source={{ uri: item.uri }}
            className={styles.pendingAttachmentImage}
            resizeMode="cover"
          />
          {item.uploading ? (
            <View className={styles.pendingAttachmentUploading}>
              <ActivityIndicator size="small" color={colors.white} />
            </View>
          ) : null}
          <Pressable
            accessibilityLabel={`Remove ${item.name}`}
            accessibilityRole="button"
            testID={"remove-pending-attachment-" + item.id}
            className={styles.pendingAttachmentRemove}
            onPress={() => onRemove(item.id)}
          >
            <X color={colors.white} size={12} strokeWidth={2.5} />
          </Pressable>
        </View>
      ))}
    </ScrollView>
  );
}

export default PendingAttachmentsBar;
