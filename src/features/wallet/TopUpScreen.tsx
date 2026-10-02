import { getLocalizedErrorMessage } from "@/utils/error";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Platform } from "react-native";
import { KeyboardAvoidingView, ScrollView, View } from "@/tw";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { type TopUpData, type TopUpQuote, walletApi } from "@/api/WalletApi";
import { ScreenLayout } from "@/components/layout/ScreenLayout";
import { useLocale } from "@/features/preferences/localeStore";
import { walletMessages } from "@/locales/walletMessages";
import { spacing } from "@/theme/spacing";
import { TopUpAmountStep } from "./components/TopUpAmountStep";
import { TopUpConfirmationStep } from "./components/TopUpConfirmationStep";
import { TopUpHeader } from "./components/TopUpHeader";
import { TopUpPromptPayStep } from "./components/TopUpPromptPayStep";
import { TopUpSuccessStep } from "./components/TopUpSuccessStep";
import {
  walletKeys,
  useCreateTopUpMutation,
  useQuoteTopUpMutation,
  useSimulateTopUpMutation,
  useTopUpStatusQuery,
  useTopUpsQuery,
  useWalletQuery,
} from "./api/walletQueries";
import type { TopUpStep } from "./topUpTypes";
import { goBackOrReplace } from "@/utils/navigation";
import { checkTopUpAmount, isQuoteExpired } from "./walletModule";

export default function TopUpScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const { locale } = useLocale();
  const m = walletMessages[locale];

  const [step, setStep] = useState<TopUpStep>("amount");
  const [amountStr, setAmountStr] = useState("100");
  const [error, setError] = useState<string | null>(null);
  const [quote, setQuote] = useState<TopUpQuote | null>(null);
  const [activeTopUpId, setActiveTopUpId] = useState<string | null>(null);
  const activeTopUpIdRef = useRef(activeTopUpId);
  const stepRef = useRef(step);
  useEffect(() => {
    activeTopUpIdRef.current = activeTopUpId;
    stepRef.current = step;
  }, [activeTopUpId, step]);
  const [paymentVerified, setPaymentVerified] = useState(false);
  const handledStatusRef = useRef<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [currentBalanceSatang, setCurrentBalanceSatang] = useState<
    number | null
  >(null);
  const [refreshingBalance, setRefreshingBalance] = useState(false);
  const [balanceRefreshFailed, setBalanceRefreshFailed] = useState(false);
  const quoteMutation = useQuoteTopUpMutation();
  const createMutation = useCreateTopUpMutation();
  const simulateMutation = useSimulateTopUpMutation();
  const walletQuery = useWalletQuery(false);
  const statusQuery = useTopUpStatusQuery(activeTopUpId);
  const activeTopUp = statusQuery.data ?? null;
  const topUpsQuery = useTopUpsQuery();
  const loading = quoteMutation.isPending || createMutation.isPending;
  const checkingStatus =
    statusQuery.isFetching || simulateMutation.isPending || refreshingBalance;
  const amountCheck = checkTopUpAmount(amountStr);
  const isAmountValid = amountCheck.ok;

  useEffect(() => {
    const latestPendingTopUp = (topUpsQuery.data ?? [])
      .filter(
        (topUp) =>
          topUp.topUpStatus === "PENDING" &&
          Date.parse(topUp.qrExpiresAt ?? "") > Date.now()
      )
      .sort(
        (left, right) =>
          Date.parse(right.createdAt) - Date.parse(left.createdAt)
      )[0];
    if (
      !latestPendingTopUp ||
      activeTopUpIdRef.current ||
      stepRef.current !== "amount"
    ) {
      return;
    }
    let current = true;
    void walletApi
      .getTopUpStatus(latestPendingTopUp.id)
      .then((topUp) => {
        if (
          !current ||
          activeTopUpIdRef.current ||
          stepRef.current !== "amount"
        ) {
          return;
        }
        queryClient.setQueryData(walletKeys.topUpStatus(topUp.id), topUp);
        activeTopUpIdRef.current = topUp.id;
        setActiveTopUpId(topUp.id);
        setStep("promptPay");
      })
      .catch(() => undefined);
    return () => {
      current = false;
    };
  }, [queryClient, topUpsQuery.data]);
  const resetQuote = () => {
    setActiveTopUpId(null);
    activeTopUpIdRef.current = null;
    setPaymentVerified(false);
    setCurrentBalanceSatang(null);
    setBalanceRefreshFailed(false);
    setStatusMessage(null);
  };

  const updateAmount = (val: string) => {
    setAmountStr(val);
    setError(null);
    resetQuote();
  };

  const handleContinue = async () => {
    if (!amountCheck.ok) {
      setError(
        amountCheck.reason === "BELOW_MINIMUM"
          ? m.minTopUpHint
          : m.paymentFailed
      );
      return;
    }
    setError(null);
    setStatusMessage(null);

    try {
      const nextQuote = await quoteMutation.mutateAsync(amountCheck.satang);
      setQuote(nextQuote);
      setStep("confirmation");
    } catch (err: unknown) {
      setError(
        getLocalizedErrorMessage(err, locale, {
          fallback: m.paymentFailed,
        })
      );
    }
  };

  const handleConfirm = async () => {
    if (!quote || loading) return;
    setError(null);

    if (isQuoteExpired(quote, new Date())) {
      setError(m.paymentFailed);
      return;
    }

    try {
      const topUp = await createMutation.mutateAsync(quote.id);
      queryClient.setQueryData(walletKeys.topUpStatus(topUp.id), topUp);
      activeTopUpIdRef.current = topUp.id;
      setActiveTopUpId(topUp.id);
      setStep("promptPay");
    } catch (err: unknown) {
      setError(
        getLocalizedErrorMessage(err, locale, {
          fallback: m.paymentFailed,
        })
      );
    }
  };

  const applyPaymentStatus = useCallback(
    async (latest: TopUpData) => {
      handledStatusRef.current = `${latest.id}:${latest.topUpStatus}`;
      queryClient.setQueryData(walletKeys.topUpStatus(latest.id), latest);
      if (latest.topUpStatus === "PAID") {
        setRefreshingBalance(true);
        setBalanceRefreshFailed(false);
        try {
          const result = await walletQuery.refetch();
          if (result.error) throw result.error;
          setCurrentBalanceSatang(result.data?.spendingBalanceSatang ?? null);
        } catch {
          setCurrentBalanceSatang(null);
          setBalanceRefreshFailed(true);
        } finally {
          setRefreshingBalance(false);
        }
        void queryClient.invalidateQueries({
          queryKey: [...walletKeys.all, "transactions"],
        });
        setPaymentVerified(true);
        setStatusMessage(m.paymentSuccess);
      } else {
        setStatusMessage(m.paymentPending);
      }
    },
    [m.paymentPending, m.paymentSuccess, queryClient, walletQuery]
  );
  useEffect(() => {
    const latest = statusQuery.data;
    if (!latest || latest.topUpStatus === "PENDING") return;
    const statusKey = `${latest.id}:${latest.topUpStatus}`;
    if (handledStatusRef.current === statusKey) return;
    void applyPaymentStatus(latest);
  }, [applyPaymentStatus, statusQuery.data]);
  const handleRetryBalanceRefresh = async () => {
    if (refreshingBalance) return;
    setRefreshingBalance(true);
    setBalanceRefreshFailed(false);
    try {
      const result = await walletQuery.refetch();
      if (result.error) throw result.error;
      setCurrentBalanceSatang(result.data?.spendingBalanceSatang ?? null);
    } catch {
      setCurrentBalanceSatang(null);
      setBalanceRefreshFailed(true);
    } finally {
      setRefreshingBalance(false);
    }
  };

  const handleVerifyPayment = async () => {
    if (!activeTopUp || checkingStatus) return;
    setStatusMessage(null);
    try {
      const result = await statusQuery.refetch();
      if (result.error) throw result.error;
      if (result.data) await applyPaymentStatus(result.data);
    } catch (err: unknown) {
      setStatusMessage(
        getLocalizedErrorMessage(err, locale, {
          fallback: m.paymentFailed,
        })
      );
    }
  };

  const handleSimulatePayment = async () => {
    if (!activeTopUp || checkingStatus) return;
    setStatusMessage(null);
    try {
      const latest = await simulateMutation.mutateAsync(activeTopUp.id);
      await applyPaymentStatus(latest);
    } catch (err: unknown) {
      setStatusMessage(
        getLocalizedErrorMessage(err, locale, {
          fallback: m.paymentFailed,
        })
      );
    }
  };

  const handleBack = () => {
    if (paymentVerified) {
      goBackOrReplace(router, "/(tabs)/money");
    } else if (step === "confirmation") {
      setStep("amount");
      setError(null);
    } else if (step === "promptPay") {
      setStep("confirmation");
      setError(null);
    } else {
      goBackOrReplace(router, "/(tabs)/money");
    }
  };

  const handleFinish = () => {
    goBackOrReplace(router, "/(tabs)/money");
  };

  return (
    <ScreenLayout className="bg-ku-background" edges={["top", "left", "right"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <TopUpHeader
          locale={locale}
          onBack={handleBack}
          step={paymentVerified ? null : step}
        />

        <ScrollView
          contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xl }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          testID="top-up-screen-scroll"
        >
          <View className="w-full max-w-[640px] self-center px-ku-md pt-ku-md">
            {step === "amount" ? (
              <TopUpAmountStep
                amountStr={amountStr}
                error={error}
                isAmountValid={isAmountValid}
                loading={loading}
                locale={locale}
                onAmountChange={updateAmount}
                onContinue={handleContinue}
              />
            ) : step === "confirmation" && quote ? (
              <TopUpConfirmationStep
                error={error}
                loading={loading}
                locale={locale}
                onConfirm={handleConfirm}
                onEdit={() => setStep("amount")}
                quote={quote}
              />
            ) : activeTopUp && paymentVerified ? (
              <TopUpSuccessStep
                balanceRefreshFailed={balanceRefreshFailed}
                creditSatang={activeTopUp.creditSatang}
                currentBalanceSatang={currentBalanceSatang}
                isRefreshingBalance={refreshingBalance}
                locale={locale}
                onDone={handleFinish}
                onRetryBalanceRefresh={handleRetryBalanceRefresh}
                transactionReference={activeTopUp.internalReference}
              />
            ) : activeTopUp ? (
              <TopUpPromptPayStep
                activeTopUp={activeTopUp}
                checkingStatus={checkingStatus}
                locale={locale}
                onSimulatePayment={handleSimulatePayment}
                onVerifyPayment={handleVerifyPayment}
                statusMessage={statusMessage}
              />
            ) : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenLayout>
  );
}
