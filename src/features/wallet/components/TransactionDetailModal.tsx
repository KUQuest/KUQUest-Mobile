import React from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
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
import { fontFamily } from "@/theme/typography";
import { formatSatang } from "@/domain/satang";
import type { WalletMessages } from "@/locales/walletMessages";
import type { ClassifiedHirerTransaction } from "../walletModule";

interface TransactionDetailModalProps {
  transaction: ClassifiedHirerTransaction | null;
  visible: boolean;
  messages: WalletMessages;
  onClose: () => void;
}

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
      <View style={styles.modalOverlay}>
        <Pressable
          accessibilityLabel={m.closeButton}
          onPress={onClose}
          style={StyleSheet.absoluteFill}
          testID="transaction-detail-backdrop"
        />
        <View style={styles.modalCard} testID="transaction-detail-modal">
          {/* Header with Close */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>{m.transactionDetailTitle}</Text>
            <TouchableOpacity
              accessibilityLabel={m.closeButton}
              accessibilityRole="button"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              onPress={onClose}
              style={styles.closeBtn}
              testID="transaction-detail-close-btn"
            >
              <X color={colors.textSecondary} size={20} />
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Main Amount & Icon Hero */}
            <View style={styles.heroSection}>
              <View
                style={[
                  styles.iconWrap,
                  tx.isInflow ? styles.iconWrapInflow : styles.iconWrapNeutral,
                ]}
              >
                {renderIcon()}
              </View>

              <Text
                style={[
                  styles.amountText,
                  tx.isInflow ? styles.amountInflow : styles.amountOutflow,
                ]}
                testID="tx-detail-amount"
              >
                {formattedAmount}
              </Text>

              <Text style={styles.txTitle} testID="tx-detail-title">
                {tx.title}
              </Text>

              {/* Status Badge */}
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: statusBadge.bg },
                ]}
                testID="tx-detail-status-badge"
              >
                {statusBadge.icon}
                <Text
                  style={[styles.statusBadgeText, { color: statusBadge.text }]}
                >
                  {tx.statusLabel}
                </Text>
              </View>
            </View>

            {/* Detail Rows */}
            <View style={styles.detailsCard}>
              {/* Date & Time */}
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>{m.txDateLabel}</Text>
                <Text style={styles.detailValue}>
                  {tx.dateFormatted}, {tx.timeFormatted} น.
                </Text>
              </View>

              {/* Source API */}
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>{m.txSourceLabel}</Text>
                <View style={styles.sourceTag} testID="tx-detail-source-tag">
                  <Text style={styles.sourceTagText}>{tx.sourceApiLabel}</Text>
                </View>
              </View>

              {/* Reference / Subtitle if available */}
              {tx.subtitle ? (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>รายละเอียด</Text>
                  <Text style={styles.detailValue} numberOfLines={2}>
                    {tx.subtitle}
                  </Text>
                </View>
              ) : null}

              {/* Transaction ID */}
              <View style={[styles.detailRow, styles.detailRowLast]}>
                <Text style={styles.detailLabel}>{m.txReferenceLabel}</Text>
                <Text
                  numberOfLines={1}
                  style={[styles.detailValue, styles.monoText]}
                  testID="tx-detail-reference"
                >
                  {tx.id}
                </Text>
              </View>
            </View>

            {/* Bottom Close Button */}
            <TouchableOpacity
              accessibilityLabel={m.closeButton}
              accessibilityRole="button"
              activeOpacity={0.8}
              onPress={onClose}
              style={styles.actionButton}
            >
              <Text style={styles.actionButtonText}>{m.closeButton}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.55)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "85%",
    paddingBottom: 24,
    elevation: 24,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  headerTitle: {
    fontFamily: fontFamily.bold,
    fontSize: 16,
    color: colors.textStrong,
  },
  closeBtn: {
    padding: 4,
  },
  scrollContent: {
    padding: 20,
  },
  heroSection: {
    alignItems: "center",
    marginBottom: 20,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  iconWrapInflow: {
    backgroundColor: colors.surfaceSuccess,
  },
  iconWrapNeutral: {
    backgroundColor: colors.surfaceMuted,
  },
  amountText: {
    fontFamily: fontFamily.bold,
    fontSize: 30,
    lineHeight: 38,
    marginBottom: 4,
  },
  amountInflow: {
    color: colors.success,
  },
  amountOutflow: {
    color: colors.textStrong,
  },
  txTitle: {
    fontFamily: fontFamily.medium,
    fontSize: 15,
    color: colors.textSecondary,
    marginBottom: 10,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
  },
  statusBadgeText: {
    fontFamily: fontFamily.medium,
    fontSize: 12,
  },
  detailsCard: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderSubtle,
  },
  detailRowLast: {
    borderBottomWidth: 0,
  },
  detailLabel: {
    fontFamily: fontFamily.regular,
    fontSize: 13,
    color: colors.textMuted,
    flex: 1,
  },
  detailValue: {
    fontFamily: fontFamily.medium,
    fontSize: 13,
    color: colors.textStrong,
    flex: 1.5,
    textAlign: "right",
  },
  monoText: {
    fontFamily: fontFamily.regular,
    fontSize: 11,
    color: colors.textSecondary,
  },
  sourceTag: {
    backgroundColor: colors.surfaceSuccess,
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 6,
    alignSelf: "flex-end",
  },
  sourceTagText: {
    fontFamily: fontFamily.medium,
    fontSize: 11,
    color: colors.primaryDeep,
  },
  actionButton: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  actionButtonText: {
    fontFamily: fontFamily.bold,
    fontSize: 15,
    color: colors.white,
  },
});
