import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Platform } from "react-native";
import { KeyboardAvoidingView, ScrollView, View } from "@/tw";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { type TopUpData, type TopUpQuote } from "@/api/WalletApi";
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
  useWalletQuery,
} from "./api/walletQueries";
import type { TopUpStep } from "./topUpTypes";
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
  const [activeTopUp, setActiveTopUp] = useState<TopUpData | null>(null);
  const [paymentVerified, setPaymentVerified] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [currentBalanceSatang, setCurrentBalanceSatang] = useState<
    number | null
  >(null);
  const [refreshingBalance, setRefreshingBalance] = useState(false);
  const quoteMutation = useQuoteTopUpMutation();
  const createMutation = useCreateTopUpMutation();
  const simulateMutation = useSimulateTopUpMutation();
  const walletQuery = useWalletQuery(false);
  const statusQuery = useTopUpStatusQuery(activeTopUp?.id ?? null);
  const loading = quoteMutation.isPending || createMutation.isPending;
  const checkingStatus =
    statusQuery.isFetching || simulateMutation.isPending || refreshingBalance;
  const amountCheck = checkTopUpAmount(amountStr);
  const isAmountValid = amountCheck.ok;

  const resetQuote = () => {
    setQuote(null);
    setActiveTopUp(null);
    setPaymentVerified(false);
    setCurrentBalanceSatang(null);
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
      setError(err instanceof Error ? err.message : m.paymentFailed);
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
      setActiveTopUp(topUp);
      setStep("promptPay");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : m.paymentFailed);
    }
  };

  const applyPaymentStatus = async (latest: TopUpData) => {
    setActiveTopUp(latest);
    if (latest.topUpStatus === "PAID") {
      setRefreshingBalance(true);
      try {
        const result = await walletQuery.refetch();
        if (result.error) throw result.error;
        setCurrentBalanceSatang(result.data?.spendingBalanceSatang ?? null);
      } catch {
        setCurrentBalanceSatang(null);
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
  };

  const handleVerifyPayment = async () => {
    if (!activeTopUp || checkingStatus) return;
    setStatusMessage(null);
    try {
      const result = await statusQuery.refetch();
      if (result.error) throw result.error;
      if (result.data) await applyPaymentStatus(result.data);
    } catch (err: unknown) {
      setStatusMessage(err instanceof Error ? err.message : m.paymentFailed);
    }
  };

  const handleSimulatePayment = async () => {
    if (!activeTopUp || checkingStatus) return;
    setStatusMessage(null);
    try {
      const latest = await simulateMutation.mutateAsync(activeTopUp.id);
      await applyPaymentStatus(latest);
    } catch (err: unknown) {
      setStatusMessage(err instanceof Error ? err.message : m.paymentFailed);
    }
  };

  const handleBack = () => {
    if (paymentVerified) {
      router.back();
    } else if (step === "confirmation") {
      setStep("amount");
      setError(null);
    } else if (step === "promptPay") {
      setStep("confirmation");
      setError(null);
    } else {
      router.back();
    }
  };

  const handleFinish = () => {
    router.back();
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
                creditSatang={activeTopUp.creditSatang}
                currentBalanceSatang={currentBalanceSatang}
                transactionReference={activeTopUp.internalReference}
                locale={locale}
                onDone={handleFinish}
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
