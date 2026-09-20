import React, { useCallback, useMemo, useState } from "react";
import {
  RefreshControl,
  useWindowDimensions,
  type ListRenderItemInfo,
} from "react-native";
import {
  ActivityIndicator,
  FlatList,
  Text,
  TouchableOpacity,
  View,
} from "@/tw";
import { AlertCircle, FileText, RefreshCw } from "lucide-react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ScreenLayout } from "@/components/layout/ScreenLayout";
import { handleNavigationScroll } from "@/features/navigation/navigationUiStore";
import { useLocale } from "@/features/preferences/localeStore";
import { walletMessages } from "@/locales/walletMessages";
import { colors } from "@/theme/colors";
import { getAppChromeMetrics, getBottomNavigationInset } from "@/theme/layout";
import { spacing } from "@/theme/spacing";

import {
  useTransactionHistoryQuery,
  useWalletQuery,
} from "./api/walletQueries";
import { HirerBalanceCards } from "./components/HirerBalanceCards";
import {
  HirerHistoryFilter,
  type HirerHistoryFilterOption,
} from "./components/HirerHistoryFilter";
import { HirerTransactionItem } from "./components/HirerTransactionItem";
import { HirerWalletBanner } from "./components/HirerWalletBanner";
import { HirerWalletHeader } from "./components/HirerWalletHeader";
import {
  classifyHirerTransaction,
  type ClassifiedHirerTransaction,
} from "./walletModule";
import { TransactionDetailModal } from "./components/TransactionDetailModal";
import { TransferEarningsModal } from "./components/TransferEarningsModal";

const MemoizedHirerTransactionItem = React.memo(HirerTransactionItem);

export default function WalletScreen() {
  const router = useRouter();
  const { locale } = useLocale();
  const m = walletMessages[locale];
  const { width, fontScale } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const metrics = getAppChromeMetrics(width, fontScale);

  const walletQuery = useWalletQuery();
  const historyQuery = useTransactionHistoryQuery(50);
  const hasLoadedWalletData = Boolean(walletQuery.data && historyQuery.data);
  const balances = hasLoadedWalletData ? (walletQuery.data ?? null) : null;
  const transactions = hasLoadedWalletData
    ? (historyQuery.data?.items ?? [])
    : [];
  const loading = walletQuery.isPending || historyQuery.isPending;
  const refreshing = walletQuery.isRefetching || historyQuery.isRefetching;
  const error =
    walletQuery.error?.message ??
    historyQuery.error?.message ??
    (walletQuery.isError || historyQuery.isError ? m.errorLoadingWallet : null);
  const [filter, setFilter] = useState<HirerHistoryFilterOption>("all");
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] =
    useState<ClassifiedHirerTransaction | null>(null);
  const refetchWallet = walletQuery.refetch;
  const refetchHistory = historyQuery.refetch;
  const handleRefresh = useCallback(() => {
    void Promise.all([refetchWallet(), refetchHistory()]);
  }, [refetchHistory, refetchWallet]);

  const classifiedList = useMemo(
    () => transactions.map((tx) => classifyHirerTransaction(tx, locale)),
    [transactions, locale]
  );

  const filteredList = useMemo(
    () =>
      classifiedList.filter((item) => {
        if (filter === "inflow") return item.isInflow;
        if (filter === "outflow") return !item.isInflow;
        if (filter === "top_up") {
          return item.type === "TOP_UP" || item.sourceApi === "TOP_UPS";
        }
        if (filter === "payout") {
          return item.type === "PAYOUT" || item.sourceApi === "PAYOUTS";
        }
        if (filter === "escrow") {
          return (
            item.iconKind === "escrow_pay" ||
            item.iconKind === "unlock_pay" ||
            item.iconKind === "refund" ||
            item.type === "HOLD" ||
            item.type === "RELEASE"
          );
        }
        return true;
      }),
    [classifiedList, filter]
  );

  const filterOptions = [
    { key: "all" as const, label: m.filterAll },
    { key: "top_up" as const, label: m.filterTopUp },
    { key: "payout" as const, label: m.filterPayout },
    { key: "escrow" as const, label: m.filterEscrow },
    { key: "inflow" as const, label: m.filterInflow },
    { key: "outflow" as const, label: m.filterOutflow },
  ];

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<ClassifiedHirerTransaction>) => (
      <MemoizedHirerTransactionItem
        onPress={setSelectedTransaction}
        transaction={item}
      />
    ),
    [setSelectedTransaction]
  );

  const keyExtractor = useCallback(
    (item: ClassifiedHirerTransaction) => item.id,
    []
  );

  const listHeader = (
    <>
      {/* Screen Header */}
      <HirerWalletHeader
        subtitle={m.walletSubtitle}
        title={m.financeSubtitle}
      />
      {/* Action Banner "เติมเงิน" */}
      <HirerWalletBanner
        label={m.sendMoneyAction}
        onPress={() => router.push("/top-up")}
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
        onTransferEarnings={() => setTransferModalOpen(true)}
        transferButtonLabel={m.convertEarnings}
      />

      {/* History Section: Header & Filter Dropdown */}
      <HirerHistoryFilter
        onSelectFilter={setFilter}
        options={filterOptions}
        selectedFilter={filter}
        title={m.historySectionTitle}
      />
    </>
  );

  const emptyState =
    loading && !refreshing ? (
      <View className={styles.centerContainer} testID="hirer-wallet-loading">
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    ) : error && !balances ? (
      <View className={styles.errorCard} testID="hirer-wallet-error">
        <AlertCircle color={colors.danger} size={32} />
        <Text className={styles.errorText}>{error}</Text>
        <TouchableOpacity
          accessibilityLabel={m.retry}
          accessibilityRole="button"
          className={styles.retryButton}
          onPress={handleRefresh}
          testID="hirer-wallet-retry-button"
        >
          <RefreshCw color={colors.onPrimary} size={16} />
          <Text className={styles.retryButtonText}>{m.retry}</Text>
        </TouchableOpacity>
      </View>
    ) : (
      <View className={styles.emptyCard} testID="hirer-wallet-empty">
        <View className={styles.emptyIconBox}>
          <FileText color={colors.textSubtle} size={28} />
        </View>
        <Text className={styles.emptyTitle}>{m.emptyHistoryTitle}</Text>
        <Text className={styles.emptyDesc}>{m.emptyHistoryDesc}</Text>
      </View>
    );

  return (
    <ScreenLayout className={styles.screen} edges={["top", "left", "right"]}>
      <FlatList
        contentContainerStyle={{
          paddingBottom:
            getBottomNavigationInset(metrics, insets.bottom) + spacing.xl,
          paddingHorizontal: spacing.md,
          paddingTop: spacing.xs,
        }}
        data={filteredList}
        keyExtractor={keyExtractor}
        ListEmptyComponent={emptyState}
        ListHeaderComponent={listHeader}
        onScroll={handleNavigationScroll}
        scrollEventThrottle={16}
        onRefresh={handleRefresh}
        refreshControl={
          <RefreshControl
            colors={[colors.primary]}
            onRefresh={handleRefresh}
            refreshing={refreshing}
            tintColor={colors.primary}
          />
        }
        refreshing={refreshing}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        testID="hirer-wallet-transactions-list"
      />

      {/* Transaction Detail Modal */}
      <TransactionDetailModal
        messages={m}
        onClose={() => setSelectedTransaction(null)}
        transaction={selectedTransaction}
        visible={Boolean(selectedTransaction)}
      />
      {/* Transfer Earnings Modal */}
      <TransferEarningsModal
        balances={balances}
        messages={m}
        onClose={() => setTransferModalOpen(false)}
        onSuccess={handleRefresh}
        visible={transferModalOpen}
      />
    </ScreenLayout>
  );
}

const styles = {
  screen: "bg-ku-background",
  centerContainer: "items-center justify-center py-[40px]",
  errorCard:
    "mt-ku-sm items-center rounded-[16px] border border-ku-border-danger bg-ku-card p-ku-lg",
  errorText:
    "mb-ku-md mt-[10px] text-center font-ku-medium text-ku-body-small text-ku-danger",
  retryButton:
    "flex-row items-center gap-ku-sm rounded-ku-pill bg-ku-primary px-[18px] py-[10px]",
  retryButtonText: "font-ku-semibold text-ku-body-small text-ku-on-primary",
  emptyCard:
    "mt-ku-xs items-center rounded-[16px] border border-ku-border-subtle bg-ku-card p-ku-xl",
  emptyIconBox:
    "mb-[14px] h-[56px] w-[56px] items-center justify-center rounded-[28px] bg-ku-surface-muted",
  emptyTitle:
    "mb-ku-sm text-center font-ku-semibold text-ku-body text-ku-text-strong",
  emptyDesc:
    "text-center font-ku-regular text-ku-meta leading-[18px] text-ku-text-secondary",
} as const;
