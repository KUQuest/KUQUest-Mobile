import React from "react";
import { ArrowLeft, X } from "lucide-react-native";
import { Text, TouchableOpacity, View } from "@/tw";
import { cn } from "@/tw/cn";
import { useAppTheme } from "@/features/workspace/AppThemeProvider";
import type { SupportedLocale } from "@/locales/locale";
import { walletMessages } from "@/locales/walletMessages";
import type { TopUpStep } from "../topUpTypes";

const STEPS: readonly TopUpStep[] = ["amount", "confirmation", "promptPay"];

interface TopUpHeaderProps {
  locale: SupportedLocale;
  /** `null` once the payment is verified; hides the progress indicator. */
  step: TopUpStep | null;
  onBack: () => void;
  backDisabled?: boolean;
  onClose?: () => void;
}

export function TopUpHeader({
  locale,
  step,
  onBack,
  backDisabled = false,
  onClose,
}: TopUpHeaderProps) {
  const m = walletMessages[locale];
  const { colors } = useAppTheme();
  const stepLabels: Record<TopUpStep, string> = {
    amount: m.topUpAmountStepSubtitle,
    confirmation: m.topUpConfirmationStepSubtitle,
    promptPay: m.topUpPromptPayStepSubtitle,
  };
  const stepIndex = step ? STEPS.indexOf(step) : -1;

  return (
    <View className={styles.container}>
      <View className={styles.bar}>
        <TouchableOpacity
          accessibilityLabel={m.back}
          accessibilityRole="button"
          accessibilityState={{ disabled: backDisabled }}
          activeOpacity={0.7}
          className={styles.iconButton}
          disabled={backDisabled}
          onPress={onBack}
          testID="top-up-back-btn"
        >
          <ArrowLeft color={colors.textStrong} size={22} strokeWidth={2.2} />
        </TouchableOpacity>
        <Text accessibilityRole="header" className={styles.title}>
          {m.topUp}
        </Text>
        {onClose ? (
          <TouchableOpacity
            accessibilityLabel={m.close}
            accessibilityRole="button"
            activeOpacity={0.7}
            className={styles.iconButton}
            onPress={onClose}
            testID="top-up-close-btn"
          >
            <X color={colors.textStrong} size={22} strokeWidth={2.2} />
          </TouchableOpacity>
        ) : (
          <View className={styles.iconSpacer} />
        )}
      </View>

      {step ? (
        <View className={styles.progress}>
          <View className={styles.track}>
            {STEPS.map((item, index) => (
              <View
                className={cn(
                  styles.segment,
                  index <= stepIndex ? styles.segmentDone : styles.segmentTodo
                )}
                key={item}
              />
            ))}
          </View>
          <Text className={styles.stepLabel}>{stepLabels[step]}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = {
  container: "gap-ku-sm px-ku-sm pb-ku-sm",
  bar: "min-h-[56px] flex-row items-center",
  iconButton:
    "h-[48px] w-[48px] items-center justify-center rounded-ku-pill bg-ku-surface-raised",
  iconSpacer: "w-[48px]",
  title:
    "flex-1 px-ku-sm text-center font-ku-semibold text-ku-emphasis text-ku-text-strong",
  progress: "gap-ku-6 px-ku-sm",
  track: "flex-row gap-ku-xs",
  segment: "h-[4px] flex-1 rounded-ku-pill",
  segmentDone: "bg-ku-primary",
  segmentTodo: "bg-ku-surface-high",
  stepLabel: "font-ku-medium text-ku-label text-ku-text-secondary",
} as const;
