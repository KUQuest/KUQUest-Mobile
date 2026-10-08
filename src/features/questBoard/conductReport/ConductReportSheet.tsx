import { Modal, Platform } from "react-native";
import { Flag, X } from "lucide-react-native";

import { Button } from "@/components/ui/Button";
import { TextArea } from "@/components/ui/TextArea";
import { colors } from "@/theme/colors";
import {
  KeyboardAvoidingView,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  View,
} from "@/tw";

import styles from "../styles/questDetailStyles";
import type { useHirerConductReport } from "./useHirerConductReport";

type ConductReportSheetProps = Pick<
  ReturnType<typeof useHirerConductReport>,
  | "messages"
  | "open"
  | "closeReport"
  | "targets"
  | "selectedTarget"
  | "setSelectedId"
  | "detail"
  | "setDetail"
  | "submit"
  | "submitting"
  | "submitError"
>;

/** Hirer form for a CONDUCT_ABANDONED Conduct Report. */
export function ConductReportSheet({
  messages,
  open,
  closeReport,
  targets,
  selectedTarget,
  setSelectedId,
  detail,
  setDetail,
  submit,
  submitting,
  submitError,
}: ConductReportSheetProps) {
  return (
    <Modal
      animationType="slide"
      onRequestClose={closeReport}
      transparent
      visible={open}
    >
      <Pressable
        accessibilityLabel={messages.close}
        accessibilityRole="button"
        className={styles.proofSheetBackdrop}
        onPress={closeReport}
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
            testID="conduct-report-sheet"
          >
            <SafeAreaView className="shrink" edges={["bottom"]}>
              <View className={styles.proofSheetHeader}>
                <View className={styles.proofSheetHeaderCopy}>
                  <View className="flex-row items-center gap-ku-sm">
                    <Flag color={colors.danger} size={22} />
                    <Text
                      accessibilityRole="header"
                      className={styles.proofSheetTitle}
                    >
                      {messages.title}
                    </Text>
                  </View>
                </View>
                <Pressable
                  accessibilityLabel={messages.close}
                  accessibilityRole="button"
                  className={styles.sheetCloseButton}
                  onPress={closeReport}
                  testID="conduct-report-close"
                >
                  <X color={colors.textStrong} size={24} />
                </Pressable>
              </View>
              <ScrollView
                className="shrink"
                contentContainerClassName="gap-ku-20 pt-ku-20 pb-ku-md"
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                <View className="gap-ku-xs">
                  {messages.rules.map((rule) => (
                    <Text
                      className="text-ku-body-small text-ku-text-secondary"
                      key={rule}
                    >
                      {`• ${rule}`}
                    </Text>
                  ))}
                </View>

                <View className="gap-ku-sm">
                  <Text className="font-ku-semibold text-ku-body-small text-ku-text-strong">
                    {messages.workerLabel}
                  </Text>
                  {targets.map((target) => {
                    const selected = target.id === selectedTarget?.id;
                    return (
                      <Pressable
                        accessibilityRole="radio"
                        accessibilityState={{ selected }}
                        className={`min-h-[48px] justify-center rounded-[14px] border p-ku-md ${
                          selected
                            ? "border-ku-danger bg-ku-surface-danger"
                            : "border-ku-border-subtle bg-ku-surface"
                        }`}
                        key={target.id}
                        onPress={() => setSelectedId(target.id)}
                        testID={`conduct-report-worker-${target.id}`}
                      >
                        <Text className="font-ku-semibold text-ku-body text-ku-text-strong">
                          {target.label}
                        </Text>
                        <Text className="text-ku-body-small text-ku-text-secondary">
                          {messages.reasonAbandoned}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                <TextArea
                  accessibilityLabel={messages.detailLabel}
                  label={messages.detailLabel}
                  maxLength={1000}
                  onChangeText={setDetail}
                  placeholder={messages.detailPlaceholder}
                  testID="conduct-report-detail"
                  value={detail}
                />

                {submitError ? (
                  <Text
                    accessibilityRole="alert"
                    className="rounded-[12px] bg-ku-surface-danger p-ku-12 text-ku-danger-dark"
                    testID="conduct-report-error"
                  >
                    {submitError}
                  </Text>
                ) : null}
              </ScrollView>
              <View className={styles.proofSheetActions}>
                <Button
                  className="w-auto flex-1"
                  disabled={submitting}
                  onPress={closeReport}
                  testID="conduct-report-cancel"
                  variant="secondary"
                >
                  {messages.cancel}
                </Button>
                <Button
                  className="w-auto flex-1"
                  disabled={submitting || !selectedTarget}
                  onPress={() => void submit()}
                  testID="conduct-report-submit"
                >
                  {submitting ? messages.submitting : messages.submit}
                </Button>
              </View>
            </SafeAreaView>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}
