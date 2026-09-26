import React from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react-native";
import { Text, View } from "@/tw";
import { Button } from "@/components/ui/Button";
import { formatSatang } from "@/domain/satang";
import { useAppTheme } from "@/features/workspace/AppThemeProvider";
import type { SupportedLocale } from "@/locales/locale";
import { walletMessages } from "@/locales/walletMessages";
import { topUpStyles } from "./topUpStyles";

export interface TopUpSuccessStepProps {
  creditSatang: number;
  locale: SupportedLocale;
  onDone: () => void;
  currentBalanceSatang: number | null;
  transactionReference: string;
  balanceRefreshFailed?: boolean;
  onRetryBalanceRefresh?: () => void;
  isRefreshingBalance?: boolean;
}

export function TopUpSuccessStep({
  creditSatang,
  locale,
  onDone,
  currentBalanceSatang,
  transactionReference,
  balanceRefreshFailed = false,
  onRetryBalanceRefresh,
  isRefreshingBalance = false,
}: TopUpSuccessStepProps) {
  const m = walletMessages[locale];
  const { colors } = useAppTheme();
  const currentBalance =
    currentBalanceSatang === null
      ? m.topUpBalanceUnavailable
      : formatSatang(currentBalanceSatang, locale, "exact");

  return (
    <View className={topUpStyles.step} testID="top-up-success-view">
      <View className={styles.hero}>
        <View className={styles.badge} testID="top-up-verified-badge">
          <CheckCircle2 color={colors.success} size={44} strokeWidth={2.2} />
        </View>
        <Text accessibilityRole="header" className={styles.title}>
          {m.topUpSuccessTitle}
        </Text>
        <Text className={styles.description}>{m.topUpSuccessDescription}</Text>
      </View>

      <View className={topUpStyles.receipt}>
        <View className={topUpStyles.receiptHero}>
          <Text className={topUpStyles.receiptHeroLabel}>{m.topUpCredit}</Text>
          <Text className={topUpStyles.receiptHeroValue}>
            {formatSatang(creditSatang, locale, "exact")}
          </Text>
        </View>
        <View className={styles.details}>
          <View className={styles.detail}>
            <Text className={styles.detailLabel}>{m.spendingBalance}</Text>
            <Text
              className={styles.detailValue}
              testID="top-up-current-balance"
            >
              {currentBalance}
            </Text>
          </View>
          <View className={styles.detail}>
            <Text className={styles.detailLabel}>{m.txReferenceLabel}</Text>
            <Text
              className={styles.referenceValue}
              selectable
              testID="top-up-reference-value"
            >
              {transactionReference}
            </Text>
          </View>
        </View>
      </View>
      {balanceRefreshFailed && (
        <View
          className="gap-ku-sm rounded-ku-card border border-ku-border-danger bg-ku-surface-danger p-ku-md"
          testID="top-up-balance-refresh-notice"
        >
          <View className="flex-row items-start gap-ku-sm">
            <AlertCircle color={colors.danger} size={18} strokeWidth={2.2} />
            <Text className="flex-1 font-ku-medium text-ku-body-small text-ku-danger-dark">
              {m.balanceRefreshFailed}
            </Text>
          </View>
          {onRetryBalanceRefresh && (
            <Button
              accessibilityLabel={m.topUpBalanceRefreshRetry}
              disabled={isRefreshingBalance}
              onPress={onRetryBalanceRefresh}
              testID="top-up-retry-balance-btn"
              variant="secondary"
            >
              {m.topUpBalanceRefreshRetry}
            </Button>
          )}
        </View>
      )}

      <Button
        accessibilityLabel={m.done}
        onPress={onDone}
        testID="top-up-done-btn"
      >
        {m.done}
      </Button>
    </View>
  );
}

const styles = {
  hero: "items-center gap-ku-sm pt-ku-md",
  badge:
    "mb-ku-sm h-[88px] w-[88px] items-center justify-center rounded-ku-pill border border-ku-border-success bg-ku-surface-success",
  title: "text-center font-ku-bold text-ku-title text-ku-text-strong",
  description:
    "text-center font-ku-regular text-ku-body-small text-ku-text-secondary",
  details: "gap-ku-md p-ku-md",
  detail: "gap-ku-2",
  detailLabel: "font-ku-medium text-ku-label text-ku-text-secondary",
  detailValue: "font-ku-semibold text-ku-body text-ku-text-strong",
  referenceValue: "font-ku-regular text-ku-body-small text-ku-text",
} as const;
