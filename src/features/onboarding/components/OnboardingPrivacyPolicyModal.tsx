import { Modal } from "react-native";
import { Pressable, ScrollView, Text, View } from "@/tw";
import { Button } from "@/components/ui/Button";
import { X } from "lucide-react-native";

import { onboardingMessages } from "@/locales/registrationOnboarding";
import { useAppTheme } from "@/features/workspace/AppThemeProvider";
import styles from "@/features/onboarding/styles/registrationStyles";

type OnboardingMessages = (typeof onboardingMessages)["en"];

export function OnboardingPrivacyPolicyModal({
  visible,
  reduceMotion,
  messages,
  onClose,
}: {
  visible: boolean;
  reduceMotion: boolean;
  messages: OnboardingMessages;
  onClose: () => void;
}) {
  const { colors } = useAppTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType={reduceMotion ? "none" : "slide"}
      onRequestClose={onClose}
    >
      <View className={styles.policyModalOverlay}>
        <View accessibilityViewIsModal className={styles.policyModalContent}>
          <View className={styles.policyModalHeader}>
            <Text
              accessibilityRole="header"
              className={styles.policyModalTitle}
            >
              {messages.privacyPolicy}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={messages.closePolicy}
              className={styles.policyModalClose}
              onPress={onClose}
            >
              <X color={colors.textSecondary} size={22} strokeWidth={2} />
            </Pressable>
          </View>
          <ScrollView
            className={styles.policyModalScroll}
            contentContainerClassName={styles.policyModalScrollContent}
            showsVerticalScrollIndicator={false}
          >
            <Text className={styles.policyModalText}>
              {messages.privacyPolicyText}
            </Text>
          </ScrollView>
          <View className={styles.policyModalFooter}>
            <Button onPress={onClose} accessibilityLabel={messages.closePolicy}>
              {messages.closePolicy}
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
}
