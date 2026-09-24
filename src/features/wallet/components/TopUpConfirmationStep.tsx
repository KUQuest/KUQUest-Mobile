import React from "react";
import type { ViewStyle } from "react-native";
import { ActivityIndicator, Text, TouchableOpacity, View } from "@/tw";
import { AlertCircle, Clock } from "lucide-react-native";
import type { TopUpQuote } from "@/api/WalletApi";
import { formatSatang } from "@/domain/satang";
import type { SupportedLocale } from "@/locales/locale";
import { walletMessages } from "@/locales/walletMessages";
import { colors } from "@/theme/colors";
import { formatTopUpExpiry } from "../walletFormatting";

export interface TopUpConfirmationStepProps {
  error: string | null;
  loading: boolean;
  locale: SupportedLocale;
  onConfirm: () => void;
  onEdit: () => void;
  quote: TopUpQuote;
}

const styles = {
  summaryCard:
    "mb-ku-md rounded-[20px] border border-ku-border-subtle bg-ku-surface p-ku-18",
  summaryHeader: "mb-ku-md border-b border-ku-border-subtle pb-ku-sm",
  summaryTitle: "mb-ku-2 font-ku-bold text-[16px] text-ku-text-strong",
  summarySubtitle: "font-ku-regular text-[12px] text-ku-text-secondary",
  breakdownTable: "gap-ku-sm",
  breakdownRow: "flex-row items-center justify-between",
  breakdownLabel: "font-ku-medium text-ku-meta text-ku-text-secondary",
  breakdownValue: "font-ku-semibold text-ku-body-small text-ku-text-strong",
  breakdownValueMuted: "font-ku-regular text-ku-meta text-ku-text-muted",
  breakdownDivider: "my-ku-xs h-[1px] bg-ku-border-subtle",
  breakdownTotalRow: "flex-row items-center justify-between pt-ku-xs",
  breakdownTotalLabel: "font-ku-bold text-ku-control text-ku-text-strong",
  breakdownTotalValue: "font-ku-bold text-ku-title-small text-ku-hirer-deep",
  expiryRow:
    "mt-ku-md flex-row items-center gap-ku-6 border-t border-ku-border-subtle pt-ku-sm",
  expiryText: "font-ku-regular text-[11px] text-ku-text-muted",
  errorBanner:
    "mt-ku-sm flex-row items-center gap-ku-6 rounded-[10px] bg-ku-surface-danger p-ku-10",
  errorText: "flex-1 font-ku-medium text-[12px] text-ku-danger",
  primaryActionButton:
    "h-[52px] items-center justify-center rounded-[16px] bg-ku-hirer-deep",
  primaryActionButtonText: "font-ku-bold text-ku-body text-ku-on-hirer",
  secondaryButton:
    "mt-ku-10 h-[48px] items-center justify-center rounded-[16px] bg-ku-surface-muted",
  secondaryButtonText:
    "font-ku-medium text-ku-body-small text-ku-text-secondary",
} as const;

const primaryActionShadow = {
  shadowColor: colors.hirerDeep,
  shadowOffset: { width: 0, height: 3 },
  shadowOpacity: 0.25,
  shadowRadius: 6,
  elevation: 3,
} satisfies ViewStyle;

export function TopUpConfirmationStep({
  error,
  loading,
  locale,
  onConfirm,
  onEdit,
  quote,
}: TopUpConfirmationStepProps) {
  const m = walletMessages[locale];

  return (
    <View testID="top-up-confirmation-step">
      <View className={styles.summaryCard}>
        <View className={styles.summaryHeader}>
          <Text className={styles.summaryTitle}>
            {m.topUpConfirmationTitle}
          </Text>
          <Text className={styles.summarySubtitle}>
            {m.topUpConfirmationStepSubtitle}
          </Text>
        </View>

        <View className={styles.breakdownTable}>
          <View className={styles.breakdownRow}>
            <Text className={styles.breakdownLabel}>{m.topUpCredit}</Text>
            <Text className={styles.breakdownValue}>
              {formatSatang(quote.creditSatang, locale, "exact")}
            </Text>
          </View>

          <View className={styles.breakdownRow}>
            <Text className={styles.breakdownLabel}>{m.topUpFee}</Text>
            <Text className={styles.breakdownValueMuted}>
              {formatSatang(quote.chargedFeeSatang, locale, "exact")}
            </Text>
          </View>

          <View className={styles.breakdownRow}>
            <Text className={styles.breakdownLabel}>{m.topUpTax}</Text>
            <Text className={styles.breakdownValueMuted}>
              {formatSatang(quote.chargedTaxSatang, locale, "exact")}
            </Text>
          </View>

          <View className={styles.breakdownDivider} />

          <View className={styles.breakdownTotalRow}>
            <Text className={styles.breakdownTotalLabel}>
              {m.topUpPaymentTotal}
            </Text>
            <Text
              className={styles.breakdownTotalValue}
              testID="top-up-payment-total"
            >
              {formatSatang(quote.paymentTotalSatang, locale, "exact")}
            </Text>
          </View>
        </View>

        <View className={styles.expiryRow}>
          <Clock color={colors.textMuted} size={14} />
          <Text className={styles.expiryText}>
            {m.topUpExpiresAt}: {formatTopUpExpiry(quote.expiresAt, locale)}
          </Text>
        </View>
      </View>

      {error ? (
        <View className={styles.errorBanner}>
          <AlertCircle color={colors.danger} size={15} />
          <Text className={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <TouchableOpacity
        accessibilityLabel={m.topUpConfirm}
        accessibilityRole="button"
        activeOpacity={0.8}
        disabled={loading}
        onPress={onConfirm}
        className={styles.primaryActionButton}
        style={primaryActionShadow}
        testID="top-up-confirm-btn"
      >
        {loading ? (
          <ActivityIndicator color={colors.onHirer} size="small" />
        ) : (
          <Text className={styles.primaryActionButtonText}>
            {m.topUpConfirm}
          </Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        accessibilityLabel={m.editAmount}
        accessibilityRole="button"
        activeOpacity={0.7}
        disabled={loading}
        onPress={onEdit}
        className={styles.secondaryButton}
        testID="top-up-edit-amount-btn"
      >
        <Text className={styles.secondaryButtonText}>{m.editAmount}</Text>
      </TouchableOpacity>
    </View>
  );
}
