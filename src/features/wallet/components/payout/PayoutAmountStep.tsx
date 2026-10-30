import React from "react";
import type { UseQueryResult } from "@tanstack/react-query";
import { ChevronRight, Plus } from "lucide-react-native";
import type { PayoutDestination } from "@/api/WalletApi";
import { Button } from "@/components/ui/Button";
import { formatSatang } from "@/domain/satang";
import { useAppTheme } from "@/features/workspace/AppThemeProvider";
import type { SupportedLocale } from "@/locales/locale";
import type { WalletMessages } from "@/locales/walletMessages";
import {
  ActivityIndicator,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "@/tw";
import { cn } from "@/tw/cn";
import {
  ButtonContent,
  DestinationIdentity,
  ErrorText,
  StepLayout,
  destinationSummary,
} from "./PayoutParts";
import payoutStyles from "./payoutStyles";

/** Keeps digits and at most one decimal point with two fraction digits. */
export function sanitizeAmountInput(value: string) {
  const cleaned = value.replace(/,/g, ".").replace(/[^0-9.]/g, "");
  const [whole = "", ...rest] = cleaned.split(".");
  return rest.length > 0 ? `${whole}.${rest.join("").slice(0, 2)}` : whole;
}

/** Amount-field text for a satang balance, without a trailing ".00". */
export function satangToInput(satang: number) {
  const baht = Math.floor(satang / 100);
  const fraction = satang % 100;
  return fraction === 0
    ? String(baht)
    : `${baht}.${String(fraction).padStart(2, "0")}`;
}

interface PayoutAmountStepProps {
  messages: WalletMessages;
  locale: SupportedLocale;
  earningsSatang: number;
  destinationQuery: UseQueryResult<PayoutDestination | null>;
  inputAmount: string;
  onInputAmountChange: (value: string) => void;
  amountHint: string | null;
  errorMsg: string | null;
  canReview: boolean;
  quoting: boolean;
  busy: boolean;
  onReview: () => void;
  onOpenDestination: () => void;
  onAddDestination: () => void;
}

export function PayoutAmountStep({
  messages: m,
  locale,
  earningsSatang,
  destinationQuery,
  inputAmount,
  onInputAmountChange,
  amountHint,
  errorMsg,
  canReview,
  quoting,
  busy,
  onReview,
  onOpenDestination,
  onAddDestination,
}: PayoutAmountStepProps) {
  const { colors } = useAppTheme();
  const destination = destinationQuery.data ?? null;

  const renderDestination = () => {
    if (destinationQuery.isPending) {
      return (
        <View
          accessibilityLabel={m.payoutDestinationLoading}
          accessibilityLiveRegion="polite"
          className={payoutStyles.centered}
          testID="payout-request-destination-loading"
        >
          <ActivityIndicator color={colors.primary} size="small" />
        </View>
      );
    }
    if (destinationQuery.isError) {
      return (
        <View
          accessibilityRole="alert"
          className={payoutStyles.card}
          testID="payout-request-destination-error"
        >
          <Text className={payoutStyles.hintError}>
            {m.payoutDestinationLoadError}
          </Text>
          <Button
            accessibilityLabel={m.retry}
            onPress={() => void destinationQuery.refetch()}
            testID="payout-request-destination-retry"
            variant="secondary"
          >
            <ButtonContent label={m.retry} variant="secondary" />
          </Button>
        </View>
      );
    }
    if (!destination) {
      return (
        <View testID="payout-request-no-destination">
          <TouchableOpacity
            accessibilityHint={m.payoutNoDestinationDesc}
            accessibilityLabel={m.payoutAddDestination}
            accessibilityRole="button"
            className={payoutStyles.destinationRowEmpty}
            onPress={onAddDestination}
            testID="payout-request-add-destination-btn"
          >
            <View className="h-[40px] w-[40px] items-center justify-center rounded-ku-pill bg-ku-primary">
              <Plus color={colors.onPrimary} size={20} strokeWidth={2.4} />
            </View>
            <View className="flex-1">
              <Text className={payoutStyles.cardTitle}>
                {m.payoutAddDestination}
              </Text>
              <Text className={payoutStyles.note}>
                {m.payoutNoDestinationDesc}
              </Text>
            </View>
            <ChevronRight color={colors.textSecondary} size={20} />
          </TouchableOpacity>
        </View>
      );
    }
    return (
      <TouchableOpacity
        accessibilityHint={m.destinationTitle}
        accessibilityLabel={`${m.payoutDestinationLabel}: ${destinationSummary(destination, locale)}`}
        accessibilityRole="button"
        accessibilityState={{ disabled: busy }}
        className={payoutStyles.destinationRow}
        disabled={busy}
        onPress={onOpenDestination}
        testID="payout-request-destination"
      >
        <DestinationIdentity
          destination={destination}
          locale={locale}
          logoSize={40}
        />
        <ChevronRight color={colors.textSecondary} size={20} />
      </TouchableOpacity>
    );
  };

  const noEarnings = earningsSatang <= 0;

  return (
    <StepLayout
      footer={
        <Button
          accessibilityLabel={m.payoutReview}
          accessibilityState={{ disabled: !canReview, busy: quoting }}
          disabled={!canReview}
          onPress={onReview}
          testID="payout-quote-btn"
        >
          <ButtonContent
            busy={quoting}
            label={quoting ? m.payoutQuoting : m.payoutReview}
          />
        </Button>
      }
    >
      <View className={payoutStyles.amountWrap}>
        <View className={payoutStyles.amountRow}>
          <Text
            accessibilityElementsHidden
            className={payoutStyles.amountPrefix}
            importantForAccessibility="no-hide-descendants"
          >
            ฿
          </Text>
          <TextInput
            accessibilityLabel={m.payoutAmountLabel}
            className={cn(
              payoutStyles.amountInput,
              (amountHint || errorMsg) && "text-ku-danger"
            )}
            editable={!noEarnings && !busy}
            inputMode="decimal"
            keyboardType="decimal-pad"
            maxLength={12}
            onChangeText={(value) =>
              onInputAmountChange(sanitizeAmountInput(value))
            }
            placeholder="0.00"
            placeholderTextColor={colors.textMuted}
            testID="payout-amount-input"
            value={inputAmount}
          />
        </View>
        <View className={payoutStyles.availableRow}>
          <Text
            className={payoutStyles.availableText}
            testID="payout-available-earnings"
          >
            {m.payoutAvailable(formatSatang(earningsSatang, locale, "exact"))}
          </Text>
          <TouchableOpacity
            accessibilityLabel={m.payoutMaxLabel}
            accessibilityRole="button"
            accessibilityState={{ disabled: noEarnings || busy }}
            className={payoutStyles.maxChip}
            disabled={noEarnings || busy}
            onPress={() => onInputAmountChange(satangToInput(earningsSatang))}
            testID="payout-max-btn"
          >
            <Text className={payoutStyles.maxChipText}>{m.payoutMax}</Text>
          </TouchableOpacity>
        </View>
        {noEarnings ? (
          <Text
            className={payoutStyles.hintWarning}
            testID="payout-no-earnings-hint"
          >
            {m.payoutNoEarnings}
          </Text>
        ) : amountHint ? (
          <ErrorText message={amountHint} testID="payout-amount-hint" />
        ) : null}
      </View>

      {renderDestination()}

      {errorMsg ? <ErrorText message={errorMsg} testID="payout-error" /> : null}
    </StepLayout>
  );
}
