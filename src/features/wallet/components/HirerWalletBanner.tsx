import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Plus } from "lucide-react-native";
import { colors } from "@/theme/colors";
import { fontFamily } from "@/theme/typography";
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
      onPress={onPress}
      style={styles.container}
      testID="hirer-wallet-banner"
    >
      <Text style={styles.label}>{label}</Text>
      <View style={styles.actionButton} testID="hirer-wallet-banner-action-btn">
        <Plus color={colors.primaryDeep} size={20} strokeWidth={2.6} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surfaceSuccess,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderSuccess,
    paddingHorizontal: 18,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  label: {
    fontFamily: fontFamily.semiBold,
    fontSize: 16,
    color: colors.primaryDeep,
  },
  actionButton: {
    backgroundColor: colors.white,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
});
