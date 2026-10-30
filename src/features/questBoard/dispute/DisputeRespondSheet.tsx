import { useState } from "react";
import { Modal } from "react-native";

import { Button } from "@/components/ui/Button";
import { showSweetAlert, SweetAlertVariant } from "@/components/ui/SweetAlert";
import { TextArea } from "@/components/ui/TextArea";
import { useRespondToDisputeMutation } from "@/features/questBoard/api/questBoardQueries";
import { useLocale } from "@/features/preferences/localeStore";
import { disputeMessages } from "@/locales/disputeMessages";
import { KeyboardAvoidingView, ScrollView, Text, View } from "@/tw";
import { getLocalizedErrorMessage } from "@/utils/error";

/**
 * The respondent's one statement on a Dispute Case filed against them. The
 * case id comes from the inbox row: no Quest read returns a case the Member
 * did not file.
 */
export function DisputeRespondSheet({
  disputeCaseId,
  onClose,
}: {
  disputeCaseId: string;
  onClose: () => void;
}) {
  const { locale } = useLocale();
  const messages = disputeMessages[locale];
  const [statement, setStatement] = useState("");
  const { mutate, isPending } = useRespondToDisputeMutation();
  const trimmed = statement.trim();

  const close = () => {
    if (!isPending) onClose();
  };
  const send = () => {
    if (!trimmed || isPending) return;
    mutate(
      { disputeCaseId, respondentStatement: trimmed },
      {
        onSuccess: () => {
          onClose();
          showSweetAlert({
            title: messages.respondSuccessTitle,
            message: messages.respondSuccessDescription,
            variant: SweetAlertVariant.Success,
          });
        },
        onError: (error) =>
          showSweetAlert({
            title: messages.respondErrorTitle,
            message: getLocalizedErrorMessage(error, locale, {
              fallback: messages.respondErrorFallback,
            }),
            variant: SweetAlertVariant.Error,
          }),
      }
    );
  };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={close}>
      <KeyboardAvoidingView
        // "height" leaves Android inputs under the keyboard (gotchas.md).
        behavior="padding"
        className="flex-1 justify-end bg-ku-overlay"
      >
        <View
          accessibilityViewIsModal
          className="max-h-[90%] rounded-t-[24px] bg-ku-card p-ku-lg"
        >
          <ScrollView keyboardShouldPersistTaps="handled">
            <Text
              accessibilityRole="header"
              className="font-ku-semibold text-ku-title-small text-ku-text-strong"
            >
              {messages.respondTitle}
            </Text>
            <Text className="mt-ku-xs text-ku-body-small text-ku-text-secondary">
              {messages.respondIntro}
            </Text>
            <View className="mt-ku-md">
              <TextArea
                label={messages.respondLabel}
                accessibilityLabel={messages.respondLabel}
                value={statement}
                onChangeText={setStatement}
                editable={!isPending}
              />
            </View>
            <View className="mt-ku-lg flex-row gap-ku-sm">
              <Button
                className="flex-1"
                variant="secondary"
                disabled={isPending}
                onPress={close}
              >
                {messages.cancel}
              </Button>
              <Button
                className="flex-1"
                disabled={!trimmed || isPending}
                onPress={send}
              >
                {messages.respondSend}
              </Button>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
