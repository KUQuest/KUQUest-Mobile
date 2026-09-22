import React from "react";
import { Text, View } from "@/tw";

interface HirerWalletHeaderProps {
  title: string;
  subtitle?: string;
}

export function HirerWalletHeader({ subtitle, title }: HirerWalletHeaderProps) {
  return (
    <View className={styles.screenHeader} testID="hirer-wallet-header">
      <Text
        accessibilityRole="header"
        className={styles.screenTitle}
        testID="hirer-wallet-title"
      >
        {title}
      </Text>
      {subtitle ? (
        <Text className={styles.screenSubtitle}>{subtitle}</Text>
      ) : null}
    </View>
  );
}

const styles = {
  screenHeader: "px-ku-xs pb-ku-20",
  screenTitle: "font-ku-bold text-[28px] leading-[36px] text-ku-text-strong",
  screenSubtitle:
    "mt-ku-xs font-ku-regular text-ku-body-small leading-[21px] text-ku-text-secondary",
} as const;
