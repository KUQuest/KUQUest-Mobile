import { useCallback, useEffect } from "react";
import { Modal, Platform } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { KeyboardAvoidingView, ScrollView, View } from "@/tw";
import { useAppTheme } from "@/features/workspace/AppThemeProvider";
import type { SupportedLocale } from "@/locales/locale";
import { getActionBarPaddingBottom } from "@/theme/layout";
import { checkTopUpAmount } from "../walletModule";
import { TopUpAmountStep } from "./TopUpAmountStep";
import { TopUpConfirmationStep } from "./TopUpConfirmationStep";
import { TopUpHeader } from "./TopUpHeader";
import { TopUpPromptPayStep } from "./TopUpPromptPayStep";
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
  const insets = useSafeAreaInsets();
  const { scheme } = useAppTheme();
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
    <>
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />
      <Modal
        animationType="slide"
        onRequestClose={flow.handleTopUpBack}
        statusBarTranslucent
        visible
      >
        <View
          accessibilityViewIsModal
          className="flex-1 bg-ku-background"
          style={{
            paddingBottom: getActionBarPaddingBottom(insets.bottom),
            paddingTop: insets.top,
          }}
          testID="quest-funding-top-up-flow"
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            className="w-full max-w-[640px] flex-1 self-center"
          >
            <TopUpHeader
              backDisabled={flow.isConfirming}
              locale={locale}
              onBack={flow.handleTopUpBack}
              onClose={finish}
              step={flow.topUpStep}
            />
            <ScrollView
              contentContainerClassName="px-ku-md pt-ku-md pb-ku-lg"
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {flow.topUpStep === "amount" ? (
                <TopUpAmountStep
                  amountStr={flow.topUpAmount}
                  error={flow.verificationError}
                  isAmountValid={checkTopUpAmount(flow.topUpAmount).ok}
                  loading={false}
                  locale={locale}
                  onAmountChange={flow.handleTopUpAmountChange}
                  onContinue={flow.handleTopUpContinue}
                />
              ) : flow.topUpStep === "confirmation" && flow.topUpQuote ? (
                <TopUpConfirmationStep
                  error={flow.verificationError}
                  loading={flow.isConfirming}
                  locale={locale}
                  onConfirm={flow.handleTopUpConfirm}
                  onEdit={flow.handleTopUpBack}
                  quote={flow.topUpQuote}
                />
              ) : flow.activeTopUp ? (
                <TopUpPromptPayStep
                  activeTopUp={flow.activeTopUp}
                  checkingStatus={flow.isVerifying}
                  locale={locale}
                  onSimulatePayment={flow.handleSimulatePayment}
                  onVerifyPayment={flow.handleVerifyPayment}
                  statusMessage={flow.verificationError}
                />
              ) : null}
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </>
  );
}
