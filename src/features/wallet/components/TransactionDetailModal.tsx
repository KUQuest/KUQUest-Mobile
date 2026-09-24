import { WalletTransactionType } from "@/api/WalletApi";
import { Modal, StyleSheet } from "react-native";
import type { ViewStyle } from "react-native";
import { Pressable, ScrollView, Text, TouchableOpacity, View } from "@/tw";
import {
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  CreditCard,
  FileText,
  Lock,
  RotateCcw,
  Send,
  X,
  XCircle,
} from "lucide-react-native";
import { colors } from "@/theme/colors";
import { formatSatang } from "@/domain/satang";
import type { WalletMessages } from "@/locales/walletMessages";
import type { ClassifiedHirerTransaction } from "../walletModule";

interface TransactionDetailModalProps {
  transaction: ClassifiedHirerTransaction | null;
  visible: boolean;
  messages: WalletMessages;
  onClose: () => void;
}
const styles = {
  modalOverlay: "flex-1 justify-end bg-ku-overlay",
  modalCard:
    "max-h-[85%] rounded-tl-[24px] rounded-tr-[24px] bg-ku-surface pb-ku-lg",
  header:
    "flex-row items-center justify-between border-b border-ku-border-subtle px-ku-20 pb-ku-14 pt-ku-18",
  headerTitle: "font-ku-bold text-ku-body text-ku-text-strong",
  closeBtn: "p-ku-xs",
  scrollContent: "p-ku-md",
  heroSection: "mb-ku-md items-center",
  iconWrap:
    "mb-ku-sm h-[56px] w-[56px] items-center justify-center rounded-[28px]",
  iconWrapInflow: "bg-ku-surface-success",
  iconWrapNeutral: "bg-ku-surface-muted",
  amountText: "mb-ku-xs font-ku-bold text-[30px] leading-[38px]",
  amountInflow: "text-ku-success",
  amountOutflow: "text-ku-text-strong",
  txTitle: "mb-ku-10 font-ku-medium text-ku-control text-ku-text-secondary",
  statusBadge:
    "flex-row items-center gap-ku-5 rounded-ku-pill px-ku-10 py-ku-xs",
  statusBadgeText: "font-ku-medium text-ku-label",
  detailsCard:
    "mb-ku-md rounded-[16px] border border-ku-border-subtle bg-ku-surface-muted px-ku-md py-ku-sm",
  detailRow: "flex-row items-center justify-between py-ku-10",
  detailRowLast: "",
  detailLabel: "flex-1 font-ku-regular text-ku-meta text-ku-text-muted",
  detailValue:
    "flex-[1.5] text-right font-ku-medium text-ku-meta text-ku-text-strong",
  monoText: "font-ku-regular text-[11px] text-ku-text-secondary",
  sourceTag: "self-end rounded-[6px] bg-ku-surface-success px-ku-sm py-ku-2",
  sourceTagText: "font-ku-medium text-[11px] text-ku-primary-deep",
  actionButton:
    "items-center justify-center rounded-[14px] bg-ku-primary px-ku-13 py-ku-13",
  actionButtonText: "font-ku-bold text-ku-control text-ku-on-primary",
} as const;

const modalCardShadow = {
  elevation: 24,
  shadowColor: colors.black,
  shadowOffset: { width: 0, height: -4 },
  shadowOpacity: 0.2,
  shadowRadius: 12,
} satisfies ViewStyle;

const detailRowDividerStyle = {
  borderBottomColor: colors.borderSubtle,
  borderBottomWidth: StyleSheet.hairlineWidth,
} as const;

const detailRowLastStyle = {
  borderBottomWidth: 0,
} as const;

export function TransactionDetailModal({
  transaction: tx,
  visible,
  messages: m,
  onClose,
}: TransactionDetailModalProps) {
  if (!tx) return null;

  const renderIcon = () => {
    switch (tx.iconKind) {
      case "escrow_pay":
        return <Send color={colors.textStrong} size={24} strokeWidth={2.2} />;
      case "top_up":
        return (
          <CreditCard color={colors.success} size={24} strokeWidth={2.2} />
        );
      case "unlock_pay":
        return <Lock color={colors.success} size={24} strokeWidth={2.2} />;
      case "refund":
        return <RotateCcw color={colors.success} size={24} strokeWidth={2.2} />;
      case "fee":
        return (
          <FileText color={colors.textStrong} size={24} strokeWidth={2.2} />
        );
      case "generic_inflow":
        return (
          <ArrowDownLeft color={colors.success} size={24} strokeWidth={2.2} />
        );
      case "generic_outflow":
      default:
        return (
          <ArrowUpRight color={colors.textStrong} size={24} strokeWidth={2.2} />
        );
    }
  };

  const getStatusBadge = () => {
    switch (tx.statusKind) {
      case "completed":
        return {
          bg: colors.surfaceSuccess,
          text: colors.success,
          icon: <CheckCircle2 color={colors.success} size={14} />,
        };
      case "pending":
        return {
          bg: colors.surfaceWarning,
          text: colors.warningDark,
          icon: <Clock color={colors.warningDark} size={14} />,
        };
      case "expired":
        return {
          bg: colors.surfaceMuted,
          text: colors.textMuted,
          icon: <Clock color={colors.textMuted} size={14} />,
        };
      case "failed":
      default:
        return {
          bg: colors.surfaceDanger,
          text: colors.danger,
          icon: <XCircle color={colors.danger} size={14} />,
        };
    }
  };

  const statusBadge = getStatusBadge();
  const formattedAmount = formatSatang(
    tx.isInflow ? tx.amountSatang : -tx.amountSatang,
    "en",
    "signed"
  );

  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      transparent
      visible={visible}
    >
      <View className={styles.modalOverlay}>
        <Pressable
          accessibilityLabel={m.closeButton}
          onPress={onClose}
          style={StyleSheet.absoluteFill}
          testID="transaction-detail-backdrop"
        />
        <View
          className={styles.modalCard}
          style={modalCardShadow}
          testID="transaction-detail-modal"
        >
          <View className={styles.header}>
            <Text className={styles.headerTitle}>
              {m.transactionDetailTitle}
            </Text>
            <TouchableOpacity
              accessibilityLabel={m.closeButton}
              accessibilityRole="button"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              onPress={onClose}
              className={styles.closeBtn}
              testID="transaction-detail-close-btn"
            >
              <X color={colors.textSecondary} size={20} />
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerClassName={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View className={styles.heroSection}>
              <View
                className={`${styles.iconWrap} ${tx.isInflow ? styles.iconWrapInflow : styles.iconWrapNeutral
                  }`}
              >
                {renderIcon()}
              </View>

              <Text
                className={`${styles.amountText} ${tx.isInflow ? styles.amountInflow : styles.amountOutflow
                  }`}
                testID="tx-detail-amount"
              >
                {formattedAmount}
              </Text>

              <Text className={styles.txTitle} testID="tx-detail-title">
                {tx.title}
              </Text>

              <View
                className={styles.statusBadge}
                style={{ backgroundColor: statusBadge.bg }}
                testID="tx-detail-status-badge"
              >
                {statusBadge.icon}
                <Text
                  className={styles.statusBadgeText}
                  style={{ color: statusBadge.text }}
                >
                  {tx.statusLabel}
                </Text>
              </View>
            </View>

            <View className={styles.detailsCard}>
              <View className={styles.detailRow} style={detailRowDividerStyle}>
                <Text className={styles.detailLabel}>{m.txDateLabel}</Text>
                <Text className={styles.detailValue}>
                  {tx.dateFormatted}, {tx.timeFormatted} น.
                </Text>
              </View>

              <View className={styles.detailRow} style={detailRowDividerStyle}>
                <Text className={styles.detailLabel}>{m.txSourceLabel}</Text>
                <View
                  className={styles.sourceTag}
                  testID="tx-detail-source-tag"
                >
                  <Text className={styles.sourceTagText}>
                    {tx.sourceApiLabel}
                  </Text>
                </View>
              </View>

              {tx.subtitle ? (
                <View
                  className={styles.detailRow}
                  style={detailRowDividerStyle}
                >
                  <Text className={styles.detailLabel}>
                    {tx.type === WalletTransactionType.TOP_UP
                      ? m.txTopUpReferenceLabel
                      : m.txDetailsLabel}
                  </Text>
                  <Text className={styles.detailValue} numberOfLines={2}>
                    {tx.subtitle}
                  </Text>
                </View>
              ) : null}

              <View className={styles.detailRow} style={detailRowLastStyle}>
                <Text className={styles.detailLabel}>{m.txTransactionIdLabel}</Text>
                <Text
                  numberOfLines={1}
                  className={`${styles.detailValue} ${styles.monoText}`}
                  testID="tx-detail-reference"
                >
                  {tx.id}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              accessibilityLabel={m.closeButton}
              accessibilityRole="button"
              activeOpacity={0.8}
              onPress={onClose}
              className={styles.actionButton}
            >
              <Text className={styles.actionButtonText}>{m.closeButton}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
