import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { walletApi } from "@/api/WalletApi";

export const walletKeys = {
  all: ["wallet"] as const,
  detail: () => [...walletKeys.all, "detail"] as const,
  transactions: (limit: number) =>
    [...walletKeys.all, "transactions", limit] as const,
  topUpStatus: (topUpId: string) =>
    [...walletKeys.all, "top-up-status", topUpId] as const,
};

export function useWalletQuery(enabled = true) {
  return useQuery({
    enabled,
    queryKey: walletKeys.detail(),
    queryFn: ({ signal }) => walletApi.getWallet({ signal }),
  });
}

export function useTransactionHistoryQuery(limit: number, enabled = true) {
  return useQuery({
    enabled,
    queryKey: walletKeys.transactions(limit),
    queryFn: ({ signal }) => walletApi.getTransactionHistory(limit, { signal }),
  });
}

export function useTopUpStatusQuery(topUpId: string | null) {
  return useQuery({
    enabled: false,
    queryKey: walletKeys.topUpStatus(topUpId ?? ""),
    queryFn: ({ signal }) => {
      if (!topUpId) {
        throw new Error("A top-up ID is required");
      }
      return walletApi.getTopUpStatus(topUpId, { signal });
    },
  });
}

export function useQuoteTopUpMutation() {
  return useMutation({
    mutationFn: (amountSatang: number) => walletApi.quoteTopUp(amountSatang),
  });
}

export function useCreateTopUpMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (quoteId: string) => walletApi.createTopUp(quoteId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: [...walletKeys.all, "transactions"],
      });
    },
  });
}

export function useSimulateTopUpMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (topUpId: string) => walletApi.simulateTopUp(topUpId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: walletKeys.detail() });
      void queryClient.invalidateQueries({
        queryKey: [...walletKeys.all, "transactions"],
      });
    },
  });
}

export function useConvertEarningsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (amountSatang: number) =>
      walletApi.convertEarnings(amountSatang),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: walletKeys.detail() });
      void queryClient.invalidateQueries({
        queryKey: [...walletKeys.all, "transactions"],
      });
    },
  });
}
