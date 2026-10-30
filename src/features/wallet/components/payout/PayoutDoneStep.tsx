import React from "react";
import { Check } from "lucide-react-native";
import type { PayoutDestination } from "@/api/WalletApi";
import { Button } from "@/components/ui/Button";
import { formatSatang } from "@/domain/satang";
import { useAppTheme } from "@/features/workspace/AppThemeProvider";
import type { SupportedLocale } from "@/locales/locale";
import type { WalletMessages } from "@/locales/walletMessages";
import { Text, View } from "@/tw";
import { ButtonContent, StepLayout, destinationSummary } from "./PayoutParts";
import payoutStyles from "./payoutStyles";

interface PayoutDoneStepProps {
  messages: WalletMessages;
  locale: SupportedLocale;
  receiptSatang: number;
  destination: PayoutDestination | null;
  onDone: () => void;
}

export function PayoutDoneStep({
  messages: m,
  locale,
  receiptSatang,
  destination,
  onDone,
}: PayoutDoneStepProps) {
  const { colors } = useAppTheme();
  return (
    <StepLayout
      footer={
        <Button
          accessibilityLabel={m.payoutDone}
          onPress={onDone}
          testID="payout-done-btn"
        >
          <ButtonContent label={m.payoutDone} />
        </Button>
      }
    >
      <View
        accessibilityLiveRegion="polite"
        className="items-center gap-ku-sm py-ku-md"
        testID="payout-done"
      >
        <View className={payoutStyles.doneBadge}>
          <Check color={colors.success} size={36} strokeWidth={2.6} />
        </View>
        <Text
          className={payoutStyles.receiptAmount}
          testID="payout-done-amount"
        >
          {formatSatang(receiptSatang, locale, "exact")}
        </Text>
        {destination ? (
          <Text className={payoutStyles.noteCentered}>
            {destinationSummary(destination, locale)}
          </Text>
        ) : null}
        <Text className={payoutStyles.noteCentered}>{m.payoutDoneNote}</Text>
      </View>
    </StepLayout>
  );
}
