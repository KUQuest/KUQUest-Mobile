import { useCallback, useEffect } from "react";
import type { SupportedLocale } from "@/locales/locale";
import { QuestTopUpModalFrame } from "./questTopUpModal/QuestTopUpModalFrame";
import { useQuestTopUpFlow } from "./questTopUpModal/useQuestTopUpFlow";

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

  const flow = useQuestTopUpFlow({
    locale,
    onBackFromAmount: onClose,
    onPaid: finish,
  });
  const { openTopUp } = flow;

  useEffect(() => {
    if (!visible) return;
    openTopUp(suggestedAmountSatang);
  }, [openTopUp, suggestedAmountSatang, visible]);

  if (!visible) return null;

  return (
    <QuestTopUpModalFrame
      amount={flow.topUpAmount}
      locale={locale}
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
    />
  );
}
