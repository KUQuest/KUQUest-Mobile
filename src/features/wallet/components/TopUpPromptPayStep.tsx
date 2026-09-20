import React from "react";
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { QrCode, RefreshCw, Sparkles } from "lucide-react-native";
import type { TopUpData } from "@/api/WalletApi";
import { formatSatang } from "@/domain/satang";
import type { SupportedLocale } from "@/locales/locale";
import { walletMessages } from "@/locales/walletMessages";
import { colors } from "@/theme/colors";
import { fontFamily } from "@/theme/typography";

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

  return (
    <View style={styles.promptPayContainer} testID="top-up-promptpay-step">
      <Text style={styles.promptPayDesc}>{m.topUpPromptPayDescription}</Text>

      <View style={styles.qrCard}>
        <View style={styles.qrHeader}>
          <Text style={styles.qrHeaderPromptPay}>PromptPay</Text>
          <Text style={styles.qrHeaderSubtitle}>{m.promptPayScanLabel}</Text>
        </View>

        <View style={styles.qrImageWrapper}>
          {activeTopUp.qrDataUrl ? (
            <Image
              resizeMode="contain"
              source={{ uri: activeTopUp.qrDataUrl }}
              style={styles.qrImage}
            />
          ) : (
            <View style={styles.qrPlaceholder}>
              <QrCode color={colors.primary} size={120} strokeWidth={1.8} />
              <Text style={styles.qrPlaceholderText}>{m.promptPayQrCode}</Text>
            </View>
          )}
        </View>

        <View style={styles.qrAmountBox}>
          <Text style={styles.qrAmountLabel}>{m.topUpPaymentTotal}</Text>
          <Text style={styles.qrAmountValue} testID="top-up-qr-amount-value">
            {formatSatang(activeTopUp.paymentTotalSatang, locale, "exact")}
          </Text>
        </View>
      </View>

      {statusMessage ? (
        <View style={styles.statusBanner}>
          <Text style={styles.statusBannerText}>{statusMessage}</Text>
        </View>
      ) : null}

      <View style={styles.promptPayActions}>
        <TouchableOpacity
          accessibilityLabel={m.checkStatus}
          accessibilityRole="button"
          activeOpacity={0.8}
          disabled={checkingStatus}
          onPress={onVerifyPayment}
          style={styles.checkStatusButton}
          testID="top-up-check-status-btn"
        >
          {checkingStatus ? (
            <ActivityIndicator color={colors.white} size="small" />
          ) : (
            <>
              <RefreshCw color={colors.white} size={16} />
              <Text style={styles.checkStatusButtonText}>{m.checkStatus}</Text>
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
            style={styles.simulateButton}
            testID="top-up-simulate-btn"
          >
            <Sparkles color={colors.primaryDeep} size={15} />
            <Text style={styles.simulateButtonText}>{m.simulateSuccess}</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  promptPayContainer: { alignItems: "center" },
  promptPayDesc: {
    fontFamily: fontFamily.regular,
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: 16,
    paddingHorizontal: 12,
  },
  qrCard: {
    width: "100%",
    backgroundColor: colors.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    alignItems: "center",
    padding: 20,
    marginBottom: 20,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  qrHeader: { alignItems: "center", marginBottom: 16 },
  qrHeaderPromptPay: {
    fontFamily: fontFamily.bold,
    fontSize: 18,
    color: colors.primaryDark,
    letterSpacing: 0.5,
  },
  qrHeaderSubtitle: {
    fontFamily: fontFamily.medium,
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  qrImageWrapper: {
    width: 220,
    height: 220,
    borderRadius: 16,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    marginBottom: 16,
  },
  qrImage: { width: 200, height: 200 },
  qrPlaceholder: { alignItems: "center", justifyContent: "center" },
  qrPlaceholderText: {
    fontFamily: fontFamily.medium,
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 8,
  },
  qrAmountBox: { alignItems: "center" },
  qrAmountLabel: {
    fontFamily: fontFamily.medium,
    fontSize: 12,
    color: colors.textSecondary,
  },
  qrAmountValue: {
    fontFamily: fontFamily.bold,
    fontSize: 26,
    color: colors.textStrong,
    marginTop: 2,
  },
  statusBanner: {
    width: "100%",
    backgroundColor: colors.surfaceMuted,
    borderRadius: 12,
    padding: 12,
    marginBottom: 18,
    alignItems: "center",
  },
  statusBannerText: {
    fontFamily: fontFamily.medium,
    fontSize: 13,
    color: colors.textSecondary,
  },
  promptPayActions: { width: "100%", gap: 10 },
  checkStatusButton: {
    backgroundColor: colors.primaryDeep,
    borderRadius: 16,
    height: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: colors.primaryDeep,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  checkStatusButtonText: {
    fontFamily: fontFamily.semiBold,
    fontSize: 15,
    color: colors.white,
  },
  simulateButton: {
    backgroundColor: colors.surfaceSuccess,
    borderRadius: 16,
    height: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: colors.borderSuccess,
  },
  simulateButtonText: {
    fontFamily: fontFamily.medium,
    fontSize: 13,
    color: colors.primaryDeep,
  },
});
