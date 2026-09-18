import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { ArrowDownLeft, ArrowUpRight, RefreshCw, X } from "lucide-react-native";
import {
  walletApi,
  type UserTransaction,
  type UserTransactionHistoryResult,
} from "@/api/WalletApi";
import type { SupportedLocale } from "@/locales/locale";
import { walletMessages } from "@/locales/walletMessages";
import { colors } from "@/theme/colors";
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
  const [loading, setLoading] = useState(false);
  const [historyResult, setHistoryResult] =
    useState<UserTransactionHistoryResult | null>(null);
  const [refreshIndex, setRefreshIndex] = useState(0);

  useEffect(() => {
    if (!visible) return undefined;
    let active = true;
    walletApi
      .getTransactionHistory(30)
      .then((result) => {
        if (active) setHistoryResult(result);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [visible, refreshIndex]);

  const handleRefresh = () => {
    setLoading(true);
    setRefreshIndex((idx) => idx + 1);
  };

  const formatAmount = (satang: number) => {
    return (satang / 100).toLocaleString("en-US", { minimumFractionDigits: 2 });
  };

  const getStatusBadgeStyle = (status: string, isPlaceholder?: boolean) => {
    if (isPlaceholder) {
      return { bg: colors.surfaceMuted, text: colors.textMuted };
    }
    const upper = status.toUpperCase();
    if (upper === "PAID" || upper === "SUCCEEDED" || upper === "SETTLED") {
      return { bg: colors.surfaceSuccess, text: colors.success };
    }
    if (upper.includes("PENDING")) {
      return { bg: colors.surfaceAccent, text: colors.primary };
    }
    if (upper === "FAILED" || upper === "REJECTED") {
      return { bg: colors.surfaceDanger, text: colors.danger };
    }
    return { bg: colors.surfaceMuted, text: colors.textSecondary };
  };

  return (
    <Modal
      animationType="fade"
      transparent
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={s.modalOverlay}>
        <View
          style={[
            s.modalCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.borderSubtle,
              maxHeight: "90%",
            },
          ]}
        >
          {/* Modal Header */}
          <View style={s.modalHeader}>
            <View style={{ flex: 1 }}>
              <Text style={[s.modalTitle, { color: colors.textStrong }]}>
                {m.historyTitle}
              </Text>
            </View>
            <TouchableOpacity
              accessibilityLabel={m.refresh}
              accessibilityRole="button"
              disabled={loading}
              onPress={handleRefresh}
              style={[s.closeBtn, { marginRight: 6 }]}
            >
              <RefreshCw color={colors.primary} size={18} />
            </TouchableOpacity>
            <TouchableOpacity
              accessibilityLabel={m.close}
              accessibilityRole="button"
              onPress={onClose}
              style={[s.closeBtn, { backgroundColor: colors.surfaceMuted }]}
            >
              <X color={colors.textMuted} size={20} />
            </TouchableOpacity>
          </View>

          {/* Ledger-backed activity feed */}

          {/* Transaction List */}
          {loading && !historyResult ? (
            <View style={{ paddingVertical: 32, alignItems: "center" }}>
              <ActivityIndicator color={colors.primary} size="large" />
            </View>
          ) : (
            <ScrollView
              style={{ flexShrink: 1 }}
              showsVerticalScrollIndicator={false}
            >
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
                      style={[
                        s.txItem,
                        {
                          backgroundColor: colors.surfaceMuted,
                          borderColor: colors.borderSubtle,
                        },
                      ]}
                    >
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          flex: 1,
                        }}
                      >
                        <View
                          style={{
                            alignItems: "center",
                            backgroundColor: isInflow
                              ? colors.surfaceSuccess
                              : colors.surfaceMuted,
                            borderRadius: 10,
                            height: 34,
                            justifyContent: "center",
                            marginRight: 10,
                            width: 34,
                          }}
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
                        <View style={s.txLeading}>
                          <Text
                            numberOfLines={1}
                            style={[s.txTitle, { color: colors.textStrong }]}
                          >
                            {title}
                          </Text>
                          <Text style={[s.txDate, { color: colors.textMuted }]}>
                            {dateFormatted}{" "}
                            {item.reference ? `• ${item.reference}` : ""}
                          </Text>
                        </View>
                      </View>

                      <View style={s.txTrailing}>
                        <Text
                          style={[
                            s.txAmount,
                            {
                              color: isInflow
                                ? colors.success
                                : colors.textStrong,
                            },
                          ]}
                        >
                          {isInflow ? "+" : "-"}฿
                          {formatAmount(item.amountSatang)}
                        </Text>
                        <View
                          style={[s.txBadge, { backgroundColor: badge.bg }]}
                        >
                          <Text style={[s.txBadgeText, { color: badge.text }]}>
                            {item.status}
                          </Text>
                        </View>
                      </View>
                    </View>
                  );
                })
              ) : (
                <View style={{ paddingVertical: 24, alignItems: "center" }}>
                  <Text style={{ color: colors.textMuted }}>
                    {m.noTransactions}
                  </Text>
                </View>
              )}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}
