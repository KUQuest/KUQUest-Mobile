import React from "react";
import { Clock, QrCode, RefreshCw } from "lucide-react-native";
import { ActivityIndicator, Image, Text, View } from "@/tw";
import type { TopUpData } from "@/api/WalletApi";
import { Button } from "@/components/ui/Button";
import { formatSatang } from "@/domain/satang";
import { useAppTheme } from "@/features/workspace/AppThemeProvider";
import type { SupportedLocale } from "@/locales/locale";
import { walletMessages } from "@/locales/walletMessages";
import { TopUpNotice } from "./TopUpNotice";
import { topUpStyles } from "./topUpStyles";

export interface TopUpPromptPayStepProps {
  activeTopUp: TopUpData;
  checkingStatus: boolean;
  locale: SupportedLocale;
  onSimulatePayment: () => void;
  onVerifyPayment: () => void;
  statusMessage: string | null;
}

export function TopUpPromptPayStep({
  activeTopUp,
  checkingStatus,
  locale,
  onSimulatePayment,
  onVerifyPayment,
  statusMessage,
}: TopUpPromptPayStepProps) {
  const m = walletMessages[locale];
  const { colors } = useAppTheme();
  const total = formatSatang(activeTopUp.paymentTotalSatang, locale, "exact");

  return (
    <View className={topUpStyles.step} testID="top-up-promptpay-step">
      <View className={topUpStyles.intro}>
        <Text accessibilityRole="header" className={topUpStyles.headline}>
          {m.topUpPromptPayTitle}
        </Text>
        <Text className={topUpStyles.description}>
          {m.topUpPromptPayDescription}
        </Text>
      </View>

      <View className={styles.qrCard}>
        <View className={styles.badge}>
          <QrCode color={colors.primaryDark} size={16} strokeWidth={2.2} />
          <Text className={styles.badgeText}>PromptPay</Text>
        </View>

        {activeTopUp.qrDataUrl ? (
          <>
            {/* QR scanners need a light quiet zone in both appearances. */}
            <View
              accessibilityLabel={`${m.promptPayScanLabel}. ${m.topUpPaymentTotal}: ${total}`}
              accessibilityRole="image"
              accessible
              className={styles.qrFrame}
              testID="top-up-qr-image"
            >
              <Image
                className={styles.qrImage}
                contentFit="contain"
                source={{ uri: activeTopUp.qrDataUrl }}
              />
            </View>
            <Text className={styles.scanLabel}>{m.promptPayScanLabel}</Text>
          </>
        ) : (
          <View className={styles.qrUnavailable} testID="top-up-qr-unavailable">
            <QrCode color={colors.textMuted} size={40} strokeWidth={1.8} />
            <Text className={styles.qrUnavailableText}>
              {m.topUpQrUnavailable}
            </Text>
          </View>
        )}

        <View className={styles.amountRow}>
          <Text className={styles.amountLabel}>{m.topUpPaymentTotal}</Text>
          <Text
            className={styles.amountValue}
            selectable
            testID="top-up-qr-amount-value"
          >
            {total}
          </Text>
        </View>
      </View>

      {statusMessage ? (
        <TopUpNotice icon={Clock} message={statusMessage} tone="info" />
      ) : null}

      <View className={topUpStyles.actions}>
        <Button
          accessibilityLabel={m.checkStatus}
          accessibilityState={{
            disabled: checkingStatus,
            busy: checkingStatus,
          }}
          disabled={checkingStatus}
          onPress={onVerifyPayment}
          testID="top-up-check-status-btn"
        >
          {checkingStatus ? (
            <ActivityIndicator color={colors.onPrimary} size="small" />
          ) : (
            <>
              <RefreshCw color={colors.onPrimary} size={18} strokeWidth={2.4} />
              <Text className={styles.checkStatusText}>{m.checkStatus}</Text>
            </>
          )}
        </Button>

        {__DEV__ ? (
          <Button
            accessibilityLabel={m.simulateSuccess}
            disabled={checkingStatus}
            onPress={onSimulatePayment}
            testID="top-up-simulate-btn"
            variant="secondary"
          >
            {m.simulateSuccess}
          </Button>
        ) : null}
      </View>
    </View>
  );
}

const styles = {
  qrCard:
    "items-center gap-ku-md rounded-ku-card border border-ku-border bg-ku-surface p-ku-lg",
  badge:
    "flex-row items-center gap-ku-6 rounded-ku-pill bg-ku-surface-accent px-ku-12 py-ku-6",
  badgeText: "font-ku-semibold text-ku-label text-ku-primary-dark",
  qrFrame:
    "rounded-ku-image-large border border-ku-border bg-ku-white p-ku-12",
  qrImage: "h-[208px] w-[208px]",
  scanLabel: "text-center font-ku-medium text-ku-label text-ku-text-secondary",
  qrUnavailable:
    "min-h-[208px] w-full items-center justify-center gap-ku-sm rounded-ku-image-large bg-ku-surface-raised p-ku-lg",
  qrUnavailableText:
    "text-center font-ku-medium text-ku-body-small text-ku-text-secondary",
  amountRow:
    "w-full flex-row flex-wrap items-center justify-between gap-ku-sm border-t border-ku-divider pt-ku-md",
  amountLabel: "font-ku-semibold text-ku-body-small text-ku-text-secondary",
  amountValue: "font-ku-bold text-ku-title text-ku-text-strong",
  checkStatusText: "font-ku-semibold text-ku-body text-ku-on-primary",
} as const;
