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
  screenHeader: "gap-ku-xs px-ku-xs pb-ku-lg pt-ku-sm",
  screenTitle: "font-ku-bold text-ku-headline text-ku-text-strong",
  screenSubtitle: "font-ku-regular text-ku-body-small text-ku-text-secondary",
} as const;
