import React, { useRef, useState } from "react";
import { Modal, Platform, StyleSheet } from "react-native";
import type { ViewStyle } from "react-native";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "@/tw";
import { Banknote, X } from "lucide-react-native";
import type { PayoutQuote, WalletBalances } from "@/api/WalletApi";
import { showSweetAlert, SweetAlertVariant } from "@/components/ui/SweetAlert";
import { formatTimeInBangkok } from "@/domain/datetime";
import { formatSatang, parseSatangInput } from "@/domain/satang";
import { useLocale } from "@/features/preferences/localeStore";
import type { WalletMessages } from "@/locales/walletMessages";
import { colors } from "@/theme/colors";
import { cn } from "@/tw/cn";
import { getLocalizedErrorMessage } from "@/utils/error";
import { createIdempotencyKey } from "@/utils/idempotency";
import {
  useCreatePayoutMutation,
  usePayoutDestinationQuery,
  useQuotePayoutMutation,
} from "../../api/walletQueries";
import { BankLogo } from "./BankLogo";
import payoutStyles from "./payoutStyles";
import { getThaiBankLabel } from "./thaiBanks";

/** Keeps digits and at most one decimal point with two fraction digits. */
function sanitizeAmountInput(value: string) {
  const cleaned = value.replace(/,/g, ".").replace(/[^0-9.]/g, "");
  const [whole = "", ...rest] = cleaned.split(".");
  return rest.length > 0 ? `${whole}.${rest.join("").slice(0, 2)}` : whole;
}

interface RequestPayoutModalProps {
  visible: boolean;
  balances: WalletBalances | null;
  messages: WalletMessages;
  onClose: () => void;
  onManageDestination: () => void;
  onSuccess: () => void;
}

/**
 * Request Payout: amount -> quote -> confirm. The Server owns every fee, tax,
 * and debit figure; this component only forwards the typed receipt amount and
 * renders the quote it gets back. A quote keeps one idempotency key, so a
 * retried confirm cannot create a second Payout.
 */
export function RequestPayoutModal({
  visible,
  balances,
  messages: m,
  onClose,
  onManageDestination,
  onSuccess,
}: RequestPayoutModalProps) {
  const { locale } = useLocale();
  const earningsSatang = balances?.earningsBalanceSatang ?? 0;
  const destinationQuery = usePayoutDestinationQuery(visible);
  const quoteMutation = useQuotePayoutMutation();
  const createMutation = useCreatePayoutMutation();
  const [inputAmount, setInputAmount] = useState("");
  const [quote, setQuote] = useState<PayoutQuote | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const idempotencyKey = useRef<string | null>(null);

  const destination = destinationQuery.data ?? null;
  const quoting = quoteMutation.isPending;
  const submitting = createMutation.isPending;
  const busy = quoting || submitting;

  const parsedSatang = parseSatangInput(inputAmount);
  const hasAmount = inputAmount.length > 0;
  const amountInvalid =
    hasAmount && (parsedSatang === null || parsedSatang <= 0);
  const amountTooHigh =
    parsedSatang !== null &&
    parsedSatang > earningsSatang &&
    earningsSatang > 0;
  const canQuote =
    Boolean(destination) &&
    parsedSatang !== null &&
    parsedSatang > 0 &&
    parsedSatang <= earningsSatang &&
    !busy;

  const quoteInsufficient = quote
    ? quote.maximumDebitSatang > earningsSatang
    : false;

  const resetFlow = () => {
    setInputAmount("");
    setQuote(null);
    setErrorMsg(null);
    idempotencyKey.current = null;
  };
  const handleClose = () => {
    if (busy) return;
    resetFlow();
    onClose();
  };

  const handleQuote = async () => {
    if (!canQuote || parsedSatang === null) return;
    setErrorMsg(null);
    try {
      const nextQuote = await quoteMutation.mutateAsync(parsedSatang);
      idempotencyKey.current = createIdempotencyKey("payout");
      setQuote(nextQuote);
    } catch (err: unknown) {
      setErrorMsg(
        getLocalizedErrorMessage(err, locale, { fallback: m.payoutQuoteError })
      );
    }
  };

  const handleEditAmount = () => {
    if (busy) return;
    setQuote(null);
    setErrorMsg(null);
    idempotencyKey.current = null;
  };

  const handleConfirm = async () => {
    if (!quote || busy || quoteInsufficient) return;
    if (Date.parse(quote.expiresAt) <= Date.now()) {
      setQuote(null);
      idempotencyKey.current = null;
      setErrorMsg(m.payoutQuoteExpired);
      return;
    }
    const key = idempotencyKey.current ?? createIdempotencyKey("payout");
    idempotencyKey.current = key;
    setErrorMsg(null);
    try {
      await createMutation.mutateAsync({
        quoteId: quote.id,
        idempotencyKey: key,
      });
      showSweetAlert({
        title: m.payoutSuccessTitle,
        message: m.payoutSuccessDesc(
          formatSatang(quote.receiptSatang, locale, "exact")
        ),
        variant: SweetAlertVariant.Success,
      });
      onSuccess();
      resetFlow();
      onClose();
    } catch (err: unknown) {
      setErrorMsg(
        getLocalizedErrorMessage(err, locale, { fallback: m.payoutSubmitError })
      );
    }
  };

  const renderDestination = () => {
    if (destinationQuery.isPending) {
      return (
        <View
          accessibilityLabel={m.payoutDestinationLoading}
          accessibilityLiveRegion="polite"
          className={payoutStyles.centered}
          testID="payout-request-destination-loading"
        >
          <ActivityIndicator color={colors.worker} size="small" />
        </View>
      );
    }
    if (destinationQuery.isError) {
      return (
        <View
          accessibilityRole="alert"
          className={payoutStyles.card}
          testID="payout-request-destination-error"
        >
          <Text className={payoutStyles.hintError}>
            {m.payoutDestinationLoadError}
          </Text>
          <TouchableOpacity
            accessibilityLabel={m.retry}
            accessibilityRole="button"
            className={payoutStyles.secondaryBtn}
            onPress={() => void destinationQuery.refetch()}
            testID="payout-request-destination-retry"
          >
            <Text className={payoutStyles.secondaryBtnText}>{m.retry}</Text>
          </TouchableOpacity>
        </View>
      );
    }
    if (!destination) {
      return (
        <View
          className={payoutStyles.card}
          testID="payout-request-no-destination"
        >
          <Text className={payoutStyles.cardTitle}>
            {m.payoutNoDestinationTitle}
          </Text>
          <Text className={payoutStyles.note}>{m.payoutNoDestinationDesc}</Text>
          <TouchableOpacity
            accessibilityLabel={m.payoutAddDestination}
            accessibilityRole="button"
            className={payoutStyles.primaryBtn}
            onPress={onManageDestination}
            testID="payout-request-add-destination-btn"
          >
            <Text className={payoutStyles.primaryBtnText}>
              {m.payoutAddDestination}
            </Text>
          </TouchableOpacity>
        </View>
      );
    }
    return (
      <View className={payoutStyles.card} testID="payout-request-destination">
        <View className={payoutStyles.row}>
          <BankLogo code={destination.bankCode} size={36} />
          <View className="flex-1">
            <Text className={payoutStyles.rowLabel}>
              {m.payoutDestinationLabel}
            </Text>
            <Text className={payoutStyles.cardTitle}>
              {`${destination.bankCode ? getThaiBankLabel(destination.bankCode, locale) : ""} ${destination.maskedAccount ?? ""}`.trim()}
            </Text>
            <Text className={payoutStyles.note}>
              {destination.accountHolderName}
            </Text>
          </View>
          <TouchableOpacity
            accessibilityLabel={m.payoutManageDestination}
            accessibilityRole="button"
            accessibilityState={{ disabled: busy }}
            className={payoutStyles.linkBtn}
            disabled={busy}
            onPress={onManageDestination}
            testID="payout-request-manage-destination-btn"
          >
            <Text className={payoutStyles.linkBtnText}>
              {m.payoutManageDestination}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const amountHint = amountInvalid
    ? m.payoutAmountInvalid
    : amountTooHigh
      ? m.payoutInsufficientEarnings
      : null;

  const renderAmountStep = () => (
    <>
      <View className={payoutStyles.card}>
        <View className={payoutStyles.row}>
          <Text className={payoutStyles.rowLabel}>
            {m.payoutAvailableEarnings}
          </Text>
          <Text
            className={payoutStyles.rowValueStrong}
            testID="payout-available-earnings"
          >
            {formatSatang(earningsSatang, locale, "exact")}
          </Text>
        </View>
      </View>

      {renderDestination()}

      <View>
        <Text className={payoutStyles.inputLabel}>{m.payoutAmountLabel}</Text>
        <View
          className={cn(
            payoutStyles.inputWrap,
            (amountHint || errorMsg) && payoutStyles.inputWrapError,
            earningsSatang <= 0 && payoutStyles.inputWrapDisabled
          )}
        >
          <Text className={payoutStyles.inputPrefix}>฿</Text>
          <TextInput
            accessibilityLabel={m.payoutAmountLabel}
            editable={earningsSatang > 0 && !busy}
            inputMode="decimal"
            keyboardType="decimal-pad"
            maxLength={12}
            onChangeText={(value) => {
              setInputAmount(sanitizeAmountInput(value));
              setErrorMsg(null);
            }}
            placeholder="0.00"
            placeholderTextColor={colors.textMuted}
            className={payoutStyles.textInput}
            testID="payout-amount-input"
            value={inputAmount}
          />
        </View>
        {earningsSatang <= 0 ? (
          <Text
            className={cn(payoutStyles.hintWarning, "mt-ku-6")}
            testID="payout-no-earnings-hint"
          >
            {m.payoutNoEarnings}
          </Text>
        ) : amountHint ? (
          <Text
            accessibilityRole="alert"
            className={cn(payoutStyles.hintError, "mt-ku-6")}
            testID="payout-amount-hint"
          >
            {amountHint}
          </Text>
        ) : null}
      </View>

      {errorMsg ? (
        <Text
          accessibilityRole="alert"
          className={payoutStyles.hintError}
          testID="payout-error"
        >
          {errorMsg}
        </Text>
      ) : null}

      <View className={payoutStyles.actionRow}>
        <TouchableOpacity
          accessibilityLabel={m.payoutGetQuote}
          accessibilityRole="button"
          accessibilityState={{ disabled: !canQuote, busy: quoting }}
          className={cn(
            payoutStyles.primaryBtn,
            !canQuote && payoutStyles.primaryBtnDisabled
          )}
          disabled={!canQuote}
          onPress={() => void handleQuote()}
          testID="payout-quote-btn"
        >
          {quoting ? (
            <ActivityIndicator color={colors.onWorker} size="small" />
          ) : null}
          <Text className={payoutStyles.primaryBtnText}>
            {quoting ? m.payoutQuoting : m.payoutGetQuote}
          </Text>
        </TouchableOpacity>
      </View>
    </>
  );

  const renderQuoteStep = (activeQuote: PayoutQuote) => {
    const confirmDisabled = busy || quoteInsufficient;
    return (
      <>
        <View className={payoutStyles.card} testID="payout-quote-summary">
          <Text accessibilityRole="header" className={payoutStyles.cardTitle}>
            {m.payoutQuoteTitle}
          </Text>
          <View className={payoutStyles.row}>
            <Text className={payoutStyles.rowLabel}>
              {m.payoutQuoteReceipt}
            </Text>
            <Text
              className={payoutStyles.rowValueStrong}
              testID="payout-quote-receipt"
            >
              {formatSatang(activeQuote.receiptSatang, locale, "exact")}
            </Text>
          </View>
          <View className={payoutStyles.row}>
            <Text className={payoutStyles.rowLabel}>{m.payoutQuoteFee}</Text>
            <Text className={payoutStyles.rowValue} testID="payout-quote-fee">
              {formatSatang(activeQuote.maximumFeeSatang, locale, "exact")}
            </Text>
          </View>
          <View className={payoutStyles.row}>
            <Text className={payoutStyles.rowLabel}>{m.payoutQuoteTax}</Text>
            <Text className={payoutStyles.rowValue} testID="payout-quote-tax">
              {formatSatang(activeQuote.maximumTaxSatang, locale, "exact")}
            </Text>
          </View>
          <View className={payoutStyles.row}>
            <Text className={payoutStyles.rowLabel}>{m.payoutQuoteDebit}</Text>
            <Text className={payoutStyles.rowValue} testID="payout-quote-debit">
              {formatSatang(activeQuote.maximumDebitSatang, locale, "exact")}
            </Text>
          </View>
          <Text className={payoutStyles.note}>
            {m.payoutQuoteExpires(formatTimeInBangkok(activeQuote.expiresAt))}
          </Text>
        </View>

        <Text className={payoutStyles.note}>{m.payoutQuoteNote}</Text>

        {quoteInsufficient ? (
          <Text
            accessibilityRole="alert"
            className={payoutStyles.hintError}
            testID="payout-quote-insufficient"
          >
            {m.payoutQuoteInsufficient}
          </Text>
        ) : null}
        {errorMsg ? (
          <Text
            accessibilityRole="alert"
            className={payoutStyles.hintError}
            testID="payout-error"
          >
            {errorMsg}
          </Text>
        ) : null}

        <View className={payoutStyles.actionRow}>
          <TouchableOpacity
            accessibilityLabel={m.payoutConfirm}
            accessibilityRole="button"
            accessibilityState={{ disabled: confirmDisabled, busy: submitting }}
            className={cn(
              payoutStyles.primaryBtn,
              confirmDisabled && payoutStyles.primaryBtnDisabled
            )}
            disabled={confirmDisabled}
            onPress={() => void handleConfirm()}
            testID="payout-confirm-btn"
          >
            {submitting ? (
              <ActivityIndicator color={colors.onWorker} size="small" />
            ) : null}
            <Text className={payoutStyles.primaryBtnText}>
              {submitting ? m.payoutSubmitting : m.payoutConfirm}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityLabel={m.payoutEditAmount}
            accessibilityRole="button"
            accessibilityState={{ disabled: busy }}
            className={payoutStyles.secondaryBtn}
            disabled={busy}
            onPress={handleEditAmount}
            testID="payout-edit-amount-btn"
          >
            <Text className={payoutStyles.secondaryBtnText}>
              {m.payoutEditAmount}
            </Text>
          </TouchableOpacity>
        </View>
      </>
    );
  };

  return (
    <Modal
      animationType="fade"
      onRequestClose={handleClose}
      transparent
      visible={visible}
    >
      <View className={payoutStyles.modalOverlay}>
        <Pressable
          accessibilityLabel={m.closeButton}
          onPress={handleClose}
          style={StyleSheet.absoluteFill}
          testID="payout-request-backdrop"
        />
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="w-full"
        >
          <View
            accessibilityViewIsModal
            className={payoutStyles.modalCard}
            style={modalCardShadow}
            testID="payout-request-modal"
          >
            <View className={payoutStyles.header}>
              <Banknote color={colors.workerDeep} size={20} strokeWidth={2.2} />
              <Text
                accessibilityRole="header"
                className={payoutStyles.headerTitle}
              >
                {m.requestPayoutTitle}
              </Text>
              <TouchableOpacity
                accessibilityLabel={m.closeButton}
                accessibilityRole="button"
                accessibilityState={{ disabled: busy }}
                className={payoutStyles.closeBtn}
                disabled={busy}
                onPress={handleClose}
                testID="payout-request-close-btn"
              >
                <X color={colors.textSecondary} size={20} strokeWidth={2} />
              </TouchableOpacity>
            </View>
            <ScrollView
              contentContainerClassName={payoutStyles.scrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <Text className={payoutStyles.desc}>{m.requestPayoutDesc}</Text>
              {quote ? renderQuoteStep(quote) : renderAmountStep()}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const modalCardShadow = {
  elevation: 24,
  shadowColor: colors.black,
  shadowOffset: { width: 0, height: -4 },
  shadowOpacity: 0.2,
  shadowRadius: 12,
} satisfies ViewStyle;
