import React from "react";
import { Modal } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { X } from "lucide-react-native";

import { Pressable, Text, View } from "@/tw";
import { colors } from "@/theme/colors";
import { spacing } from "@/theme/spacing";

const styles = {
  overlay: "bg-ku-overlay flex-1 justify-end",
  overlayFullScreen: "bg-ku-card flex-1",
  backdrop: "absolute bottom-0 left-0 right-0 top-0",
  sheet:
    "bg-ku-card max-h-[92%] min-h-[360px] rounded-tl-[24px] rounded-tr-[24px] px-[20px] pt-[12px]",
  sheetFullScreen: "bg-ku-card flex-1 px-[20px] pt-[12px]",
  handle:
    "self-center bg-ku-border-accent rounded-ku-pill h-[4px] mb-[14px] w-[40px]",
  header: "items-start flex-row justify-between",
  heading: "flex-1 min-w-0 pr-[12px]",
  title: "text-ku-text-strong font-ku-bold text-ku-title-small",
  subtitle:
    "text-ku-text-secondary font-ku-regular text-ku-body-small mt-[3px]",
  close:
    "items-center bg-ku-surface-muted rounded-ku-pill h-[44px] justify-center w-[44px]",
} as const;

export interface BottomSheetProps {
  visible: boolean;
  title: string;
  subtitle?: string;
  closeLabel: string;
  onClose: () => void;
  children: React.ReactNode;
  testID: string;
  bottomInset?: number;
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
  bottomInset,
  fullScreen = false,
}: BottomSheetProps) {
  const insets = useSafeAreaInsets();
  const paddingBottom = Math.max(
    spacing.md,
    (bottomInset ?? insets.bottom) + spacing.sm
  );

  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      transparent={!fullScreen}
      visible={visible}
    >
      <View className={fullScreen ? styles.overlayFullScreen : styles.overlay}>
        {fullScreen ? null : (
          <Pressable
            accessibilityLabel={closeLabel}
            accessibilityRole="button"
            className={styles.backdrop}
            onPress={onClose}
            testID={`${testID}-backdrop`}
          />
        )}
        <View
          accessibilityViewIsModal
          className={fullScreen ? styles.sheetFullScreen : styles.sheet}
          style={{
            flex: fullScreen ? 1 : undefined,
            paddingBottom,
            paddingTop: fullScreen ? insets.top + spacing.sm : undefined,
          }}
          testID={testID}
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
      </View>
    </Modal>
  );
}

BottomSheet.displayName = "BottomSheet";
