import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  ArrowLeft,
  CheckCircle2,
  QrCode,
  ShieldCheck,
  X,
} from "lucide-react-native";
import { type TopUpData, type TopUpQuote } from "@/api/WalletApi";
import { formatSatang } from "@/domain/satang";
import type { SupportedLocale } from "@/locales/LocaleProvider";
import { walletMessages } from "@/locales/walletMessages";
import { colors } from "@/theme/colors";
import {
  checkTopUpAmount,
  checkTopUpPayment,
  createTopUpFromQuote,
  requestTopUpQuote,
  simulateTopUpPayment,
} from "./walletModule";
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quote, setQuote] = useState<TopUpQuote | null>(null);
  const [activeTopUp, setActiveTopUp] = useState<TopUpData | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [paymentVerified, setPaymentVerified] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

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
    setLoading(true);
    setError(null);
    setStatusMessage(null);

    try {
      const nextQuote = await requestTopUpQuote(amountCheck.satang);
      setQuote(nextQuote);
      setStep("confirmation");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : m.paymentFailed);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!quote || loading) return;
    setLoading(true);
    setError(null);

    try {
      const result = await createTopUpFromQuote(quote, new Date());
      if (!result.ok) {
        setError(m.paymentFailed);
        return;
      }
      setActiveTopUp(result.topUp);
      setStep("promptPay");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : m.paymentFailed);
    } finally {
      setLoading(false);
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
    setCheckingStatus(true);
    setStatusMessage(null);
    try {
      applyPaymentStatus(await checkTopUpPayment(activeTopUp.id));
    } catch (err: unknown) {
      setStatusMessage(err instanceof Error ? err.message : m.paymentFailed);
    } finally {
      setCheckingStatus(false);
    }
  };

  const handleSimulatePayment = async () => {
    if (!activeTopUp || checkingStatus) return;
    setCheckingStatus(true);
    setStatusMessage(null);
    try {
      const latest = await simulateTopUpPayment(activeTopUp.id);
      if (latest) applyPaymentStatus(latest);
    } catch (err: unknown) {
      setStatusMessage(err instanceof Error ? err.message : m.paymentFailed);
    } finally {
      setCheckingStatus(false);
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
        style={s.modalOverlay}
      >
        <View
          style={[
            s.modalCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.borderSubtle,
            },
          ]}
        >
          {/* Modal Header */}
          <View style={s.modalHeader}>
            {step !== "amount" ? (
              <TouchableOpacity
                accessibilityLabel={m.back}
                accessibilityRole="button"
                onPress={handleBackToAmount}
                style={s.closeBtn}
                testID="quest-funding-top-up-back"
              >
                <ArrowLeft
                  color={colors.textStrong}
                  size={22}
                  strokeWidth={2.3}
                />
              </TouchableOpacity>
            ) : (
              <View style={{ width: 38 }} />
            )}
            <Text style={[s.modalTitle, { color: colors.textStrong }]}>
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
              style={[s.closeBtn, { backgroundColor: colors.surfaceMuted }]}
              testID="quest-funding-top-up-close"
            >
              <X color={colors.textMuted} size={20} />
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={{ paddingBottom: 16 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {step === "amount" ? (
              /* Step 1: Enter Top-Up Amount */
              <View testID="quest-funding-top-up-flow">
                <Text
                  style={{
                    color: colors.textSecondary,
                    fontSize: 13,
                    marginBottom: 14,
                    lineHeight: 18,
                  }}
                >
                  {m.topUpAmountDescription}
                </Text>

                <Text
                  style={{
                    color: colors.textSecondary,
                    fontSize: 13,
                    fontWeight: "600",
                    marginBottom: 6,
                  }}
                >
                  {m.enterAmount}
                </Text>

                <View
                  style={{
                    alignItems: "center",
                    backgroundColor: colors.surfaceMuted,
                    borderColor: colors.borderAccent,
                    borderRadius: 14,
                    borderWidth: 1,
                    flexDirection: "row",
                    height: 52,
                    marginBottom: 6,
                    paddingHorizontal: 14,
                  }}
                >
                  <Text
                    style={{
                      color: colors.primary,
                      fontSize: 20,
                      fontWeight: "700",
                      marginRight: 8,
                    }}
                  >
                    ฿
                  </Text>
                  <TextInput
                    accessibilityLabel={m.enterAmount}
                    autoFocus
                    keyboardType="numeric"
                    maxLength={7}
                    onChangeText={(val) =>
                      updateAmount(val.replace(/[^0-9]/g, ""))
                    }
                    placeholder="0"
                    placeholderTextColor={colors.textMuted}
                    returnKeyType="done"
                    style={{
                      color: colors.textStrong,
                      flex: 1,
                      fontSize: 20,
                      fontWeight: "700",
                      height: "100%",
                    }}
                    testID="quest-funding-top-up-amount"
                    value={amountStr}
                  />
                </View>

                <Text
                  style={[
                    s.hintText,
                    { color: colors.textMuted, marginBottom: 14 },
                  ]}
                >
                  {m.minTopUpHint}
                </Text>

                {/* Quick Select Buttons */}
                <View style={s.quickAmountRow}>
                  {QUICK_AMOUNTS.map((amt) => {
                    const selected = amountStr === String(amt);
                    return (
                      <TouchableOpacity
                        key={amt}
                        onPress={() => handleSelectQuick(amt)}
                        style={[
                          s.quickAmountBtn,
                          {
                            backgroundColor: selected
                              ? colors.primary
                              : colors.surfaceMuted,
                            borderColor: selected
                              ? colors.primary
                              : colors.borderSubtle,
                          },
                        ]}
                        testID={`quest-funding-top-up-quick-${amt}`}
                      >
                        <Text
                          style={[
                            s.quickAmountLabel,
                            {
                              color: selected
                                ? colors.white
                                : colors.textStrong,
                            },
                          ]}
                        >
                          ฿{amt.toLocaleString("en-US")}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {error ? (
                  <Text
                    style={{
                      color: colors.danger,
                      fontSize: 12,
                      marginBottom: 12,
                    }}
                  >
                    {error}
                  </Text>
                ) : null}

                {/* Continue Button */}
                <TouchableOpacity
                  accessibilityLabel={m.continue}
                  accessibilityRole="button"
                  accessibilityState={{ disabled: !isAmountValid || loading }}
                  disabled={!isAmountValid || loading}
                  onPress={handleContinue}
                  style={[
                    s.actionButtonPrimary,
                    {
                      backgroundColor: isAmountValid
                        ? colors.primary
                        : colors.surfaceMuted,
                      borderColor: isAmountValid
                        ? colors.primary
                        : colors.borderMuted,
                      height: 48,
                      borderRadius: 14,
                      marginTop: 4,
                    },
                  ]}
                  testID="quest-funding-top-up-continue"
                >
                  {loading ? (
                    <ActivityIndicator color={colors.white} size="small" />
                  ) : (
                    <Text
                      style={[
                        s.actionButtonLabelPrimary,
                        {
                          color: isAmountValid
                            ? colors.white
                            : colors.textMuted,
                          fontSize: 15,
                          fontWeight: "700",
                        },
                      ]}
                    >
                      {m.continue}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            ) : step === "confirmation" && quote ? (
              <View testID="quest-funding-top-up-confirmation">
                <Text
                  style={{
                    color: colors.textSecondary,
                    fontSize: 13,
                    lineHeight: 18,
                    marginBottom: 16,
                  }}
                >
                  {m.topUpAmountDescription}
                </Text>
                <View
                  style={{
                    backgroundColor: colors.surfaceMuted,
                    borderColor: colors.borderSubtle,
                    borderRadius: 14,
                    borderWidth: 1,
                    gap: 12,
                    padding: 16,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                    }}
                  >
                    <Text style={{ color: colors.textSecondary }}>
                      {m.topUpCredit}
                    </Text>
                    <Text
                      style={{ color: colors.textStrong, fontWeight: "700" }}
                    >
                      {formatSatang(quote.creditSatang, locale, "exact")}
                    </Text>
                  </View>
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                    }}
                  >
                    <Text style={{ color: colors.textSecondary }}>
                      {m.topUpFee}
                    </Text>
                    <Text style={{ color: colors.textStrong }}>
                      {formatSatang(quote.chargedFeeSatang, locale, "exact")}
                    </Text>
                  </View>
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                    }}
                  >
                    <Text style={{ color: colors.textSecondary }}>
                      {m.topUpTax}
                    </Text>
                    <Text style={{ color: colors.textStrong }}>
                      {formatSatang(quote.chargedTaxSatang, locale, "exact")}
                    </Text>
                  </View>
                  <View
                    style={{
                      borderTopColor: colors.borderSubtle,
                      borderTopWidth: 1,
                      flexDirection: "row",
                      justifyContent: "space-between",
                      paddingTop: 12,
                    }}
                  >
                    <Text
                      style={{ color: colors.textStrong, fontWeight: "700" }}
                    >
                      {m.topUpPaymentTotal}
                    </Text>
                    <Text
                      style={{
                        color: colors.textStrong,
                        fontSize: 18,
                        fontWeight: "800",
                      }}
                    >
                      {formatSatang(quote.paymentTotalSatang, locale, "exact")}
                    </Text>
                  </View>
                </View>
                <Text
                  style={{
                    color: colors.textMuted,
                    fontSize: 12,
                    marginTop: 12,
                  }}
                >
                  {m.topUpExpiresAt}: {formatExpiry(quote.expiresAt, locale)}
                </Text>
                {error ? (
                  <Text
                    style={{
                      color: colors.danger,
                      fontSize: 12,
                      marginTop: 12,
                    }}
                  >
                    {error}
                  </Text>
                ) : null}
                <TouchableOpacity
                  accessibilityLabel={m.topUpConfirm}
                  accessibilityRole="button"
                  disabled={loading}
                  onPress={handleConfirm}
                  style={[
                    s.actionButtonPrimary,
                    {
                      backgroundColor: colors.primary,
                      borderColor: colors.primary,
                      borderRadius: 14,
                      height: 48,
                      marginTop: 16,
                    },
                  ]}
                  testID="quest-funding-top-up-confirm"
                >
                  {loading ? (
                    <ActivityIndicator color={colors.white} size="small" />
                  ) : (
                    <Text
                      style={[
                        s.actionButtonLabelPrimary,
                        {
                          color: colors.white,
                          fontSize: 15,
                          fontWeight: "700",
                        },
                      ]}
                    >
                      {m.topUpConfirm}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              <View
                style={{ alignItems: "center" }}
                testID="quest-funding-top-up-promptpay"
              >
                <Text
                  style={{
                    color: colors.textSecondary,
                    fontSize: 13,
                    textAlign: "center",
                    marginBottom: 12,
                  }}
                >
                  {m.topUpPromptPayDescription}
                </Text>

                {/* QR Code Container */}
                <View
                  style={[
                    s.qrWrapper,
                    {
                      backgroundColor: colors.white,
                      borderColor: colors.borderAccent,
                      padding: 16,
                      borderRadius: 20,
                    },
                  ]}
                >
                  {activeTopUp?.qrDataUrl ? (
                    <Image
                      source={{ uri: activeTopUp.qrDataUrl }}
                      style={s.qrImage}
                      resizeMode="contain"
                    />
                  ) : (
                    <View
                      style={[
                        s.qrImage,
                        { alignItems: "center", justifyContent: "center" },
                      ]}
                    >
                      <QrCode
                        color={colors.primary}
                        size={84}
                        strokeWidth={1.8}
                      />
                      <Text
                        style={{
                          color: colors.textMuted,
                          fontSize: 12,
                          marginTop: 12,
                          textAlign: "center",
                        }}
                      >
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
                <View style={{ alignItems: "center", marginVertical: 8 }}>
                  <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
                    {m.topUpPaymentTotal}
                  </Text>
                  <Text
                    style={{
                      color: colors.textStrong,
                      fontSize: 24,
                      fontWeight: "800",
                      marginTop: 2,
                    }}
                  >
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
                    style={{
                      alignItems: "center",
                      backgroundColor: colors.surfaceSuccess,
                      borderColor: colors.borderSuccess,
                      borderRadius: 16,
                      borderWidth: 1,
                      flexDirection: "row",
                      gap: 12,
                      marginVertical: 12,
                      padding: 14,
                      width: "100%",
                    }}
                    testID="quest-funding-verified-badge"
                  >
                    <ShieldCheck
                      color={colors.success}
                      size={28}
                      strokeWidth={2.3}
                    />
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          color: colors.textStrong,
                          fontSize: 14,
                          fontWeight: "700",
                        }}
                      >
                        {m.paymentVerified}
                      </Text>
                      <Text
                        style={{
                          color: colors.textSecondary,
                          fontSize: 12,
                          marginTop: 2,
                        }}
                      >
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
                  <View
                    style={{
                      backgroundColor: colors.surfaceMuted,
                      borderRadius: 10,
                      padding: 10,
                      marginBottom: 12,
                      width: "100%",
                    }}
                  >
                    <Text
                      style={{
                        color: colors.textSecondary,
                        fontSize: 12,
                        textAlign: "center",
                      }}
                    >
                      {statusMessage}
                    </Text>
                  </View>
                ) : null}

                {/* Actions Row */}
                <View style={{ gap: 10, marginTop: 10, width: "100%" }}>
                  {!paymentVerified ? (
                    <TouchableOpacity
                      accessibilityLabel={m.verifyPayment}
                      accessibilityRole="button"
                      disabled={checkingStatus}
                      onPress={handleVerifyPayment}
                      style={[
                        s.actionButtonPrimary,
                        {
                          backgroundColor: colors.primary,
                          height: 48,
                          borderRadius: 14,
                        },
                      ]}
                      testID="quest-funding-top-up-verify-payment"
                    >
                      {checkingStatus ? (
                        <ActivityIndicator color={colors.white} size="small" />
                      ) : (
                        <>
                          <CheckCircle2
                            color={colors.white}
                            size={18}
                            strokeWidth={2.2}
                          />
                          <Text
                            style={[
                              s.actionButtonLabelPrimary,
                              {
                                color: colors.white,
                                fontSize: 14,
                                fontWeight: "700",
                              },
                            ]}
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
                      disabled={checkingStatus}
                      onPress={handleSimulatePayment}
                      style={[
                        s.actionButtonSecondary,
                        {
                          backgroundColor: colors.surfaceMuted,
                          borderColor: colors.borderSubtle,
                          height: 48,
                          borderRadius: 14,
                        },
                      ]}
                      testID="quest-funding-top-up-simulate-dev"
                    >
                      <Text
                        style={[
                          s.actionButtonLabelSecondary,
                          {
                            color: colors.textStrong,
                            fontSize: 14,
                            fontWeight: "700",
                          },
                        ]}
                      >
                        {m.simulateSuccess}
                      </Text>
                    </TouchableOpacity>
                  ) : null}

                  <TouchableOpacity
                    accessibilityLabel={paymentVerified ? m.done : m.close}
                    accessibilityRole="button"
                    onPress={resetAndClose}
                    style={[
                      s.actionButtonSecondary,
                      {
                        backgroundColor: paymentVerified
                          ? colors.primary
                          : colors.surfaceMuted,
                        borderColor: paymentVerified
                          ? colors.primary
                          : colors.borderSubtle,
                        height: 48,
                        borderRadius: 14,
                      },
                    ]}
                    testID="quest-funding-top-up-promptpay-close"
                  >
                    <Text
                      style={[
                        s.actionButtonLabelSecondary,
                        {
                          color: paymentVerified
                            ? colors.white
                            : colors.textStrong,
                          fontSize: 14,
                          fontWeight: "700",
                        },
                      ]}
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
