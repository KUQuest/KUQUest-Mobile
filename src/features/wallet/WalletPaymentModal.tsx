import React, { useState } from "react";
import { Modal, Platform } from "react-native";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "@/tw";
import {
  ArrowLeft,
  CheckCircle2,
  QrCode,
  ShieldCheck,
  X,
} from "lucide-react-native";
import { type TopUpData, type TopUpQuote } from "@/api/WalletApi";
import { formatSatang } from "@/domain/satang";
import type { SupportedLocale } from "@/locales/locale";
import { walletMessages } from "@/locales/walletMessages";
import { colors } from "@/theme/colors";
import {
  useCreateTopUpMutation,
  useQuoteTopUpMutation,
  useSimulateTopUpMutation,
  useTopUpStatusQuery,
} from "./api/walletQueries";
import { checkTopUpAmount, isQuoteExpired } from "./walletModule";
import { walletStyles as s } from "./walletStyles";

interface WalletPaymentModalProps {
  visible: boolean;
  locale: SupportedLocale;
  onClose: () => void;
  onSuccess: () => void;
}

const QUICK_AMOUNTS = [100, 500, 1000, 2000] as const;

function formatExpiry(expiresAt: string, locale: SupportedLocale): string {
  const date = new Date(expiresAt);
  if (Number.isNaN(date.getTime())) return expiresAt;
  return new Intl.DateTimeFormat(locale === "th" ? "th-TH" : "en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function WalletPaymentModal({
  visible,
  locale,
  onClose,
  onSuccess,
}: WalletPaymentModalProps) {
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

  const updateAmount = (amount: string) => {
    setAmountStr(amount);
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
      onSuccess();
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

  const resetAndClose = () => {
    setStep("amount");
    resetQuote();
    setError(null);
    setAmountStr("100");
    onClose();
  };

  const handleBackToAmount = () => {
    setStep("amount");
    resetQuote();
    setError(null);
  };

  return (
    <Modal
      animationType="fade"
      transparent
      visible={visible}
      onRequestClose={resetAndClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className={s.modalOverlay}
      >
        <View
          className={`${s.modalCard} border-ku-border-subtle bg-ku-surface`}
        >
          {/* Modal Header */}
          <View className={s.modalHeader}>
            {step !== "amount" ? (
              <TouchableOpacity
                accessibilityLabel={m.back}
                accessibilityRole="button"
                onPress={handleBackToAmount}
                className={s.closeBtn}
                testID="quest-funding-top-up-back"
              >
                <ArrowLeft
                  color={colors.textStrong}
                  size={22}
                  strokeWidth={2.3}
                />
              </TouchableOpacity>
            ) : (
              <View className="w-[38px]" />
            )}
            <Text className={`${s.modalTitle} text-ku-text-strong`}>
              {step === "amount"
                ? m.topUpAmountTitle
                : step === "confirmation"
                  ? m.topUpConfirmationTitle
                  : m.topUpPromptPayTitle}
            </Text>
            <TouchableOpacity
              accessibilityLabel={m.close}
              accessibilityRole="button"
              onPress={resetAndClose}
              className={`${s.closeBtn} bg-ku-surface-muted`}
              testID="quest-funding-top-up-close"
            >
              <X color={colors.textMuted} size={20} />
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerClassName="pb-ku-md"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {step === "amount" ? (
              /* Step 1: Enter Top-Up Amount */
              <View testID="quest-funding-top-up-flow">
                <Text className="mb-[14px] text-[13px] leading-[18px] text-ku-text-secondary">
                  {m.topUpAmountDescription}
                </Text>

                <Text className="mb-[6px] text-[13px] font-semibold text-ku-text-secondary">
                  {m.enterAmount}
                </Text>

                <View className="mb-[6px] h-[52px] flex-row items-center rounded-[14px] border border-ku-border-accent bg-ku-surface-muted px-[14px]">
                  <Text className="mr-ku-sm text-[20px] font-bold text-ku-primary">
                    ฿
                  </Text>
                  <TextInput
                    accessibilityLabel={m.enterAmount}
                    autoFocus
                    className="h-full flex-1 text-[20px] font-bold text-ku-text-strong"
                    keyboardType="numeric"
                    maxLength={7}
                    onChangeText={(val) =>
                      updateAmount(val.replace(/[^0-9]/g, ""))
                    }
                    placeholder="0"
                    placeholderTextColor={colors.textMuted}
                    returnKeyType="done"
                    testID="quest-funding-top-up-amount"
                    value={amountStr}
                  />
                </View>

                <Text className={`${s.hintText} mb-[14px] text-ku-text-muted`}>
                  {m.minTopUpHint}
                </Text>

                {/* Quick Select Buttons */}
                <View className={s.quickAmountRow}>
                  {QUICK_AMOUNTS.map((amt) => {
                    const selected = amountStr === String(amt);
                    return (
                      <TouchableOpacity
                        key={amt}
                        className={`${s.quickAmountBtn} ${
                          selected
                            ? "border-ku-primary bg-ku-primary"
                            : "border-ku-border-subtle bg-ku-surface-muted"
                        }`}
                        onPress={() => handleSelectQuick(amt)}
                        testID={`quest-funding-top-up-quick-${amt}`}
                      >
                        <Text
                          className={`${s.quickAmountLabel} ${
                            selected
                              ? "text-ku-on-primary"
                              : "text-ku-text-strong"
                          }`}
                        >
                          {formatSatang(amt * 100, locale)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {error ? (
                  <Text className="mb-[12px] text-[12px] text-ku-danger">
                    {error}
                  </Text>
                ) : null}

                {/* Continue Button */}
                <TouchableOpacity
                  accessibilityLabel={m.continue}
                  accessibilityRole="button"
                  accessibilityState={{ disabled: !isAmountValid || loading }}
                  className={`${s.actionButtonPrimary} mt-ku-xs h-[48px] rounded-[14px] ${
                    isAmountValid
                      ? "border-ku-primary bg-ku-primary"
                      : "border-ku-border-muted bg-ku-surface-muted"
                  }`}
                  disabled={!isAmountValid || loading}
                  onPress={handleContinue}
                  testID="quest-funding-top-up-continue"
                >
                  {loading ? (
                    <ActivityIndicator color={colors.onPrimary} size="small" />
                  ) : (
                    <Text
                      className={`${s.actionButtonLabelPrimary} text-ku-control font-bold ${
                        isAmountValid
                          ? "text-ku-on-primary"
                          : "text-ku-text-muted"
                      }`}
                    >
                      {m.continue}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            ) : step === "confirmation" && quote ? (
              <View testID="quest-funding-top-up-confirmation">
                <Text className="mb-ku-md text-[13px] leading-[18px] text-ku-text-secondary">
                  {m.topUpAmountDescription}
                </Text>
                <View className="gap-[12px] rounded-[14px] border border-ku-border-subtle bg-ku-surface-muted p-ku-md">
                  <View className="flex-row justify-between">
                    <Text className="text-ku-text-secondary">
                      {m.topUpCredit}
                    </Text>
                    <Text className="font-bold text-ku-text-strong">
                      {formatSatang(quote.creditSatang, locale, "exact")}
                    </Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-ku-text-secondary">{m.topUpFee}</Text>
                    <Text className="text-ku-text-strong">
                      {formatSatang(quote.chargedFeeSatang, locale, "exact")}
                    </Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-ku-text-secondary">{m.topUpTax}</Text>
                    <Text className="text-ku-text-strong">
                      {formatSatang(quote.chargedTaxSatang, locale, "exact")}
                    </Text>
                  </View>
                  <View className="flex-row justify-between border-t border-ku-border-subtle pt-[12px]">
                    <Text className="font-bold text-ku-text-strong">
                      {m.topUpPaymentTotal}
                    </Text>
                    <Text className="text-[18px] font-extrabold text-ku-text-strong">
                      {formatSatang(quote.paymentTotalSatang, locale, "exact")}
                    </Text>
                  </View>
                </View>
                <Text className="mt-[12px] text-[12px] text-ku-text-muted">
                  {m.topUpExpiresAt}: {formatExpiry(quote.expiresAt, locale)}
                </Text>
                {error ? (
                  <Text className="mt-[12px] text-[12px] text-ku-danger">
                    {error}
                  </Text>
                ) : null}
                <TouchableOpacity
                  accessibilityLabel={m.topUpConfirm}
                  accessibilityRole="button"
                  className={`${s.actionButtonPrimary} mt-ku-md h-[48px] rounded-[14px] border-ku-primary bg-ku-primary`}
                  disabled={loading}
                  onPress={handleConfirm}
                  testID="quest-funding-top-up-confirm"
                >
                  {loading ? (
                    <ActivityIndicator color={colors.onPrimary} size="small" />
                  ) : (
                    <Text
                      className={`${s.actionButtonLabelPrimary} text-ku-control font-bold text-ku-on-primary`}
                    >
                      {m.topUpConfirm}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              <View
                className="items-center"
                testID="quest-funding-top-up-promptpay"
              >
                <Text className="mb-[12px] text-center text-[13px] text-ku-text-secondary">
                  {m.topUpPromptPayDescription}
                </Text>

                {/* QR Code Container */}
                <View
                  className={`${s.qrWrapper} rounded-[20px] border-ku-border-accent bg-ku-white`}
                >
                  {activeTopUp?.qrDataUrl ? (
                    <Image
                      className={s.qrImage}
                      resizeMode="contain"
                      source={{ uri: activeTopUp.qrDataUrl }}
                    />
                  ) : (
                    <View
                      className={`${s.qrImage} items-center justify-center`}
                    >
                      <QrCode
                        color={colors.primary}
                        size={84}
                        strokeWidth={1.8}
                      />
                      <Text className="mt-[12px] text-center text-[12px] text-ku-text-muted">
                        {m.topUpPromptPayTitle} •{" "}
                        {formatSatang(
                          activeTopUp!.paymentTotalSatang,
                          locale,
                          "exact"
                        )}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Amount Line */}
                <View className="my-ku-sm items-center">
                  <Text className="text-[13px] text-ku-text-secondary">
                    {m.topUpPaymentTotal}
                  </Text>
                  <Text className="mt-[2px] text-[24px] font-extrabold text-ku-text-strong">
                    {formatSatang(
                      activeTopUp!.paymentTotalSatang,
                      locale,
                      "exact"
                    )}
                  </Text>
                </View>

                {/* Verified Badge */}
                {paymentVerified ? (
                  <View
                    className="my-[12px] w-full flex-row items-center gap-[12px] rounded-[16px] border border-ku-border-success bg-ku-surface-success p-[14px]"
                    testID="quest-funding-verified-badge"
                  >
                    <ShieldCheck
                      color={colors.success}
                      size={28}
                      strokeWidth={2.3}
                    />
                    <View className="flex-1">
                      <Text className="text-[14px] font-bold text-ku-text-strong">
                        {m.paymentVerified}
                      </Text>
                      <Text className="mt-[2px] text-[12px] text-ku-text-secondary">
                        {m.paymentCredited(
                          formatSatang(
                            activeTopUp!.creditSatang,
                            locale,
                            "exact"
                          )
                        )}
                      </Text>
                    </View>
                  </View>
                ) : null}

                {statusMessage && !paymentVerified ? (
                  <View className="mb-[12px] w-full rounded-[10px] bg-ku-surface-muted p-[10px]">
                    <Text className="text-center text-[12px] text-ku-text-secondary">
                      {statusMessage}
                    </Text>
                  </View>
                ) : null}

                {/* Actions Row */}
                <View className="mt-[10px] w-full gap-[10px]">
                  {!paymentVerified ? (
                    <TouchableOpacity
                      accessibilityLabel={m.verifyPayment}
                      accessibilityRole="button"
                      className={`${s.actionButtonPrimary} h-[48px] rounded-[14px] bg-ku-primary`}
                      disabled={checkingStatus}
                      onPress={handleVerifyPayment}
                      testID="quest-funding-top-up-verify-payment"
                    >
                      {checkingStatus ? (
                        <ActivityIndicator
                          color={colors.onPrimary}
                          size="small"
                        />
                      ) : (
                        <>
                          <CheckCircle2
                            color={colors.onPrimary}
                            size={18}
                            strokeWidth={2.2}
                          />
                          <Text
                            className={`${s.actionButtonLabelPrimary} text-ku-body-small font-bold text-ku-on-primary`}
                          >
                            {m.verifyPayment}
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>
                  ) : null}
                  {__DEV__ && !paymentVerified ? (
                    <TouchableOpacity
                      accessibilityLabel={m.simulateSuccess}
                      accessibilityRole="button"
                      className={`${s.actionButtonSecondary} h-[48px] rounded-[14px] border-ku-border-subtle bg-ku-surface-muted`}
                      disabled={checkingStatus}
                      onPress={handleSimulatePayment}
                      testID="quest-funding-top-up-simulate-dev"
                    >
                      <Text
                        className={`${s.actionButtonLabelSecondary} text-ku-body-small font-bold text-ku-text-strong`}
                      >
                        {m.simulateSuccess}
                      </Text>
                    </TouchableOpacity>
                  ) : null}

                  <TouchableOpacity
                    accessibilityLabel={paymentVerified ? m.done : m.close}
                    accessibilityRole="button"
                    className={`${s.actionButtonSecondary} h-[48px] rounded-[14px] ${
                      paymentVerified
                        ? "border-ku-primary bg-ku-primary"
                        : "border-ku-border-subtle bg-ku-surface-muted"
                    }`}
                    onPress={resetAndClose}
                    testID="quest-funding-top-up-promptpay-close"
                  >
                    <Text
                      className={`${s.actionButtonLabelSecondary} text-ku-body-small font-bold ${
                        paymentVerified
                          ? "text-ku-on-primary"
                          : "text-ku-text-strong"
                      }`}
                    >
                      {paymentVerified ? m.done : m.close}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
