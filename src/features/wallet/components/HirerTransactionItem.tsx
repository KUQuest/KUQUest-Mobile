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
import { useAppTheme } from "@/features/workspace/AppThemeProvider";
import { cn } from "@/tw/cn";
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
  const { colors } = useAppTheme();
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
      <View
        className={cn(
          styles.iconBox,
          isGreenIcon ? styles.iconBoxGreen : styles.iconBoxNeutral
        )}
      >
        {renderIcon()}
      </View>
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

      <View className={styles.amountWrap}>
        <Text
          className={cn(
            styles.amount,
            tx.isInflow ? styles.amountInflow : styles.amountOutflow
          )}
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
  card: "mb-ku-sm min-h-[48px] flex-row items-center gap-ku-12 rounded-ku-card border border-ku-border bg-ku-surface p-ku-md",
  iconBox: "h-[44px] w-[44px] items-center justify-center rounded-ku-pill",
  iconBoxNeutral: "bg-ku-surface-muted",
  iconBoxGreen: "bg-ku-surface-success",
  contentWrap: "flex-1 gap-ku-2",
  title: "font-ku-semibold text-ku-body-small text-ku-text-strong",
  subtitle: "font-ku-regular text-ku-label text-ku-text-secondary",
  dateRow: "flex-row flex-wrap items-center gap-ku-sm",
  date: "font-ku-regular text-ku-label text-ku-text-muted",
  pendingChip: "rounded-ku-pill bg-ku-surface-warning px-ku-sm py-ku-2",
  pendingText: "font-ku-medium text-ku-caption text-ku-warning-dark",
  failedChip: "rounded-ku-pill bg-ku-surface-danger px-ku-sm py-ku-2",
  failedText: "font-ku-medium text-ku-caption text-ku-danger",
  amountWrap: "flex-row items-center gap-ku-xs",
  amount: "font-ku-bold text-ku-control",
  amountInflow: "text-ku-success",
  amountOutflow: "text-ku-text-strong",
} as const;
