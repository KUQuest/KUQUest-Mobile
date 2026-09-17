import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "@/theme/colors";
import { fontFamily } from "@/theme/typography";

interface HirerWalletHeaderProps {
  title: string;
  subtitle?: string;
}

export function HirerWalletHeader({ subtitle, title }: HirerWalletHeaderProps) {
  return (
    <View style={styles.screenHeader} testID="hirer-wallet-header">
      <Text
        accessibilityRole="header"
        style={styles.screenTitle}
        testID="hirer-wallet-title"
      >
        {title}
      </Text>
      {subtitle ? <Text style={styles.screenSubtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screenHeader: {
    paddingHorizontal: 4,
    paddingBottom: 20,
  },
  screenTitle: {
    fontFamily: fontFamily.bold,
    fontSize: 28,
    lineHeight: 36,
    color: colors.textStrong,
  },
  screenSubtitle: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    lineHeight: 21,
    color: colors.textSecondary,
    marginTop: 4,
  },
});
