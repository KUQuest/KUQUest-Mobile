import React from "react";
import { Text, TouchableOpacity, View } from "@/tw";
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
      className={styles.card}
      onPress={onPress ? () => onPress(tx) : undefined}
      testID={`hirer-tx-${tx.id}`}
    >
      {/* Icon Box */}
      <View
        className={`${styles.iconBox} ${
          isGreenIcon ? styles.iconBoxGreen : styles.iconBoxNeutral
        }`}
      >
        {renderIcon()}
      </View>

      {/* Title, Subtitle, Date */}
      <View className={styles.contentWrap}>
        <Text numberOfLines={1} className={styles.title}>
          {tx.title}
        </Text>
        {tx.subtitle ? (
          <Text numberOfLines={1} className={styles.subtitle}>
            {tx.subtitle}
          </Text>
        ) : null}
        <View className={styles.dateRow}>
          <Text className={styles.date}>{tx.dateFormatted}</Text>
          {isPending ? (
            <View className={styles.pendingChip}>
              <Text className={styles.pendingText}>{tx.statusLabel}</Text>
            </View>
          ) : isFailed ? (
            <View className={styles.failedChip}>
              <Text className={styles.failedText}>{tx.statusLabel}</Text>
            </View>
          ) : null}
        </View>
      </View>

      {/* Amount and Chevron */}
      <View className={styles.amountWrap}>
        <Text
          className={`${styles.amount} ${
            tx.isInflow ? styles.amountInflow : styles.amountOutflow
          }`}
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

const styles = {
  card: "mb-ku-10 flex-row items-center rounded-[16px] border border-ku-border-subtle bg-ku-card p-ku-14",
  iconBox:
    "mr-ku-12 h-[44px] w-[44px] items-center justify-center rounded-[12px]",
  iconBoxNeutral: "bg-ku-surface-muted",
  iconBoxGreen: "bg-ku-surface-success",
  contentWrap: "mr-ku-sm flex-1",
  title:
    "mb-ku-2 font-ku-medium text-ku-body-small leading-[20px] text-ku-text-strong",
  subtitle:
    "mb-ku-2 font-ku-regular text-ku-label leading-[16px] text-ku-text-secondary",
  dateRow: "flex-row items-center gap-ku-sm",
  date: "font-ku-regular text-ku-caption text-ku-text-muted",
  pendingChip: "rounded-[4px] bg-ku-surface-warning px-ku-xs py-ku-1",
  pendingText: "font-ku-medium text-ku-nav text-ku-warning-dark",
  failedChip: "rounded-[4px] bg-ku-surface-danger px-ku-xs py-ku-1",
  failedText: "font-ku-medium text-ku-nav text-ku-danger",
  amountWrap: "flex-row items-center gap-ku-xs",
  amount: "font-ku-bold text-[15px] leading-[20px]",
  amountInflow: "text-ku-success",
  amountOutflow: "text-ku-text-strong",
} as const;
