import { useState } from "react";
import { Modal, Platform } from "react-native";
import { create } from "zustand";
import { Button } from "@/components/ui/Button";
import { TextArea } from "@/components/ui/TextArea";
import type { DisputeInput } from "@/api/DisputeApi";
import { useLocale } from "@/features/preferences/localeStore";
import { disputeMessages } from "@/locales/disputeMessages";
import { KeyboardAvoidingView, Pressable, ScrollView, Text, View } from "@/tw";

const useForm = create<{ submit: ((input: DisputeInput) => void) | null }>(
  () => ({ submit: null })
);
export function showDisputeForm(submit: (input: DisputeInput) => void) {
  useForm.setState({ submit });
}

export function DisputeFormHost() {
  const submit = useForm((state) => state.submit);
  return submit ? <DisputeForm submit={submit} /> : null;
}

function DisputeForm({ submit }: { submit: (input: DisputeInput) => void }) {
  const { locale } = useLocale();
  const messages = disputeMessages[locale];
  const [category, setCategory] = useState<DisputeInput["category"] | null>(
    null
  );
  const [detail, setDetail] = useState("");
  const labels = messages.categories;
  const close = () => useForm.setState({ submit: null });
  const detailLabel = messages.detailLabel;
  return (
    <Modal visible transparent animationType="slide" onRequestClose={close}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
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
              <Button className="flex-1" variant="secondary" onPress={close}>
                {messages.cancel}
              </Button>
              <Button
                className="flex-1"
                disabled={!category || !detail.trim()}
                onPress={() => {
                  if (!category || !detail.trim()) return;
                  close();
                  submit({ category, submittedDetail: detail.trim() });
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
