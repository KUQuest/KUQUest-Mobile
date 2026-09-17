import { Modal, StyleSheet, useColorScheme } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useState } from "react";
import { useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ArrowLeft,
  ArrowUpRight,
  ChevronDown,
  Info,
  Plus,
  ReceiptText,
  ShieldCheck,
  WalletCards,
  X,
} from "lucide-react-native";

import { Image, Pressable, ScrollView, Text, TextInput, View } from "@/tw";
import {
  walletApi,
  type TopUpData,
  type TopUpQuote,
  type WalletBalances,
} from "@/api/WalletApi";
import { formatSatang } from "@/domain/satang";
import {
  checkTopUpAmount,
  checkTopUpPayment,
  createTopUpFromQuote,
  requestTopUpQuote,
  simulateTopUpPayment,
  toCompartments,
} from "@/features/wallet/walletModule";
import type { SupportedLocale } from "@/locales/LocaleProvider";
import { questBoardMessages } from "@/locales/questBoardMessages";
import { colors } from "@/theme/colors";
import { spacing } from "@/theme/spacing";
import { fontFamily } from "@/theme/typography";

type FundingModalKind = "details" | "topUp";
type TopUpStep = "amount" | "confirmation" | "promptPay";

const QUICK_TOP_UP_AMOUNTS = [100, 500, 1000, 2000] as const;

function formatExpiry(expiresAt: string, locale: SupportedLocale): string {
  const date = new Date(expiresAt);
  if (Number.isNaN(date.getTime())) return expiresAt;
  return new Intl.DateTimeFormat(locale === "th" ? "th-TH" : "en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

const fundingLayout = StyleSheet.create({
  summary: {
    marginBottom: 16,
  },
  collapsedSummary: {
    borderRadius: 16,
    borderWidth: 1,
  },
  toggle: {
    alignItems: "center",
    flexDirection: "row",
    minHeight: 64,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  icon: {
    alignItems: "center",
    justifyContent: "center",
  },
  chevron: {
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  modalOverlay: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  modalBackdrop: {
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
  modalCard: {
    borderRadius: 24,
    borderWidth: 1,
    maxHeight: "82%",
    maxWidth: 560,
    paddingHorizontal: 20,
    paddingTop: 16,
    width: "100%",
  },
  topUpSurface: {
    flex: 1,
    paddingHorizontal: 20,
    width: "100%",
  },
  topUpFlow: {
    alignSelf: "center",
    flex: 1,
    maxWidth: 640,
    width: "100%",
  },
  topUpFlowContent: {
    flex: 1,
  },
  modalContentRoot: {
    flexShrink: 1,
    width: "100%",
  },
  modalHeader: {
    alignItems: "center",
    flexDirection: "row",
    minHeight: 56,
    marginBottom: 8,
  },
  modalHeaderIcon: {
    alignItems: "center",
    borderRadius: 12,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  modalHeaderCopy: {
    flex: 1,
    minWidth: 0,
    marginLeft: 10,
  },
  modalTitle: {
    fontFamily: fontFamily.bold,
    fontSize: 20,
    lineHeight: 26,
  },
  modalCloseButton: {
    alignItems: "center",
    borderRadius: 9999,
    height: 48,
    justifyContent: "center",
    marginLeft: 8,
    width: 48,
  },
  modalBackButton: {
    alignItems: "center",
    borderRadius: 9999,
    height: 48,
    justifyContent: "center",
    marginRight: 4,
    width: 48,
  },
  modalScroll: {
    flexShrink: 1,
  },
  topUpScroll: {
    flex: 1,
  },
  modalContent: {
    gap: 12,
    paddingBottom: 4,
  },
  topUpContent: {
    gap: 16,
    paddingBottom: 24,
  },
  statusCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  statusIcon: {
    alignItems: "center",
    borderRadius: 20,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  statusValue: {
    fontFamily: fontFamily.bold,
    fontSize: 24,
    lineHeight: 30,
    marginTop: 2,
  },
  statusDescription: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 4,
  },
  reservation: {
    borderTopWidth: 1,
    marginTop: 16,
    paddingTop: 12,
  },
  actionRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 16,
  },
  actionButton: {
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: 8,
  },
  actionButtonDisabled: {
    opacity: 0.72,
  },
  information: {
    borderTopWidth: 1,
    gap: 12,
    paddingBottom: 4,
    paddingTop: 12,
  },
  informationItem: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 8,
  },
  informationIcon: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 1,
    width: 24,
  },
  flowIntro: {
    gap: 4,
  },
  flowTitle: {
    fontFamily: fontFamily.bold,
    fontSize: 20,
    lineHeight: 26,
  },
  flowDescription: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    lineHeight: 21,
  },
  amountLabel: {
    fontFamily: fontFamily.semiBold,
    fontSize: 12,
    lineHeight: 18,
  },
  amountField: {
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    minHeight: 64,
    paddingHorizontal: 16,
  },
  amountCurrency: {
    fontFamily: fontFamily.bold,
    fontSize: 24,
    lineHeight: 30,
  },
  amountInput: {
    flex: 1,
    fontFamily: fontFamily.bold,
    fontSize: 24,
    lineHeight: 30,
    minHeight: 60,
    paddingHorizontal: 8,
    textAlign: "right",
  },
  quickAmounts: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  quickAmount: {
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    flexBasis: "23%",
    flexGrow: 1,
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: 8,
  },
  quickAmountText: {
    fontFamily: fontFamily.semiBold,
    fontSize: 14,
    lineHeight: 21,
  },
  continueButton: {
    alignItems: "center",
    borderRadius: 9999,
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: 16,
  },
  continueButtonDisabled: {
    borderWidth: 1,
  },
  continueButtonText: {
    fontFamily: fontFamily.semiBold,
    fontSize: 15,
    lineHeight: 22,
  },
  promptPayCard: {
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  qrFrame: {
    alignItems: "center",
    borderRadius: 12,
    justifyContent: "center",
    padding: 12,
  },
  qrRows: {
    aspectRatio: 1,
    width: 196,
  },
  qrRow: {
    flex: 1,
    flexDirection: "row",
  },
  qrCell: {
    flex: 1,
  },
  promptPayPrototype: {
    fontFamily: fontFamily.semiBold,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 12,
    textAlign: "center",
  },
  promptPayAmount: {
    alignItems: "center",
    borderTopWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
    paddingTop: 12,
    width: "100%",
  },
  promptPayAmountLabel: {
    fontFamily: fontFamily.semiBold,
    fontSize: 13,
    lineHeight: 19,
  },
  promptPayAmountValue: {
    fontFamily: fontFamily.bold,
    fontSize: 19,
    lineHeight: 24,
  },
  promptPayNotice: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 12,
    textAlign: "center",
  },
});

interface FundingDetailsContentProps {
  locale: SupportedLocale;
  onClose: () => void;
  onTopUp: () => void;
}

function FundingDetailsContent({
  locale,
  onClose,
  onTopUp,
}: FundingDetailsContentProps) {
  const messages = questBoardMessages[locale];

  return (
    <View accessibilityViewIsModal testID="quest-funding-summary-details">
      <View style={fundingLayout.modalHeader}>
        <View
          style={[
            fundingLayout.modalHeaderIcon,
            { backgroundColor: colors.surfaceAccent },
          ]}
        >
          <WalletCards
            accessible={false}
            color={colors.primary}
            size={20}
            strokeWidth={2.2}
          />
        </View>
        <View style={fundingLayout.modalHeaderCopy}>
          <Text
            accessibilityRole="header"
            style={[fundingLayout.modalTitle, { color: colors.textStrong }]}
          >
            {messages.fundingTitle}
          </Text>
        </View>
        <Pressable
          accessibilityLabel={messages.close}
          accessibilityRole="button"
          style={fundingLayout.modalCloseButton}
          onPress={onClose}
          testID="quest-funding-summary-close"
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
        contentContainerStyle={fundingLayout.modalContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        style={fundingLayout.modalScroll}
      >
        <View
          style={[
            fundingLayout.statusCard,
            {
              backgroundColor: colors.surfaceSubtle,
              borderColor: colors.borderSubtle,
            },
          ]}
          testID="quest-funding-status-card"
        >
          <View
            accessible
            accessibilityLabel={`${messages.fundingStatusLabel}: ${messages.fundingUnavailable}. ${messages.fundingUnavailableDescription}`}
            accessibilityRole="text"
            className="flex-row items-start gap-[12px]"
            testID="quest-funding-status"
          >
            <View
              style={[
                fundingLayout.statusIcon,
                { backgroundColor: colors.surfaceAccent },
              ]}
            >
              <Info
                accessible={false}
                color={colors.primary}
                size={21}
                strokeWidth={2.2}
              />
            </View>
            <View className="flex-1 min-w-0">
              <Text className="text-ku-text-muted font-ku-semibold text-ku-label">
                {messages.fundingStatusLabel}
              </Text>
              <Text
                className="text-ku-text-strong"
                selectable
                testID="quest-funding-status-value"
                style={fundingLayout.statusValue}
              >
                {messages.fundingUnavailable}
              </Text>
              <Text
                className="text-ku-text-secondary"
                testID="quest-funding-status-description"
                style={fundingLayout.statusDescription}
              >
                {messages.fundingUnavailableDescription}
              </Text>
            </View>
          </View>
          <View
            style={[
              fundingLayout.reservation,
              { borderTopColor: colors.borderSubtle },
            ]}
            testID="quest-funding-reservation-info"
          >
            <Text className="text-ku-text-secondary font-ku-medium text-ku-label">
              {messages.fundingHeld}
            </Text>
            <Text className="text-ku-text-secondary font-ku-regular text-ku-body-small mt-[4px]">
              {messages.fundingReservationDescription}
            </Text>
          </View>
          <View style={fundingLayout.actionRow} testID="quest-funding-actions">
            <Pressable
              accessibilityLabel={messages.fundingTopUp}
              accessibilityRole="button"
              className="flex-1 flex-row items-center justify-center"
              style={[
                fundingLayout.actionButton,
                {
                  backgroundColor: colors.surfaceAccent,
                  borderColor: colors.borderAccent,
                },
              ]}
              onPress={onTopUp}
              testID="quest-funding-top-up"
            >
              <Plus
                accessible={false}
                color={colors.primary}
                size={18}
                strokeWidth={2.2}
              />
              <Text className="text-ku-primary font-ku-semibold text-ku-label ml-[4px]">
                {messages.fundingTopUp}
              </Text>
            </Pressable>
            <Pressable
              accessibilityLabel={messages.fundingTransfer}
              accessibilityRole="button"
              accessibilityState={{ disabled: true }}
              className="flex-1 flex-row items-center justify-center"
              disabled
              style={[
                fundingLayout.actionButton,
                fundingLayout.actionButtonDisabled,
                {
                  backgroundColor: colors.surfaceMuted,
                  borderColor: colors.borderMuted,
                },
              ]}
              testID="quest-funding-transfer"
            >
              <ArrowUpRight
                accessible={false}
                color={colors.textMuted}
                size={18}
                strokeWidth={2.2}
              />
              <Text className="text-ku-text-muted font-ku-semibold text-ku-label ml-[4px]">
                {messages.fundingTransfer}
              </Text>
            </Pressable>
          </View>
          <Text
            accessible
            accessibilityRole="text"
            className="text-ku-text-muted font-ku-regular text-ku-caption mt-[8px] text-center"
            testID="quest-funding-actions-unavailable"
          >
            {messages.fundingActionsUnavailable}
          </Text>
        </View>
        <View
          accessibilityRole="text"
          style={[
            fundingLayout.information,
            { borderTopColor: colors.borderSubtle },
          ]}
          testID="quest-funding-information"
        >
          <View
            style={fundingLayout.informationItem}
            testID="quest-funding-settlement-info"
          >
            <View style={fundingLayout.informationIcon}>
              <ReceiptText
                accessible={false}
                color={colors.primary}
                size={20}
                strokeWidth={2.1}
              />
            </View>
            <View className="flex-1 min-w-0">
              <Text className="text-ku-text-strong font-ku-semibold text-ku-label">
                {messages.settlement}
              </Text>
              <Text className="text-ku-text-secondary font-ku-regular text-ku-label">
                {messages.settlementDescription}
              </Text>
            </View>
          </View>
          <View
            style={fundingLayout.informationItem}
            testID="quest-funding-refund-info"
          >
            <View style={fundingLayout.informationIcon}>
              <ShieldCheck
                accessible={false}
                color={colors.primary}
                size={20}
                strokeWidth={2.1}
              />
            </View>
            <View className="flex-1 min-w-0">
              <Text className="text-ku-text-strong font-ku-semibold text-ku-label">
                {messages.refunds}
              </Text>
              <Text className="text-ku-text-secondary font-ku-regular text-ku-label">
                {messages.refundsDescription}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

interface TopUpFlowContentProps {
  locale: SupportedLocale;
  step: TopUpStep;
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

function TopUpFlowContent({
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
}: TopUpFlowContentProps) {
  const messages = questBoardMessages[locale];
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
      style={fundingLayout.topUpFlowContent}
      testID="quest-funding-top-up-flow"
    >
      <View style={[fundingLayout.modalHeader, { marginBottom: 16 }]}>
        <Pressable
          accessibilityLabel={messages.topUpBack}
          accessibilityRole="button"
          accessibilityState={{ disabled: isConfirming }}
          disabled={isConfirming}
          style={fundingLayout.modalBackButton}
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
            fundingLayout.modalHeaderCopy,
            { alignItems: "center", marginLeft: 0 },
          ]}
        >
          <Text
            accessibilityRole="header"
            style={[fundingLayout.modalTitle, { color: colors.textStrong }]}
          >
            {title}
          </Text>
        </View>
        <Pressable
          accessibilityLabel={messages.close}
          accessibilityRole="button"
          style={fundingLayout.modalCloseButton}
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
        contentContainerStyle={fundingLayout.topUpContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        style={[fundingLayout.modalScroll, fundingLayout.topUpScroll]}
      >
        {step === "amount" ? (
          <>
            <View style={fundingLayout.flowIntro}>
              <Text
                style={[fundingLayout.flowTitle, { color: colors.textStrong }]}
              >
                {messages.topUpAmountTitle}
              </Text>
              <Text
                style={[
                  fundingLayout.flowDescription,
                  { color: colors.textSecondary },
                ]}
              >
                {messages.topUpAmountDescription}
              </Text>
            </View>
            <Text
              style={[
                fundingLayout.amountLabel,
                { color: colors.textSecondary },
              ]}
            >
              {messages.topUpAmountLabel}
            </Text>
            <View
              style={[
                fundingLayout.amountField,
                {
                  backgroundColor: colors.surfaceSubtle,
                  borderColor: colors.borderSubtle,
                },
              ]}
            >
              <Text
                style={[
                  fundingLayout.amountCurrency,
                  { color: colors.primary },
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
                  fundingLayout.amountInput,
                  { color: colors.textStrong },
                ]}
                testID="quest-funding-top-up-amount"
                value={amount}
              />
            </View>
            <View
              accessibilityLabel={messages.topUpAmountLabel}
              accessibilityRole="toolbar"
              style={fundingLayout.quickAmounts}
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
                      fundingLayout.quickAmount,
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
                        fundingLayout.quickAmountText,
                        {
                          color: selected ? colors.primary : colors.textStrong,
                        },
                      ]}
                    >
                      ฿{quickAmount.toLocaleString("en-US")}
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
                fundingLayout.continueButton,
                {
                  backgroundColor: amountValid
                    ? colors.primary
                    : colors.surfaceMuted,
                  borderColor: amountValid
                    ? colors.primary
                    : colors.borderMuted,
                },
                !amountValid && fundingLayout.continueButtonDisabled,
              ]}
              onPress={onContinue}
              testID="quest-funding-top-up-continue"
            >
              <Text
                style={[
                  fundingLayout.continueButtonText,
                  { color: amountValid ? colors.white : colors.textMuted },
                ]}
              >
                {messages.topUpContinue}
              </Text>
            </Pressable>
          </>
        ) : null}

        {step === "confirmation" && quote ? (
          <View testID="quest-funding-top-up-confirmation">
            <View style={fundingLayout.flowIntro}>
              <Text
                style={[fundingLayout.flowTitle, { color: colors.textStrong }]}
              >
                {messages.topUpConfirmationTitle}
              </Text>
              <Text
                style={[
                  fundingLayout.flowDescription,
                  { color: colors.textSecondary },
                ]}
              >
                {messages.topUpAmountDescription}
              </Text>
            </View>
            <View
              style={[
                fundingLayout.promptPayCard,
                {
                  backgroundColor: colors.surfaceSubtle,
                  borderColor: colors.borderSubtle,
                  gap: 12,
                },
              ]}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                }}
              >
                <Text style={{ color: colors.textSecondary }}>
                  {messages.topUpCredit}
                </Text>
                <Text style={{ color: colors.textStrong, fontWeight: "700" }}>
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
                  {messages.topUpFee}
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
                  {messages.topUpTax}
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
                <Text style={{ color: colors.textStrong, fontWeight: "700" }}>
                  {messages.topUpPaymentTotal}
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
              style={{ color: colors.textMuted, fontSize: 12, marginTop: 12 }}
            >
              {messages.topUpExpiresAt}: {formatExpiry(quote.expiresAt, locale)}
            </Text>
            {verificationError ? (
              <View
                className="bg-ku-surface-danger border border-ku-border-danger rounded-[12px] p-[12px] mt-[10px]"
                testID="quest-funding-verify-error"
              >
                <Text className="text-ku-danger-dark font-ku-medium text-[12px]">
                  {verificationError}
                </Text>
              </View>
            ) : null}
            <Pressable
              accessibilityLabel={messages.topUpConfirm}
              accessibilityRole="button"
              disabled={isConfirming}
              style={[
                fundingLayout.continueButton,
                {
                  backgroundColor: colors.primary,
                  borderColor: colors.primary,
                },
                isConfirming && fundingLayout.continueButtonDisabled,
              ]}
              onPress={onConfirm}
              testID="quest-funding-top-up-confirm"
            >
              <Text
                style={[
                  fundingLayout.continueButtonText,
                  { color: colors.white },
                ]}
              >
                {messages.topUpConfirm}
              </Text>
            </Pressable>
          </View>
        ) : null}

        {step === "promptPay" ? (
          <>
            <View style={fundingLayout.flowIntro}>
              <Text
                style={[fundingLayout.flowTitle, { color: colors.textStrong }]}
              >
                {messages.topUpPromptPayTitle}
              </Text>
              <Text
                style={[
                  fundingLayout.flowDescription,
                  { color: colors.textSecondary },
                ]}
              >
                {messages.topUpPromptPayDescription}
              </Text>
            </View>
            <View
              style={[
                fundingLayout.promptPayCard,
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
                  fundingLayout.qrFrame,
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
                  <Text style={{ color: colors.textMuted }}>
                    {messages.topUpPromptPayQrUnavailable}
                  </Text>
                )}
              </View>
              <Text
                style={[
                  fundingLayout.promptPayPrototype,
                  { color: colors.textMuted },
                ]}
              >
                {topUp!.qrDataUrl
                  ? messages.topUpPromptPayDescription
                  : messages.topUpPromptPayQrUnavailable}
              </Text>
              <View
                style={[
                  fundingLayout.promptPayAmount,
                  { borderTopColor: colors.borderSubtle },
                ]}
              >
                <Text
                  style={[
                    fundingLayout.promptPayAmountLabel,
                    { color: colors.textSecondary },
                  ]}
                >
                  {messages.topUpPaymentTotal}
                </Text>
                <Text
                  selectable
                  style={[
                    fundingLayout.promptPayAmountValue,
                    { color: colors.textStrong },
                  ]}
                >
                  {formatSatang(topUp!.paymentTotalSatang, locale, "exact")}
                </Text>
              </View>
            </View>
            {paymentVerified ? (
              <View
                className="bg-ku-surface-success border border-ku-border-success rounded-[16px] p-[16px] flex-row items-center gap-[12px] mt-[12px]"
                testID="quest-funding-verified-badge"
              >
                <ShieldCheck
                  color={colors.success}
                  size={24}
                  strokeWidth={2.2}
                />
                <View className="flex-1">
                  <Text className="font-ku-bold text-ku-text-strong text-[14px]">
                    {messages.topUpPaymentVerified}
                  </Text>
                  <Text className="font-ku-regular text-ku-text-secondary text-[12px]">
                    {messages.topUpPaymentCredited(
                      formatSatang(topUp!.creditSatang, locale, "exact")
                    )}
                  </Text>
                </View>
              </View>
            ) : null}

            {verificationError ? (
              <View
                className="bg-ku-surface-danger border border-ku-border-danger rounded-[12px] p-[12px] mt-[10px]"
                testID="quest-funding-verify-error"
              >
                <Text className="text-ku-danger-dark font-ku-medium text-[12px]">
                  {verificationError}
                </Text>
              </View>
            ) : null}

            <View style={{ gap: 10, marginTop: 12 }}>
              {!paymentVerified ? (
                <Pressable
                  accessibilityLabel={messages.topUpVerifyPayment}
                  accessibilityRole="button"
                  style={[
                    fundingLayout.continueButton,
                    {
                      backgroundColor: colors.surfaceSuccess,
                      borderColor: colors.borderSuccess,
                      marginTop: 0,
                    },
                    isVerifying && fundingLayout.continueButtonDisabled,
                  ]}
                  disabled={isVerifying}
                  onPress={onVerifyPayment}
                  testID="quest-funding-top-up-verify-payment"
                >
                  <Text
                    style={[
                      fundingLayout.continueButtonText,
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
                    fundingLayout.continueButton,
                    {
                      backgroundColor: colors.surfaceMuted,
                      borderColor: colors.borderMuted,
                      marginTop: 0,
                    },
                    isVerifying && fundingLayout.continueButtonDisabled,
                  ]}
                  onPress={onSimulatePayment}
                  testID="quest-funding-top-up-simulate-dev"
                >
                  <Text
                    style={[
                      fundingLayout.continueButtonText,
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
                  fundingLayout.continueButton,
                  {
                    backgroundColor: colors.primary,
                    borderColor: colors.primary,
                    marginTop: 0,
                  },
                ]}
                onPress={onClose}
                testID="quest-funding-top-up-promptpay-close"
              >
                <Text
                  style={[
                    fundingLayout.continueButtonText,
                    { color: colors.white },
                  ]}
                >
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

interface TopUpFlowOptions {
  locale: SupportedLocale;
  onBackFromAmount: () => void;
  /** Invoked after a payment is verified and the wallet reloaded. */
  onPaid?: () => void;
}

function useTopUpFlow({ locale, onBackFromAmount, onPaid }: TopUpFlowOptions) {
  const messages = questBoardMessages[locale];
  const [topUpStep, setTopUpStep] = useState<TopUpStep>("amount");
  const [topUpAmount, setTopUpAmount] = useState("");
  const [liveWallet, setLiveWallet] = useState<WalletBalances | null>(null);
  const [topUpQuote, setTopUpQuote] = useState<TopUpQuote | null>(null);
  const [activeTopUp, setActiveTopUp] = useState<TopUpData | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [paymentVerified, setPaymentVerified] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(
    null
  );

  const loadWallet = useCallback(async () => {
    try {
      setLiveWallet(await walletApi.getWallet());
    } catch {
      // Keep the last successful wallet snapshot visible.
    }
  }, []);

  const resetTopUp = useCallback(() => {
    setTopUpQuote(null);
    setActiveTopUp(null);
    setPaymentVerified(false);
    setIsConfirming(false);
    setVerificationError(null);
    setTopUpStep("amount");
  }, []);

  const openTopUp = useCallback(
    (suggestedAmountSatang?: number) => {
      setTopUpAmount(
        suggestedAmountSatang && suggestedAmountSatang > 0
          ? String(Math.ceil(suggestedAmountSatang / 100))
          : ""
      );
      resetTopUp();
    },
    [resetTopUp]
  );

  const handleTopUpBack = () => {
    if (topUpStep === "amount") {
      onBackFromAmount();
      return;
    }
    resetTopUp();
  };
  const handleTopUpAmountChange = (amount: string) => {
    setTopUpAmount(amount);
    resetTopUp();
  };
  const handleTopUpContinue = async () => {
    if (topUpStep !== "amount") return;
    const check = checkTopUpAmount(
      topUpAmount,
      liveWallet ? toCompartments(liveWallet) : null
    );
    if (!check.ok) {
      setVerificationError(messages.topUpCreateError);
      return;
    }

    try {
      const quote = await requestTopUpQuote(check.satang);
      setTopUpQuote(quote);
      setVerificationError(null);
      setTopUpStep("confirmation");
    } catch (err: unknown) {
      setVerificationError(
        err instanceof Error ? err.message : messages.topUpCreateError
      );
    }
  };
  const handleTopUpConfirm = async () => {
    if (topUpStep !== "confirmation" || !topUpQuote || isConfirming) return;
    setIsConfirming(true);

    try {
      const result = await createTopUpFromQuote(topUpQuote, new Date());
      if (!result.ok) {
        setVerificationError(messages.topUpCreateError);
        return;
      }
      setActiveTopUp(result.topUp);
      setVerificationError(null);
      setTopUpStep("promptPay");
    } catch (err: unknown) {
      setVerificationError(
        err instanceof Error ? err.message : messages.topUpCreateError
      );
    } finally {
      setIsConfirming(false);
    }
  };
  const settleTopUp = async (topUp: TopUpData) => {
    setActiveTopUp(topUp);
    if (topUp.topUpStatus !== "PAID") {
      setVerificationError(messages.topUpPaymentPending);
      return;
    }
    setPaymentVerified(true);
    await loadWallet();
    onPaid?.();
  };
  const handleVerifyPayment = async () => {
    if (!activeTopUp || isVerifying) return;
    setIsVerifying(true);
    setVerificationError(null);
    try {
      await settleTopUp(await checkTopUpPayment(activeTopUp.id));
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Verification failed";
      setVerificationError(message);
    } finally {
      setIsVerifying(false);
    }
  };
  const handleSimulatePayment = async () => {
    if (!activeTopUp || isVerifying) return;
    setIsVerifying(true);
    setVerificationError(null);
    try {
      const topUp = await simulateTopUpPayment(activeTopUp.id);
      if (!topUp) return;
      await settleTopUp(topUp);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Verification failed";
      setVerificationError(message);
    } finally {
      setIsVerifying(false);
    }
  };

  return {
    topUpStep,
    topUpAmount,
    liveWallet,
    topUpQuote,
    activeTopUp,
    isConfirming,
    isVerifying,
    paymentVerified,
    verificationError,
    loadWallet,
    resetTopUp,
    openTopUp,
    handleTopUpBack,
    handleTopUpAmountChange,
    handleTopUpContinue,
    handleTopUpConfirm,
    handleVerifyPayment,
    handleSimulatePayment,
  };
}

interface FundingModalProps {
  amount: string;
  locale: SupportedLocale;
  modal: FundingModalKind;
  quote?: TopUpQuote | null;
  topUp?: TopUpData | null;
  paymentVerified?: boolean;
  isConfirming?: boolean;
  isVerifying?: boolean;
  verificationError?: string | null;
  step: TopUpStep;
  onAmountChange: (amount: string) => void;
  onBack: () => void;
  onClose: () => void;
  onContinue: () => void;
  onConfirm: () => void;
  onTopUp: () => void;
  onVerifyPayment?: () => void;
  onSimulatePayment?: () => void;
}

function FundingModal({
  amount,
  locale,
  modal,
  quote,
  topUp,
  paymentVerified,
  isConfirming,
  isVerifying,
  verificationError,
  step,
  onAmountChange,
  onBack,
  onClose,
  onContinue,
  onConfirm,
  onTopUp,
  onVerifyPayment,
  onSimulatePayment,
}: FundingModalProps) {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDetailsModal = modal === "details";
  const bottomPadding = Math.max(spacing.md, insets.bottom + spacing.sm);

  return (
    <>
      <StatusBar
        style={isDetailsModal || colorScheme === "dark" ? "light" : "dark"}
      />
      <Modal
        animationType={isDetailsModal ? "fade" : "slide"}
        key={modal}
        onRequestClose={onBack}
        statusBarTranslucent
        transparent={isDetailsModal}
        visible
      >
        {isDetailsModal ? (
          <View
            style={[
              fundingLayout.modalOverlay,
              { backgroundColor: colors.overlay },
            ]}
          >
            <Pressable
              accessible={false}
              style={fundingLayout.modalBackdrop}
              onPress={onClose}
              testID="quest-funding-summary-backdrop"
            />
            <View
              accessibilityViewIsModal
              style={[
                fundingLayout.modalCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.borderSubtle,
                  paddingBottom: spacing.md,
                },
              ]}
              testID="quest-funding-summary-modal"
            >
              <View
                style={fundingLayout.modalContentRoot}
                testID="quest-funding-summary-centered-modal"
              >
                <FundingDetailsContent
                  locale={locale}
                  onClose={onClose}
                  onTopUp={onTopUp}
                />
              </View>
            </View>
          </View>
        ) : (
          <View
            accessibilityViewIsModal
            style={[
              fundingLayout.topUpSurface,
              { backgroundColor: colors.surface },
            ]}
            testID="quest-funding-top-up-flow-modal"
          >
            <View
              accessibilityViewIsModal
              style={[
                fundingLayout.topUpFlow,
                { paddingBottom: bottomPadding, paddingTop: insets.top },
              ]}
              testID="quest-funding-top-up-full-screen-modal"
            >
              <TopUpFlowContent
                amount={amount}
                locale={locale}
                quote={quote}
                topUp={topUp}
                paymentVerified={paymentVerified}
                isConfirming={isConfirming}
                isVerifying={isVerifying}
                verificationError={verificationError}
                onAmountChange={onAmountChange}
                onBack={onBack}
                onClose={onClose}
                onContinue={onContinue}
                onConfirm={onConfirm}
                onSimulatePayment={onSimulatePayment}
                onVerifyPayment={onVerifyPayment}
                step={step}
              />
            </View>
          </View>
        )}
      </Modal>
    </>
  );
}

export function QuestFundingSummary({ locale }: { locale: SupportedLocale }) {
  const messages = questBoardMessages[locale];
  const [modal, setModal] = useState<FundingModalKind | null>(null);
  const closeFundingModal = () => {
    flow.resetTopUp();
    setModal(null);
  };
  const flow = useTopUpFlow({
    locale,
    onBackFromAmount: () => setModal("details"),
  });

  useColorScheme();

  const { loadWallet } = flow;
  useFocusEffect(
    useCallback(() => {
      void loadWallet();
      return undefined;
    }, [loadWallet])
  );

  const openFundingDetails = () => setModal("details");
  const openTopUp = () => {
    flow.openTopUp();
    setModal("topUp");
  };
  return (
    <>
      <View
        style={[
          fundingLayout.summary,
          fundingLayout.collapsedSummary,
          { backgroundColor: colors.surface, borderColor: colors.borderAccent },
        ]}
        testID="quest-funding-summary"
      >
        <Pressable
          accessibilityHint={
            modal === "details"
              ? messages.fundingCollapse
              : messages.fundingExpand
          }
          accessibilityLabel={`${messages.fundingTitle}: ${messages.fundingUnavailable}`}
          accessibilityRole="button"
          accessibilityState={{ expanded: modal === "details" }}
          style={fundingLayout.toggle}
          onPress={openFundingDetails}
          testID="quest-funding-summary-toggle"
        >
          <View className="flex-1 flex-row items-center min-w-0">
            <View
              style={[
                fundingLayout.icon,
                {
                  backgroundColor: colors.surfaceAccent,
                  borderRadius: 12,
                  height: 36,
                  width: 36,
                },
              ]}
            >
              <WalletCards
                accessible={false}
                color={colors.primary}
                size={20}
                strokeWidth={2.1}
              />
            </View>
            <View className="flex-1 min-w-0 ml-[10px]">
              <Text
                numberOfLines={1}
                style={{
                  color: colors.textStrong,
                  fontFamily: fontFamily.semiBold,
                  fontSize: 14,
                  lineHeight: 21,
                }}
              >
                {messages.fundingTitle}
              </Text>
              <Text
                className="text-ku-text-secondary font-ku-regular text-ku-caption"
                numberOfLines={1}
                testID="quest-funding-collapsed-status"
              >
                {flow.liveWallet
                  ? `฿${(flow.liveWallet.spendingBalanceSatang / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })} available`
                  : messages.fundingUnavailable}
              </Text>
            </View>
          </View>
          <View
            style={[
              fundingLayout.chevron,
              {
                backgroundColor: colors.surfaceAccent,
                borderRadius: 9999,
                height: 44,
                width: 44,
              },
            ]}
          >
            <ChevronDown color={colors.primary} size={21} strokeWidth={2.4} />
          </View>
        </Pressable>
      </View>
      {modal ? (
        <FundingModal
          amount={flow.topUpAmount}
          locale={locale}
          modal={modal}
          quote={flow.topUpQuote}
          topUp={flow.activeTopUp}
          paymentVerified={flow.paymentVerified}
          isConfirming={flow.isConfirming}
          isVerifying={flow.isVerifying}
          verificationError={flow.verificationError}
          onAmountChange={flow.handleTopUpAmountChange}
          onBack={
            modal === "details" ? closeFundingModal : flow.handleTopUpBack
          }
          onClose={closeFundingModal}
          onContinue={flow.handleTopUpContinue}
          onConfirm={flow.handleTopUpConfirm}
          onSimulatePayment={flow.handleSimulatePayment}
          onVerifyPayment={flow.handleVerifyPayment}
          step={flow.topUpStep}
          onTopUp={openTopUp}
        />
      ) : null}
    </>
  );
}

export interface QuestTopUpModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  locale: SupportedLocale;
  suggestedAmountSatang?: number;
}

export function QuestTopUpModal({
  visible,
  onClose,
  onSuccess,
  locale,
  suggestedAmountSatang,
}: QuestTopUpModalProps) {
  const finish = useCallback(() => {
    onSuccess?.();
    onClose();
  }, [onSuccess, onClose]);

  const flow = useTopUpFlow({
    locale,
    onBackFromAmount: onClose,
    onPaid: finish,
  });
  const { loadWallet, openTopUp } = flow;

  useEffect(() => {
    if (!visible) return;
    openTopUp(suggestedAmountSatang);
    void loadWallet();
  }, [visible, suggestedAmountSatang, openTopUp, loadWallet]);

  if (!visible) return null;

  return (
    <FundingModal
      amount={flow.topUpAmount}
      locale={locale}
      modal="topUp"
      quote={flow.topUpQuote}
      topUp={flow.activeTopUp}
      paymentVerified={flow.paymentVerified}
      isConfirming={flow.isConfirming}
      isVerifying={flow.isVerifying}
      verificationError={flow.verificationError}
      step={flow.topUpStep}
      onAmountChange={flow.handleTopUpAmountChange}
      onBack={flow.handleTopUpBack}
      onClose={finish}
      onContinue={flow.handleTopUpContinue}
      onConfirm={flow.handleTopUpConfirm}
      onSimulatePayment={flow.handleSimulatePayment}
      onVerifyPayment={flow.handleVerifyPayment}
      onTopUp={finish}
    />
  );
}
