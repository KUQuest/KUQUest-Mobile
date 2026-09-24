import React from "react";
import { Image, Modal, StatusBar } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { X } from "lucide-react-native";

// The viewer image is sized and fitted imperatively and carries no class, so it
// stays on react-native's `Image`. `@/tw`'s `Image` is expo-image, which
// normalises `source` to an array and ignores `resizeMode`.
import { Pressable, ScrollView, Text, View } from "@/tw";

import { colors } from "@/theme/colors";
import { spacing } from "@/theme/spacing";

export interface ImageViewerModalProps {
  visible: boolean;
  imageUrl: string | null;
  imageAccessibilityLabel: string;
  closeLabel: string;
  fileName?: string;
  timestamp?: string;
  onClose: () => void;
}

export const ImageViewerModal: React.FC<ImageViewerModalProps> = ({
  visible,
  imageUrl,
  imageAccessibilityLabel,
  closeLabel,
  fileName,
  timestamp,
  onClose,
}) => {
  const insets = useSafeAreaInsets();

  if (!visible || !imageUrl) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <StatusBar barStyle="light-content" backgroundColor="rgba(0,0,0,0.95)" />
      <View className={styles.container} style={containerBackground}>
        <View
          className={styles.topBar}
          style={{ paddingTop: Math.max(insets.top, spacing.md) }}
        >
          <View className={styles.fileNameContainer}>
            {fileName ? (
              <Text numberOfLines={1} className={styles.fileName}>
                {fileName}
              </Text>
            ) : null}
            {timestamp ? (
              <Text numberOfLines={1} className={styles.timestamp}>
                {timestamp}
              </Text>
            ) : null}
          </View>
          <Pressable
            accessibilityLabel={closeLabel}
            accessibilityRole="button"
            testID="image-viewer-close-button"
            onPress={onClose}
            className={styles.closeButton}
            hitSlop={8}
          >
            <X size={24} color={colors.white} />
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
          }}
          maximumZoomScale={3}
          minimumZoomScale={1}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
        >
          <Image
            source={{ uri: imageUrl }}
            style={{ width: "100%", height: "80%" }}
            resizeMode="contain"
            testID="image-viewer-image"
            accessibilityLabel={imageAccessibilityLabel}
          />
        </ScrollView>
      </View>
    </Modal>
  );
};

const containerBackground = { backgroundColor: "rgba(0, 0, 0, 0.95)" };

const styles = {
  container: "flex-1",
  topBar: "items-center flex-row justify-between px-ku-md pb-ku-12 z-10",
  fileNameContainer: "flex-1 mr-ku-12",
  fileName: "text-ku-white text-[16px] font-semibold",
  timestamp: "mt-ku-2 text-ku-text-muted text-[12px]",
  closeButton: "h-12 w-12 items-center justify-center rounded-full",
} as const;
