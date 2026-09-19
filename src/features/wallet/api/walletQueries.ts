import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  walletApi,
  type CreatePayoutDestinationPayload,
  type PayoutDestination,
} from "@/api/WalletApi";

export const walletKeys = {
  all: ["wallet"] as const,
  detail: () => [...walletKeys.all, "detail"] as const,
  transactions: (limit: number) =>
    [...walletKeys.all, "transactions", limit] as const,
  payoutDestinations: () => [...walletKeys.all, "payout-destinations"] as const,
  topUpStatus: (topUpId: string) =>
    [...walletKeys.all, "top-up-status", topUpId] as const,
};

export function useWalletQuery() {
  return useQuery({
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

export function usePayoutDestinationsQuery(enabled = true) {
  return useQuery({
    enabled,
    queryKey: walletKeys.payoutDestinations(),
    queryFn: ({ signal }) => walletApi.listPayoutDestinations({ signal }),
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
      void queryClient.invalidateQueries({ queryKey: walletKeys.all });
    },
  });
}

export function useSimulateTopUpMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (topUpId: string) => walletApi.simulateTopUp(topUpId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: walletKeys.all });
    },
  });
}

export function useConvertEarningsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (amountSatang: number) =>
      walletApi.convertEarnings(amountSatang),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: walletKeys.all });
    },
  });
}

export function useCreatePayoutDestinationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreatePayoutDestinationPayload) =>
      walletApi.createPayoutDestination(payload),
    onSuccess: (destination) => {
      queryClient.setQueryData<PayoutDestination[]>(
        walletKeys.payoutDestinations(),
        (current) => [...(current ?? []), destination]
      );
      void queryClient.invalidateQueries({
        queryKey: walletKeys.payoutDestinations(),
        refetchType: "none",
      });
    },
  });
}

export function useDeletePayoutDestinationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id?: string) => walletApi.deletePayoutDestination(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: walletKeys.payoutDestinations(),
      });
    },
  });
}

async function submitPayout(amountSatang: number, destinationId: string) {
  if (
    typeof walletApi.quotePayout === "function" &&
    typeof walletApi.createPayout === "function"
  ) {
    try {
      const quote = await walletApi.quotePayout(amountSatang);
      return walletApi.createPayout(quote.id);
    } catch {
      return walletApi.requestPayout(amountSatang, destinationId);
    }
  }

  return walletApi.requestPayout(amountSatang, destinationId);
}

export function useRequestPayoutMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      amountSatang,
      destinationId,
    }: {
      amountSatang: number;
      destinationId: string;
    }) => submitPayout(amountSatang, destinationId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: walletKeys.all });
    },
  });
}
