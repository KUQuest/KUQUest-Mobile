import { useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { TopUpData, TopUpQuote } from "@/api/WalletApi";
import type { SupportedLocale } from "@/locales/locale";
import { questBoardMessages } from "@/locales/questBoardMessages";
import {
  checkTopUpAmount,
  checkTopUpPayment,
  createTopUpFromQuote,
  requestTopUpQuote,
  simulateTopUpPayment,
  toCompartments,
} from "@/features/wallet/walletModule";
import {
  useWalletQuery,
  walletKeys,
} from "@/features/wallet/api/walletQueries";
import type { QuestTopUpStep } from "./types";

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
  const [topUpStep, setTopUpStep] = useState<QuestTopUpStep>("amount");
  const [topUpAmount, setTopUpAmount] = useState("");
  const { data: liveWallet } = useWalletQuery();
  const queryClient = useQueryClient();
  const [topUpQuote, setTopUpQuote] = useState<TopUpQuote | null>(null);
  const [activeTopUp, setActiveTopUp] = useState<TopUpData | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [paymentVerified, setPaymentVerified] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(
    null
  );

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
    await queryClient.invalidateQueries({ queryKey: walletKeys.detail() });
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
    topUpQuote,
    activeTopUp,
    isConfirming,
    isVerifying,
    paymentVerified,
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
