import { useMemo, useRef, useState } from "react";

import { ApiError } from "@/api/ApiClient";
import { createQuestIdempotencyKey } from "@/api/QuestApi";
import { useSessionQuery } from "@/features/auth/sessionQueries";
import {
  useCreateReviewMutation,
  useLiveQuestSnapshotQuery,
  useQuestAssignmentsQuery,
  useQuestReviewsQuery,
  useUpdateReviewMutation,
} from "@/features/questBoard/api/questBoardQueries";
import {
  QuestActor,
  QuestAssignmentStatus,
} from "@/features/questBoard/domain/types";
import { useLocale } from "@/features/preferences/localeStore";
import { questReviewMessages } from "@/locales/questReviewMessages";
import { getLocalizedErrorMessage } from "@/utils/error";

interface QuestReviewFeatureProps {
  questId?: string;
  onSubmitted?: () => void;
}

type ReviewTarget = { id: string; label: string };

export const HIRER_REVIEW_TARGET_ID = "hirer";

export function useQuestReviewFeature({
  questId,
  onSubmitted,
}: QuestReviewFeatureProps) {
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
  const reviewsQuery = useQuestReviewsQuery(questId ?? null, viewerId || null);
  const createReviewMutation = useCreateReviewMutation();
  const updateReviewMutation = useUpdateReviewMutation();
  const reviewKeysRef = useRef<Record<string, string>>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);

  const actor = snapshotQuery.data?.actor;
  const targetOptions = useMemo<ReviewTarget[]>(() => {
    if (actor === QuestActor.WORKER) {
      const quest = snapshotQuery.data?.quest;
      const hirerName =
        quest && "hirerName" in quest ? quest.hirerName : undefined;
      return [
        {
          id: HIRER_REVIEW_TARGET_ID,
          label: hirerName || messages.hirerLabel,
        },
      ];
    }
    if (actor !== QuestActor.HIRER) return [];
    const participantNames = new Map(
      (snapshotQuery.data?.participants ?? []).map((participant) => [
        participant.id,
        participant.displayName,
      ])
    );
    const workerIds = new Set<string>();
    const workerAssignments = (assignmentsQuery.data ?? []).filter(
      (assignment) => {
        if (
          assignment.state === QuestAssignmentStatus.ASSIGNMENT_CANCELLED ||
          workerIds.has(assignment.workerId)
        ) {
          return false;
        }
        workerIds.add(assignment.workerId);
        return true;
      }
    );
    return workerAssignments.map((assignment, index) => ({
      id: assignment.workerId,
      label:
        assignment.member?.displayName ??
        participantNames.get(assignment.workerId) ??
        messages.workerFallback(index + 1),
    }));
  }, [actor, assignmentsQuery.data, messages, snapshotQuery.data]);
  const selectedTarget =
    targetOptions.find((target) => target.id === selectedId) ??
    targetOptions[0] ??
    null;
  const authored = (reviewsQuery.data ?? []).filter(
    (review) => review.reviewerId === viewerId
  );
  const existingReview = selectedTarget
    ? actor === QuestActor.WORKER
      ? authored[0]
      : authored.find((review) => review.revieweeId === selectedTarget.id)
    : undefined;
  const reviewStateKey = `${selectedTarget?.id}:${existingReview?.id ?? ""}:${existingReview?.rating}:${existingReview?.comment}`;
  const [previousReviewStateKey, setPreviousReviewStateKey] = useState<
    string | null
  >(null);
  if (reviewStateKey !== previousReviewStateKey) {
    setPreviousReviewStateKey(reviewStateKey);
    setRating(existingReview?.rating ?? 0);
    setComment(existingReview?.comment ?? "");
    setSubmitError(null);
  }
  const loading =
    sessionQuery.isPending ||
    snapshotQuery.isPending ||
    assignmentsQuery.isPending ||
    reviewsQuery.isPending;
  const loadError =
    snapshotQuery.error ||
    assignmentsQuery.error ||
    reviewsQuery.error ||
    sessionQuery.error;
  const loadErrorMessage = loadError
    ? getLocalizedErrorMessage(loadError, locale, {
        fallback: messages.errorDescription,
      })
    : undefined;
  const retryLoad = () => {
    void snapshotQuery.refetch();
    void assignmentsQuery.refetch();
    void reviewsQuery.refetch();
  };
  const canReview = snapshotQuery.data?.capabilities.canCreateReview === true;

  const handleSubmit = async () => {
    if (!questId || !viewerId || !selectedTarget || loadError) return;
    setSubmitError(null);
    const trimmedComment = comment.trim();
    if (rating < 1 || rating > 5) {
      setSubmitError(messages.invalidRating);
      return;
    }
    if (trimmedComment.length > 1000) {
      setSubmitError(messages.invalidComment);
      return;
    }

    const idempotencyKey = (reviewKeysRef.current[selectedTarget.id] ??=
      createQuestIdempotencyKey());
    try {
      if (existingReview) {
        await updateReviewMutation.mutateAsync({
          questId,
          viewerId,
          reviewId: existingReview.id,
          revieweeId: existingReview.revieweeId,
          input: { rating, comment: trimmedComment || undefined },
          idempotencyKey,
        });
      } else {
        await createReviewMutation.mutateAsync({
          questId,
          viewerId,
          input: {
            rating,
            ...(trimmedComment ? { comment: trimmedComment } : {}),
            ...(actor === QuestActor.HIRER
              ? { revieweeId: selectedTarget.id }
              : {}),
          },
          idempotencyKey,
        });
      }
      delete reviewKeysRef.current[selectedTarget.id];
      onSubmitted?.();
    } catch (caught) {
      if (caught instanceof ApiError && caught.status < 500) {
        delete reviewKeysRef.current[selectedTarget.id];
      }
      setSubmitError(
        getLocalizedErrorMessage(caught, locale, {
          fallback: messages.errorDescription,
        })
      );
    }
  };

  return {
    actor,
    canReview,
    comment,
    createReviewMutation,
    updateReviewMutation,
    handleSubmit,
    loading,
    loadError: loadErrorMessage,
    mode: existingReview ? "edit" : "create",
    messages,
    rating,
    retryLoad,
    selectedTarget,
    setComment,
    setRating,
    setSelectedId,
    setSubmitError,
    submitError,
    targetOptions,
    questTitle: snapshotQuery.data?.quest.title,
  };
}
