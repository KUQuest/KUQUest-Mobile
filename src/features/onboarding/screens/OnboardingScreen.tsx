import { CircleAlert } from "lucide-react-native";
import { Platform } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";

import { ScreenLayout } from "@/components/layout/ScreenLayout";
import { KeyboardAvoidingView, Pressable, Text, View } from "@/tw";

import { FileTooLargeModal } from "../components/FileTooLargeModal";
import { OnboardingActionBar } from "../components/OnboardingActionBar";
import { OnboardingForm } from "../components/OnboardingForm";
import { OnboardingLoadingState } from "../components/OnboardingLoadingState";
import { OnboardingPrivacyPolicyModal } from "../components/OnboardingPrivacyPolicyModal";
import styles from "../styles/registrationStyles";
import { useOnboardingController } from "../workflow/useOnboardingController";

export default function OnboardingScreen() {
  const { frame, content } = useOnboardingController();

  if (content.initialLoadPending) {
    return (
      <OnboardingLoadingState
        currentStep={frame.currentStep}
        loadingLabel={frame.messages.loadingProfile}
      />
    );
  }

  if (content.loadError) {
    return (
      <ScreenLayout className={styles.safeArea}>
        <View className={styles.loadErrorCard} accessibilityRole="alert">
          <CircleAlert size={24} color={frame.colors.danger} strokeWidth={2} />
          <Text className={styles.submitErrorText}>
            {frame.messages.loadError}
          </Text>
          <Pressable
            accessibilityRole="button"
            className={styles.addMoreBtn}
            onPress={content.retryLoad}
          >
            <Text className={styles.addMoreBtnText}>
              {frame.messages.retrySubmitBtn}
            </Text>
          </Pressable>
        </View>
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout
      edges={["top", "left", "right", "bottom"]}
      className={styles.safeArea}
    >
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <OnboardingForm {...content.formProps} />
        <OnboardingActionBar {...content.actionBarProps} />
      </KeyboardAvoidingView>
      {content.datePicker.target ? (
        <DateTimePicker
          value={new Date(content.datePicker.target.value)}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onValueChange={content.datePicker.handleChange}
          onDismiss={content.datePicker.close}
          maximumDate={content.datePicker.today}
        />
      ) : null}
      <FileTooLargeModal
        visible={content.imagePicker.isTooLargeVisible}
        onBack={content.imagePicker.dismissTooLarge}
        onTryAgain={content.imagePicker.retry}
      />
      <OnboardingPrivacyPolicyModal
        visible={content.isPolicyVisible}
        reduceMotion={frame.reduceMotion}
        messages={frame.messages}
        onClose={content.onClosePolicy}
      />
    </ScreenLayout>
  );
}
