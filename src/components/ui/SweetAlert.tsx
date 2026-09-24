import React from "react";
import { Modal } from "react-native";
import { CircleAlert, CircleCheck, Info, TriangleAlert } from "lucide-react-native";

import { Button } from "@/components/ui/Button";
import { colors } from "@/theme/colors";
import { Text, View } from "@/tw";

export const SweetAlertVariant = {
  Error: "error",
  Success: "success",
  Warning: "warning",
  Info: "info",
} as const;

export type SweetAlertVariant =
  (typeof SweetAlertVariant)[keyof typeof SweetAlertVariant];

const variants: Record<
  SweetAlertVariant,
  { Icon: typeof CircleAlert; color: string }
> = {
  [SweetAlertVariant.Error]: { Icon: CircleAlert, color: colors.dangerDark },
  [SweetAlertVariant.Success]: {
    Icon: CircleCheck,
    color: colors.successBright,
  },
  [SweetAlertVariant.Warning]: {
    Icon: TriangleAlert,
    color: colors.warningDark,
  },
  [SweetAlertVariant.Info]: { Icon: Info, color: colors.info },
};

const styles = {
  overlay: "flex-1 items-center justify-center bg-ku-overlay px-ku-lg",
  dialog:
    "w-full max-w-[420px] items-center rounded-ku-card bg-ku-card px-ku-lg py-ku-xl",
  title:
    "mt-ku-md text-center text-ku-text-strong font-ku-semibold text-ku-title-small",
  message:
    "mt-ku-sm text-center text-ku-text-secondary font-ku-regular text-ku-body",
  close: "mt-ku-lg",
} as const;

export interface SweetAlertProps {
  visible: boolean;
  variant: SweetAlertVariant;
  title: string;
  message: string;
  buttonLabel: string;
  onClose: () => void;
  testID?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void;
}

export function SweetAlert({
  visible,
  variant,
  title,
  message,
  buttonLabel,
  onClose,
  confirmLabel,
  cancelLabel,
  onConfirm,
  testID = "sweet-alert",
}: SweetAlertProps) {
  const { Icon, color } = variants[variant];

  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      transparent
      visible={visible}
    >
      <View className={styles.overlay}>
        <View
          accessibilityViewIsModal
          className={styles.dialog}
          testID={testID}
        >
          <Icon color={color} size={44} strokeWidth={1.8} />
          <Text accessibilityRole="header" className={styles.title}>
            {title}
          </Text>
          <Text accessibilityRole="alert" className={styles.message}>
            {message}
          </Text>
          {onConfirm ? (
            <View className="mt-ku-lg w-full gap-ku-sm">
              <Button
                accessibilityLabel={confirmLabel ?? buttonLabel}
                onPress={onConfirm}
              >
                {confirmLabel ?? buttonLabel}
              </Button>
              <Button
                accessibilityLabel={cancelLabel ?? "Cancel"}
                onPress={onClose}
                variant="secondary"
              >
                {cancelLabel ?? "Cancel"}
              </Button>
            </View>
          ) : (
            <Button className={styles.close} onPress={onClose}>
              {buttonLabel}
            </Button>
          )}
        </View>
      </View>
    </Modal>
  );
}

SweetAlert.displayName = "SweetAlert";
