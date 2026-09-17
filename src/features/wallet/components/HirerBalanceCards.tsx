import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Lock, Wallet } from "lucide-react-native";
import { colors } from "@/theme/colors";
import { fontFamily } from "@/theme/typography";
import { formatHirerCardAmount } from "../walletModule";

interface HirerBalanceCardsProps {
  spendingBalanceSatang: number;
  fundingReservedSatang: number;
  spendingTitle: string;
  spendingDesc: string;
  escrowTitle: string;
  escrowDesc: string;
}

export function HirerBalanceCards({
  spendingBalanceSatang,
  fundingReservedSatang,
  spendingTitle,
  spendingDesc,
  escrowTitle,
  escrowDesc,
}: HirerBalanceCardsProps) {
  return (
    <View style={styles.row} testID="hirer-balance-cards">
      {/* Spending balance Card */}
      <View style={[styles.card, styles.spendingCard]}>
        <View style={styles.cardHeader}>
          <Text style={styles.spendingCardLabel}>{spendingTitle}</Text>
          <Wallet color={colors.primary} size={20} strokeWidth={2} />
        </View>
        <Text
          style={styles.spendingAmount}
          testID="hirer-spending-balance"
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {formatHirerCardAmount(spendingBalanceSatang)}
        </Text>
        <Text style={styles.spendingDesc}>{spendingDesc}</Text>
      </View>

      {/* Money in Escrow Card */}
      <View style={[styles.card, styles.escrowCard]}>
        <View style={styles.cardHeader}>
          <Text style={styles.escrowCardLabel}>{escrowTitle}</Text>
          <Lock color={colors.primary} size={20} strokeWidth={2} />
        </View>
        <Text
          style={styles.escrowAmount}
          testID="hirer-escrow-balance"
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {formatHirerCardAmount(fundingReservedSatang)}
        </Text>
        <Text style={styles.escrowDesc}>{escrowDesc}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  card: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    justifyContent: "space-between",
    minHeight: 126,
  },
  spendingCard: {
    backgroundColor: colors.surfaceSuccess,
    borderColor: colors.borderSuccess,
  },
  escrowCard: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.borderSubtle,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  spendingCardLabel: {
    fontFamily: fontFamily.medium,
    fontSize: 13,
    color: colors.textStrong,
    flex: 1,
    marginRight: 4,
  },
  escrowCardLabel: {
    fontFamily: fontFamily.medium,
    fontSize: 13,
    color: colors.textStrong,
    flex: 1,
    marginRight: 4,
  },
  spendingAmount: {
    fontFamily: fontFamily.bold,
    fontSize: 22,
    lineHeight: 28,
    color: colors.primaryDeep,
    marginVertical: 4,
  },
  escrowAmount: {
    fontFamily: fontFamily.bold,
    fontSize: 22,
    lineHeight: 28,
    color: colors.textStrong,
    marginVertical: 4,
  },
  spendingDesc: {
    fontFamily: fontFamily.regular,
    fontSize: 11,
    lineHeight: 15,
    color: colors.success,
  },
  escrowDesc: {
    fontFamily: fontFamily.regular,
    fontSize: 11,
    lineHeight: 15,
    color: colors.textMuted,
  },
});
