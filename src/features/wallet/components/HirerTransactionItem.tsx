import React from "react";
import { StyleSheet, Text, View } from "react-native";
import {
  ArrowDownLeft,
  ArrowUpRight,
  CreditCard,
  FileText,
  Lock,
  RotateCcw,
  Send,
} from "lucide-react-native";
import { colors } from "@/theme/colors";
import { fontFamily } from "@/theme/typography";
import type { ClassifiedHirerTransaction } from "../walletModule";
interface HirerTransactionItemProps {
  transaction: ClassifiedHirerTransaction;
}

export function HirerTransactionItem({
  transaction: tx,
}: HirerTransactionItemProps) {
  const renderIcon = () => {
    switch (tx.iconKind) {
      case "escrow_pay":
        return <Send color={colors.textStrong} size={18} strokeWidth={2.2} />;
      case "top_up":
        return (
          <CreditCard color={colors.success} size={18} strokeWidth={2.2} />
        );
      case "unlock_pay":
        return <Lock color={colors.success} size={18} strokeWidth={2.2} />;
      case "refund":
        return <RotateCcw color={colors.success} size={18} strokeWidth={2.2} />;
      case "fee":
        return (
          <FileText color={colors.textStrong} size={18} strokeWidth={2.2} />
        );
      case "generic_inflow":
        return (
          <ArrowDownLeft color={colors.success} size={18} strokeWidth={2.2} />
        );
      case "generic_outflow":
      default:
        return (
          <ArrowUpRight color={colors.textStrong} size={18} strokeWidth={2.2} />
        );
    }
  };

  const isGreenIcon =
    tx.iconKind === "top_up" ||
    tx.iconKind === "unlock_pay" ||
    tx.iconKind === "refund" ||
    tx.iconKind === "generic_inflow";

  return (
    <View style={styles.card} testID={`hirer-tx-${tx.id}`}>
      {/* Icon Box */}
      <View
        style={[
          styles.iconBox,
          isGreenIcon ? styles.iconBoxGreen : styles.iconBoxNeutral,
        ]}
      >
        {renderIcon()}
      </View>

      {/* Title, Subtitle, Date */}
      <View style={styles.contentWrap}>
        <Text style={styles.title} numberOfLines={1}>
          {tx.title}
        </Text>
        {tx.subtitle ? (
          <Text style={styles.subtitle} numberOfLines={1}>
            {tx.subtitle}
          </Text>
        ) : null}
        <Text style={styles.date}>{tx.dateFormatted}</Text>
      </View>

      {/* Amount */}
      <View style={styles.amountWrap}>
        <Text
          style={[
            styles.amount,
            tx.isInflow ? styles.amountInflow : styles.amountOutflow,
          ]}
        >
          {tx.amountText}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  iconBoxNeutral: {
    backgroundColor: colors.surfaceMuted,
  },
  iconBoxGreen: {
    backgroundColor: colors.surfaceSuccess,
  },
  contentWrap: {
    flex: 1,
    justifyContent: "center",
  },
  title: {
    fontFamily: fontFamily.semiBold,
    fontSize: 15,
    color: colors.textStrong,
    lineHeight: 20,
  },
  subtitle: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
    marginTop: 2,
  },
  date: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 16,
    marginTop: 2,
  },
  amountWrap: {
    alignItems: "flex-end",
    justifyContent: "center",
    marginLeft: 8,
  },
  amount: {
    fontFamily: fontFamily.bold,
    fontSize: 15,
    lineHeight: 20,
  },
  amountInflow: {
    color: colors.success,
  },
  amountOutflow: {
    color: colors.textStrong,
  },
});
