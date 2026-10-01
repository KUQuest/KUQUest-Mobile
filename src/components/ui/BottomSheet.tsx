import React from "react";
import { Modal } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { X } from "lucide-react-native";

import { Pressable, SafeAreaView, Text, View } from "@/tw";
import { colors } from "@/theme/colors";

const styles = {
  overlay: "bg-ku-overlay flex-1 justify-end",
  overlayFullScreen: "bg-ku-card flex-1",
  backdrop: "absolute bottom-0 left-0 right-0 top-0",
  sheet:
    "bg-ku-card max-h-[92%] min-h-[360px] rounded-tl-[24px] rounded-tr-[24px]",
  sheetFullScreen: "bg-ku-card flex-1",
  content: "flex-1 px-ku-20 pb-ku-md pt-ku-12",
  contentFullScreen: "flex-1 px-ku-20 pb-ku-md pt-ku-sm",
  handle:
    "self-center bg-ku-border-accent rounded-ku-pill h-[4px] mb-ku-14 w-[40px]",
  header: "items-start flex-row justify-between",
  heading: "flex-1 min-w-0 pr-ku-12",
  title: "text-ku-text-strong font-ku-bold text-ku-title-small",
  subtitle: "text-ku-text-secondary font-ku-regular text-ku-body-small mt-ku-3",
  close:
    "items-center bg-ku-surface-muted rounded-ku-pill h-[48px] justify-center w-[48px]",
} as const;

export interface BottomSheetProps {
  visible: boolean;
  title: string;
  subtitle?: string;
  closeLabel: string;
  onClose: () => void;
  children: React.ReactNode;
  testID: string;
  fullScreen?: boolean;
}

export function BottomSheet({
  visible,
  title,
  subtitle,
  closeLabel,
  onClose,
  children,
  testID,
  fullScreen = false,
}: BottomSheetProps) {
  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      transparent={!fullScreen}
      visible={visible}
    >
      <SafeAreaProvider>
        <View
          className={fullScreen ? styles.overlayFullScreen : styles.overlay}
        >
          {fullScreen ? null : (
            <Pressable
              accessibilityLabel={closeLabel}
              accessibilityRole="button"
              className={styles.backdrop}
              onPress={onClose}
              testID={`${testID}-backdrop`}
            />
          )}
          <SafeAreaView
            edges={
              fullScreen
                ? ["top", "left", "right", "bottom"]
                : ["left", "right", "bottom"]
            }
            accessibilityViewIsModal
            className={fullScreen ? styles.sheetFullScreen : styles.sheet}
            testID={testID}
          >
            <View
              className={fullScreen ? styles.contentFullScreen : styles.content}
            >
              {fullScreen ? null : <View className={styles.handle} />}
              <View className={styles.header}>
                <View className={styles.heading}>
                  <Text accessibilityRole="header" className={styles.title}>
                    {title}
                  </Text>
                  {subtitle ? (
                    <Text className={styles.subtitle}>{subtitle}</Text>
                  ) : null}
                </View>
                <Pressable
                  accessibilityLabel={closeLabel}
                  accessibilityRole="button"
                  className={styles.close}
                  onPress={onClose}
                  testID={`${testID}-close`}
                >
                  <X color={colors.textStrong} size={20} strokeWidth={2.3} />
                </Pressable>
              </View>
              {children}
            </View>
          </SafeAreaView>
        </View>
      </SafeAreaProvider>
    </Modal>
  );
}

BottomSheet.displayName = "BottomSheet";
