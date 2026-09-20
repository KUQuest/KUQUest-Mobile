import React from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { AlertCircle, Clock } from "lucide-react-native";
import type { TopUpQuote } from "@/api/WalletApi";
import { formatSatang } from "@/domain/satang";
import type { SupportedLocale } from "@/locales/locale";
import { walletMessages } from "@/locales/walletMessages";
import { colors } from "@/theme/colors";
import { fontFamily } from "@/theme/typography";

function formatExpiry(expiresAt: string, locale: SupportedLocale): string {
  const date = new Date(expiresAt);
  if (Number.isNaN(date.getTime())) return expiresAt;
  return new Intl.DateTimeFormat(locale === "th" ? "th-TH" : "en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export interface TopUpConfirmationStepProps {
  error: string | null;
  loading: boolean;
  locale: SupportedLocale;
  onConfirm: () => void;
  onEdit: () => void;
  quote: TopUpQuote;
}

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
      <View style={styles.summaryCard}>
        <View style={styles.summaryHeader}>
          <Text style={styles.summaryTitle}>{m.topUpConfirmationTitle}</Text>
          <Text style={styles.summarySubtitle}>
            {m.topUpConfirmationStepSubtitle}
          </Text>
        </View>

        <View style={styles.breakdownTable}>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>{m.topUpCredit}</Text>
            <Text style={styles.breakdownValue}>
              {formatSatang(quote.creditSatang, locale, "exact")}
            </Text>
          </View>

          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>{m.topUpFee}</Text>
            <Text style={styles.breakdownValueMuted}>
              {formatSatang(quote.chargedFeeSatang, locale, "exact")}
            </Text>
          </View>

          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>{m.topUpTax}</Text>
            <Text style={styles.breakdownValueMuted}>
              {formatSatang(quote.chargedTaxSatang, locale, "exact")}
            </Text>
          </View>

          <View style={styles.breakdownDivider} />

          <View style={styles.breakdownTotalRow}>
            <Text style={styles.breakdownTotalLabel}>
              {m.topUpPaymentTotal}
            </Text>
            <Text
              style={styles.breakdownTotalValue}
              testID="top-up-payment-total"
            >
              {formatSatang(quote.paymentTotalSatang, locale, "exact")}
            </Text>
          </View>
        </View>

        <View style={styles.expiryRow}>
          <Clock color={colors.textMuted} size={14} />
          <Text style={styles.expiryText}>
            {m.topUpExpiresAt}: {formatExpiry(quote.expiresAt, locale)}
          </Text>
        </View>
      </View>

      {error ? (
        <View style={styles.errorBanner}>
          <AlertCircle color={colors.danger} size={15} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <TouchableOpacity
        accessibilityLabel={m.topUpConfirm}
        accessibilityRole="button"
        activeOpacity={0.8}
        disabled={loading}
        onPress={onConfirm}
        style={styles.primaryActionButton}
        testID="top-up-confirm-btn"
      >
        {loading ? (
          <ActivityIndicator color={colors.white} size="small" />
        ) : (
          <Text style={styles.primaryActionButtonText}>{m.topUpConfirm}</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        accessibilityLabel={m.editAmount}
        accessibilityRole="button"
        activeOpacity={0.7}
        disabled={loading}
        onPress={onEdit}
        style={styles.secondaryButton}
        testID="top-up-edit-amount-btn"
      >
        <Text style={styles.secondaryButtonText}>{m.editAmount}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    padding: 18,
    marginBottom: 20,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryHeader: {
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
    paddingBottom: 12,
  },
  summaryTitle: {
    fontFamily: fontFamily.bold,
    fontSize: 16,
    color: colors.textStrong,
    marginBottom: 2,
  },
  summarySubtitle: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    color: colors.textSecondary,
  },
  breakdownTable: { gap: 12 },
  breakdownRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  breakdownLabel: {
    fontFamily: fontFamily.medium,
    fontSize: 13,
    color: colors.textSecondary,
  },
  breakdownValue: {
    fontFamily: fontFamily.semiBold,
    fontSize: 14,
    color: colors.textStrong,
  },
  breakdownValueMuted: {
    fontFamily: fontFamily.regular,
    fontSize: 13,
    color: colors.textMuted,
  },
  breakdownDivider: {
    height: 1,
    backgroundColor: colors.borderSubtle,
    marginVertical: 4,
  },
  breakdownTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 4,
  },
  breakdownTotalLabel: {
    fontFamily: fontFamily.bold,
    fontSize: 15,
    color: colors.textStrong,
  },
  breakdownTotalValue: {
    fontFamily: fontFamily.bold,
    fontSize: 20,
    color: colors.primaryDeep,
  },
  expiryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
  expiryText: {
    fontFamily: fontFamily.regular,
    fontSize: 11,
    color: colors.textMuted,
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.surfaceDanger,
    borderRadius: 10,
    padding: 10,
    marginTop: 8,
  },
  errorText: {
    fontFamily: fontFamily.medium,
    fontSize: 12,
    color: colors.danger,
    flex: 1,
  },
  primaryActionButton: {
    backgroundColor: colors.primaryDeep,
    borderRadius: 16,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.primaryDeep,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  primaryActionButtonText: {
    fontFamily: fontFamily.bold,
    fontSize: 16,
    color: colors.white,
  },
  secondaryButton: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 16,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  secondaryButtonText: {
    fontFamily: fontFamily.medium,
    fontSize: 14,
    color: colors.textSecondary,
  },
});
