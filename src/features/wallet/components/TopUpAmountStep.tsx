import React from "react";
import type { ViewStyle } from "react-native";
import {
  ActivityIndicator,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "@/tw";
import { AlertCircle, ShieldCheck, Wallet } from "lucide-react-native";
import { formatSatang } from "@/domain/satang";
import type { SupportedLocale } from "@/locales/locale";
import { walletMessages } from "@/locales/walletMessages";
import { colors } from "@/theme/colors";
import { cn } from "@/tw/cn";

const QUICK_AMOUNTS = [100, 300, 500, 1000, 2000] as const;

export interface TopUpAmountStepProps {
  amountStr: string;
  error: string | null;
  isAmountValid: boolean;
  loading: boolean;
  locale: SupportedLocale;
  onAmountChange: (value: string) => void;
  onContinue: () => void;
  onSelectQuick: (amount: number) => void;
}

const styles = {
  bannerCard:
    "mb-ku-md flex-row items-center gap-[14px] rounded-[18px] border border-ku-border-accent bg-ku-surface-accent p-ku-md",
  bannerIconWrap:
    "h-[44px] w-[44px] items-center justify-center rounded-[22px] bg-ku-surface-success",
  bannerTextWrap: "flex-1",
  bannerTitle: "mb-[2px] font-ku-bold text-[15px] text-ku-primary-deep",
  bannerDesc:
    "font-ku-regular text-[12px] leading-[16px] text-ku-text-secondary",
  sectionContainer: "mb-ku-md",
  sectionLabel:
    "mb-ku-sm font-ku-semibold text-ku-body-small text-ku-text-strong",
  inputContainer:
    "h-[60px] flex-row items-center rounded-[16px] border-2 border-ku-primary bg-ku-surface px-ku-md",
  inputContainerError: "border-ku-danger",
  inputPrefix: "mr-ku-sm font-ku-bold text-ku-title-small text-ku-text-strong",
  amountInput: "flex-1 py-0 font-ku-bold text-ku-title text-ku-text-strong",
  clearBtn: "p-[6px]",
  clearBtnText: "font-ku-bold text-[14px] text-ku-text-muted",
  helperText: "mt-[6px] font-ku-medium text-[12px] text-ku-text-secondary",
  errorBanner:
    "mt-ku-sm flex-row items-center gap-[6px] rounded-[10px] bg-ku-surface-danger p-[10px]",
  errorText: "flex-1 font-ku-medium text-[12px] text-ku-danger",
  quickGrid: "flex-row flex-wrap gap-[10px]",
  quickChip:
    "items-center justify-center rounded-[12px] border border-ku-border-subtle bg-ku-surface-muted px-ku-md py-[10px]",
  quickChipSelected: "border-[1.5px] border-ku-primary bg-ku-surface-accent",
  quickChipText: "font-ku-semibold text-[13px] text-ku-text-secondary",
  quickChipTextSelected: "font-ku-bold text-[13px] text-ku-primary-deep",
  infoCallout:
    "mb-ku-lg flex-row items-start gap-[10px] rounded-[14px] border border-ku-border-success bg-ku-surface-success p-[14px]",
  infoCalloutText:
    "flex-1 font-ku-regular text-[12px] leading-[18px] text-ku-text-secondary",
  primaryActionButton:
    "h-[52px] items-center justify-center rounded-[16px] bg-ku-primary-deep",
  primaryButtonDisabled: "bg-ku-text-muted",
  primaryActionButtonText: "font-ku-bold text-ku-body text-ku-on-primary",
} as const;

const primaryActionShadow = {
  shadowColor: colors.primaryDeep,
  shadowOffset: { width: 0, height: 3 },
  shadowOpacity: 0.25,
  shadowRadius: 6,
  elevation: 3,
} satisfies ViewStyle;

const primaryActionShadowDisabled = {
  shadowColor: colors.primaryDeep,
  shadowOffset: { width: 0, height: 3 },
  shadowOpacity: 0,
  shadowRadius: 6,
  elevation: 0,
} satisfies ViewStyle;

export function TopUpAmountStep({
  amountStr,
  error,
  isAmountValid,
  loading,
  locale,
  onAmountChange,
  onContinue,
  onSelectQuick,
}: TopUpAmountStepProps) {
  const m = walletMessages[locale];
  const continueDisabled = !isAmountValid || loading;

  return (
    <View testID="top-up-amount-step">
      <View className={styles.bannerCard}>
        <View className={styles.bannerIconWrap}>
          <Wallet color={colors.primaryDeep} size={22} strokeWidth={2.4} />
        </View>
        <View className={styles.bannerTextWrap}>
          <Text className={styles.bannerTitle}>{m.topUpTitle}</Text>
          <Text className={styles.bannerDesc}>{m.topUpAmountDescription}</Text>
        </View>
      </View>

      <View className={styles.sectionContainer}>
        <Text className={styles.sectionLabel}>{m.enterAmount}</Text>
        <View
          className={cn(
            styles.inputContainer,
            error && styles.inputContainerError
          )}
        >
          <Text className={styles.inputPrefix}>฿</Text>
          <TextInput
            accessibilityLabel={m.enterAmount}
            autoFocus={false}
            keyboardType="numeric"
            onChangeText={onAmountChange}
            placeholder="0"
            placeholderTextColor={colors.textMuted}
            className={styles.amountInput}
            testID="top-up-amount-input"
            value={amountStr}
          />
          {amountStr.length > 0 ? (
            <TouchableOpacity
              accessibilityLabel={m.clearAmount}
              onPress={() => onAmountChange("")}
              className={styles.clearBtn}
            >
              <Text className={styles.clearBtnText}>✕</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {error ? (
          <View className={styles.errorBanner}>
            <AlertCircle color={colors.danger} size={15} />
            <Text className={styles.errorText}>{error}</Text>
          </View>
        ) : (
          <Text className={styles.helperText}>{m.minTopUpHint}</Text>
        )}
      </View>

      <View className={styles.sectionContainer}>
        <Text className={styles.sectionLabel}>{m.quickAmountLabel}</Text>
        <View className={styles.quickGrid}>
          {QUICK_AMOUNTS.map((amt) => {
            const isSelected = amountStr === String(amt);
            return (
              <TouchableOpacity
                accessibilityLabel={m.quickAmountAccessibilityLabel(amt)}
                accessibilityRole="button"
                activeOpacity={0.7}
                key={amt}
                onPress={() => onSelectQuick(amt)}
                className={cn(
                  styles.quickChip,
                  isSelected && styles.quickChipSelected
                )}
                testID={`top-up-quick-${amt}`}
              >
                <Text
                  className={
                    isSelected
                      ? styles.quickChipTextSelected
                      : styles.quickChipText
                  }
                >
                  {formatSatang(amt * 100, locale)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View className={styles.infoCallout}>
        <ShieldCheck color={colors.primaryDeep} size={18} strokeWidth={2.4} />
        <Text className={styles.infoCalloutText}>{m.topUpSafetyNotice}</Text>
      </View>

      <TouchableOpacity
        accessibilityLabel={m.continue}
        accessibilityRole="button"
        activeOpacity={0.8}
        disabled={continueDisabled}
        onPress={onContinue}
        className={cn(
          styles.primaryActionButton,
          continueDisabled && styles.primaryButtonDisabled
        )}
        style={
          continueDisabled ? primaryActionShadowDisabled : primaryActionShadow
        }
        testID="top-up-continue-btn"
      >
        {loading ? (
          <ActivityIndicator color={colors.onPrimary} size="small" />
        ) : (
          <Text className={styles.primaryActionButtonText}>{m.continue}</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}
