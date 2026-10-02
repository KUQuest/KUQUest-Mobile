import React from "react";
import { AlertCircle, ShieldCheck, X } from "lucide-react-native";
import {
  ActivityIndicator,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "@/tw";
import { cn } from "@/tw/cn";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { formatSatang } from "@/domain/satang";
import { useAppTheme } from "@/features/workspace/AppThemeProvider";
import type { SupportedLocale } from "@/locales/locale";
import { walletMessages } from "@/locales/walletMessages";
import { TopUpNotice } from "./TopUpNotice";
import { topUpStyles } from "./topUpStyles";

const QUICK_AMOUNTS = [100, 300, 500, 1000, 2000] as const;

export interface TopUpAmountStepProps {
  amountStr: string;
  error: string | null;
  isAmountValid: boolean;
  loading: boolean;
  locale: SupportedLocale;
  /** Receives digits only. */
  onAmountChange: (value: string) => void;
  onContinue: () => void;
}

export function TopUpAmountStep({
  amountStr,
  error,
  isAmountValid,
  loading,
  locale,
  onAmountChange,
  onContinue,
}: TopUpAmountStepProps) {
  const m = walletMessages[locale];
  const { colors } = useAppTheme();
  const continueDisabled = !isAmountValid || loading;

  return (
    <View className={topUpStyles.step} testID="top-up-amount-step">
      <View className={topUpStyles.intro}>
        <Text accessibilityRole="header" className={topUpStyles.headline}>
          {m.topUpAmountTitle}
        </Text>
        <Text className={topUpStyles.description}>
          {m.topUpAmountDescription}
        </Text>
      </View>

      <View className={cn(styles.amountCard, error && styles.amountCardError)}>
        <Text className={topUpStyles.label}>{m.enterAmount}</Text>
        <View className={styles.amountRow}>
          <Text className={styles.currency}>฿</Text>
          <TextInput
            accessibilityLabel={m.enterAmount}
            className={styles.amountInput}
            keyboardType="number-pad"
            maxLength={7}
            onChangeText={(value) => onAmountChange(value.replace(/\D/g, ""))}
            placeholder="0"
            placeholderTextColor={colors.textMuted}
            returnKeyType="done"
            testID="top-up-amount-input"
            value={amountStr}
          />
          {amountStr ? (
            <TouchableOpacity
              accessibilityLabel={m.clearAmount}
              accessibilityRole="button"
              activeOpacity={0.7}
              className={styles.clearButton}
              onPress={() => onAmountChange("")}
              testID="top-up-clear-amount-btn"
            >
              <X color={colors.textSecondary} size={18} strokeWidth={2.4} />
            </TouchableOpacity>
          ) : null}
        </View>
        {error ? (
          <View
            accessibilityLiveRegion="assertive"
            accessibilityRole="alert"
            className={styles.fieldError}
          >
            <AlertCircle color={colors.danger} size={16} strokeWidth={2.2} />
            <Text className={styles.fieldErrorText}>{error}</Text>
          </View>
        ) : (
          <Text className={styles.helper}>{m.minTopUpHint}</Text>
        )}
      </View>

      <View className={styles.quickSection}>
        <Text className={topUpStyles.label}>{m.quickAmountLabel}</Text>
        <View className={styles.quickGrid}>
          {QUICK_AMOUNTS.map((amount) => (
            <Chip
              accessibilityLabel={m.quickAmountAccessibilityLabel(amount)}
              className={styles.quickChip}
              key={amount}
              label={formatSatang(amount * 100, locale)}
              onPress={() => onAmountChange(String(amount))}
              selected={amountStr === String(amount)}
              testID={`top-up-quick-${amount}`}
              textClassName={styles.quickChipText}
              tone="tab"
            />
          ))}
        </View>
      </View>

      <TopUpNotice
        icon={ShieldCheck}
        message={m.topUpSafetyNotice}
        tone="info"
      />

      <Button
        accessibilityLabel={m.continue}
        accessibilityState={{ disabled: continueDisabled, busy: loading }}
        disabled={continueDisabled}
        onPress={onContinue}
        testID="top-up-continue-btn"
      >
        {loading ? (
          <ActivityIndicator color={colors.onPrimary} size="small" />
        ) : (
          m.continue
        )}
      </Button>
    </View>
  );
}

const styles = {
  amountCard:
    "gap-ku-sm rounded-ku-card border border-ku-border bg-ku-surface p-ku-md",
  amountCardError: "border-ku-danger",
  amountRow: "min-h-[64px] flex-row items-center gap-ku-sm",
  currency: "font-ku-bold text-ku-title text-ku-primary",
  amountInput:
    "flex-1 py-ku-0 font-ku-bold text-ku-display-small text-ku-text-strong",
  clearButton:
    "h-[48px] w-[48px] items-center justify-center rounded-ku-pill bg-ku-surface-raised",
  helper: "font-ku-regular text-ku-label text-ku-text-secondary",
  fieldError: "flex-row items-center gap-ku-6",
  fieldErrorText: "flex-1 font-ku-medium text-ku-label text-ku-danger-dark",
  quickSection: "gap-ku-sm",
  quickGrid: "flex-row flex-wrap gap-ku-sm",
  quickChip: "min-h-[48px] grow basis-[28%] px-ku-md",
  quickChipText: "font-ku-semibold text-ku-body-small",
} as const;
