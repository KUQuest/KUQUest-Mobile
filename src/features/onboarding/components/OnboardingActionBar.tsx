import { Button } from "@/components/ui/Button";
import type { onboardingMessages } from "@/locales/registrationOnboarding";
import type { OnboardingStep } from "@/features/auth/types";

import styles from "../styles/registrationStyles";
import { Text, View } from "@/tw";

type Messages = (typeof onboardingMessages)["en"];

export function OnboardingActionBar({
  messages,
  isEditMode,
  currentStep,
  isSubmitting,
  submitError,
  onBackPress,
  onPrimaryPress,
}: {
  messages: Messages;
  isEditMode: boolean;
  currentStep: OnboardingStep;
  isSubmitting: boolean;
  submitError: string | null;
  onBackPress: () => void;
  onPrimaryPress: () => void;
}) {
  const backLabel =
    currentStep === 1 && !isEditMode
      ? messages.cancelRegistration
      : messages.back;
  const primaryLabel =
    currentStep === 1 || currentStep === 2
      ? messages.next
      : isSubmitting
        ? messages.submitting
        : submitError
          ? messages.retrySubmitBtn
          : isEditMode
            ? messages.saveChanges
            : messages.completeBtn;

  return (
    <View className={styles.actionBar}>
      {isSubmitting ? (
        <Text accessibilityLiveRegion="polite" className={styles.savingStatus}>
          {messages.savingStatus}
        </Text>
      ) : null}
      <View className={styles.actionButtons}>
        <View className={styles.actionButton}>
          <Button
            variant="secondary"
            accessibilityLabel={backLabel}
            onPress={onBackPress}
            disabled={isSubmitting}
          >
            {backLabel}
          </Button>
        </View>
        <View className={styles.actionButton}>
          <Button
            accessibilityLabel={primaryLabel}
            onPress={onPrimaryPress}
            disabled={isSubmitting}
          >
            {primaryLabel}
          </Button>
        </View>
      </View>
    </View>
  );
}
