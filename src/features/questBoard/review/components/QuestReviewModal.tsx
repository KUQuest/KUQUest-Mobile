import type { ReactNode } from "react";
import { Modal, Platform } from "react-native";
import { Star, X } from "lucide-react-native";

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

import styles from "../../styles/questDetailStyles";
import { useQuestReviewFeature } from "../useQuestReviewFeature";

export interface QuestReviewModalProps {
  questId: string | null;
  onClose: () => void;
}

/** Rating Review Popup for a completed Quest; open while `questId` is set. */
export function QuestReviewModal({ questId, onClose }: QuestReviewModalProps) {
  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      transparent
      visible={Boolean(questId)}
    >
      {questId ? (
        <QuestReviewSheet onClose={onClose} questId={questId} />
      ) : null}
    </Modal>
  );
}

function QuestReviewSheet({
  questId,
  onClose,
}: {
  questId: string;
  onClose: () => void;
}) {
  const {
    canReview,
    comment,
    createReviewMutation,
    handleSubmit,
    loading,
    loadError,
    messages,
    mode,
    rating,
    retryLoad,
    selectedTarget,
    setComment,
    setRating,
    setSelectedId,
    setSubmitError,
    submitError,
    targetOptions,
    updateReviewMutation,
    questTitle,
  } = useQuestReviewFeature({ questId, onSubmitted: onClose });
  const pending =
    createReviewMutation.isPending || updateReviewMutation.isPending;
  const notice = (title: string, description: string, action?: ReactNode) => (
    <View className="items-center py-ku-lg">
      <Text className="text-center font-ku-bold text-ku-text-strong">
        {title}
      </Text>
      <Text className="mt-ku-sm text-center text-ku-text-secondary">
        {description}
      </Text>
      {action}
    </View>
  );
  const doneButton = (
    <Button className="mt-ku-20 max-w-[280px]" onPress={onClose}>
      {messages.done}
    </Button>
  );

  return (
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
          testID="quest-review-modal"
        >
          <SafeAreaView className="shrink" edges={["bottom"]}>
            <View className={styles.proofSheetHeader}>
              <View className={styles.proofSheetHeaderCopy}>
                <View className="flex-row items-center gap-ku-sm">
                  <Star color={colors.warningDark} size={22} />
                  <Text
                    accessibilityRole="header"
                    className={styles.proofSheetTitle}
                  >
                    {mode === "edit" ? messages.editTitle : messages.title}
                  </Text>
                </View>
                {questTitle ? (
                  <Text className={styles.proofSheetDescription}>
                    {questTitle}
                  </Text>
                ) : null}
              </View>
              <Pressable
                accessibilityLabel={messages.close}
                accessibilityRole="button"
                className={styles.sheetCloseButton}
                onPress={onClose}
                testID="quest-review-close"
              >
                <X color={colors.textStrong} size={24} />
              </Pressable>
            </View>
            {loading ? (
              <Text className="py-ku-lg text-center text-ku-text-secondary">
                {messages.loading}
              </Text>
            ) : loadError ? (
              notice(
                messages.errorTitle,
                loadError,
                <Button className="mt-ku-20 max-w-[280px]" onPress={retryLoad}>
                  {messages.retry}
                </Button>
              )
            ) : !canReview ? (
              notice(messages.unavailableTitle, messages.unavailableDescription)
            ) : targetOptions.length === 0 ? (
              notice(
                messages.noWorkersTitle,
                messages.noWorkersDescription,
                doneButton
              )
            ) : (
              <>
                <ScrollView
                  className="shrink"
                  contentContainerClassName="gap-ku-20 pt-ku-20 pb-ku-md"
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                >
                  {targetOptions.length === 1 ? (
                    <Text className="font-ku-semibold text-ku-body text-ku-text-strong">
                      {targetOptions[0].label}
                    </Text>
                  ) : null}

                  {targetOptions.length > 1 ? (
                    <View className="gap-ku-sm">
                      <Text className="font-ku-semibold text-ku-body-small text-ku-text-strong">
                        {messages.workerLabel}
                      </Text>
                      <View className="gap-ku-sm">
                        {targetOptions.map((target) => {
                          const selected = target.id === selectedTarget?.id;
                          return (
                            <Pressable
                              accessibilityRole="radio"
                              accessibilityState={{ selected }}
                              className={`min-h-[48px] justify-center rounded-[14px] border p-ku-md ${
                                selected
                                  ? "border-ku-primary bg-ku-surface-success"
                                  : "border-ku-border-subtle bg-ku-surface"
                              }`}
                              key={target.id}
                              onPress={() => {
                                setSelectedId(target.id);
                                setSubmitError(null);
                              }}
                              testID={`quest-review-worker-${target.id}`}
                            >
                              <Text className="font-ku-semibold text-ku-body text-ku-text-strong">
                                {target.label}
                              </Text>
                            </Pressable>
                          );
                        })}
                      </View>
                    </View>
                  ) : null}

                  <View className="gap-ku-12">
                    <Text className="font-ku-semibold text-ku-body-small text-ku-text-strong">
                      {messages.ratingLabel}
                    </Text>
                    <View className="flex-row justify-between rounded-[14px] border border-ku-border-subtle bg-ku-surface px-ku-md py-ku-12">
                      {[1, 2, 3, 4, 5].map((value) => {
                        const selected = value <= rating;
                        return (
                          <Pressable
                            accessibilityLabel={messages.ratingOption(value)}
                            accessibilityRole="radio"
                            accessibilityState={{ selected }}
                            className="h-[48px] w-[48px] items-center justify-center"
                            key={value}
                            onPress={() => {
                              setRating(value);
                              setSubmitError(null);
                            }}
                            testID={`quest-review-rating-${value}`}
                          >
                            <Star
                              color={
                                selected ? colors.warningDark : colors.textMuted
                              }
                              fill={
                                selected ? colors.warningDark : "transparent"
                              }
                              size={32}
                              strokeWidth={2}
                            />
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>

                  <TextArea
                    accessibilityLabel={messages.commentLabel}
                    label={messages.commentLabel}
                    maxLength={1000}
                    onChangeText={(value) => {
                      setComment(value);
                      setSubmitError(null);
                    }}
                    placeholder={messages.commentPlaceholder}
                    testID="quest-review-comment"
                    value={comment}
                  />

                  {submitError ? (
                    <Text
                      accessibilityRole="alert"
                      className="rounded-[12px] bg-ku-surface-danger p-ku-12 text-ku-danger-dark"
                      testID="quest-review-error"
                    >
                      {submitError}
                    </Text>
                  ) : null}
                </ScrollView>
                <View className={styles.proofSheetActions}>
                  <Button
                    className="w-auto flex-1"
                    onPress={onClose}
                    testID="quest-review-done"
                    variant="secondary"
                  >
                    {messages.done}
                  </Button>
                  <Button
                    className="w-auto flex-1"
                    disabled={pending || !selectedTarget}
                    onPress={() => void handleSubmit()}
                    testID="quest-review-submit"
                  >
                    {pending
                      ? messages.submitting
                      : mode === "edit"
                        ? messages.editTitle
                        : messages.submit}
                  </Button>
                </View>
              </>
            )}
          </SafeAreaView>
        </Pressable>
      </KeyboardAvoidingView>
    </Pressable>
  );
}
