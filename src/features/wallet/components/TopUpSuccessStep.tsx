import React from "react";
import { CheckCircle2, ShieldCheck, Wallet } from "lucide-react-native";
import { TouchableOpacity, Text, View } from "@/tw";
import { formatSatang } from "@/domain/satang";
import type { SupportedLocale } from "@/locales/locale";
import { walletMessages } from "@/locales/walletMessages";
import { colors } from "@/theme/colors";

export interface TopUpSuccessStepProps {
  creditSatang: number;
  locale: SupportedLocale;
  onDone: () => void;
}

export function TopUpSuccessStep({
  creditSatang,
  locale,
  onDone,
}: TopUpSuccessStepProps) {
  const m = walletMessages[locale];
  const credit = formatSatang(creditSatang, locale, "exact");

  return (
    <View
      className="items-center pt-ku-lg pb-ku-lg"
      testID="top-up-success-view"
    >
      <View
        className="h-[88px] w-[88px] items-center justify-center rounded-[48px] border border-ku-border-success bg-ku-surface-success"
        testID="top-up-verified-badge"
      >
        <CheckCircle2 color={colors.success} size={48} strokeWidth={2.2} />
      </View>
      <Text className="mt-ku-md text-center font-ku-bold text-ku-title text-ku-text-strong">
        {m.topUpSuccessTitle}
      </Text>
      <Text className="mt-ku-xs text-center font-ku-regular text-ku-body-small leading-[21px] text-ku-text-secondary">
        {m.topUpSuccessDescription}
      </Text>
      <View className="mt-ku-lg w-full items-center rounded-[18px] border border-ku-border-accent bg-ku-surface px-ku-20 py-ku-18">
        <View className="flex-row items-center gap-ku-sm">
          <Wallet color={colors.primaryDeep} size={20} strokeWidth={2.2} />
          <Text className="font-ku-medium text-ku-meta text-ku-text-secondary">
            {m.topUpCredit}
          </Text>
        </View>
        <Text className="mt-ku-xs font-ku-bold text-ku-display-small text-ku-primary-deep">
          {credit}
        </Text>
      </View>
      <View className="mt-ku-sm w-full flex-row items-start gap-ku-sm rounded-[14px] bg-ku-surface-accent p-ku-sm">
        <ShieldCheck color={colors.success} size={18} strokeWidth={2.2} />
        <Text className="flex-1 font-ku-regular text-[12px] leading-[18px] text-ku-text-secondary">
          {m.paymentSuccess}
        </Text>
      </View>
      <TouchableOpacity
        accessibilityLabel={m.done}
        accessibilityRole="button"
        activeOpacity={0.8}
        onPress={onDone}
        className="mt-ku-lg h-[52px] w-full items-center justify-center rounded-ku-pill bg-ku-primary"
        testID="top-up-done-btn"
      >
        <Text className="font-ku-semibold text-ku-control text-ku-on-primary">
          {m.done}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
