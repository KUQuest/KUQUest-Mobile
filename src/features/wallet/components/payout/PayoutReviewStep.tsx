import React from "react";
import type { PayoutDestination, PayoutQuote } from "@/api/WalletApi";
import { Button } from "@/components/ui/Button";
import { formatTimeInBangkok } from "@/domain/datetime";
import { formatSatang } from "@/domain/satang";
import type { SupportedLocale } from "@/locales/locale";
import type { WalletMessages } from "@/locales/walletMessages";
import { Text, View } from "@/tw";
import {
  ButtonContent,
  DestinationIdentity,
  ErrorText,
  StepLayout,
} from "./PayoutParts";
import payoutStyles from "./payoutStyles";

interface PayoutReviewStepProps {
  messages: WalletMessages;
  locale: SupportedLocale;
  quote: PayoutQuote;
  destination: PayoutDestination | null;
  insufficient: boolean;
  errorMsg: string | null;
  submitting: boolean;
  busy: boolean;
  onConfirm: () => void;
  onEditAmount: () => void;
}

export function PayoutReviewStep({
  messages: m,
  locale,
  quote,
  destination,
  insufficient,
  errorMsg,
  submitting,
  busy,
  onConfirm,
  onEditAmount,
}: PayoutReviewStepProps) {
  const confirmDisabled = busy || insufficient;
  const money = (satang: number) => formatSatang(satang, locale, "exact");
  return (
    <StepLayout
      footer={
        <>
          <Button
            accessibilityLabel={m.payoutConfirm}
            accessibilityState={{
              disabled: confirmDisabled,
              busy: submitting,
            }}
            disabled={confirmDisabled}
            onPress={onConfirm}
            testID="payout-confirm-btn"
          >
            <ButtonContent
              busy={submitting}
              label={submitting ? m.payoutSubmitting : m.payoutConfirm}
            />
          </Button>
          <Button
            accessibilityLabel={m.payoutEditAmount}
            disabled={busy}
            onPress={onEditAmount}
            testID="payout-edit-amount-btn"
            variant="secondary"
          >
            <ButtonContent label={m.payoutEditAmount} variant="secondary" />
          </Button>
        </>
      }
    >
      <View className="gap-ku-md" testID="payout-quote-summary">
        <View className={payoutStyles.receiptCard}>
          <Text className={payoutStyles.eyebrow}>{m.payoutQuoteReceipt}</Text>
          <Text
            className={payoutStyles.receiptAmount}
            testID="payout-quote-receipt"
          >
            {money(quote.receiptSatang)}
          </Text>
        </View>
        <View className={payoutStyles.card}>
          <View className={payoutStyles.row}>
            <Text className={payoutStyles.rowLabel}>{m.payoutQuoteFee}</Text>
            <Text className={payoutStyles.rowValue} testID="payout-quote-fee">
              {money(quote.maximumFeeSatang)}
            </Text>
          </View>
          <View className={payoutStyles.row}>
            <Text className={payoutStyles.rowLabel}>{m.payoutQuoteTax}</Text>
            <Text className={payoutStyles.rowValue} testID="payout-quote-tax">
              {money(quote.maximumTaxSatang)}
            </Text>
          </View>
          <View className={payoutStyles.divider} />
          <View className={payoutStyles.row}>
            <Text className={payoutStyles.cardTitle}>{m.payoutQuoteDebit}</Text>
            <Text
              className={payoutStyles.rowValueStrong}
              testID="payout-quote-debit"
            >
              {money(quote.maximumDebitSatang)}
            </Text>
          </View>
        </View>
      </View>

      {destination ? (
        <View
          className={payoutStyles.destinationRow}
          testID="payout-review-destination"
        >
          <DestinationIdentity
            destination={destination}
            locale={locale}
            logoSize={40}
          />
        </View>
      ) : null}

      <Text className={payoutStyles.note}>
        {m.payoutQuoteExpires(formatTimeInBangkok(quote.expiresAt))}
      </Text>
      <Text className={payoutStyles.note}>{m.payoutQuoteNote}</Text>

      {insufficient ? (
        <ErrorText
          message={m.payoutQuoteInsufficient}
          testID="payout-quote-insufficient"
        />
      ) : null}
      {errorMsg ? <ErrorText message={errorMsg} testID="payout-error" /> : null}
    </StepLayout>
  );
}
