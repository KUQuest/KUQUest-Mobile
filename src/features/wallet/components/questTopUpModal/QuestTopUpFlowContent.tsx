import { ArrowLeft, ShieldCheck, X } from "lucide-react-native";
import { Image, Pressable, ScrollView, Text, TextInput, View } from "@/tw";
import type { TopUpData, TopUpQuote } from "@/api/WalletApi";
import { formatSatang } from "@/domain/satang";
import type { SupportedLocale } from "@/locales/locale";
import { questBoardMessages } from "@/locales/questBoardMessages";
import { useAppTheme } from "@/features/workspace/AppThemeProvider";
import { spacing } from "@/theme/spacing";
import { checkTopUpAmount } from "@/features/wallet/walletModule";
import { formatTopUpExpiry } from "../../walletFormatting";
import { questTopUpLayout } from "./questTopUpStyles";
import type { QuestTopUpStep } from "./types";

const QUICK_TOP_UP_AMOUNTS = [100, 500, 1000, 2000] as const;

interface QuestTopUpFlowContentProps {
  locale: SupportedLocale;
  step: QuestTopUpStep;
  amount: string;
  quote?: TopUpQuote | null;
  topUp?: TopUpData | null;
  paymentVerified?: boolean;
  isConfirming?: boolean;
  isVerifying?: boolean;
  verificationError?: string | null;
  onAmountChange: (amount: string) => void;
  onBack: () => void;
  onClose: () => void;
  onContinue: () => void;
  onConfirm: () => void;
  onVerifyPayment?: () => void;
  onSimulatePayment?: () => void;
}

export function QuestTopUpFlowContent({
  locale,
  step,
  amount,
  quote,
  topUp,
  paymentVerified = false,
  isVerifying = false,
  isConfirming = false,
  verificationError = null,
  onAmountChange,
  onBack,
  onClose,
  onContinue,
  onConfirm,
  onVerifyPayment,
  onSimulatePayment,
}: QuestTopUpFlowContentProps) {
  const messages = questBoardMessages[locale];
  const { colors } = useAppTheme();
  const amountValid = checkTopUpAmount(amount).ok;
  const title =
    step === "confirmation"
      ? messages.topUpConfirmationTitle
      : step === "promptPay"
        ? messages.topUpPromptPayTitle
        : messages.topUpTitle;

  return (
    <View
      accessibilityViewIsModal
      style={questTopUpLayout.topUpFlowContent}
      testID="quest-funding-top-up-flow"
    >
      <View
        style={[questTopUpLayout.modalHeader, { marginBottom: spacing.md }]}
      >
        <Pressable
          accessibilityLabel={messages.topUpBack}
          accessibilityRole="button"
          accessibilityState={{ disabled: isConfirming }}
          disabled={isConfirming}
          style={questTopUpLayout.modalBackButton}
          onPress={onBack}
          testID="quest-funding-top-up-back"
        >
          <ArrowLeft
            accessible={false}
            color={colors.textStrong}
            size={21}
            strokeWidth={2.2}
          />
        </Pressable>
        <View
          style={[
            questTopUpLayout.modalHeaderCopy,
            { alignItems: "center", marginLeft: spacing.px0 },
          ]}
        >
          <Text
            accessibilityRole="header"
            style={[questTopUpLayout.modalTitle, { color: colors.textStrong }]}
          >
            {title}
          </Text>
        </View>
        <Pressable
          accessibilityLabel={messages.close}
          accessibilityRole="button"
          style={questTopUpLayout.modalCloseButton}
          onPress={onClose}
          testID="quest-funding-top-up-close"
        >
          <X
            accessible={false}
            color={colors.textStrong}
            size={22}
            strokeWidth={2.3}
          />
        </Pressable>
      </View>

      <ScrollView
        contentContainerClassName={questTopUpLayout.topUpContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        className={`${questTopUpLayout.modalScroll} ${questTopUpLayout.topUpScroll}`}
      >
        {step === "amount" ? (
          <>
            <View style={questTopUpLayout.flowIntro}>
              <Text
                style={[
                  questTopUpLayout.flowTitle,
                  { color: colors.textStrong },
                ]}
              >
                {messages.topUpAmountTitle}
              </Text>
              <Text
                style={[
                  questTopUpLayout.flowDescription,
                  { color: colors.textSecondary },
                ]}
              >
                {messages.topUpAmountDescription}
              </Text>
            </View>
            <Text
              style={[
                questTopUpLayout.amountLabel,
                { color: colors.textSecondary },
              ]}
            >
              {messages.topUpAmountLabel}
            </Text>
            <View
              style={[
                questTopUpLayout.amountField,
                {
                  backgroundColor: colors.surfaceSubtle,
                  borderColor: colors.borderSubtle,
                },
              ]}
            >
              <Text
                style={[
                  questTopUpLayout.amountCurrency,
                  { color: colors.hirer },
                ]}
              >
                ฿
              </Text>
              <TextInput
                accessibilityLabel={messages.topUpAmountLabel}
                keyboardType="number-pad"
                maxLength={7}
                onChangeText={(value) =>
                  onAmountChange(value.replace(/[^0-9]/g, ""))
                }
                placeholder="0"
                placeholderTextColor={colors.textMuted}
                returnKeyType="done"
                style={[
                  questTopUpLayout.amountInput,
                  { color: colors.textStrong },
                ]}
                testID="quest-funding-top-up-amount"
                value={amount}
              />
            </View>
            <View
              accessibilityLabel={messages.topUpAmountLabel}
              accessibilityRole="toolbar"
              style={questTopUpLayout.quickAmounts}
            >
              {QUICK_TOP_UP_AMOUNTS.map((quickAmount) => {
                const selected = amount === String(quickAmount);
                return (
                  <Pressable
                    accessibilityLabel={messages.topUpQuickAmountLabel(
                      quickAmount
                    )}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    style={[
                      questTopUpLayout.quickAmount,
                      {
                        backgroundColor: selected
                          ? colors.surfaceAccent
                          : colors.surface,
                        borderColor: selected
                          ? colors.borderAccent
                          : colors.borderSubtle,
                      },
                    ]}
                    key={quickAmount}
                    onPress={() => onAmountChange(String(quickAmount))}
                    testID={`quest-funding-top-up-quick-${quickAmount}`}
                  >
                    <Text
                      style={[
                        questTopUpLayout.quickAmountText,
                        {
                          color: selected ? colors.hirer : colors.textStrong,
                        },
                      ]}
                    >
                      {formatSatang(quickAmount * 100, locale)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <Pressable
              accessibilityLabel={messages.topUpContinue}
              accessibilityRole="button"
              accessibilityState={{ disabled: !amountValid }}
              disabled={!amountValid}
              style={[
                questTopUpLayout.continueButton,
                {
                  backgroundColor: amountValid
                    ? colors.hirer
                    : colors.surfaceMuted,
                  borderColor: amountValid ? colors.hirer : colors.borderMuted,
                },
                !amountValid && questTopUpLayout.continueButtonDisabled,
              ]}
              onPress={onContinue}
              testID="quest-funding-top-up-continue"
            >
              <Text
                className={`font-ku-semibold text-[15px] leading-[22px] ${
                  amountValid ? "text-ku-on-hirer" : "text-ku-text-muted"
                }`}
              >
                {messages.topUpContinue}
              </Text>
            </Pressable>
          </>
        ) : null}

        {step === "confirmation" && quote ? (
          <View testID="quest-funding-top-up-confirmation">
            <View style={questTopUpLayout.flowIntro}>
              <Text
                style={[
                  questTopUpLayout.flowTitle,
                  { color: colors.textStrong },
                ]}
              >
                {messages.topUpConfirmationTitle}
              </Text>
              <Text
                style={[
                  questTopUpLayout.flowDescription,
                  { color: colors.textSecondary },
                ]}
              >
                {messages.topUpAmountDescription}
              </Text>
            </View>
            <View
              style={[
                questTopUpLayout.promptPayCard,
                {
                  backgroundColor: colors.surfaceSubtle,
                  borderColor: colors.borderSubtle,
                  gap: spacing.px12,
                },
              ]}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                }}
              >
                <Text className="text-ku-text-secondary">
                  {messages.topUpCredit}
                </Text>
                <Text className="font-ku-bold text-ku-text-strong">
                  {formatSatang(quote.creditSatang, locale, "exact")}
                </Text>
              </View>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                }}
              >
                <Text className="text-ku-text-secondary">
                  {messages.topUpFee}
                </Text>
                <Text className="text-ku-text-strong">
                  {formatSatang(quote.chargedFeeSatang, locale, "exact")}
                </Text>
              </View>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                }}
              >
                <Text className="text-ku-text-secondary">
                  {messages.topUpTax}
                </Text>
                <Text className="text-ku-text-strong">
                  {formatSatang(quote.chargedTaxSatang, locale, "exact")}
                </Text>
              </View>
              <View
                className="border-t-ku-border-subtle"
                style={{
                  borderTopWidth: 1,
                  flexDirection: "row",
                  justifyContent: "space-between",
                  paddingTop: spacing.px12,
                }}
              >
                <Text className="font-ku-bold text-ku-text-strong">
                  {messages.topUpPaymentTotal}
                </Text>
                <Text className="font-ku-bold text-[18px] text-ku-text-strong">
                  {formatSatang(quote.paymentTotalSatang, locale, "exact")}
                </Text>
              </View>
            </View>
            <Text className="mt-ku-12 text-[12px] text-ku-text-muted">
              {messages.topUpExpiresAt}:{" "}
              {formatTopUpExpiry(quote.expiresAt, locale)}
            </Text>
            {verificationError ? (
              <View
                className="mt-ku-10 rounded-[12px] border border-ku-border-danger bg-ku-surface-danger p-ku-12"
                testID="quest-funding-verify-error"
              >
                <Text className="font-ku-medium text-[12px] text-ku-danger-dark">
                  {verificationError}
                </Text>
              </View>
            ) : null}
            <Pressable
              accessibilityLabel={messages.topUpConfirm}
              accessibilityRole="button"
              disabled={isConfirming}
              style={[
                questTopUpLayout.continueButton,
                {
                  backgroundColor: colors.hirer,
                  borderColor: colors.hirer,
                },
                isConfirming && questTopUpLayout.continueButtonDisabled,
              ]}
              onPress={onConfirm}
              testID="quest-funding-top-up-confirm"
            >
              <Text className="font-ku-semibold text-[15px] leading-[22px] text-ku-on-hirer">
                {messages.topUpConfirm}
              </Text>
            </Pressable>
          </View>
        ) : null}

        {step === "promptPay" ? (
          <>
            <View style={questTopUpLayout.flowIntro}>
              <Text
                style={[
                  questTopUpLayout.flowTitle,
                  { color: colors.textStrong },
                ]}
              >
                {messages.topUpPromptPayTitle}
              </Text>
              <Text
                style={[
                  questTopUpLayout.flowDescription,
                  { color: colors.textSecondary },
                ]}
              >
                {messages.topUpPromptPayDescription}
              </Text>
            </View>
            <View
              style={[
                questTopUpLayout.promptPayCard,
                {
                  backgroundColor: colors.surfaceSubtle,
                  borderColor: colors.borderSubtle,
                },
              ]}
              testID="quest-funding-top-up-promptpay"
            >
              <View
                accessible
                accessibilityLabel={`${messages.topUpPromptPayTitle}. ${messages.topUpPaymentTotal}: ${formatSatang(topUp!.paymentTotalSatang, locale, "exact")}`}
                accessibilityRole="image"
                style={[
                  questTopUpLayout.qrFrame,
                  { backgroundColor: colors.white },
                ]}
                testID="quest-funding-top-up-promptpay-qr"
              >
                {topUp!.qrDataUrl ? (
                  <Image
                    source={{ uri: topUp!.qrDataUrl }}
                    style={{ width: 168, height: 168 }}
                    resizeMode="contain"
                  />
                ) : (
                  <Text className="text-ku-text-muted">
                    {messages.topUpPromptPayQrUnavailable}
                  </Text>
                )}
              </View>
              <Text
                style={[
                  questTopUpLayout.promptPayPrototype,
                  { color: colors.textMuted },
                ]}
              >
                {topUp!.qrDataUrl
                  ? messages.topUpPromptPayDescription
                  : messages.topUpPromptPayQrUnavailable}
              </Text>
              <View
                style={[
                  questTopUpLayout.promptPayAmount,
                  { borderTopColor: colors.borderSubtle },
                ]}
              >
                <Text
                  style={[
                    questTopUpLayout.promptPayAmountLabel,
                    { color: colors.textSecondary },
                  ]}
                >
                  {messages.topUpPaymentTotal}
                </Text>
                <Text
                  selectable
                  style={[
                    questTopUpLayout.promptPayAmountValue,
                    { color: colors.textStrong },
                  ]}
                >
                  {formatSatang(topUp!.paymentTotalSatang, locale, "exact")}
                </Text>
              </View>
            </View>
            {paymentVerified ? (
              <View
                className="mt-ku-12 flex-row items-center gap-ku-12 rounded-[16px] border border-ku-border-success bg-ku-surface-success p-ku-md"
                testID="quest-funding-verified-badge"
              >
                <ShieldCheck
                  color={colors.success}
                  size={24}
                  strokeWidth={2.2}
                />
                <View className="flex-1">
                  <Text className="font-ku-bold text-[14px] text-ku-text-strong">
                    {messages.topUpPaymentVerified}
                  </Text>
                  <Text className="font-ku-regular text-[12px] text-ku-text-secondary">
                    {messages.topUpPaymentCredited(
                      formatSatang(topUp!.creditSatang, locale, "exact")
                    )}
                  </Text>
                </View>
              </View>
            ) : null}

            {verificationError ? (
              <View
                className="mt-ku-10 rounded-[12px] border border-ku-border-danger bg-ku-surface-danger p-ku-12"
                testID="quest-funding-verify-error"
              >
                <Text className="font-ku-medium text-[12px] text-ku-danger-dark">
                  {verificationError}
                </Text>
              </View>
            ) : null}

            <View style={{ gap: spacing.px10, marginTop: spacing.px12 }}>
              {!paymentVerified ? (
                <Pressable
                  accessibilityLabel={messages.topUpVerifyPayment}
                  accessibilityRole="button"
                  style={[
                    questTopUpLayout.continueButton,
                    {
                      backgroundColor: colors.surfaceSuccess,
                      borderColor: colors.borderSuccess,
                      marginTop: spacing.px0,
                    },
                    isVerifying && questTopUpLayout.continueButtonDisabled,
                  ]}
                  disabled={isVerifying}
                  onPress={onVerifyPayment}
                  testID="quest-funding-top-up-verify-payment"
                >
                  <Text
                    style={[
                      questTopUpLayout.continueButtonText,
                      { color: colors.success },
                    ]}
                  >
                    {isVerifying
                      ? messages.topUpVerifyingPayment
                      : messages.topUpVerifyPayment}
                  </Text>
                </Pressable>
              ) : null}

              {__DEV__ && !paymentVerified ? (
                <Pressable
                  accessibilityLabel={messages.topUpSimulateDev}
                  accessibilityRole="button"
                  disabled={isVerifying}
                  style={[
                    questTopUpLayout.continueButton,
                    {
                      backgroundColor: colors.surfaceMuted,
                      borderColor: colors.borderMuted,
                      marginTop: spacing.px0,
                    },
                    isVerifying && questTopUpLayout.continueButtonDisabled,
                  ]}
                  onPress={onSimulatePayment}
                  testID="quest-funding-top-up-simulate-dev"
                >
                  <Text
                    style={[
                      questTopUpLayout.continueButtonText,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {messages.topUpSimulateDev}
                  </Text>
                </Pressable>
              ) : null}

              <Pressable
                accessibilityLabel={messages.topUpClose}
                accessibilityRole="button"
                style={[
                  questTopUpLayout.continueButton,
                  {
                    backgroundColor: colors.hirer,
                    borderColor: colors.hirer,
                    marginTop: spacing.px0,
                  },
                ]}
                onPress={onClose}
                testID="quest-funding-top-up-promptpay-close"
              >
                <Text className="font-ku-semibold text-[15px] leading-[22px] text-ku-on-hirer">
                  {paymentVerified ? messages.topUpDone : messages.topUpClose}
                </Text>
              </Pressable>
            </View>
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}
