import { useMemo } from "react";

import { Button } from "@/components/ui/Button";
import { formatTimestamp } from "@/domain/datetime";
import { useLocale } from "@/features/preferences/localeStore";
import { questBoardMessages } from "@/locales/questBoardMessages";
import { Text, View } from "@/tw";
import { cn } from "@/tw/cn";

import { QuestProofStatus } from "../../domain/types";
import type { ProofReviewRow } from "../proofReviewRows";

export interface ProofReviewSubmissionCardProps {
  row: ProofReviewRow;
  canReview: boolean;
  /** Evidence links for this submission are loading. */
  opening: boolean;
  onReview: (proofId: string) => void;
}

const statusTone: Record<string, string> = {
  [QuestProofStatus.PROOF_PENDING]:
    "border-ku-border-warning bg-ku-surface-warning",
  [QuestProofStatus.PROOF_APPROVED]:
    "border-ku-border-success bg-ku-surface-success",
  [QuestProofStatus.PROOF_NOT_APPROVED]:
    "border-ku-border-danger bg-ku-surface-danger",
};

/** One Assignment (or the Candidate Team) in the Hirer proof review list. */
export function ProofReviewSubmissionCard({
  row,
  canReview,
  opening,
  onReview,
}: ProofReviewSubmissionCardProps) {
  const { locale } = useLocale();
  const messages = questBoardMessages[locale];
  const { proof } = row;
  const status = proof?.status ?? null;
  const name =
    row.name ??
    (row.kind === "team"
      ? messages.teamBannerTitle
      : messages.proofReviewWorkerFallback);
  const submittedAt = useMemo(
    () => formatTimestamp(proof?.submittedAt, locale, ""),
    [locale, proof?.submittedAt]
  );
  const reviewable =
    canReview && proof !== null && status === QuestProofStatus.PROOF_PENDING;

  return (
    <View
      className="gap-ku-sm rounded-[14px] border border-ku-border-subtle bg-ku-surface p-ku-14"
      testID={`proof-review-row-${row.key}`}
    >
      <View className="flex-row flex-wrap items-center justify-between gap-ku-sm">
        <Text
          accessibilityRole="header"
          className="shrink font-ku-bold text-ku-body text-ku-text-strong"
        >
          {name}
        </Text>
        <View
          className={cn(
            "rounded-ku-pill border px-ku-10 py-ku-xs",
            (status && statusTone[status]) ??
              "border-ku-border-subtle bg-ku-surface-muted"
          )}
        >
          <Text
            className="font-ku-semibold text-ku-label text-ku-text-strong"
            testID={`proof-review-status-${row.key}`}
          >
            {messages.proofReviewStatus(status)}
          </Text>
        </View>
      </View>
      {row.kind === "team" ? (
        <Text className="font-ku-regular text-ku-body-small text-ku-text-secondary">
          {messages.proofReviewTeamSubmittedBy(
            row.leaderName ?? messages.teamLeader
          )}
        </Text>
      ) : null}
      {submittedAt ? (
        <Text className="font-ku-regular text-ku-body-small text-ku-text-secondary">
          {`${messages.proofReviewSubmittedAt}: ${submittedAt}`}
        </Text>
      ) : null}
      {reviewable ? (
        <Button
          accessibilityLabel={messages.proofReviewOpenLabel(name)}
          accessibilityState={{ disabled: opening, busy: opening }}
          disabled={opening}
          onPress={() => onReview(proof.id)}
          testID={`proof-review-open-${proof.id}`}
        >
          {opening ? messages.loading : messages.proofReviewOpen}
        </Button>
      ) : null}
    </View>
  );
}
