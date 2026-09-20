import React from "react";
import type { ViewStyle } from "react-native";
import { ActivityIndicator, Image, Text, TouchableOpacity, View } from "@/tw";
import { QrCode, RefreshCw, Sparkles } from "lucide-react-native";
import type { TopUpData } from "@/api/WalletApi";
import { formatSatang } from "@/domain/satang";
import type { SupportedLocale } from "@/locales/locale";
import { walletMessages } from "@/locales/walletMessages";
import { colors } from "@/theme/colors";

export interface TopUpPromptPayStepProps {
  activeTopUp: TopUpData;
  checkingStatus: boolean;
  locale: SupportedLocale;
  onSimulatePayment: () => void;
  onVerifyPayment: () => void;
  statusMessage: string | null;
}

const styles = {
  promptPayContainer: "items-center",
  promptPayDesc:
    "mb-ku-md px-ku-sm text-center font-ku-regular text-[13px] text-ku-text-secondary",
  qrCard:
    "mb-ku-md w-full items-center rounded-[24px] border border-ku-border-subtle bg-ku-surface p-ku-md",
  qrHeader: "mb-ku-md items-center",
  qrHeaderPromptPay: "font-ku-bold text-ku-subtitle text-ku-primary-dark",
  qrHeaderSubtitle:
    "mt-[2px] font-ku-medium text-[12px] text-ku-text-secondary",
  qrImageWrapper:
    "mb-ku-md h-[220px] w-[220px] items-center justify-center overflow-hidden rounded-[16px] border border-ku-border-subtle bg-ku-white",
  qrImage: "h-[200px] w-[200px]",
  qrPlaceholder: "items-center justify-center",
  qrPlaceholderText: "mt-ku-sm font-ku-medium text-[11px] text-ku-text-muted",
  qrAmountBox: "items-center",
  qrAmountLabel: "font-ku-medium text-[12px] text-ku-text-secondary",
  qrAmountValue: "mt-[2px] font-ku-bold text-[26px] text-ku-text-strong",
  statusBanner:
    "mb-[18px] w-full items-center rounded-[12px] bg-ku-surface-muted p-ku-sm",
  statusBannerText: "font-ku-medium text-[13px] text-ku-text-secondary",
  promptPayActions: "w-full gap-[10px]",
  checkStatusButton:
    "h-[50px] flex-row items-center justify-center gap-ku-sm rounded-[16px] bg-ku-primary-deep",
  checkStatusButtonText: "font-ku-semibold text-ku-control text-ku-on-primary",
  simulateButton:
    "h-[44px] flex-row items-center justify-center gap-[6px] rounded-[16px] border border-ku-border-success bg-ku-surface-success",
  simulateButtonText: "font-ku-medium text-[13px] text-ku-primary-deep",
} as const;

const qrCardShadow = {
  shadowColor: colors.black,
  shadowOffset: { width: 0, height: 3 },
  shadowOpacity: 0.08,
  shadowRadius: 10,
  elevation: 3,
} satisfies ViewStyle;

const checkStatusShadow = {
  shadowColor: colors.primaryDeep,
  shadowOffset: { width: 0, height: 3 },
  shadowOpacity: 0.25,
  shadowRadius: 6,
  elevation: 3,
} satisfies ViewStyle;

export function TopUpPromptPayStep({
  activeTopUp,
  checkingStatus,
  locale,
  onSimulatePayment,
  onVerifyPayment,
  statusMessage,
}: TopUpPromptPayStepProps) {
  const m = walletMessages[locale];

  return (
    <View className={styles.promptPayContainer} testID="top-up-promptpay-step">
      <Text className={styles.promptPayDesc}>
        {m.topUpPromptPayDescription}
      </Text>

      <View className={styles.qrCard} style={qrCardShadow}>
        <View className={styles.qrHeader}>
          <Text className={styles.qrHeaderPromptPay}>PromptPay</Text>
          <Text className={styles.qrHeaderSubtitle}>
            {m.promptPayScanLabel}
          </Text>
        </View>

        <View className={styles.qrImageWrapper}>
          {activeTopUp.qrDataUrl ? (
            <Image
              resizeMode="contain"
              source={{ uri: activeTopUp.qrDataUrl }}
              className={styles.qrImage}
            />
          ) : (
            <View className={styles.qrPlaceholder}>
              <QrCode color={colors.primary} size={120} strokeWidth={1.8} />
              <Text className={styles.qrPlaceholderText}>
                {m.promptPayQrCode}
              </Text>
            </View>
          )}
        </View>

        <View className={styles.qrAmountBox}>
          <Text className={styles.qrAmountLabel}>{m.topUpPaymentTotal}</Text>
          <Text
            className={styles.qrAmountValue}
            testID="top-up-qr-amount-value"
          >
            {formatSatang(activeTopUp.paymentTotalSatang, locale, "exact")}
          </Text>
        </View>
      </View>

      {statusMessage ? (
        <View className={styles.statusBanner}>
          <Text className={styles.statusBannerText}>{statusMessage}</Text>
        </View>
      ) : null}

      <View className={styles.promptPayActions}>
        <TouchableOpacity
          accessibilityLabel={m.checkStatus}
          accessibilityRole="button"
          activeOpacity={0.8}
          disabled={checkingStatus}
          onPress={onVerifyPayment}
          className={styles.checkStatusButton}
          style={checkStatusShadow}
          testID="top-up-check-status-btn"
        >
          {checkingStatus ? (
            <ActivityIndicator color={colors.onPrimary} size="small" />
          ) : (
            <>
              <RefreshCw color={colors.onPrimary} size={16} />
              <Text className={styles.checkStatusButtonText}>
                {m.checkStatus}
              </Text>
            </>
          )}
        </TouchableOpacity>

        {__DEV__ ? (
          <TouchableOpacity
            accessibilityLabel={m.simulateSuccess}
            accessibilityRole="button"
            activeOpacity={0.7}
            disabled={checkingStatus}
            onPress={onSimulatePayment}
            className={styles.simulateButton}
            testID="top-up-simulate-btn"
          >
            <Sparkles color={colors.primaryDeep} size={15} />
            <Text className={styles.simulateButtonText}>
              {m.simulateSuccess}
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}
