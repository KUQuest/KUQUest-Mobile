import React from "react";
import { Button } from "@/components/ui/Button";
import { useAppTheme } from "@/features/workspace/AppThemeProvider";
import { ActivityIndicator, Text, View } from "@/tw";
import { cn } from "@/tw/cn";
import type { PayoutRecord } from "@/api/WalletApi";
import { formatSatang } from "@/domain/satang";
import { useLocale } from "@/features/preferences/localeStore";
import type { WalletMessages } from "@/locales/walletMessages";
import { getLocalizedErrorMessage } from "@/utils/error";
import {
  usePayoutQuery,
  usePayoutStatusHistoryQuery,
} from "../../api/walletQueries";
import {
  formatTransactionDate,
  formatTransactionTime,
} from "../../walletModule";
import { ButtonContent } from "./PayoutParts";
import { PAYOUT_TONE_CLASSES, getPayoutTone } from "./payoutStatusTone";
import payoutStyles from "./payoutStyles";

interface PayoutStatusSectionProps {
  payoutId: string;
  messages: WalletMessages;
}

function statusLabel(m: WalletMessages, status: string): string {
  return m.payoutStatusLabels[status] ?? status;
}

function settledAmounts(payout: PayoutRecord) {
  return {
    fee: payout.actualFeeSatang ?? payout.maximumFeeSatang,
    tax: payout.actualTaxSatang ?? payout.maximumTaxSatang,
    debit: payout.actualDebitSatang ?? payout.maximumDebitSatang,
    isMaximum: payout.actualDebitSatang == null,
  };
}

/** Payout status, amounts, and status history for the transaction detail. */
export function PayoutStatusSection({
  payoutId,
  messages: m,
}: PayoutStatusSectionProps) {
  const { locale } = useLocale();
  const payoutQuery = usePayoutQuery(payoutId);
  const historyQuery = usePayoutStatusHistoryQuery(payoutId);
  const { colors } = useAppTheme();

  if (payoutQuery.isPending) {
    return (
      <View
        accessibilityLabel={m.payoutDetailLoading}
        accessibilityLiveRegion="polite"
        className={payoutStyles.centered}
        testID="payout-status-loading"
      >
        <ActivityIndicator color={colors.primary} size="small" />
      </View>
    );
  }

  if (payoutQuery.isError) {
    return (
      <View
        accessibilityRole="alert"
        className={payoutStyles.card}
        testID="payout-status-error"
      >
        <Text className={payoutStyles.hintError}>
          {getLocalizedErrorMessage(payoutQuery.error, locale, {
            fallback: m.payoutDetailError,
          })}
        </Text>
        <Button
          accessibilityLabel={m.retry}
          onPress={() => {
            void payoutQuery.refetch();
            void historyQuery.refetch();
          }}
          testID="payout-status-retry"
          variant="secondary"
        >
          <ButtonContent label={m.retry} variant="secondary" />
        </Button>
      </View>
    );
  }

  const payout = payoutQuery.data;
  const status = payout.status ?? payout.payoutStatus ?? "";
  const amounts = settledAmounts(payout);
  const history = historyQuery.data ?? [];
  const tone = PAYOUT_TONE_CLASSES[getPayoutTone(status)];
  const money = (satang: number) => formatSatang(satang, locale, "exact");

  return (
    <View className="gap-ku-md" testID="payout-status-section">
      <View className="gap-ku-sm">
        <Text accessibilityRole="header" className={payoutStyles.cardTitle}>
          {m.payoutStatusTitle}
        </Text>
        <View className={cn(payoutStyles.pill, tone.pill)}>
          <View className={cn(payoutStyles.pillDot, tone.dot)} />
          <Text className={payoutStyles.pillText} testID="payout-status-label">
            {statusLabel(m, status)}
          </Text>
        </View>
        {m.payoutStatusDescriptions[status] ? (
          <Text className={payoutStyles.note}>
            {m.payoutStatusDescriptions[status]}
          </Text>
        ) : null}
      </View>

      <View className={payoutStyles.card} testID="payout-status-breakdown">
        {payout.receiptSatang != null ? (
          <View className={payoutStyles.row}>
            <Text className={payoutStyles.rowLabel}>
              {m.payoutReceiptLabel}
            </Text>
            <Text className={payoutStyles.rowValue}>
              {money(payout.receiptSatang)}
            </Text>
          </View>
        ) : null}
        {amounts.fee != null ? (
          <View className={payoutStyles.row}>
            <Text className={payoutStyles.rowLabel}>{m.payoutFeeLabel}</Text>
            <Text className={payoutStyles.rowValue}>{money(amounts.fee)}</Text>
          </View>
        ) : null}
        {amounts.tax != null ? (
          <View className={payoutStyles.row}>
            <Text className={payoutStyles.rowLabel}>{m.payoutTaxLabel}</Text>
            <Text className={payoutStyles.rowValue}>{money(amounts.tax)}</Text>
          </View>
        ) : null}
        {amounts.debit != null ? (
          <>
            <View className={payoutStyles.divider} />
            <View className={payoutStyles.row}>
              <Text className={payoutStyles.cardTitle}>
                {m.payoutDebitLabel}
              </Text>
              <Text className={payoutStyles.rowValueStrong}>
                {money(amounts.debit)}
              </Text>
            </View>
          </>
        ) : null}
        {amounts.isMaximum ? (
          <Text className={payoutStyles.note}>{m.payoutFeesMaximumNote}</Text>
        ) : null}
      </View>

      <View className="gap-ku-sm" testID="payout-status-history">
        <Text accessibilityRole="header" className={payoutStyles.cardTitle}>
          {m.payoutStatusHistoryTitle}
        </Text>
        {historyQuery.isPending ? (
          <ActivityIndicator color={colors.primary} size="small" />
        ) : historyQuery.isError ? (
          <View accessibilityRole="alert" className="gap-ku-sm">
            <Text className={payoutStyles.hintError}>
              {getLocalizedErrorMessage(historyQuery.error, locale, {
                fallback: m.payoutDetailError,
              })}
            </Text>
            <Button
              accessibilityLabel={m.retry}
              onPress={() => void historyQuery.refetch()}
              testID="payout-history-retry"
              variant="secondary"
            >
              <ButtonContent label={m.retry} variant="secondary" />
            </Button>
          </View>
        ) : history.length === 0 ? (
          <Text className={payoutStyles.note} testID="payout-history-empty">
            {m.payoutStatusHistoryEmpty}
          </Text>
        ) : (
          history.map((entry, index) => (
            <View
              accessible
              className={payoutStyles.timelineRow}
              key={entry.id}
              testID={`payout-history-${entry.id}`}
            >
              <View className={payoutStyles.timelineRail}>
                <View
                  className={cn(
                    payoutStyles.timelineDot,
                    PAYOUT_TONE_CLASSES[getPayoutTone(entry.toStatus)].dot
                  )}
                />
                {index < history.length - 1 ? (
                  <View className={payoutStyles.timelineLine} />
                ) : null}
              </View>
              <View className={payoutStyles.timelineBody}>
                <Text className={payoutStyles.rowValueStrong}>
                  {statusLabel(m, entry.toStatus)}
                </Text>
                <Text className={payoutStyles.note}>
                  {`${formatTransactionDate(entry.occurredAt, locale)} ${formatTransactionTime(entry.occurredAt)}`.trim()}
                </Text>
                {entry.reason ? (
                  <Text className={payoutStyles.note}>
                    {m.payoutHistoryReason(entry.reason)}
                  </Text>
                ) : null}
              </View>
            </View>
          ))
        )}
      </View>
    </View>
  );
}
