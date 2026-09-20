import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft } from "lucide-react-native";
import { type TopUpData, type TopUpQuote } from "@/api/WalletApi";
import { ScreenLayout } from "@/components/layout/ScreenLayout";
import { useLocale } from "@/features/preferences/localeStore";
import { walletMessages } from "@/locales/walletMessages";
import { colors } from "@/theme/colors";
import { fontFamily } from "@/theme/typography";
import { TopUpAmountStep } from "./components/TopUpAmountStep";
import { TopUpConfirmationStep } from "./components/TopUpConfirmationStep";
import { TopUpPromptPayStep } from "./components/TopUpPromptPayStep";
import { TopUpSuccessStep } from "./components/TopUpSuccessStep";
import {
  useCreateTopUpMutation,
  useQuoteTopUpMutation,
  useSimulateTopUpMutation,
  useTopUpStatusQuery,
} from "./api/walletQueries";
import { checkTopUpAmount, isQuoteExpired } from "./walletModule";

export default function TopUpScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { locale } = useLocale();
  const m = walletMessages[locale];

  const [step, setStep] = useState<"amount" | "confirmation" | "promptPay">(
    "amount"
  );
  const [amountStr, setAmountStr] = useState("100");
  const [error, setError] = useState<string | null>(null);
  const [quote, setQuote] = useState<TopUpQuote | null>(null);
  const [activeTopUp, setActiveTopUp] = useState<TopUpData | null>(null);
  const [paymentVerified, setPaymentVerified] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const quoteMutation = useQuoteTopUpMutation();
  const createMutation = useCreateTopUpMutation();
  const simulateMutation = useSimulateTopUpMutation();
  const statusQuery = useTopUpStatusQuery(activeTopUp?.id ?? null);
  const loading = quoteMutation.isPending || createMutation.isPending;
  const checkingStatus = statusQuery.isFetching || simulateMutation.isPending;
  const amountCheck = checkTopUpAmount(amountStr);
  const isAmountValid = amountCheck.ok;

  const resetQuote = () => {
    setQuote(null);
    setActiveTopUp(null);
    setPaymentVerified(false);
    setStatusMessage(null);
  };

  const updateAmount = (val: string) => {
    setAmountStr(val.replace(/[^0-9]/g, ""));
    setError(null);
    resetQuote();
  };

  const handleSelectQuick = (amount: number) => {
    updateAmount(String(amount));
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

  const applyPaymentStatus = (latest: TopUpData) => {
    setActiveTopUp(latest);
    if (latest.topUpStatus === "PAID") {
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
      if (result.data) applyPaymentStatus(result.data);
    } catch (err: unknown) {
      setStatusMessage(err instanceof Error ? err.message : m.paymentFailed);
    }
  };

  const handleSimulatePayment = async () => {
    if (!activeTopUp || checkingStatus) return;
    setStatusMessage(null);
    try {
      const latest = await simulateMutation.mutateAsync(activeTopUp.id);
      applyPaymentStatus(latest);
    } catch (err: unknown) {
      setStatusMessage(err instanceof Error ? err.message : m.paymentFailed);
    }
  };

  const handleBack = () => {
    if (step === "confirmation") {
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
    <ScreenLayout edges={["top", "left", "right"]} style={styles.screen}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboardContainer}
      >
        {/* Top Header */}
        <View style={styles.topBar}>
          <TouchableOpacity
            accessibilityLabel={m.back}
            accessibilityRole="button"
            activeOpacity={0.7}
            onPress={handleBack}
            style={styles.backButton}
            testID="top-up-screen-back-btn"
          >
            <ArrowLeft color={colors.textStrong} size={22} strokeWidth={2.4} />
          </TouchableOpacity>

          <View style={styles.headerTitleWrap}>
            <Text numberOfLines={1} style={styles.headerTitle}>
              {step === "amount"
                ? m.topUpAmountTitle
                : step === "confirmation"
                  ? m.topUpConfirmationTitle
                  : m.topUpPromptPayTitle}
            </Text>
            <Text style={styles.headerSubtitle}>
              {step === "amount"
                ? m.topUpAmountStepSubtitle
                : step === "confirmation"
                  ? m.topUpConfirmationStepSubtitle
                  : m.topUpPromptPayStepSubtitle}
            </Text>
          </View>

          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 32 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          testID="top-up-screen-scroll"
        >
          {step === "amount" ? (
            <TopUpAmountStep
              amountStr={amountStr}
              error={error}
              isAmountValid={isAmountValid}
              loading={loading}
              locale={locale}
              onAmountChange={updateAmount}
              onContinue={handleContinue}
              onSelectQuick={handleSelectQuick}
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
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardContainer: {
    flex: 1,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceMuted,
  },
  headerTitleWrap: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 8,
  },
  headerTitle: {
    fontFamily: fontFamily.bold,
    fontSize: 16,
    color: colors.textStrong,
    textAlign: "center",
  },
  headerSubtitle: {
    fontFamily: fontFamily.medium,
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 18,
  },
});
