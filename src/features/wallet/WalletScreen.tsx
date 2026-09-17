import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { AlertCircle, FileText, RefreshCw } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  walletApi,
  type UserTransaction,
  type WalletBalances,
} from "@/api/WalletApi";
import { ScreenLayout } from "@/components/layout/ScreenLayout";
import { useLocale } from "@/locales/LocaleProvider";
import { walletMessages } from "@/locales/walletMessages";
import { colors } from "@/theme/colors";
import { getAppChromeMetrics, getBottomNavigationInset } from "@/theme/layout";
import { spacing } from "@/theme/spacing";
import { fontFamily } from "@/theme/typography";

import { HirerBalanceCards } from "./components/HirerBalanceCards";
import {
  HirerHistoryFilter,
  type HirerHistoryFilterOption,
} from "./components/HirerHistoryFilter";
import { HirerTransactionItem } from "./components/HirerTransactionItem";
import { HirerWalletBanner } from "./components/HirerWalletBanner";
import { HirerWalletHeader } from "./components/HirerWalletHeader";
import { classifyHirerTransaction } from "./walletModule";
import { WalletPaymentModal } from "./WalletPaymentModal";

export default function WalletScreen() {
  const { locale } = useLocale();
  const m = walletMessages[locale];
  const { width, fontScale } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const metrics = getAppChromeMetrics(width, fontScale);

  const [balances, setBalances] = useState<WalletBalances | null>(null);
  const [transactions, setTransactions] = useState<UserTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<HirerHistoryFilterOption>("all");
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [walletRes, historyRes] = await Promise.all([
        walletApi.getWallet(),
        walletApi.getTransactionHistory(50),
      ]);
      setBalances(walletRes);
      setTransactions(historyRes.items);
      setError(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : m.errorLoadingWallet);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [m.errorLoadingWallet]);

  /* eslint-disable react-hooks/set-state-in-effect -- initial async load updates wallet balances and history */
  useEffect(() => {
    void fetchData();
  }, [fetchData]);
  /* eslint-enable react-hooks/set-state-in-effect */
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    void fetchData();
  }, [fetchData]);

  const classifiedList = transactions.map((tx) =>
    classifyHirerTransaction(tx, locale)
  );

  const filteredList = classifiedList.filter((item) => {
    if (filter === "inflow") return item.isInflow;
    if (filter === "outflow") return !item.isInflow;
    if (filter === "escrow") {
      return (
        item.iconKind === "escrow_pay" ||
        item.iconKind === "unlock_pay" ||
        item.iconKind === "refund"
      );
    }
    return true;
  });

  const filterOptions = [
    { key: "all" as const, label: m.filterAll },
    { key: "inflow" as const, label: m.filterInflow },
    { key: "outflow" as const, label: m.filterOutflow },
    { key: "escrow" as const, label: m.filterEscrow },
  ];

  return (
    <ScreenLayout edges={["top", "left", "right"]} style={styles.screen}>
      <ScrollView
        contentContainerStyle={{
          paddingBottom:
            getBottomNavigationInset(metrics, insets.bottom) + spacing.xl,
          paddingHorizontal: spacing.md,
          paddingTop: spacing.xs,
        }}
        refreshControl={
          <RefreshControl
            colors={[colors.primary]}
            onRefresh={handleRefresh}
            refreshing={refreshing}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
        testID="money-screen"
      >
        {/* Screen Header */}
        <HirerWalletHeader
          subtitle={m.walletSubtitle}
          title={m.financeSubtitle}
        />
        {/* Action Banner "เติมเงิน" */}
        <HirerWalletBanner
          label={m.sendMoneyAction}
          onPress={() => setPaymentModalOpen(true)}
        />

        {/* Balance Compartment Cards: Spending Balance & Money in Escrow (Swappable Separately) */}
        <HirerBalanceCards
          balanceCardsHint={m.balanceCardsHint}
          earningsBalanceSatang={balances?.earningsBalanceSatang ?? 0}
          earningsDesc={m.earningsCardDesc}
          earningsTitle={m.earningsCardTitle}
          escrowDesc={m.escrowCardDesc}
          escrowTitle={m.escrowCardTitle}
          fundingReservedSatang={balances?.fundingReservedSatang ?? 0}
          hirerViewLabel={m.hirerViewLabel}
          payoutDesc={m.payoutCardDesc}
          payoutTitle={m.payoutCardTitle}
          reservedForPayoutsSatang={balances?.reservedForPayoutsSatang ?? 0}
          spendingBalanceSatang={balances?.spendingBalanceSatang ?? 0}
          spendingDesc={m.spendingBalanceCardDesc}
          spendingTitle={m.spendingBalanceCardTitle}
          swapAllButton={m.swapAllButton}
          swapHint={m.swapHint}
          workerViewLabel={m.workerViewLabel}
        />

        {/* History Section: Header & Filter Dropdown */}
        <HirerHistoryFilter
          onSelectFilter={setFilter}
          options={filterOptions}
          selectedFilter={filter}
          title={m.historySectionTitle}
        />

        {/* Transactions List / Loading / Error / Empty States */}
        {loading && !refreshing ? (
          <View style={styles.centerContainer} testID="hirer-wallet-loading">
            <ActivityIndicator color={colors.primary} size="large" />
          </View>
        ) : error && !balances ? (
          <View style={styles.errorCard} testID="hirer-wallet-error">
            <AlertCircle color={colors.danger} size={32} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              accessibilityLabel={m.retry}
              accessibilityRole="button"
              onPress={handleRefresh}
              style={styles.retryButton}
              testID="hirer-wallet-retry-button"
            >
              <RefreshCw color="#FFFFFF" size={16} />
              <Text style={styles.retryButtonText}>{m.retry}</Text>
            </TouchableOpacity>
          </View>
        ) : filteredList.length > 0 ? (
          <View testID="hirer-wallet-transactions-list">
            {filteredList.map((tx) => (
              <HirerTransactionItem key={tx.id} transaction={tx} />
            ))}
          </View>
        ) : (
          <View style={styles.emptyCard} testID="hirer-wallet-empty">
            <View style={styles.emptyIconBox}>
              <FileText color="#9CA3AF" size={28} />
            </View>
            <Text style={styles.emptyTitle}>{m.emptyHistoryTitle}</Text>
            <Text style={styles.emptyDesc}>{m.emptyHistoryDesc}</Text>
          </View>
        )}
      </ScrollView>

      {/* Top-up via PromptPay QR Modal */}
      <WalletPaymentModal
        locale={locale}
        onClose={() => setPaymentModalOpen(false)}
        onSuccess={() => {
          setPaymentModalOpen(false);
          void fetchData();
        }}
        visible={paymentModalOpen}
      />
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.background,
  },
  centerContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  errorCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderDanger,
    alignItems: "center",
    padding: 24,
    marginTop: 8,
  },
  errorText: {
    fontFamily: fontFamily.medium,
    fontSize: 14,
    color: colors.danger,
    marginTop: 10,
    marginBottom: 16,
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: colors.primary,
    borderRadius: 9999,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  retryButtonText: {
    fontFamily: fontFamily.semiBold,
    fontSize: 14,
    color: colors.white,
  },
  emptyCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    alignItems: "center",
    padding: 32,
    marginTop: 4,
  },
  emptyIconBox: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  emptyTitle: {
    fontFamily: fontFamily.semiBold,
    fontSize: 16,
    color: colors.textStrong,
    marginBottom: 6,
    textAlign: "center",
  },
  emptyDesc: {
    fontFamily: fontFamily.regular,
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 18,
  },
});
