import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  QrCode,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Wallet,
} from "lucide-react-native";
import { type TopUpData, type TopUpQuote } from "@/api/WalletApi";
import { ScreenLayout } from "@/components/layout/ScreenLayout";
import { formatSatang } from "@/domain/satang";
import { useLocale, type SupportedLocale } from "@/locales/LocaleProvider";
import { walletMessages } from "@/locales/walletMessages";
import { colors } from "@/theme/colors";
import { fontFamily } from "@/theme/typography";
import {
  checkTopUpAmount,
  checkTopUpPayment,
  createTopUpFromQuote,
  requestTopUpQuote,
  simulateTopUpPayment,
} from "./walletModule";

const QUICK_AMOUNTS = [100, 300, 500, 1000, 2000] as const;

function formatExpiry(expiresAt: string, locale: SupportedLocale): string {
  const date = new Date(expiresAt);
  if (Number.isNaN(date.getTime())) return expiresAt;
  return new Intl.DateTimeFormat(locale === "th" ? "th-TH" : "en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default function TopUpScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { locale } = useLocale();
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
                ? "ขั้นตอนที่ 1/3 • ระบุจำนวนเงิน"
                : step === "confirmation"
                  ? "ขั้นตอนที่ 2/3 • ยืนยันข้อมูล"
                  : "ขั้นตอนที่ 3/3 • สแกนชำระเงิน"}
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
            /* Step 1: Amount Selection */
            <View testID="top-up-amount-step">
              {/* Header card */}
              <View style={styles.bannerCard}>
                <View style={styles.bannerIconWrap}>
                  <Wallet
                    color={colors.primaryDeep}
                    size={22}
                    strokeWidth={2.4}
                  />
                </View>
                <View style={styles.bannerTextWrap}>
                  <Text style={styles.bannerTitle}>{m.topUpTitle}</Text>
                  <Text style={styles.bannerDesc}>
                    {m.topUpAmountDescription}
                  </Text>
                </View>
              </View>

              {/* Amount Input */}
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionLabel}>{m.enterAmount}</Text>
                <View
                  style={[
                    styles.inputContainer,
                    error ? styles.inputContainerError : null,
                  ]}
                >
                  <Text style={styles.inputPrefix}>฿</Text>
                  <TextInput
                    accessibilityLabel={m.enterAmount}
                    autoFocus={false}
                    keyboardType="numeric"
                    onChangeText={updateAmount}
                    placeholder="0"
                    placeholderTextColor={colors.textMuted}
                    style={styles.amountInput}
                    testID="top-up-amount-input"
                    value={amountStr}
                  />
                  {amountStr.length > 0 ? (
                    <TouchableOpacity
                      accessibilityLabel="ล้าง"
                      onPress={() => updateAmount("")}
                      style={styles.clearBtn}
                    >
                      <Text style={styles.clearBtnText}>✕</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>

                {error ? (
                  <View style={styles.errorBanner}>
                    <AlertCircle color={colors.danger} size={15} />
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                ) : (
                  <Text style={styles.helperText}>{m.minTopUpHint}</Text>
                )}
              </View>

              {/* Quick Amount Chips */}
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionLabel}>เลือกจำนวนเงินด่วน</Text>
                <View style={styles.quickGrid}>
                  {QUICK_AMOUNTS.map((amt) => {
                    const isSelected = amountStr === String(amt);
                    return (
                      <TouchableOpacity
                        accessibilityLabel={`เติมเงิน ${amt} บาท`}
                        accessibilityRole="button"
                        activeOpacity={0.7}
                        key={amt}
                        onPress={() => handleSelectQuick(amt)}
                        style={[
                          styles.quickChip,
                          isSelected ? styles.quickChipSelected : null,
                        ]}
                        testID={`top-up-quick-${amt}`}
                      >
                        <Text
                          style={[
                            styles.quickChipText,
                            isSelected ? styles.quickChipTextSelected : null,
                          ]}
                        >
                          ฿{amt.toLocaleString("en-US")}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Safety & Info Callout */}
              <View style={styles.infoCallout}>
                <ShieldCheck
                  color={colors.primaryDeep}
                  size={18}
                  strokeWidth={2.4}
                />
                <Text style={styles.infoCalloutText}>
                  ยอดเงินที่เติมจะเข้าสู่ยอดเงินพร้อมใช้ของคุณทันทีหลังจากชำระเงินผ่าน
                  PromptPay สำเร็จ และใช้จ้างงานได้ทันที
                </Text>
              </View>

              {/* Continue Button */}
              <TouchableOpacity
                accessibilityLabel={m.continue}
                accessibilityRole="button"
                activeOpacity={0.8}
                disabled={!isAmountValid || loading}
                onPress={handleContinue}
                style={[
                  styles.primaryActionButton,
                  !isAmountValid || loading
                    ? styles.primaryButtonDisabled
                    : null,
                ]}
                testID="top-up-continue-btn"
              >
                {loading ? (
                  <ActivityIndicator color={colors.white} size="small" />
                ) : (
                  <Text style={styles.primaryActionButtonText}>
                    {m.continue}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          ) : step === "confirmation" && quote ? (
            /* Step 2: Quote Confirmation */
            <View testID="top-up-confirmation-step">
              <View style={styles.summaryCard}>
                <View style={styles.summaryHeader}>
                  <Text style={styles.summaryTitle}>
                    {m.topUpConfirmationTitle}
                  </Text>
                  <Text style={styles.summarySubtitle}>
                    ตรวจสอบรายละเอียดก่อนสร้าง PromptPay QR
                  </Text>
                </View>

                {/* Breakdown Rows */}
                <View style={styles.breakdownTable}>
                  <View style={styles.breakdownRow}>
                    <Text style={styles.breakdownLabel}>{m.topUpCredit}</Text>
                    <Text style={styles.breakdownValue}>
                      {formatSatang(quote.creditSatang, locale, "exact")}
                    </Text>
                  </View>

                  <View style={styles.breakdownRow}>
                    <Text style={styles.breakdownLabel}>{m.topUpFee}</Text>
                    <Text style={styles.breakdownValueMuted}>
                      {formatSatang(quote.chargedFeeSatang, locale, "exact")}
                    </Text>
                  </View>

                  <View style={styles.breakdownRow}>
                    <Text style={styles.breakdownLabel}>{m.topUpTax}</Text>
                    <Text style={styles.breakdownValueMuted}>
                      {formatSatang(quote.chargedTaxSatang, locale, "exact")}
                    </Text>
                  </View>

                  <View style={styles.breakdownDivider} />

                  <View style={styles.breakdownTotalRow}>
                    <Text style={styles.breakdownTotalLabel}>
                      {m.topUpPaymentTotal}
                    </Text>
                    <Text
                      style={styles.breakdownTotalValue}
                      testID="top-up-payment-total"
                    >
                      {formatSatang(quote.paymentTotalSatang, locale, "exact")}
                    </Text>
                  </View>
                </View>

                {/* Expiry Note */}
                <View style={styles.expiryRow}>
                  <Clock color={colors.textMuted} size={14} />
                  <Text style={styles.expiryText}>
                    {m.topUpExpiresAt}: {formatExpiry(quote.expiresAt, locale)}
                  </Text>
                </View>
              </View>

              {error ? (
                <View style={styles.errorBanner}>
                  <AlertCircle color={colors.danger} size={15} />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              {/* Confirm and Generate QR Button */}
              <TouchableOpacity
                accessibilityLabel={m.topUpConfirm}
                accessibilityRole="button"
                activeOpacity={0.8}
                disabled={loading}
                onPress={handleConfirm}
                style={styles.primaryActionButton}
                testID="top-up-confirm-btn"
              >
                {loading ? (
                  <ActivityIndicator color={colors.white} size="small" />
                ) : (
                  <Text style={styles.primaryActionButtonText}>
                    {m.topUpConfirm}
                  </Text>
                )}
              </TouchableOpacity>

              {/* Edit Amount Secondary Button */}
              <TouchableOpacity
                accessibilityLabel="แก้ไขจำนวนเงิน"
                accessibilityRole="button"
                activeOpacity={0.7}
                disabled={loading}
                onPress={() => setStep("amount")}
                style={styles.secondaryButton}
                testID="top-up-edit-amount-btn"
              >
                <Text style={styles.secondaryButtonText}>แก้ไขจำนวนเงิน</Text>
              </TouchableOpacity>
            </View>
          ) : activeTopUp ? (
            /* Step 3: PromptPay QR Presentation */
            <View
              style={styles.promptPayContainer}
              testID="top-up-promptpay-step"
            >
              <Text style={styles.promptPayDesc}>
                {m.topUpPromptPayDescription}
              </Text>

              {/* QR Code Container */}
              <View style={styles.qrCard}>
                <View style={styles.qrHeader}>
                  <Text style={styles.qrHeaderPromptPay}>PromptPay</Text>
                  <Text style={styles.qrHeaderSubtitle}>สแกนเพื่อชำระเงิน</Text>
                </View>

                <View style={styles.qrImageWrapper}>
                  {activeTopUp.qrDataUrl ? (
                    <Image
                      resizeMode="contain"
                      source={{ uri: activeTopUp.qrDataUrl }}
                      style={styles.qrImage}
                    />
                  ) : (
                    <View style={styles.qrPlaceholder}>
                      <QrCode
                        color={colors.primary}
                        size={120}
                        strokeWidth={1.8}
                      />
                      <Text style={styles.qrPlaceholderText}>
                        PromptPay QR Code
                      </Text>
                    </View>
                  )}
                </View>

                {/* Amount to Pay */}
                <View style={styles.qrAmountBox}>
                  <Text style={styles.qrAmountLabel}>
                    {m.topUpPaymentTotal}
                  </Text>
                  <Text
                    style={styles.qrAmountValue}
                    testID="top-up-qr-amount-value"
                  >
                    {formatSatang(
                      activeTopUp.paymentTotalSatang,
                      locale,
                      "exact"
                    )}
                  </Text>
                </View>
              </View>

              {/* Status Message / Verification Badge */}
              {paymentVerified ? (
                <View
                  style={styles.verifiedCard}
                  testID="top-up-verified-badge"
                >
                  <CheckCircle2
                    color={colors.success}
                    size={28}
                    strokeWidth={2.4}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.verifiedTitle}>
                      {m.paymentVerified}
                    </Text>
                    <Text style={styles.verifiedDesc}>
                      {m.paymentCredited(
                        formatSatang(activeTopUp.creditSatang, locale, "exact")
                      )}
                    </Text>
                  </View>
                </View>
              ) : statusMessage ? (
                <View style={styles.statusBanner}>
                  <Text style={styles.statusBannerText}>{statusMessage}</Text>
                </View>
              ) : null}

              {/* Payment Action Controls */}
              {paymentVerified ? (
                <TouchableOpacity
                  accessibilityLabel={m.done}
                  accessibilityRole="button"
                  activeOpacity={0.8}
                  onPress={handleFinish}
                  style={styles.primaryActionButton}
                  testID="top-up-done-btn"
                >
                  <Text style={styles.primaryActionButtonText}>{m.done}</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.promptPayActions}>
                  {/* Verify Status Button */}
                  <TouchableOpacity
                    accessibilityLabel={m.checkStatus}
                    accessibilityRole="button"
                    activeOpacity={0.8}
                    disabled={checkingStatus}
                    onPress={handleVerifyPayment}
                    style={styles.checkStatusButton}
                    testID="top-up-check-status-btn"
                  >
                    {checkingStatus ? (
                      <ActivityIndicator color={colors.white} size="small" />
                    ) : (
                      <>
                        <RefreshCw color={colors.white} size={16} />
                        <Text style={styles.checkStatusButtonText}>
                          {m.checkStatus}
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>

                  {/* Dev / Test Simulation Button */}
                  {__DEV__ ? (
                    <TouchableOpacity
                      accessibilityLabel={m.simulateSuccess}
                      accessibilityRole="button"
                      activeOpacity={0.7}
                      disabled={checkingStatus}
                      onPress={handleSimulatePayment}
                      style={styles.simulateButton}
                      testID="top-up-simulate-btn"
                    >
                      <Sparkles color={colors.primaryDeep} size={15} />
                      <Text style={styles.simulateButtonText}>
                        {m.simulateSuccess}
                      </Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              )}
            </View>
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
  bannerCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: colors.surfaceAccent,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.borderAccent,
    padding: 16,
    marginBottom: 20,
  },
  bannerIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surfaceSuccess,
    alignItems: "center",
    justifyContent: "center",
  },
  bannerTextWrap: {
    flex: 1,
  },
  bannerTitle: {
    fontFamily: fontFamily.bold,
    fontSize: 15,
    color: colors.primaryDeep,
    marginBottom: 2,
  },
  bannerDesc: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  sectionContainer: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontFamily: fontFamily.semiBold,
    fontSize: 14,
    color: colors.textStrong,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 60,
  },
  inputContainerError: {
    borderColor: colors.danger,
  },
  inputPrefix: {
    fontFamily: fontFamily.bold,
    fontSize: 22,
    color: colors.textStrong,
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontFamily: fontFamily.bold,
    fontSize: 24,
    color: colors.textStrong,
    paddingVertical: 0,
  },
  clearBtn: {
    padding: 6,
  },
  clearBtnText: {
    fontFamily: fontFamily.bold,
    fontSize: 14,
    color: colors.textMuted,
  },
  helperText: {
    fontFamily: fontFamily.medium,
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 6,
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.surfaceDanger,
    borderRadius: 10,
    padding: 10,
    marginTop: 8,
  },
  errorText: {
    fontFamily: fontFamily.medium,
    fontSize: 12,
    color: colors.danger,
    flex: 1,
  },
  quickGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  quickChip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    alignItems: "center",
    justifyContent: "center",
  },
  quickChipSelected: {
    backgroundColor: colors.surfaceAccent,
    borderColor: colors.primary,
    borderWidth: 1.5,
  },
  quickChipText: {
    fontFamily: fontFamily.semiBold,
    fontSize: 13,
    color: colors.textSecondary,
  },
  quickChipTextSelected: {
    color: colors.primaryDeep,
    fontFamily: fontFamily.bold,
  },
  infoCallout: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: colors.surfaceSuccess,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.borderSuccess,
    padding: 14,
    marginBottom: 24,
  },
  infoCalloutText: {
    flex: 1,
    fontFamily: fontFamily.regular,
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  primaryActionButton: {
    backgroundColor: colors.primaryDeep,
    borderRadius: 16,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.primaryDeep,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  primaryButtonDisabled: {
    backgroundColor: colors.textMuted,
    shadowOpacity: 0,
    elevation: 0,
  },
  primaryActionButtonText: {
    fontFamily: fontFamily.bold,
    fontSize: 16,
    color: colors.white,
  },
  secondaryButton: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 16,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  secondaryButtonText: {
    fontFamily: fontFamily.medium,
    fontSize: 14,
    color: colors.textSecondary,
  },
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    padding: 18,
    marginBottom: 20,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryHeader: {
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
    paddingBottom: 12,
  },
  summaryTitle: {
    fontFamily: fontFamily.bold,
    fontSize: 16,
    color: colors.textStrong,
    marginBottom: 2,
  },
  summarySubtitle: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    color: colors.textSecondary,
  },
  breakdownTable: {
    gap: 12,
  },
  breakdownRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  breakdownLabel: {
    fontFamily: fontFamily.medium,
    fontSize: 13,
    color: colors.textSecondary,
  },
  breakdownValue: {
    fontFamily: fontFamily.semiBold,
    fontSize: 14,
    color: colors.textStrong,
  },
  breakdownValueMuted: {
    fontFamily: fontFamily.regular,
    fontSize: 13,
    color: colors.textMuted,
  },
  breakdownDivider: {
    height: 1,
    backgroundColor: colors.borderSubtle,
    marginVertical: 4,
  },
  breakdownTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 4,
  },
  breakdownTotalLabel: {
    fontFamily: fontFamily.bold,
    fontSize: 15,
    color: colors.textStrong,
  },
  breakdownTotalValue: {
    fontFamily: fontFamily.bold,
    fontSize: 20,
    color: colors.primaryDeep,
  },
  expiryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
  expiryText: {
    fontFamily: fontFamily.regular,
    fontSize: 11,
    color: colors.textMuted,
  },
  promptPayContainer: {
    alignItems: "center",
  },
  promptPayDesc: {
    fontFamily: fontFamily.regular,
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: 16,
    paddingHorizontal: 12,
  },
  qrCard: {
    width: "100%",
    backgroundColor: colors.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    alignItems: "center",
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  qrHeader: {
    alignItems: "center",
    marginBottom: 16,
  },
  qrHeaderPromptPay: {
    fontFamily: fontFamily.bold,
    fontSize: 18,
    color: "#003417",
    letterSpacing: 0.5,
  },
  qrHeaderSubtitle: {
    fontFamily: fontFamily.medium,
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  qrImageWrapper: {
    width: 220,
    height: 220,
    borderRadius: 16,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    marginBottom: 16,
  },
  qrImage: {
    width: 200,
    height: 200,
  },
  qrPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  qrPlaceholderText: {
    fontFamily: fontFamily.medium,
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 8,
  },
  qrAmountBox: {
    alignItems: "center",
  },
  qrAmountLabel: {
    fontFamily: fontFamily.medium,
    fontSize: 12,
    color: colors.textSecondary,
  },
  qrAmountValue: {
    fontFamily: fontFamily.bold,
    fontSize: 26,
    color: colors.textStrong,
    marginTop: 2,
  },
  verifiedCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    width: "100%",
    backgroundColor: colors.surfaceSuccess,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderSuccess,
    padding: 16,
    marginBottom: 20,
  },
  verifiedTitle: {
    fontFamily: fontFamily.bold,
    fontSize: 14,
    color: colors.success,
    marginBottom: 2,
  },
  verifiedDesc: {
    fontFamily: fontFamily.medium,
    fontSize: 12,
    color: colors.textSecondary,
  },
  statusBanner: {
    width: "100%",
    backgroundColor: colors.surfaceMuted,
    borderRadius: 12,
    padding: 12,
    marginBottom: 18,
    alignItems: "center",
  },
  statusBannerText: {
    fontFamily: fontFamily.medium,
    fontSize: 13,
    color: colors.textSecondary,
  },
  promptPayActions: {
    width: "100%",
    gap: 10,
  },
  checkStatusButton: {
    backgroundColor: colors.primaryDeep,
    borderRadius: 16,
    height: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: colors.primaryDeep,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  checkStatusButtonText: {
    fontFamily: fontFamily.semiBold,
    fontSize: 15,
    color: colors.white,
  },
  simulateButton: {
    backgroundColor: colors.surfaceSuccess,
    borderRadius: 16,
    height: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: colors.borderSuccess,
  },
  simulateButtonText: {
    fontFamily: fontFamily.medium,
    fontSize: 13,
    color: colors.primaryDeep,
  },
});
