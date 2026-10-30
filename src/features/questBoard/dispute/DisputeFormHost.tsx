import { useState } from "react";
import { Modal } from "react-native";
import { create } from "zustand";
import { Button } from "@/components/ui/Button";
import { TextArea } from "@/components/ui/TextArea";
import type { DisputeInput } from "@/api/DisputeApi";
import { useLocale } from "@/features/preferences/localeStore";
import { disputeMessages } from "@/locales/disputeMessages";
import { KeyboardAvoidingView, Pressable, ScrollView, Text, View } from "@/tw";

/** Resolves `true` once the case is filed; `false` keeps the form open. */
type SubmitDispute = (input: DisputeInput) => Promise<boolean>;

const useForm = create<{ submit: SubmitDispute | null }>(() => ({
  submit: null,
}));
export function showDisputeForm(submit: SubmitDispute) {
  useForm.setState({ submit });
}

export function DisputeFormHost() {
  const submit = useForm((state) => state.submit);
  return submit ? <DisputeForm submit={submit} /> : null;
}

function DisputeForm({ submit }: { submit: SubmitDispute }) {
  const { locale } = useLocale();
  const messages = disputeMessages[locale];
  const [category, setCategory] = useState<DisputeInput["category"] | null>(
    null
  );
  const [detail, setDetail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const labels = messages.categories;
  const close = () => {
    if (!isSubmitting) useForm.setState({ submit: null });
  };
  const detailLabel = messages.detailLabel;
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
              {messages.confirmTitle}
            </Text>
            {messages.rules.map((rule) => (
              <Text
                key={rule}
                className="text-ku-body-small text-ku-text-secondary"
              >{`• ${rule}`}</Text>
            ))}
            <Text className="mt-ku-md font-ku-semibold text-ku-text-strong">
              {messages.categoryLabel}
            </Text>
            {(Object.keys(labels) as DisputeInput["category"][]).map(
              (value) => (
                <Pressable
                  key={value}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: category === value }}
                  onPress={() => setCategory(value)}
                  className={`mt-ku-sm rounded-[12px] border p-ku-md ${category === value ? "border-ku-primary bg-ku-surface" : "border-ku-border-subtle"}`}
                >
                  <Text className="text-ku-text-strong">{labels[value]}</Text>
                </Pressable>
              )
            )}
            <View className="mt-ku-md">
              <TextArea
                label={detailLabel}
                accessibilityLabel={detailLabel}
                value={detail}
                onChangeText={setDetail}
              />
            </View>
            <View className="mt-ku-lg flex-row gap-ku-sm">
              <Button
                className="flex-1"
                variant="secondary"
                disabled={isSubmitting}
                onPress={close}
              >
                {messages.cancel}
              </Button>
              <Button
                className="flex-1"
                disabled={!category || !detail.trim() || isSubmitting}
                onPress={() => {
                  if (!category || !detail.trim() || isSubmitting) return;
                  setIsSubmitting(true);
                  void submit({
                    category,
                    submittedDetail: detail.trim(),
                  }).then((filed) => {
                    if (filed) useForm.setState({ submit: null });
                    else setIsSubmitting(false);
                  });
                }}
              >
                {messages.confirm}
              </Button>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
