import React, { useCallback } from "react";
import { RefreshControl, type ListRenderItemInfo } from "react-native";
import { ActivityIndicator, FlatList, View } from "@/tw";
import { ScreenLayout } from "@/components/layout/ScreenLayout";
import { handleNavigationScroll } from "@/features/navigation/navigationUiStore";
import type { WalletMessages } from "@/locales/walletMessages";
import { StateView } from "@/components/ui/StateView";
import { useAppTheme } from "@/features/workspace/AppThemeProvider";
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
  const { colors } = useAppTheme();

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
      <HirerBalanceCards
        balanceCardsHint={m.balanceCardsHint}
        earningsBalanceSatang={balances?.earningsBalanceSatang ?? 0}
        earningsDesc={m.earningsCardDesc}
        earningsTitle={m.earningsCardTitle}
        escrowDesc={m.escrowCardDesc}
        escrowTitle={m.escrowCardTitle}
        fundingReservedSatang={balances?.fundingReservedSatang ?? 0}
        payoutDesc={m.payoutCardDesc}
        payoutTitle={m.payoutCardTitle}
        reservedForPayoutsSatang={balances?.reservedForPayoutsSatang ?? 0}
        spendingBalanceSatang={balances?.spendingBalanceSatang ?? 0}
        spendingDesc={m.spendingBalanceCardDesc}
        spendingTitle={m.spendingBalanceCardTitle}
        swapAllButton={m.swapAllButton}
        swapHint={m.swapHint}
        topUpLabel={m.sendMoneyAction}
        onTopUp={onTopUp}
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
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    ) : error && !balances ? (
      <View testID="hirer-wallet-error">
        <StateView
          actionLabel={m.retry}
          description={error}
          onAction={onRefresh}
          title={m.errorLoadingWallet}
          variant="error"
        />
      </View>
    ) : (
      <View testID="hirer-wallet-empty">
        <StateView
          description={m.emptyHistoryDesc}
          title={m.emptyHistoryTitle}
          variant="empty"
        />
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
        refreshControl={
          <RefreshControl
            colors={[colors.primary]}
            onRefresh={onRefresh}
            refreshing={refreshing}
            tintColor={colors.primary}
          />
        }
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
} as const;
