import React, { useCallback } from "react";
import { RefreshControl, type ListRenderItemInfo } from "react-native";
import {
  ActivityIndicator,
  FlatList,
  Text,
  TouchableOpacity,
  View,
} from "@/tw";
import { AlertCircle, FileText, RefreshCw } from "lucide-react-native";
import { ScreenLayout } from "@/components/layout/ScreenLayout";
import { handleNavigationScroll } from "@/features/navigation/navigationUiStore";
import type { WalletMessages } from "@/locales/walletMessages";
import { colors } from "@/theme/colors";
import {
  getBottomNavigationInset,
  type AppChromeMetrics,
} from "@/theme/layout";
import { spacing } from "@/theme/spacing";
import type { WalletBalances } from "@/api/WalletApi";

import { HirerBalanceCards } from "./HirerBalanceCards";
import {
  HirerHistoryFilter,
  type HirerHistoryFilterOption,
} from "./HirerHistoryFilter";
import { HirerTransactionItem } from "./HirerTransactionItem";
import { HirerWalletBanner } from "./HirerWalletBanner";
import { HirerWalletHeader } from "./HirerWalletHeader";
import { TransactionDetailModal } from "./TransactionDetailModal";
import { TransferEarningsModal } from "./TransferEarningsModal";
import type { ClassifiedHirerTransaction } from "../walletModule";

const MemoizedHirerTransactionItem = React.memo(HirerTransactionItem);

interface WalletScreenContentProps {
  frame: {
    insets: { bottom: number };
    metrics: AppChromeMetrics;
  };
  content: {
    balances: WalletBalances | null;
    loading: boolean;
    refreshing: boolean;
    error: string | null;
    filteredList: ClassifiedHirerTransaction[];
  };
  presentationProps: {
    messages: WalletMessages;
    filter: HirerHistoryFilterOption;
    filterOptions: { key: HirerHistoryFilterOption; label: string }[];
    onFilterChange: (filter: HirerHistoryFilterOption) => void;
    onOpenTransfer: () => void;
    onCloseTransfer: () => void;
    transferModalOpen: boolean;
    selectedTransaction: ClassifiedHirerTransaction | null;
    onSelectTransaction: (transaction: ClassifiedHirerTransaction) => void;
    onCloseTransaction: () => void;
    onRefresh: () => void;
    onTopUp: () => void;
  };
}

export function WalletScreenContent({
  frame,
  content,
  presentationProps,
}: WalletScreenContentProps) {
  const { balances, loading, refreshing, error, filteredList } = content;
  const {
    messages: m,
    filter,
    filterOptions,
    onFilterChange,
    onOpenTransfer,
    onCloseTransfer,
    transferModalOpen,
    selectedTransaction,
    onSelectTransaction,
    onCloseTransaction,
    onRefresh,
    onTopUp,
  } = presentationProps;

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<ClassifiedHirerTransaction>) => (
      <MemoizedHirerTransactionItem
        onPress={onSelectTransaction}
        transaction={item}
      />
    ),
    [onSelectTransaction]
  );
  const keyExtractor = useCallback(
    (item: ClassifiedHirerTransaction) => item.id,
    []
  );

  const listHeader = (
    <>
      <HirerWalletHeader
        subtitle={m.walletSubtitle}
        title={m.financeSubtitle}
      />
      <HirerWalletBanner label={m.sendMoneyAction} onPress={onTopUp} />
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
        onTransferEarnings={onOpenTransfer}
        transferButtonLabel={m.convertEarnings}
      />
      <HirerHistoryFilter
        onSelectFilter={onFilterChange}
        options={filterOptions}
        selectedFilter={filter}
        title={m.historySectionTitle}
      />
    </>
  );

  const emptyState =
    loading && !refreshing ? (
      <View className={styles.centerContainer} testID="hirer-wallet-loading">
        <ActivityIndicator color={colors.hirer} size="large" />
      </View>
    ) : error && !balances ? (
      <View className={styles.errorCard} testID="hirer-wallet-error">
        <AlertCircle color={colors.danger} size={32} />
        <Text className={styles.errorText}>{error}</Text>
        <TouchableOpacity
          accessibilityLabel={m.retry}
          accessibilityRole="button"
          className={styles.retryButton}
          onPress={onRefresh}
          testID="hirer-wallet-retry-button"
        >
          <RefreshCw color={colors.onHirer} size={16} />
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
            getBottomNavigationInset(frame.metrics, frame.insets.bottom) +
            spacing.xl,
          paddingHorizontal: spacing.md,
          paddingTop: spacing.xs,
        }}
        data={filteredList}
        keyExtractor={keyExtractor}
        ListEmptyComponent={emptyState}
        ListHeaderComponent={listHeader}
        onScroll={handleNavigationScroll}
        scrollEventThrottle={16}
        onRefresh={onRefresh}
        refreshControl={
          <RefreshControl
            colors={[colors.hirer]}
            onRefresh={onRefresh}
            refreshing={refreshing}
            tintColor={colors.hirer}
          />
        }
        refreshing={refreshing}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        testID="hirer-wallet-transactions-list"
      />
      <TransactionDetailModal
        messages={m}
        onClose={onCloseTransaction}
        transaction={selectedTransaction}
        visible={Boolean(selectedTransaction)}
      />
      <TransferEarningsModal
        balances={balances}
        messages={m}
        onClose={onCloseTransfer}
        onSuccess={onRefresh}
        visible={transferModalOpen}
      />
    </ScreenLayout>
  );
}

const styles = {
  screen: "bg-ku-background",
  centerContainer: "items-center justify-center py-ku-40",
  errorCard:
    "mt-ku-sm items-center rounded-[16px] border border-ku-border-danger bg-ku-card p-ku-lg",
  errorText:
    "mb-ku-md mt-ku-10 text-center font-ku-medium text-ku-body-small text-ku-danger",
  retryButton:
    "flex-row items-center gap-ku-sm rounded-ku-pill bg-ku-hirer px-ku-18 py-ku-10",
  retryButtonText: "font-ku-semibold text-ku-body-small text-ku-on-hirer",
  emptyCard:
    "mt-ku-xs items-center rounded-[16px] border border-ku-border-subtle bg-ku-card p-ku-xl",
  emptyIconBox:
    "mb-ku-14 h-[56px] w-[56px] items-center justify-center rounded-[28px] bg-ku-surface-muted",
  emptyTitle:
    "mb-ku-sm text-center font-ku-semibold text-ku-body text-ku-text-strong",
  emptyDesc:
    "text-center font-ku-regular text-ku-meta leading-[18px] text-ku-text-secondary",
} as const;
