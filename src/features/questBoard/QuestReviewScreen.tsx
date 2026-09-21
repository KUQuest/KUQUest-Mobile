import { useMemo, useState } from "react";
import { Star } from "lucide-react-native";
import { useRouter } from "expo-router";

import { createQuestIdempotencyKey } from "@/api/QuestApi";
import { Button } from "@/components/ui/Button";
import { TextArea } from "@/components/ui/TextArea";
import { TopBar } from "@/components/ui/TopBar";
import { ScreenLayout } from "@/components/layout/ScreenLayout";
import { useSessionQuery } from "@/features/auth/sessionQueries";
import {
  useCreateReviewMutation,
  useLiveQuestSnapshotQuery,
} from "@/features/questBoard/api/questBoardQueries";
import { useLocale } from "@/features/preferences/localeStore";
import { questReviewMessages } from "@/locales/questReviewMessages";
import { colors } from "@/theme/colors";
import { Pressable, ScrollView, Text, View } from "@/tw";

interface QuestReviewScreenProps {
  questId?: string;
}

type WorkerOption = {
  id: string;
  label: string;
};

export default function QuestReviewScreen({ questId }: QuestReviewScreenProps) {
  const router = useRouter();
  const { locale } = useLocale();
  const messages = questReviewMessages[locale];
  const sessionQuery = useSessionQuery();
  const viewerId = sessionQuery.data?.user.id ?? "";
  const snapshotQuery = useLiveQuestSnapshotQuery(
    questId ?? null,
    viewerId || null,
    {},
    Boolean(questId && viewerId)
  );
  const createReviewMutation = useCreateReviewMutation();
  const [selectedWorkerId, setSelectedWorkerId] = useState<string | null>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [reviewedWorkerIds, setReviewedWorkerIds] = useState<Set<string>>(
    () => new Set()
  );
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const workerOptions = useMemo<WorkerOption[]>(() => {
    const participantNames = new Map(
      (snapshotQuery.data?.participants ?? []).map((participant) => [
        participant.id,
        participant.displayName,
      ])
    );
    const workerIds = [
      ...new Set(
        (snapshotQuery.data?.assignments ?? [])
          .filter((assignment) => assignment.state !== "ASSIGNMENT_CANCELLED")
          .map((assignment) => assignment.workerId)
          .filter(Boolean)
      ),
    ];
    return workerIds.map((workerId) => ({
      id: workerId,
      label:
        participantNames.get(workerId) ?? messages.workerFallback(workerId),
    }));
  }, [
    messages,
    snapshotQuery.data?.assignments,
    snapshotQuery.data?.participants,
  ]);

  const remainingWorkers = workerOptions.filter(
    (worker) => !reviewedWorkerIds.has(worker.id)
  );
  const selectedWorker =
    remainingWorkers.find((worker) => worker.id === selectedWorkerId) ??
    remainingWorkers[0] ??
    null;
  const loading = sessionQuery.isPending || snapshotQuery.isPending;
  const loadError = snapshotQuery.error || sessionQuery.error;
  const canReview = snapshotQuery.data?.capabilities.canCreateReview === true;
  const allReviewed = workerOptions.length > 0 && remainingWorkers.length === 0;

  const handleSubmit = async () => {
    if (!questId || !selectedWorker) return;
    setSubmitError(null);
    setSuccessMessage(null);
    const trimmedComment = comment.trim();
    if (rating < 1 || rating > 5) {
      setSubmitError(messages.invalidRating);
      return;
    }
    if (trimmedComment.length > 1000) {
      setSubmitError(messages.invalidComment);
      return;
    }

    try {
      await createReviewMutation.mutateAsync({
        questId,
        input: {
          revieweeId: selectedWorker.id,
          rating,
          ...(trimmedComment ? { comment: trimmedComment } : {}),
        },
        viewerId,
        idempotencyKey: createQuestIdempotencyKey(),
      });
      setReviewedWorkerIds((current) => {
        const next = new Set(current);
        next.add(selectedWorker.id);
        return next;
      });
      setRating(0);
      setComment("");
      setSuccessMessage(messages.successDescription);
    } catch (caught) {
      setSubmitError(
        caught instanceof Error ? caught.message : messages.errorDescription
      );
    }
  };

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
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-center text-ku-text-secondary">
            {messages.loading}
          </Text>
        </View>
      ) : loadError ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-center font-ku-bold text-ku-text-strong">
            {messages.errorTitle}
          </Text>
          <Text className="mt-2 text-center text-ku-text-secondary">
            {loadError instanceof Error
              ? loadError.message
              : messages.errorDescription}
          </Text>
          <Button
            className="mt-5 max-w-[280px]"
            onPress={() => void snapshotQuery.refetch()}
          >
            {messages.retry}
          </Button>
        </View>
      ) : !canReview ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-center font-ku-bold text-ku-text-strong">
            {messages.unavailableTitle}
          </Text>
          <Text className="mt-2 text-center text-ku-text-secondary">
            {messages.unavailableDescription}
          </Text>
        </View>
      ) : allReviewed ? (
        <View
          className="flex-1 items-center justify-center px-6"
          testID="quest-review-success"
        >
          <Text className="text-center font-ku-bold text-ku-text-strong">
            {messages.successTitle}
          </Text>
          <Text className="mt-2 text-center text-ku-text-secondary">
            {messages.successDescription}
          </Text>
          <Button className="mt-5 max-w-[280px]" onPress={() => router.back()}>
            {messages.done}
          </Button>
        </View>
      ) : workerOptions.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-center font-ku-bold text-ku-text-strong">
            {messages.noWorkersTitle}
          </Text>
          <Text className="mt-2 text-center text-ku-text-secondary">
            {messages.noWorkersDescription}
          </Text>
          <Button className="mt-5 max-w-[280px]" onPress={() => router.back()}>
            {messages.done}
          </Button>
        </View>
      ) : (
        <ScrollView
          contentContainerClassName="gap-5 px-5 pt-5 pb-10"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View>
            <Text className="font-ku-bold text-ku-title text-ku-text-strong">
              {snapshotQuery.data?.quest.title}
            </Text>
            <Text className="mt-2 text-ku-body-small text-ku-text-secondary">
              {messages.description}
            </Text>
          </View>

          {remainingWorkers.length > 1 ? (
            <View className="gap-2">
              <Text className="font-ku-semibold text-ku-body-small text-ku-text-strong">
                {messages.workerLabel}
              </Text>
              <View className="gap-2">
                {remainingWorkers.map((worker) => {
                  const selected = worker.id === selectedWorker?.id;
                  return (
                    <Pressable
                      accessibilityRole="radio"
                      accessibilityState={{ selected }}
                      className={`rounded-[14px] border p-4 ${
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

          <View className="gap-3">
            <Text className="font-ku-semibold text-ku-body-small text-ku-text-strong">
              {messages.ratingLabel}
            </Text>
            <View className="flex-row justify-between rounded-[14px] border border-ku-border-subtle bg-ku-surface px-4 py-3">
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
              className="rounded-[12px] bg-ku-surface-success p-3 text-ku-primary"
              testID="quest-review-success"
            >
              {successMessage}
            </Text>
          ) : null}
          {submitError ? (
            <Text
              accessibilityRole="alert"
              className="rounded-[12px] bg-ku-surface-danger p-3 text-ku-danger-dark"
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
