import { Star } from "lucide-react-native";
import { useRouter } from "expo-router";

import { Button } from "@/components/ui/Button";
import { TextArea } from "@/components/ui/TextArea";
import { TopBar } from "@/components/ui/TopBar";
import { ScreenLayout } from "@/components/layout/ScreenLayout";
import { colors } from "@/theme/colors";
import { Pressable, ScrollView, Text, View } from "@/tw";

import { useQuestReviewFeature } from "./useQuestReviewFeature";

interface QuestReviewScreenProps {
  questId?: string;
}

export default function QuestReviewScreen({ questId }: QuestReviewScreenProps) {
  const router = useRouter();
  const {
    allReviewed,
    canReview,
    comment,
    createReviewMutation,
    handleSubmit,
    loading,
    loadError,
    messages,
    rating,
    remainingWorkers,
    questTitle,
    retryLoad,
    selectedWorker,
    setComment,
    setRating,
    setSelectedWorkerId,
    setSubmitError,
    setSuccessMessage,
    submitError,
    successMessage,
    workerOptions,
  } = useQuestReviewFeature({ questId });
  return (
    <ScreenLayout
      className="flex-1 bg-ku-background"
      edges={["top", "left", "right", "bottom"]}
    >
      <TopBar
        backLabel={messages.back}
        onBackPress={() => router.back()}
        title={messages.title}
      />
      {loading ? (
        <View className="flex-1 items-center justify-center px-ku-lg">
          <Text className="text-center text-ku-text-secondary">
            {messages.loading}
          </Text>
        </View>
      ) : loadError ? (
        <View className="flex-1 items-center justify-center px-ku-lg">
          <Text className="text-center font-ku-bold text-ku-text-strong">
            {messages.errorTitle}
          </Text>
          <Text className="mt-ku-sm text-center text-ku-text-secondary">
            {loadError instanceof Error
              ? loadError.message
              : messages.errorDescription}
          </Text>
          <Button className="mt-ku-20 max-w-[280px]" onPress={retryLoad}>
            {messages.retry}
          </Button>
        </View>
      ) : !canReview ? (
        <View className="flex-1 items-center justify-center px-ku-lg">
          <Text className="text-center font-ku-bold text-ku-text-strong">
            {messages.unavailableTitle}
          </Text>
          <Text className="mt-ku-sm text-center text-ku-text-secondary">
            {messages.unavailableDescription}
          </Text>
        </View>
      ) : allReviewed ? (
        <View
          className="flex-1 items-center justify-center px-ku-lg"
          testID="quest-review-success"
        >
          <Text className="text-center font-ku-bold text-ku-text-strong">
            {messages.successTitle}
          </Text>
          <Text className="mt-ku-sm text-center text-ku-text-secondary">
            {messages.successDescription}
          </Text>
          <Button
            className="mt-ku-20 max-w-[280px]"
            onPress={() => router.back()}
          >
            {messages.done}
          </Button>
        </View>
      ) : workerOptions.length === 0 ? (
        <View className="flex-1 items-center justify-center px-ku-lg">
          <Text className="text-center font-ku-bold text-ku-text-strong">
            {messages.noWorkersTitle}
          </Text>
          <Text className="mt-ku-sm text-center text-ku-text-secondary">
            {messages.noWorkersDescription}
          </Text>
          <Button
            className="mt-ku-20 max-w-[280px]"
            onPress={() => router.back()}
          >
            {messages.done}
          </Button>
        </View>
      ) : (
        <ScrollView
          contentContainerClassName="gap-ku-20 px-ku-20 pt-ku-20 pb-ku-40"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View>
            <Text className="font-ku-bold text-ku-title text-ku-text-strong">
              {questTitle}
            </Text>
            <Text className="mt-ku-sm text-ku-body-small text-ku-text-secondary">
              {messages.description}
            </Text>
          </View>

          {remainingWorkers.length > 1 ? (
            <View className="gap-ku-sm">
              <Text className="font-ku-semibold text-ku-body-small text-ku-text-strong">
                {messages.workerLabel}
              </Text>
              <View className="gap-ku-sm">
                {remainingWorkers.map((worker) => {
                  const selected = worker.id === selectedWorker?.id;
                  return (
                    <Pressable
                      accessibilityRole="radio"
                      accessibilityState={{ selected }}
                      className={`rounded-[14px] border p-ku-md ${
                        selected
                          ? "border-ku-primary bg-ku-surface-success"
                          : "border-ku-border-subtle bg-ku-surface"
                      }`}
                      key={worker.id}
                      onPress={() => {
                        setSelectedWorkerId(worker.id);
                        setSubmitError(null);
                        setSuccessMessage(null);
                      }}
                      testID={`quest-review-worker-${worker.id}`}
                    >
                      <Text className="font-ku-semibold text-ku-body text-ku-text-strong">
                        {worker.label}
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
                    key={value}
                    onPress={() => {
                      setRating(value);
                      setSubmitError(null);
                    }}
                    testID={`quest-review-rating-${value}`}
                  >
                    <Star
                      color={selected ? colors.warningDark : colors.textMuted}
                      fill={selected ? colors.warningDark : "transparent"}
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

          {successMessage ? (
            <Text
              className="rounded-[12px] bg-ku-surface-success p-ku-12 text-ku-primary"
              testID="quest-review-success"
            >
              {successMessage}
            </Text>
          ) : null}
          {submitError ? (
            <Text
              accessibilityRole="alert"
              className="rounded-[12px] bg-ku-surface-danger p-ku-12 text-ku-danger-dark"
              testID="quest-review-error"
            >
              {submitError}
            </Text>
          ) : null}

          <Button
            disabled={createReviewMutation.isPending || !selectedWorker}
            onPress={() => void handleSubmit()}
            testID="quest-review-submit"
          >
            {createReviewMutation.isPending
              ? messages.submitting
              : messages.submit}
          </Button>
          <Button
            onPress={() => router.back()}
            testID="quest-review-done"
            variant="secondary"
          >
            {messages.done}
          </Button>
        </ScrollView>
      )}
    </ScreenLayout>
  );
}
