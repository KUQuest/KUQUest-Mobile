import React, { useEffect } from "react";
import { Modal } from "react-native";
import {
  CircleAlert,
  CircleCheck,
  Info,
  TriangleAlert,
} from "lucide-react-native";
import { create } from "zustand";

import { Button } from "@/components/ui/Button";
import { useLocale } from "@/features/preferences/localeStore";
import { alertMessages } from "@/locales/alertMessages";
import { colors } from "@/theme/colors";
import { Text, View } from "@/tw";
import { getErrorMessage } from "@/utils/error";

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

interface SweetAlertRequest {
  title: string;
  message: string;
  variant: SweetAlertVariant;
  buttonLabel?: string;
  cancelLabel?: string;
  onClose?: () => void;
  onConfirm?: () => void;
}

const useSweetAlertStore = create<{ current: SweetAlertRequest | null }>(
  () => ({ current: null })
);

export function showSweetAlert(alert: SweetAlertRequest): void {
  useSweetAlertStore.setState({ current: alert });
}

export function showConfirmModal({
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
}: {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
}): void {
  showSweetAlert({
    title,
    message,
    variant: SweetAlertVariant.Warning,
    buttonLabel: confirmLabel,
    cancelLabel,
    onConfirm,
  });
}

/** Shows an app-wide error SweetAlert with a localized fallback message. */
export function showErrorAlert(title: string, error?: unknown): void {
  showSweetAlert({
    title,
    message: getErrorMessage(error, ""),
    variant: SweetAlertVariant.Error,
  });
}

/** Mounted once at the app root; renders alerts raised by the shared API. */
export function SweetAlertHost() {
  const current = useSweetAlertStore((state) => state.current);
  const messages = alertMessages[useLocale().locale];
  const onConfirm = current?.onConfirm;
  useEffect(() => () => useSweetAlertStore.setState({ current: null }), []);
  return (
    <SweetAlert
      buttonLabel={current?.buttonLabel ?? messages.dismiss}
      cancelLabel={current?.cancelLabel ?? messages.dismiss}
      confirmLabel={current?.buttonLabel}
      message={
        current?.message ||
        (current?.variant === SweetAlertVariant.Error
          ? messages.errorFallback
          : "")
      }
      onClose={() => {
        const onClose = current?.onClose;
        useSweetAlertStore.setState({ current: null });
        onClose?.();
      }}
      onConfirm={
        onConfirm
          ? () => {
              useSweetAlertStore.setState({ current: null });
              onConfirm();
            }
          : undefined
      }
      testID="sweet-alert"
      title={current?.title ?? ""}
      variant={current?.variant ?? SweetAlertVariant.Info}
      visible={current !== null}
    />
  );
}
