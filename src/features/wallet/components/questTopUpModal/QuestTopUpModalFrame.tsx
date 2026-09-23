import { Modal } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { TopUpData, TopUpQuote } from "@/api/WalletApi";
import type { SupportedLocale } from "@/locales/locale";
import { useAppTheme } from "@/features/workspace/AppThemeProvider";
import { getActionBarPaddingBottom } from "@/theme/layout";
import { View } from "@/tw";
import { QuestTopUpFlowContent } from "./QuestTopUpFlowContent";
import { questTopUpLayout } from "./questTopUpStyles";
import type { QuestTopUpStep } from "./types";

interface QuestTopUpModalFrameProps {
  amount: string;
  locale: SupportedLocale;
  quote?: TopUpQuote | null;
  topUp?: TopUpData | null;
  paymentVerified?: boolean;
  isConfirming?: boolean;
  isVerifying?: boolean;
  verificationError?: string | null;
  step: QuestTopUpStep;
  onAmountChange: (amount: string) => void;
  onBack: () => void;
  onClose: () => void;
  onContinue: () => void;
  onConfirm: () => void;
  onVerifyPayment?: () => void;
  onSimulatePayment?: () => void;
}

export function QuestTopUpModalFrame({
  amount,
  locale,
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
  onVerifyPayment,
  onSimulatePayment,
}: QuestTopUpModalFrameProps) {
  const insets = useSafeAreaInsets();
  const { scheme, colors } = useAppTheme();
  const bottomPadding = getActionBarPaddingBottom(insets.bottom);

  return (
    <>
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />
      <Modal
        animationType="slide"
        key="topUp"
        onRequestClose={onBack}
        statusBarTranslucent
        transparent={false}
        visible
      >
        <View
          accessibilityViewIsModal
          style={[
            questTopUpLayout.topUpSurface,
            { backgroundColor: colors.surface },
          ]}
          testID="quest-funding-top-up-flow-modal"
        >
          <View
            accessibilityViewIsModal
            style={[
              questTopUpLayout.topUpFlow,
              { paddingBottom: bottomPadding, paddingTop: insets.top },
            ]}
            testID="quest-funding-top-up-full-screen-modal"
          >
            <QuestTopUpFlowContent
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
      </Modal>
    </>
  );
}
