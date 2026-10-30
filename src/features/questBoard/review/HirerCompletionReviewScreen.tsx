import { useState } from "react";
import { useRouter } from "expo-router";

import type { QuestV2CompletionConfirmationReviewPayload } from "@/api/QuestApi";
import { Button } from "@/components/ui/Button";
import { ScreenLayout } from "@/components/layout/ScreenLayout";
import { StateView } from "@/components/ui/StateView";
import { TopBar } from "@/components/ui/TopBar";
import { formatTimestamp } from "@/domain/datetime";
import { useLocale } from "@/features/preferences/localeStore";
import { questBoardMessages } from "@/locales/questBoardMessages";
import { ScrollView, Text, View } from "@/tw";
import { cn } from "@/tw/cn";
import { goBackOrReplace } from "@/utils/navigation";
import { QuestCompletionConfirmationStatus } from "../domain/types";
import type { CompletionConfirmationReviewRow } from "./completionConfirmationReviewRows";
import { CompletionConfirmationReviewModal } from "./components/CompletionConfirmationReviewModal";
import { useHirerCompletionReviewFeature } from "./useHirerCompletionReviewFeature";

export interface HirerCompletionReviewScreenProps {
  questId?: string;
}

const statusTone: Record<QuestCompletionConfirmationStatus, string> = {
  [QuestCompletionConfirmationStatus.COMPLETION_CONFIRMATION_PENDING]:
    "border-ku-border-warning bg-ku-surface-warning",
  [QuestCompletionConfirmationStatus.COMPLETION_CONFIRMATION_APPROVED]:
    "border-ku-border-success bg-ku-surface-success",
  [QuestCompletionConfirmationStatus.COMPLETION_CONFIRMATION_NOT_APPROVED]:
    "border-ku-border-danger bg-ku-surface-danger",
  [QuestCompletionConfirmationStatus.COMPLETION_CONFIRMATION_CANCELLED]:
    "border-ku-border-subtle bg-ku-surface-muted",
};

function CompletionConfirmationCard({
  row,
  canReview,
  onReview,
}: {
  row: CompletionConfirmationReviewRow;
  canReview: boolean;
  onReview: (id: string) => void;
}) {
  const { locale } = useLocale();
  const messages = questBoardMessages[locale];
  const { confirmation } = row;
  const pending =
    confirmation.reviewStatus ===
    QuestCompletionConfirmationStatus.COMPLETION_CONFIRMATION_PENDING;
  const name =
    row.kind === "team"
      ? (row.name ?? messages.completionReviewTeamFallback)
      : (row.name ?? messages.completionReviewWorkerFallback);
  const confirmedAt = formatTimestamp(confirmation.confirmedAt, locale, "");
  const reviewDeadlineAt = formatTimestamp(
    confirmation.reviewDeadlineAt,
    locale,
    ""
  );

  return (
    <View
      className="gap-ku-sm rounded-[14px] border border-ku-border-subtle bg-ku-surface p-ku-14"
      testID={`completion-confirmation-review-row-${row.key}`}
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
            statusTone[confirmation.reviewStatus] ??
              "border-ku-border-subtle bg-ku-surface-muted"
          )}
        >
          <Text
            className="font-ku-semibold text-ku-label text-ku-text-strong"
            testID={`completion-confirmation-review-status-${row.key}`}
          >
            {messages.completionReviewStatus(confirmation.reviewStatus)}
          </Text>
        </View>
      </View>
      {confirmedAt ? (
        <Text className="font-ku-regular text-ku-body-small text-ku-text-secondary">
          {`${messages.completionReviewSentAt}: ${confirmedAt}`}
        </Text>
      ) : null}
      {pending && reviewDeadlineAt ? (
        <Text className="font-ku-regular text-ku-body-small text-ku-text-secondary">
          {`${messages.completionReviewDeadline}: ${reviewDeadlineAt}`}
        </Text>
      ) : null}
      {confirmation.reviewReason ? (
        <Text className="font-ku-regular text-ku-body-small text-ku-text-secondary">
          {`${messages.proofNotApprovedReason}: ${confirmation.reviewReason}`}
        </Text>
      ) : null}
      {pending && canReview ? (
        <Button
          accessibilityLabel={messages.proofReviewOpenLabel(name)}
          className="self-start px-ku-lg"
          onPress={() => onReview(confirmation.id)}
          testID={`completion-confirmation-review-open-${row.key}`}
        >
          {messages.proofReviewOpen}
        </Button>
      ) : null}
    </View>
  );
}

export default function HirerCompletionReviewScreen({
  questId,
}: HirerCompletionReviewScreenProps) {
  const router = useRouter();
  const { locale } = useLocale();
  const messages = questBoardMessages[locale];
  const {
    canReview,
    clearReviewError,
    pendingCount,
    review,
    reviewError,
    reviewing,
    rows,
    snapshot,
    snapshotQuery,
  } = useHirerCompletionReviewFeature(questId);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedRow =
    rows.find((row) => row.confirmation.id === selectedId) ?? null;
  const closeReview = () => {
    setSelectedId(null);
    clearReviewError();
  };
  const submitReview = (
    payload: QuestV2CompletionConfirmationReviewPayload
  ) => {
    if (!selectedRow) return Promise.resolve(false);
    return review(selectedRow.confirmation.id, payload);
  };

  return (
    <ScreenLayout className="flex-1 bg-ku-background">
      <TopBar
        backLabel={messages.back}
        onBackPress={() => goBackOrReplace(router, "/(tabs)/my-quests")}
        title={messages.completionReviewTitle}
      />
      {snapshotQuery.isPending ? (
        <View className="p-ku-lg">
          <Text>{messages.loading}</Text>
        </View>
      ) : snapshotQuery.isError || !snapshot || !canReview ? (
        <StateView
          actionLabel={messages.retry}
          description={messages.errorDescription}
          onAction={() => void snapshotQuery.refetch()}
          title={messages.errorTitle}
          variant="error"
        />
      ) : rows.length === 0 ? (
        <StateView
          actionLabel={messages.back}
          description={messages.completionReviewNothingPending}
          onAction={() => goBackOrReplace(router, "/(tabs)/my-quests")}
          title={messages.completionReviewTitle}
          variant="empty"
        />
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerClassName="gap-ku-md px-ku-lg pt-ku-md pb-ku-xl"
          testID="hirer-completion-review-screen"
        >
          <View className="gap-ku-xs">
            <Text
              accessibilityRole="header"
              className="font-ku-bold text-ku-body text-ku-text-strong"
            >
              {snapshot.quest.title}
            </Text>
            <Text className="font-ku-regular text-ku-body-small text-ku-text-secondary">
              {messages.completionReviewDescription}
            </Text>
            <Text
              accessibilityLiveRegion="polite"
              className="font-ku-semibold text-ku-body-small text-ku-text-strong"
              testID="completion-review-quest-status"
            >
              {`${messages.completionReviewQuestStatus}: ${messages.statusLabel(snapshot.state)}`}
            </Text>
            <Text
              accessibilityLiveRegion="polite"
              className="font-ku-semibold text-ku-body-small text-ku-text-strong"
              testID="completion-review-pending-count"
            >
              {messages.completionReviewPendingCount(pendingCount)}
            </Text>
          </View>
          {rows.map((row) => (
            <CompletionConfirmationCard
              canReview={canReview}
              key={row.key}
              onReview={(id) => {
                clearReviewError();
                setSelectedId(id);
              }}
              row={row}
            />
          ))}
        </ScrollView>
      )}
      <CompletionConfirmationReviewModal
        busy={reviewing}
        error={reviewError}
        onClose={closeReview}
        onReview={submitReview}
        row={selectedRow}
      />
    </ScreenLayout>
  );
}
