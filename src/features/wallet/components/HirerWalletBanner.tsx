import React from "react";
import { Plus } from "lucide-react-native";
import { colors } from "@/theme/colors";
import { Text, TouchableOpacity, View } from "@/tw";
interface HirerWalletBannerProps {
  label: string;
  onPress: () => void;
}

export function HirerWalletBanner({ label, onPress }: HirerWalletBannerProps) {
  return (
    <TouchableOpacity
      accessibilityLabel={label}
      accessibilityRole="button"
      activeOpacity={0.85}
      className={styles.container}
      onPress={onPress}
      testID="hirer-wallet-banner"
    >
      <Text className={styles.label}>{label}</Text>
      <View
        className={styles.actionButton}
        style={actionButtonShadow}
        testID="hirer-wallet-banner-action-btn"
      >
        <Plus color={colors.hirerDeep} size={20} strokeWidth={2.6} />
      </View>
    </TouchableOpacity>
  );
}

const styles = {
  container:
    "mb-ku-md flex-row items-center justify-between rounded-[16px] border border-ku-border-success bg-ku-surface-success px-ku-18 py-ku-12",
  label: "font-ku-semibold text-ku-body text-ku-hirer-dark",
  actionButton:
    "h-[40px] w-[40px] items-center justify-center rounded-[20px] bg-ku-white",
} as const;

const actionButtonShadow = {
  shadowColor: colors.black,
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.06,
  shadowRadius: 3,
  elevation: 2,
} as const;
