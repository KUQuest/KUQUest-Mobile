import { useCallback, useEffect, useRef, useState } from "react";
import { getLocalizedErrorMessage } from "@/utils/error";
import { useQueryClient } from "@tanstack/react-query";
import type { TopUpData, TopUpQuote } from "@/api/WalletApi";
import type { SupportedLocale } from "@/locales/locale";
import { questBoardMessages } from "@/locales/questBoardMessages";
import { walletMessages } from "@/locales/walletMessages";
import {
  checkTopUpAmount,
  checkTopUpPayment,
  createTopUpFromQuote,
  requestTopUpQuote,
  simulateTopUpPayment,
  toCompartments,
} from "@/features/wallet/walletModule";
import {
  invalidateWalletQueries,
  useTopUpStatusQuery,
  useWalletQuery,
  walletKeys,
} from "@/features/wallet/api/walletQueries";
import type { TopUpStep } from "../../topUpTypes";

interface QuestTopUpFlowOptions {
  locale: SupportedLocale;
  onBackFromAmount: () => void;
  /** Invoked after a payment is verified and the wallet reloaded. */
  onPaid?: () => void;
}

export function useQuestTopUpFlow({
  locale,
  onBackFromAmount,
  onPaid,
}: QuestTopUpFlowOptions) {
  const messages = questBoardMessages[locale];
  const [topUpStep, setTopUpStep] = useState<TopUpStep>("amount");
  const [topUpAmount, setTopUpAmount] = useState("");
  const { data: liveWallet } = useWalletQuery();
  const queryClient = useQueryClient();
  const [topUpQuote, setTopUpQuote] = useState<TopUpQuote | null>(null);
  const [activeTopUpId, setActiveTopUpId] = useState<string | null>(null);
  const handledPaidIdRef = useRef<string | null>(null);
  const activeTopUp = useTopUpStatusQuery(activeTopUpId).data ?? null;
  const [isConfirming, setIsConfirming] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(
    null
  );

  const resetTopUp = useCallback(() => {
    setTopUpQuote(null);
    setActiveTopUpId(null);
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
        getLocalizedErrorMessage(err, locale, {
          fallback: messages.topUpCreateError,
        })
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
      queryClient.setQueryData(
        walletKeys.topUpStatus(result.topUp.id),
        result.topUp
      );
      setActiveTopUpId(result.topUp.id);
      setVerificationError(null);
      setTopUpStep("promptPay");
    } catch (err: unknown) {
      setVerificationError(
        getLocalizedErrorMessage(err, locale, {
          fallback: messages.topUpCreateError,
        })
      );
    } finally {
      setIsConfirming(false);
    }
  };
  const settleTopUp = useCallback(
    async (topUp: TopUpData) => {
      queryClient.setQueryData(walletKeys.topUpStatus(topUp.id), topUp);
      if (topUp.topUpStatus !== "PAID") {
        setVerificationError(messages.topUpPaymentPending);
        return;
      }
      if (handledPaidIdRef.current === topUp.id) return;
      handledPaidIdRef.current = topUp.id;
      await invalidateWalletQueries(queryClient);
      onPaid?.();
    },
    [messages.topUpPaymentPending, onPaid, queryClient]
  );
  useEffect(() => {
    const topUp = activeTopUp;
    if (
      topUp?.topUpStatus === "PAID" &&
      handledPaidIdRef.current !== topUp.id
    ) {
      void settleTopUp(topUp);
    }
  }, [activeTopUp, settleTopUp]);
  const handleVerifyPayment = async () => {
    if (!activeTopUp || isVerifying) return;
    setIsVerifying(true);
    setVerificationError(null);
    try {
      await settleTopUp(await checkTopUpPayment(activeTopUp.id));
    } catch (err: unknown) {
      setVerificationError(
        getLocalizedErrorMessage(err, locale, {
          fallback: walletMessages[locale].topUpPaymentFailed,
        })
      );
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
      setVerificationError(
        getLocalizedErrorMessage(err, locale, {
          fallback: walletMessages[locale].topUpPaymentFailed,
        })
      );
    } finally {
      setIsVerifying(false);
    }
  };

  return {
    topUpStep,
    topUpAmount,
    topUpQuote,
    activeTopUp,
    isConfirming,
    isVerifying,
    verificationError,
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
