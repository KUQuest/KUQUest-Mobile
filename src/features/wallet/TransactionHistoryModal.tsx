import React from "react";
import { Modal } from "react-native";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "@/tw";
import { ArrowDownLeft, ArrowUpRight, RefreshCw, X } from "lucide-react-native";
import { type UserTransaction } from "@/api/WalletApi";
import { formatSatang } from "@/domain/satang";
import { colors } from "@/theme/colors";
import type { SupportedLocale } from "@/locales/locale";
import { walletMessages } from "@/locales/walletMessages";
import { useTransactionHistoryQuery } from "./api/walletQueries";
import { walletStyles as s } from "./walletStyles";

interface TransactionHistoryModalProps {
  visible: boolean;
  locale: SupportedLocale;
  onClose: () => void;
}

export function TransactionHistoryModal({
  visible,
  locale,
  onClose,
}: TransactionHistoryModalProps) {
  const m = walletMessages[locale];
  const historyQuery = useTransactionHistoryQuery(30, visible);
  const loading = historyQuery.isPending || historyQuery.isRefetching;
  const historyResult = historyQuery.data ?? null;
  const handleRefresh = () => {
    void historyQuery.refetch();
  };

  const getStatusBadgeStyle = (status: string, isPlaceholder?: boolean) => {
    if (isPlaceholder) {
      return {
        bgClass: "bg-ku-surface-muted",
        textClass: "text-ku-text-muted",
      };
    }
    const upper = status.toUpperCase();
    if (upper === "PAID" || upper === "SUCCEEDED" || upper === "SETTLED") {
      return {
        bgClass: "bg-ku-surface-success",
        textClass: "text-ku-success",
      };
    }
    if (upper.includes("PENDING")) {
      return {
        bgClass: "bg-ku-surface-accent",
        textClass: "text-ku-primary",
      };
    }
    if (upper === "FAILED" || upper === "REJECTED") {
      return {
        bgClass: "bg-ku-surface-danger",
        textClass: "text-ku-danger",
      };
    }
    return {
      bgClass: "bg-ku-surface-muted",
      textClass: "text-ku-text-secondary",
    };
  };

  return (
    <Modal
      animationType="fade"
      transparent
      visible={visible}
      onRequestClose={onClose}
    >
      <View className={s.modalOverlay}>
        <View
          accessibilityViewIsModal
          className={`${s.modalCard} max-h-[90%] border-ku-border-subtle bg-ku-surface`}
        >
          {/* Modal Header */}
          <View className={s.modalHeader}>
            <View className="flex-1">
              <Text className={`${s.modalTitle} text-ku-text-strong`}>
                {m.historyTitle}
              </Text>
            </View>
            <TouchableOpacity
              accessibilityLabel={m.refresh}
              accessibilityRole="button"
              accessibilityState={{ disabled: loading }}
              className={`${s.closeBtn} mr-ku-6`}
              disabled={loading}
              onPress={handleRefresh}
            >
              <RefreshCw color={colors.primary} size={18} />
            </TouchableOpacity>
            <TouchableOpacity
              accessibilityLabel={m.close}
              accessibilityRole="button"
              className={`${s.closeBtn} bg-ku-surface-muted`}
              onPress={onClose}
            >
              <X color={colors.textMuted} size={20} />
            </TouchableOpacity>
          </View>

          {loading && !historyResult ? (
            <View className="items-center py-ku-xl">
              <ActivityIndicator color={colors.primary} size="large" />
            </View>
          ) : (
            <ScrollView className="shrink" showsVerticalScrollIndicator={false}>
              {historyResult && historyResult.items.length > 0 ? (
                historyResult.items.map((item: UserTransaction) => {
                  const isInflow = item.direction === "INFLOW";
                  const badge = getStatusBadgeStyle(item.status);
                  const title = locale === "th" ? item.titleTh : item.title;
                  const dateFormatted = new Date(
                    item.createdAt
                  ).toLocaleDateString(locale === "th" ? "th-TH" : "en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  });

                  return (
                    <View
                      key={item.id}
                      className={`${s.txItem} border-ku-border-subtle bg-ku-surface-muted`}
                    >
                      <View className="flex-1 flex-row items-center">
                        <View
                          className={`mr-ku-10 h-[34px] w-[34px] items-center justify-center rounded-[10px] ${
                            isInflow
                              ? "bg-ku-surface-success"
                              : "bg-ku-surface-muted"
                          }`}
                        >
                          {isInflow ? (
                            <ArrowDownLeft color={colors.success} size={18} />
                          ) : (
                            <ArrowUpRight
                              color={colors.textSecondary}
                              size={18}
                            />
                          )}
                        </View>
                        <View className={s.txLeading}>
                          <Text
                            numberOfLines={1}
                            className={`${s.txTitle} text-ku-text-strong`}
                          >
                            {title}
                          </Text>
                          <Text className={`${s.txDate} text-ku-text-muted`}>
                            {dateFormatted}{" "}
                            {item.reference ? `• ${item.reference}` : ""}
                          </Text>
                        </View>
                      </View>

                      <View className={s.txTrailing}>
                        <Text
                          className={`${s.txAmount} ${
                            isInflow ? "text-ku-success" : "text-ku-text-strong"
                          }`}
                        >
                          {formatSatang(
                            isInflow ? item.amountSatang : -item.amountSatang,
                            locale,
                            "signed"
                          )}
                        </Text>
                        <View className={`${s.txBadge} ${badge.bgClass}`}>
                          <Text
                            className={`${s.txBadgeText} ${badge.textClass}`}
                          >
                            {item.status}
                          </Text>
                        </View>
                      </View>
                    </View>
                  );
                })
              ) : (
                <View className="items-center py-ku-lg">
                  <Text className="text-ku-text-muted">{m.noTransactions}</Text>
                </View>
              )}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}
