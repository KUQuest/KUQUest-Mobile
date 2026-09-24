import { Modal, Platform } from "react-native";
import { ShieldCheck, X } from "lucide-react-native";

import { useLocale } from "@/features/preferences/localeStore";
import { questBoardMessages } from "@/locales/questBoardMessages";
import { colors } from "@/theme/colors";
import {
  KeyboardAvoidingView,
  Pressable,
  SafeAreaView,
  Text,
  View,
} from "@/tw";

import type { QuestV2ProofReviewPayload } from "@/api/QuestApi";
import type { QuestV2ProofSubmission } from "@/api/questV2Contracts";
import styles from "../../styles/questDetailStyles";
import { ProofReviewPanel } from "./ProofReviewPanel";

export interface ProofReviewModalProps {
  visible: boolean;
  proof: QuestV2ProofSubmission | null | undefined;
  dueAt?: string | null;
  onClose: () => void;
  onReview: (
    payload: QuestV2ProofReviewPayload
  ) => Promise<boolean | void> | boolean | void;
}

export function ProofReviewModal({
  visible,
  proof,
  dueAt,
  onClose,
  onReview,
}: ProofReviewModalProps) {
  const { locale } = useLocale();
  const messages = questBoardMessages[locale];

  if (!proof) return null;

  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      transparent
      visible={visible}
    >
      <Pressable
        accessibilityLabel={messages.close}
        accessibilityRole="button"
        className={styles.proofSheetBackdrop}
        onPress={onClose}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1 justify-end"
        >
          <Pressable
            accessibilityRole="none"
            accessible={false}
            accessibilityViewIsModal
            className={styles.proofSheet}
            onPress={() => undefined}
            testID="proof-review-modal"
          >
            <SafeAreaView className="shrink" edges={["bottom"]}>
              <View className={styles.proofSheetHeader}>
                <View className={styles.proofSheetHeaderCopy}>
                  <View className="flex-row items-center gap-ku-sm">
                    <ShieldCheck color={colors.primary} size={22} />
                    <Text
                      accessibilityRole="header"
                      className={styles.proofSheetTitle}
                    >
                      {messages.proofReviewTitle}
                    </Text>
                  </View>
                  <Text className={styles.proofSheetDescription}>
                    {messages.proofReviewDescription}
                  </Text>
                </View>
                <Pressable
                  accessibilityLabel={messages.close}
                  accessibilityRole="button"
                  className={styles.sheetCloseButton}
                  onPress={onClose}
                  testID="proof-review-close"
                >
                  <X color={colors.textStrong} size={24} />
                </Pressable>
              </View>
              {/* Modal content unmounts while hidden, so reopening starts a fresh form. */}
              <ProofReviewPanel
                dueAt={dueAt}
                key={proof.id}
                onDone={onClose}
                onReview={onReview}
                proof={proof}
              />
            </SafeAreaView>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}
