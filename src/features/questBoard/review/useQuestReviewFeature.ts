import { useMemo, useState } from "react";

import { createQuestIdempotencyKey } from "@/api/QuestApi";
import { useSessionQuery } from "@/features/auth/sessionQueries";
import {
  useCreateReviewMutation,
  useLiveQuestSnapshotQuery,
} from "@/features/questBoard/api/questBoardQueries";
import { useLocale } from "@/features/preferences/localeStore";
import { questReviewMessages } from "@/locales/questReviewMessages";

interface QuestReviewFeatureProps {
  questId?: string;
}

type WorkerOption = {
  id: string;
  label: string;
};

export function useQuestReviewFeature({ questId }: QuestReviewFeatureProps) {
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

  return {
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
    selectedWorker,
    setComment,
    setRating,
    setSelectedWorkerId,
    setSubmitError,
    setSuccessMessage,
    snapshotQuery,
    submitError,
    successMessage,
    workerOptions,
  };
}
