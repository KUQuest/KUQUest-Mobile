import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef } from "react";

import { ApiError } from "@/api/ApiClient";
import {
  disputeApi,
  TeamSplitErrorCode,
  type TeamSplitShare,
} from "@/api/DisputeApi";
import { invalidateQuestReads } from "@/features/questBoard/api/questBoardQueries";
import type { TeamSplitMessages } from "@/locales/teamSplitMessages";
import { createIdempotencyKey } from "@/utils/idempotency";

function sharesSignature(shares: TeamSplitShare[]): string {
  return shares
    .map((share) => `${share.memberId}:${share.percentageBasisPoints}`)
    .join(",");
}

/**
 * Submits the Team Leader's split. One `Idempotency-Key` per attempt: a retry
 * of the same shares reuses it, any change to the shares makes a new one.
 */
export function useSubmitTeamSplit(questId: string, viewerId: string | null) {
  const queryClient = useQueryClient();
  const attempt = useRef<{ signature: string; key: string } | null>(null);

  return useMutation({
    mutationFn: (shares: TeamSplitShare[]) => {
      const signature = sharesSignature(shares);
      if (attempt.current?.signature !== signature) {
        attempt.current = {
          signature,
          key: createIdempotencyKey("team-split"),
        };
      }
      return disputeApi.submitTeamSplit(questId, shares, attempt.current.key);
    },
    onSuccess: () => {
      attempt.current = null;
    },
    onError: (error) => {
      // Only a 503 or a network failure is retried with the same key.
      if (error instanceof ApiError && error.status !== 503) {
        attempt.current = null;
      }
    },
    onSettled: () =>
      invalidateQuestReads(queryClient, questId, viewerId ?? undefined),
  });
}

export function teamSplitErrorMessage(
  error: unknown,
  messages: TeamSplitMessages
): string {
  if (!(error instanceof ApiError)) return messages.errors.unavailable;
  switch (error.code) {
    case TeamSplitErrorCode.INVALID:
      return messages.errors.invalid;
    case TeamSplitErrorCode.NOT_AUTHORIZED:
      return messages.errors.notAuthorized;
    case TeamSplitErrorCode.EXPIRED:
      return messages.errors.expired;
    case TeamSplitErrorCode.NOT_READY:
    case TeamSplitErrorCode.NOT_FOUND:
      return messages.errors.notReady;
    default:
      return error.status === 503
        ? messages.errors.unavailable
        : messages.errors.fallback;
  }
}
