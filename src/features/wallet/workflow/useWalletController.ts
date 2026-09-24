import { useCallback, useMemo, useState } from "react";
import { useWindowDimensions } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useLocale } from "@/features/preferences/localeStore";
import { walletMessages } from "@/locales/walletMessages";
import { getAppChromeMetrics } from "@/theme/layout";

import {
  useTransactionHistoryQuery,
  useWalletQuery,
} from "../api/walletQueries";
import type { HirerHistoryFilterOption } from "../components/HirerHistoryFilter";
import {
  classifyHirerTransaction,
  type ClassifiedHirerTransaction,
} from "../walletModule";

export function useWalletController() {
  const router = useRouter();
  const { locale } = useLocale();
  const messages = walletMessages[locale];
  const { width, fontScale } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const metrics = getAppChromeMetrics(width, fontScale);

  const walletQuery = useWalletQuery();
  const historyQuery = useTransactionHistoryQuery(50);
  const hasLoadedWalletData = Boolean(walletQuery.data && historyQuery.data);
  const balances = hasLoadedWalletData ? (walletQuery.data ?? null) : null;
  const loading = walletQuery.isPending || historyQuery.isPending;
  const refreshing = walletQuery.isRefetching || historyQuery.isRefetching;
  const error =
    walletQuery.error?.message ??
    historyQuery.error?.message ??
    (walletQuery.isError || historyQuery.isError
      ? messages.errorLoadingWallet
      : null);
  const [filter, setFilter] = useState<HirerHistoryFilterOption>("all");
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] =
    useState<ClassifiedHirerTransaction | null>(null);
  const refetchWallet = walletQuery.refetch;
  const refetchHistory = historyQuery.refetch;
  const handleRefresh = useCallback(() => {
    void Promise.all([refetchWallet(), refetchHistory()]);
  }, [refetchHistory, refetchWallet]);
  const handleOpenTransfer = useCallback(() => setTransferModalOpen(true), []);
  const handleCloseTransfer = useCallback(
    () => setTransferModalOpen(false),
    []
  );
  const handleSelectTransaction = useCallback(
    (transaction: ClassifiedHirerTransaction) =>
      setSelectedTransaction(transaction),
    []
  );
  const handleCloseTransaction = useCallback(
    () => setSelectedTransaction(null),
    []
  );
  const handleTopUp = useCallback(() => {
    router.push("/top-up");
  }, [router]);

  const classifiedList = useMemo(
    () =>
      (hasLoadedWalletData ? (historyQuery.data?.items ?? []) : []).map((tx) =>
        classifyHirerTransaction(tx, locale)
      ),
    [hasLoadedWalletData, historyQuery.data?.items, locale]
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
    { key: "all" as const, label: messages.filterAll },
    { key: "top_up" as const, label: messages.filterTopUp },
    { key: "payout" as const, label: messages.filterPayout },
    { key: "escrow" as const, label: messages.filterEscrow },
    { key: "inflow" as const, label: messages.filterInflow },
    { key: "outflow" as const, label: messages.filterOutflow },
  ];

  return {
    frame: { insets, metrics },
    content: { balances, loading, refreshing, error, filteredList },
    presentationProps: {
      messages,
      filter,
      filterOptions,
      onFilterChange: setFilter,
      onOpenTransfer: handleOpenTransfer,
      onCloseTransfer: handleCloseTransfer,
      transferModalOpen,
      selectedTransaction,
      onSelectTransaction: handleSelectTransaction,
      onCloseTransaction: handleCloseTransaction,
      onRefresh: handleRefresh,
      onTopUp: handleTopUp,
    },
  };
}
