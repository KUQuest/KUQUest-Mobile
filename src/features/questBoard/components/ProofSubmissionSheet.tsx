import { useState } from "react";
import { Modal } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { ImagePlus, X } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components/ui/Button";
import { TextArea } from "@/features/onboarding/components/TextArea";
import { useLocale } from "@/locales/LocaleProvider";
import { questBoardMessages } from "@/locales/questBoardMessages";
import { colors } from "@/theme/colors";
import { cn } from "@/tw/cn";
import { Image, Pressable, SafeAreaView, ScrollView, Text, View } from "@/tw";

import { MAX_PROOF_ATTACHMENTS, MAX_PROOF_NOTE_LENGTH } from "../types";
import styles from "../questDetailStyles";

export interface ProofSubmissionSheetProps {
  onClose: () => void;
  onSubmit: (imageUris: string[], note: string) => boolean;
  visible: boolean;
}

export function ProofSubmissionSheet({
  onClose,
  onSubmit,
  visible,
}: ProofSubmissionSheetProps) {
  const { locale } = useLocale();
  const messages = questBoardMessages[locale];
  const insets = useSafeAreaInsets();
  const [note, setNote] = useState("");
  const [imageUris, setImageUris] = useState<string[]>([]);
  const [attempted, setAttempted] = useState(false);
  const [pickerError, setPickerError] = useState<string | undefined>();

  const canSubmit = Boolean(note.trim() || imageUris.length > 0);
  const remainingAttachments = MAX_PROOF_ATTACHMENTS - imageUris.length;
  const handleClose = () => {
    setNote("");
    setImageUris([]);
    setAttempted(false);
    setPickerError(undefined);
    onClose();
  };

  const handlePickImages = async () => {
    if (remainingAttachments === 0) return;
    setPickerError(undefined);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsMultipleSelection: true,
        selectionLimit: remainingAttachments,
        quality: 0.8,
      });
      if (result.canceled) return;
      const selectedUris = result.assets.map((asset) => asset.uri);
      setImageUris((current) =>
        Array.from(new Set([...current, ...selectedUris])).slice(
          0,
          MAX_PROOF_ATTACHMENTS
        )
      );
    } catch {
      setPickerError(messages.proofImagePickerError);
    }
  };

  const handleSubmit = () => {
    setAttempted(true);
    if (!canSubmit) return;
    if (onSubmit(imageUris, note.trim())) {
      setNote("");
      setImageUris([]);
      setAttempted(false);
      setPickerError(undefined);
    }
  };

  return (
    <Modal
      animationType="slide"
      onRequestClose={handleClose}
      transparent
      visible={visible}
    >
      <Pressable className={styles.proofSheetBackdrop} onPress={handleClose}>
        <Pressable
          accessibilityViewIsModal
          className={styles.proofSheet}
          onPress={() => undefined}
        >
          <SafeAreaView edges={["bottom"]}>
            <View className={styles.proofSheetHeader}>
              <View className={styles.proofSheetHeaderCopy}>
                <Text
                  accessibilityRole="header"
                  className={styles.proofSheetTitle}
                >
                  {messages.proofSubmissionTitle}
                </Text>
                <Text className={styles.proofSheetDescription}>
                  {messages.proofSubmissionDescription}
                </Text>
              </View>
              <Pressable
                accessibilityLabel={messages.close}
                accessibilityRole="button"
                className={styles.sheetCloseButton}
                onPress={handleClose}
                testID="proof-submission-close"
              >
                <X color={colors.textStrong} size={24} />
              </Pressable>
            </View>
            <ScrollView
              contentContainerClassName={styles.proofSheetContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              testID="proof-submission-sheet"
            >
              <TextArea
                accessibilityLabel={messages.proofDescriptionLabel}
                label={messages.proofDescriptionLabel}
                maxLength={MAX_PROOF_NOTE_LENGTH}
                onChangeText={setNote}
                placeholder={messages.proofDescriptionPlaceholder}
                value={note}
              />
              <Text className={styles.proofSheetHelper}>
                {messages.proofLockDescription}
              </Text>
              <Pressable
                accessibilityLabel={messages.addProofImages}
                accessibilityRole="button"
                accessibilityState={{ disabled: remainingAttachments === 0 }}
                className={cn(
                  styles.proofAttachmentTrigger,
                  remainingAttachments === 0 &&
                    styles.proofAttachmentTriggerDisabled
                )}
                disabled={remainingAttachments === 0}
                onPress={() => void handlePickImages()}
                testID="proof-add-images"
              >
                <ImagePlus color={colors.primary} size={20} strokeWidth={2.2} />
                <Text className={styles.proofAttachmentTriggerText}>
                  {messages.addProofImages}
                </Text>
              </Pressable>
              <Text className={styles.proofAttachmentCount}>
                {messages.proofAttachmentCount(
                  imageUris.length,
                  MAX_PROOF_ATTACHMENTS
                )}
              </Text>
              {imageUris.length > 0 ? (
                <View className={styles.proofAttachmentGrid}>
                  {imageUris.map((uri, index) => (
                    <View className={styles.proofAttachment} key={uri}>
                      <Image
                        accessibilityLabel={messages.proofImageLabel(index + 1)}
                        className={styles.proofAttachmentImage}
                        contentFit="cover"
                        source={uri}
                      />
                      <Pressable
                        accessibilityLabel={messages.removeProofImage(
                          index + 1
                        )}
                        accessibilityRole="button"
                        className={styles.proofAttachmentRemove}
                        onPress={() =>
                          setImageUris((current) =>
                            current.filter(
                              (_, imageIndex) => imageIndex !== index
                            )
                          )
                        }
                        testID={`proof-remove-image-${index}`}
                      >
                        <X color={colors.white} size={16} strokeWidth={2.4} />
                      </Pressable>
                    </View>
                  ))}
                </View>
              ) : null}
              {attempted && !canSubmit ? (
                <Text
                  accessibilityRole="alert"
                  className={styles.proofValidation}
                >
                  {messages.proofContentRequired}
                </Text>
              ) : null}
              {pickerError ? (
                <Text
                  accessibilityRole="alert"
                  className={styles.proofValidation}
                >
                  {pickerError}
                </Text>
              ) : null}
            </ScrollView>
            <View
              className={styles.proofSheetActions}
              style={{ paddingBottom: Math.max(insets.bottom, 16) }}
            >
              <Button
                onPress={handleClose}
                testID="proof-submission-cancel"
                variant="secondary"
              >
                {messages.cancel}
              </Button>
              <Button onPress={handleSubmit} testID="proof-submit">
                {messages.submitProof}
              </Button>
            </View>
          </SafeAreaView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
