import React from "react";
import { Clock } from "lucide-react-native";
import { ActivityIndicator, Text, View } from "@/tw";
import type { TopUpQuote } from "@/api/WalletApi";
import { Button } from "@/components/ui/Button";
import { formatSatang } from "@/domain/satang";
import { useAppTheme } from "@/features/workspace/AppThemeProvider";
import type { SupportedLocale } from "@/locales/locale";
import { walletMessages } from "@/locales/walletMessages";
import { formatTopUpExpiry } from "../walletFormatting";
import { TopUpNotice } from "./TopUpNotice";
import { topUpStyles } from "./topUpStyles";

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
  const { colors } = useAppTheme();
  const rows = [
    { label: m.topUpCredit, satang: quote.creditSatang },
    { label: m.topUpFee, satang: quote.chargedFeeSatang },
    { label: m.topUpTax, satang: quote.chargedTaxSatang },
  ];

  return (
    <View className={topUpStyles.step} testID="top-up-confirmation-step">
      <Text accessibilityRole="header" className={topUpStyles.headline}>
        {m.topUpConfirmationTitle}
      </Text>

      <View className={topUpStyles.receipt}>
        <View className={topUpStyles.receiptHero}>
          <Text className={topUpStyles.receiptHeroLabel}>
            {m.topUpPaymentTotal}
          </Text>
          <Text
            className={topUpStyles.receiptHeroValue}
            testID="top-up-payment-total"
          >
            {formatSatang(quote.paymentTotalSatang, locale, "exact")}
          </Text>
        </View>

        <View className={styles.rows}>
          {rows.map((row) => (
            <View className={styles.row} key={row.label}>
              <Text className={styles.rowLabel}>{row.label}</Text>
              <Text className={styles.rowValue}>
                {formatSatang(row.satang, locale, "exact")}
              </Text>
            </View>
          ))}
        </View>

        <View className={styles.expiry}>
          <Clock color={colors.textSecondary} size={16} strokeWidth={2.2} />
          <Text className={styles.expiryText}>
            {m.topUpExpiresAt}: {formatTopUpExpiry(quote.expiresAt, locale)}
          </Text>
        </View>
      </View>

      {error ? <TopUpNotice message={error} tone="error" /> : null}

      <View className={topUpStyles.actions}>
        <Button
          accessibilityLabel={m.topUpConfirm}
          accessibilityState={{ disabled: loading, busy: loading }}
          disabled={loading}
          onPress={onConfirm}
          testID="top-up-confirm-btn"
        >
          {loading ? (
            <ActivityIndicator color={colors.onPrimary} size="small" />
          ) : (
            m.topUpConfirm
          )}
        </Button>
        <Button
          accessibilityLabel={m.editAmount}
          disabled={loading}
          onPress={onEdit}
          testID="top-up-edit-amount-btn"
          variant="secondary"
        >
          {m.editAmount}
        </Button>
      </View>
    </View>
  );
}

const styles = {
  rows: "gap-ku-12 p-ku-md",
  row: "flex-row items-start justify-between gap-ku-md",
  rowLabel: "flex-1 font-ku-regular text-ku-body-small text-ku-text-secondary",
  rowValue: "font-ku-semibold text-ku-body-small text-ku-text-strong",
  expiry:
    "flex-row items-center gap-ku-sm border-t border-ku-divider px-ku-md py-ku-12",
  expiryText: "flex-1 font-ku-regular text-ku-label text-ku-text-secondary",
} as const;
