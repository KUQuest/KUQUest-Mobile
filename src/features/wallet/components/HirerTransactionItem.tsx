import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import {
  ArrowDownLeft,
  ArrowUpRight,
  ChevronRight,
  CreditCard,
  FileText,
  Lock,
  RotateCcw,
  Send,
} from "lucide-react-native";
import { colors } from "@/theme/colors";
import { fontFamily } from "@/theme/typography";
import { formatSatang } from "@/domain/satang";
import type { ClassifiedHirerTransaction } from "../walletModule";

interface HirerTransactionItemProps {
  transaction: ClassifiedHirerTransaction;
  onPress?: (transaction: ClassifiedHirerTransaction) => void;
}

export function HirerTransactionItem({
  transaction: tx,
  onPress,
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

  const isPending = tx.statusKind === "pending";
  const isFailed = tx.statusKind === "failed" || tx.statusKind === "expired";
  const formattedAmount = formatSatang(
    tx.isInflow ? tx.amountSatang : -tx.amountSatang,
    "en",
    "signed"
  );

  const CardComponent = onPress ? TouchableOpacity : View;

  return (
    <CardComponent
      accessibilityHint="แตะเพื่อดูรายละเอียดธุรกรรม"
      accessibilityLabel={`${tx.title}, ${formattedAmount}`}
      accessibilityRole={onPress ? "button" : undefined}
      activeOpacity={0.75}
      onPress={onPress ? () => onPress(tx) : undefined}
      style={styles.card}
      testID={`hirer-tx-${tx.id}`}
    >
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
        <Text numberOfLines={1} style={styles.title}>
          {tx.title}
        </Text>
        {tx.subtitle ? (
          <Text numberOfLines={1} style={styles.subtitle}>
            {tx.subtitle}
          </Text>
        ) : null}
        <View style={styles.dateRow}>
          <Text style={styles.date}>{tx.dateFormatted}</Text>
          {isPending ? (
            <View style={styles.pendingChip}>
              <Text style={styles.pendingText}>{tx.statusLabel}</Text>
            </View>
          ) : isFailed ? (
            <View style={styles.failedChip}>
              <Text style={styles.failedText}>{tx.statusLabel}</Text>
            </View>
          ) : null}
        </View>
      </View>

      {/* Amount and Chevron */}
      <View style={styles.amountWrap}>
        <Text
          style={[
            styles.amount,
            tx.isInflow ? styles.amountInflow : styles.amountOutflow,
          ]}
        >
          {formattedAmount}
        </Text>
        {onPress ? (
          <ChevronRight color={colors.textMuted} size={16} strokeWidth={2} />
        ) : null}
      </View>
    </CardComponent>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    padding: 14,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  iconBoxNeutral: {
    backgroundColor: colors.surfaceMuted,
  },
  iconBoxGreen: {
    backgroundColor: colors.surfaceSuccess,
  },
  contentWrap: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    fontFamily: fontFamily.medium,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textStrong,
    marginBottom: 2,
  },
  subtitle: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    lineHeight: 16,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  date: {
    fontFamily: fontFamily.regular,
    fontSize: 11,
    color: colors.textMuted,
  },
  pendingChip: {
    backgroundColor: "#FEF9C3",
    paddingVertical: 1,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  pendingText: {
    fontFamily: fontFamily.medium,
    fontSize: 10,
    color: "#854D0E",
  },
  failedChip: {
    backgroundColor: colors.surfaceDanger,
    paddingVertical: 1,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  failedText: {
    fontFamily: fontFamily.medium,
    fontSize: 10,
    color: colors.danger,
  },
  amountWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
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
