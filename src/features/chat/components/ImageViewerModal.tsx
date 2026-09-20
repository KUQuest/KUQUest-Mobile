import React from "react";
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { X } from "lucide-react-native";

import { colors } from "@/theme/colors";

export interface ImageViewerModalProps {
  visible: boolean;
  imageUrl: string | null;
  fileName?: string;
  timestamp?: string;
  onClose: () => void;
}

export const ImageViewerModal: React.FC<ImageViewerModalProps> = ({
  visible,
  imageUrl,
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
      <View style={styles.container}>
        <View style={[styles.topBar, { paddingTop: Math.max(insets.top, 16) }]}>
          <View style={styles.fileNameContainer}>
            {fileName ? (
              <Text numberOfLines={1} style={styles.fileName}>
                {fileName}
              </Text>
            ) : null}
            {timestamp ? (
              <Text numberOfLines={1} style={styles.timestamp}>
                {timestamp}
              </Text>
            ) : null}
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close"
            testID="image-viewer-close-button"
            onPress={onClose}
            style={styles.closeButton}
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
          />
        </ScrollView>
      </View>
    </Modal>
  );
};

export default ImageViewerModal;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.95)",
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    zIndex: 10,
  },
  fileNameContainer: {
    flex: 1,
    marginRight: 12,
  },
  fileName: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "600",
  },
  timestamp: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
});
