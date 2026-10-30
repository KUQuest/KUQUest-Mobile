import React, { useReducer, useState } from "react";
import type { WalletBalances } from "@/api/WalletApi";
import { parseSatangInput } from "@/domain/satang";
import { useLocale } from "@/features/preferences/localeStore";
import type { WalletMessages } from "@/locales/walletMessages";
import { getLocalizedErrorMessage } from "@/utils/error";
import { createIdempotencyKey } from "@/utils/idempotency";
import {
  useCreatePayoutMutation,
  usePayoutDestinationQuery,
  useQuotePayoutMutation,
  useRetirePayoutDestinationMutation,
  useSavePayoutDestinationMutation,
} from "../../api/walletQueries";
import { PayoutAmountStep } from "./PayoutAmountStep";
import { PayoutDestinationFormStep } from "./PayoutDestinationFormStep";
import { PayoutDestinationStep } from "./PayoutDestinationStep";
import { PayoutDoneStep } from "./PayoutDoneStep";
import { PayoutReviewStep } from "./PayoutReviewStep";
import { PayoutSheetShell } from "./PayoutSheetShell";
import {
  INITIAL_PAYOUT_STEP,
  canGoBack,
  payoutStepReducer,
  type PayoutStep,
} from "./payoutFlow";

interface PayoutSheetProps {
  visible: boolean;
  balances: WalletBalances | null;
  messages: WalletMessages;
  onClose: () => void;
  onSuccess: () => void;
}

function stepTitle(step: PayoutStep, m: WalletMessages) {
  switch (step.kind) {
    case "amount":
      return m.requestPayoutTitle;
    case "review":
      return m.payoutQuoteTitle;
    case "done":
      return m.payoutSuccessTitle;
    case "destination":
      return m.destinationTitle;
    case "destinationForm":
      return m.destinationFormTitle;
  }
}

/**
 * One sheet for the whole Payout flow: amount, review, done, and the Payout
 * Destination steps. The Server owns every fee, tax, and debit figure; the
 * sheet forwards the typed receipt amount and renders the quote it gets back.
 * A quote keeps one idempotency key in its review step, so a retried confirm
 * cannot create a second Payout. The body mounts only while the sheet is open,
 * so closing discards the step and the typed amount.
 */
export function PayoutSheet(props: PayoutSheetProps) {
  return props.visible ? <PayoutSheetBody {...props} /> : null;
}

function PayoutSheetBody({
  visible,
  balances,
  messages: m,
  onClose,
  onSuccess,
}: PayoutSheetProps) {
  const { locale } = useLocale();
  const earningsSatang = balances?.earningsBalanceSatang ?? 0;
  const [step, dispatch] = useReducer(payoutStepReducer, INITIAL_PAYOUT_STEP);
  const [inputAmount, setInputAmount] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const destinationQuery = usePayoutDestinationQuery(visible);
  const quoteMutation = useQuotePayoutMutation();
  const createMutation = useCreatePayoutMutation();
  const saveMutation = useSavePayoutDestinationMutation();
  const retireMutation = useRetirePayoutDestinationMutation();

  const destination = destinationQuery.data ?? null;
  const quoting = quoteMutation.isPending;
  const submitting = createMutation.isPending;
  const busy =
    quoting || submitting || saveMutation.isPending || retireMutation.isPending;

  const parsedSatang = parseSatangInput(inputAmount);
  const amountInvalid =
    inputAmount.length > 0 && (parsedSatang === null || parsedSatang <= 0);
  const amountTooHigh =
    parsedSatang !== null &&
    parsedSatang > earningsSatang &&
    earningsSatang > 0;
  const amountHint = amountInvalid
    ? m.payoutAmountInvalid
    : amountTooHigh
      ? m.payoutInsufficientEarnings
      : null;
  const canReview =
    Boolean(destination) &&
    parsedSatang !== null &&
    parsedSatang > 0 &&
    parsedSatang <= earningsSatang &&
    !busy;

  const handleClose = () => {
    if (!busy) onClose();
  };
  const handleBack = () => {
    if (busy) return;
    setErrorMsg(null);
    dispatch({ type: "back" });
  };

  const handleReview = async () => {
    if (!canReview || parsedSatang === null) return;
    setErrorMsg(null);
    try {
      const quote = await quoteMutation.mutateAsync(parsedSatang);
      const idempotencyKey = createIdempotencyKey("payout");
      dispatch({ type: "quoted", quote, idempotencyKey });
    } catch (err: unknown) {
      setErrorMsg(
        getLocalizedErrorMessage(err, locale, { fallback: m.payoutQuoteError })
      );
    }
  };

  const handleConfirm = async () => {
    if (step.kind !== "review" || busy) return;
    const { quote, idempotencyKey } = step;
    if (quote.maximumDebitSatang > earningsSatang) return;
    if (Date.parse(quote.expiresAt) <= Date.now()) {
      dispatch({ type: "back" });
      setErrorMsg(m.payoutQuoteExpired);
      return;
    }
    setErrorMsg(null);
    try {
      await createMutation.mutateAsync({ quoteId: quote.id, idempotencyKey });
      dispatch({ type: "confirmed", receiptSatang: quote.receiptSatang });
      onSuccess();
    } catch (err: unknown) {
      setErrorMsg(
        getLocalizedErrorMessage(err, locale, { fallback: m.payoutSubmitError })
      );
    }
  };

  const renderStep = () => {
    switch (step.kind) {
      case "amount":
        return (
          <PayoutAmountStep
            amountHint={amountHint}
            busy={busy}
            canReview={canReview}
            destinationQuery={destinationQuery}
            earningsSatang={earningsSatang}
            errorMsg={errorMsg}
            inputAmount={inputAmount}
            locale={locale}
            messages={m}
            onAddDestination={() => dispatch({ type: "addDestination" })}
            onInputAmountChange={(value) => {
              setInputAmount(value);
              setErrorMsg(null);
            }}
            onOpenDestination={() => dispatch({ type: "openDestination" })}
            onReview={() => void handleReview()}
            quoting={quoting}
          />
        );
      case "review":
        return (
          <PayoutReviewStep
            busy={busy}
            destination={destination}
            errorMsg={errorMsg}
            insufficient={step.quote.maximumDebitSatang > earningsSatang}
            locale={locale}
            messages={m}
            onConfirm={() => void handleConfirm()}
            onEditAmount={handleBack}
            quote={step.quote}
            submitting={submitting}
          />
        );
      case "done":
        return (
          <PayoutDoneStep
            destination={destination}
            locale={locale}
            messages={m}
            onDone={onClose}
            receiptSatang={step.receiptSatang}
          />
        );
      case "destination":
        return (
          <PayoutDestinationStep
            busy={busy}
            destinationQuery={destinationQuery}
            locale={locale}
            messages={m}
            onAdd={() => dispatch({ type: "addDestination" })}
            onReplace={() => dispatch({ type: "replaceDestination" })}
            retireMutation={retireMutation}
          />
        );
      case "destinationForm":
        return (
          <PayoutDestinationFormStep
            busy={busy}
            locale={locale}
            messages={m}
            onCancel={handleBack}
            onSaved={() => dispatch({ type: "destinationSaved" })}
            saveMutation={saveMutation}
          />
        );
    }
  };

  return (
    <PayoutSheetShell
      backLabel={m.destinationBackToDetails}
      busy={busy}
      closeLabel={m.closeButton}
      onBack={canGoBack(step) ? handleBack : null}
      onClose={handleClose}
      title={stepTitle(step, m)}
      visible={visible}
    >
      {renderStep()}
    </PayoutSheetShell>
  );
}
