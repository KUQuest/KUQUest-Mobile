import { useMemo, useRef, useState } from "react";

import { ApiError } from "@/api/ApiClient";
import { createQuestIdempotencyKey } from "@/api/QuestApi";
import { useSessionQuery } from "@/features/auth/sessionQueries";
import {
  useCreateReviewMutation,
  useLiveQuestSnapshotQuery,
  useQuestAssignmentsQuery,
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
  const assignmentsQuery = useQuestAssignmentsQuery(
    questId ?? null,
    viewerId || null
  );
  const createReviewMutation = useCreateReviewMutation();
  // One key per Worker's pending review; a retry after an unknown outcome
  // replays it, while a new review after a server answer gets a new key.
  const reviewKeysRef = useRef<Record<string, string>>({});
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
        (assignmentsQuery.data ?? [])
          .filter((assignment) => assignment.state !== "ASSIGNMENT_CANCELLED")
          .map((assignment) => assignment.workerId)
      ),
    ];
    return workerIds.map((workerId) => ({
      id: workerId,
      label:
        participantNames.get(workerId) ?? messages.workerFallback(workerId),
    }));
  }, [messages, assignmentsQuery.data, snapshotQuery.data?.participants]);

  const remainingWorkers = workerOptions.filter(
    (worker) => !reviewedWorkerIds.has(worker.id)
  );
  const selectedWorker =
    remainingWorkers.find((worker) => worker.id === selectedWorkerId) ??
    remainingWorkers[0] ??
    null;
  const loading =
    sessionQuery.isPending ||
    snapshotQuery.isPending ||
    assignmentsQuery.isPending;
  const loadError =
    snapshotQuery.error || assignmentsQuery.error || sessionQuery.error;
  const retryLoad = () => {
    void snapshotQuery.refetch();
    void assignmentsQuery.refetch();
  };
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

    const revieweeId = selectedWorker.id;
    const idempotencyKey = (reviewKeysRef.current[revieweeId] ??=
      createQuestIdempotencyKey());
    try {
      await createReviewMutation.mutateAsync({
        questId,
        input: {
          revieweeId,
          rating,
          ...(trimmedComment ? { comment: trimmedComment } : {}),
        },
        viewerId,
        idempotencyKey,
      });
      delete reviewKeysRef.current[revieweeId];
      setReviewedWorkerIds((current) => {
        const next = new Set(current);
        next.add(revieweeId);
        return next;
      });
      setRating(0);
      setComment("");
      setSuccessMessage(messages.successDescription);
    } catch (caught) {
      if (caught instanceof ApiError && caught.status < 500) {
        delete reviewKeysRef.current[revieweeId];
      }
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
    questTitle: snapshotQuery.data?.quest.title,
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
  };
}
