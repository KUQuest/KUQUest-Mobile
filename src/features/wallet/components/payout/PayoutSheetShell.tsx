import React from "react";
import { Modal } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ChevronLeft, X } from "lucide-react-native";
import {
  KeyboardAvoidingView,
  Pressable,
  SafeAreaView,
  Text,
  TouchableOpacity,
  View,
} from "@/tw";
import { useAppTheme } from "@/features/workspace/AppThemeProvider";
import payoutStyles from "./payoutStyles";

interface PayoutSheetShellProps {
  visible: boolean;
  title: string;
  closeLabel: string;
  backLabel: string;
  busy: boolean;
  onClose: () => void;
  onBack: (() => void) | null;
  children: React.ReactNode;
}

/**
 * Bottom-sheet chrome for every Payout step: overlay, handle, a header with
 * back and close, and the keyboard avoider. The bottom safe-area edge is owned
 * here once; step footers add no inset of their own.
 */
export function PayoutSheetShell({
  visible,
  title,
  closeLabel,
  backLabel,
  busy,
  onClose,
  onBack,
  children,
}: PayoutSheetShellProps) {
  const { colors } = useAppTheme();
  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      transparent
      visible={visible}
    >
      <SafeAreaProvider>
        <View className={payoutStyles.overlay}>
          <Pressable
            accessibilityLabel={closeLabel}
            accessibilityRole="button"
            className={payoutStyles.backdrop}
            onPress={onClose}
            testID="payout-request-backdrop"
          />
          <SafeAreaView
            accessibilityViewIsModal
            className={payoutStyles.sheet}
            edges={["left", "right", "bottom"]}
            testID="payout-request-modal"
          >
            <KeyboardAvoidingView className="shrink">
              <View className={payoutStyles.handle} />
              <View className={payoutStyles.header}>
                {onBack ? (
                  <TouchableOpacity
                    accessibilityLabel={backLabel}
                    accessibilityRole="button"
                    accessibilityState={{ disabled: busy }}
                    className={payoutStyles.iconBtn}
                    disabled={busy}
                    onPress={onBack}
                    testID="payout-back-btn"
                  >
                    <ChevronLeft
                      color={colors.textStrong}
                      size={22}
                      strokeWidth={2.2}
                    />
                  </TouchableOpacity>
                ) : null}
                <Text
                  accessibilityRole="header"
                  className={payoutStyles.headerTitle}
                  testID="payout-sheet-title"
                >
                  {title}
                </Text>
                <TouchableOpacity
                  accessibilityLabel={closeLabel}
                  accessibilityRole="button"
                  accessibilityState={{ disabled: busy }}
                  className={payoutStyles.iconBtn}
                  disabled={busy}
                  onPress={onClose}
                  testID="payout-request-close-btn"
                >
                  <X color={colors.textStrong} size={20} strokeWidth={2.3} />
                </TouchableOpacity>
              </View>
              {children}
            </KeyboardAvoidingView>
          </SafeAreaView>
        </View>
      </SafeAreaProvider>
    </Modal>
  );
}
