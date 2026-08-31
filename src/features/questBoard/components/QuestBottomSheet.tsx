import React from 'react';
import { Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';

import { Pressable, Text, View } from '@/tw';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import styles from './groupQuestStyles';

export interface QuestBottomSheetProps {
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

/**
 * The small native sheet seam shared by the group Quest surfaces.
 *
 * It deliberately stays on React Native Modal rather than introducing a
 * gesture/dependency layer. Domain state and actions remain owned by callers.
 */
export function QuestBottomSheet({
  visible,
  title,
  subtitle,
  closeLabel,
  onClose,
  children,
  testID,
  bottomInset,
  fullScreen = false,
}: QuestBottomSheetProps) {
  const insets = useSafeAreaInsets();
  const paddingBottom = Math.max(spacing.md, (bottomInset ?? insets.bottom) + spacing.sm);

  return (
    <Modal animationType="slide" onRequestClose={onClose} transparent={!fullScreen} visible={visible}>
      <View className={fullScreen ? styles.sheetOverlayFullScreen : styles.sheetOverlay}>
        {fullScreen ? null : <Pressable
          accessibilityLabel={closeLabel}
          accessibilityRole="button"
          className={styles.sheetBackdrop}
          onPress={onClose}
          testID={`${testID}-backdrop`}
        />}
        <View
          accessibilityViewIsModal
          className={fullScreen ? styles.sheetFullScreen : styles.sheet}
          style={{ flex: fullScreen ? 1 : undefined, paddingBottom, paddingTop: fullScreen ? insets.top + spacing.sm : undefined }}
          testID={testID}
        >
          {fullScreen ? null : <View className={styles.sheetHandle} />}
          <View className={styles.sheetHeader}>
            <View className={styles.sheetHeading}>
              <Text accessibilityRole="header" className={styles.sheetTitle}>{title}</Text>
              {subtitle ? <Text className={styles.sheetSubtitle}>{subtitle}</Text> : null}
            </View>
            <Pressable
              accessibilityLabel={closeLabel}
              accessibilityRole="button"
              className={styles.sheetClose}
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

QuestBottomSheet.displayName = 'QuestBottomSheet';
