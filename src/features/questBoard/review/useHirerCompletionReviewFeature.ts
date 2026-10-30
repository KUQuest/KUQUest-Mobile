import { useMemo, useState } from "react";

import {
  createQuestIdempotencyKey,
  type QuestV2CompletionConfirmationReviewPayload,
} from "@/api/QuestApi";
import { useSessionQuery } from "@/features/auth/sessionQueries";
import {
  useLiveQuestSnapshotQuery,
  useReviewCompletionConfirmationMutation,
} from "@/features/questBoard/api/questBoardQueries";
import {
  QuestActor,
  QuestCompletionConfirmationStatus,
} from "@/features/questBoard/domain/types";
import { questBoardMessages } from "@/locales/questBoardMessages";
import { useLocale } from "@/features/preferences/localeStore";
import { getLocalizedErrorMessage } from "@/utils/error";
import { projectCompletionConfirmationReviewRows } from "./completionConfirmationReviewRows";

export function useHirerCompletionReviewFeature(questId?: string) {
  const viewerId = useSessionQuery().data?.user.id || null;
  const { locale } = useLocale();
  const messages = questBoardMessages[locale];
  const snapshotQuery = useLiveQuestSnapshotQuery(questId ?? null, viewerId);
  const reviewMutation = useReviewCompletionConfirmationMutation();
  const [reviewError, setReviewError] = useState<string>();
  const snapshot = snapshotQuery.data;
  const rows = useMemo(
    () => (snapshot ? projectCompletionConfirmationReviewRows(snapshot) : []),
    [snapshot]
  );
  const pendingCount = rows.filter(
    (row) =>
      row.confirmation.reviewStatus ===
      QuestCompletionConfirmationStatus.COMPLETION_CONFIRMATION_PENDING
  ).length;
  const canReview =
    snapshot?.actor === QuestActor.HIRER && snapshot.proofRequired === false;

  const review = async (
    completionConfirmationId: string,
    payload: QuestV2CompletionConfirmationReviewPayload
  ) => {
    if (!questId || !viewerId || !canReview) return false;
    setReviewError(undefined);
    try {
      await reviewMutation.mutateAsync({
        questId,
        completionConfirmationId,
        payload,
        viewerId,
        idempotencyKey: createQuestIdempotencyKey(),
      });
      await snapshotQuery.refetch();
      return true;
    } catch (caught) {
      setReviewError(
        getLocalizedErrorMessage(caught, locale, {
          fallback: messages.errorDescription,
        })
      );
      await snapshotQuery.refetch();
      return false;
    }
  };

  return {
    canReview,
    clearReviewError: () => setReviewError(undefined),
    pendingCount,
    review,
    reviewError,
    rows,
    snapshot,
    snapshotQuery,
    reviewing: reviewMutation.isPending,
  };
}
