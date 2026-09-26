import { useRouter } from "expo-router";

import {
  questV2ModeSchema,
  questV2ParticipationSchema,
} from "@/api/questV2Contracts";
import { ScreenLayout } from "@/components/layout/ScreenLayout";
import { Button } from "@/components/ui/Button";
import { StateView } from "@/components/ui/StateView";
import { TopBar } from "@/components/ui/TopBar";
import { useLocale } from "@/features/preferences/localeStore";
import { questBoardMessages } from "@/locales/questBoardMessages";
import { ScrollView, Text, View } from "@/tw";

import { useHirerProofReviewFeature } from "./useHirerProofReviewFeature";
import { ProofReviewModal } from "./components/ProofReviewModal";
import { ProofReviewSubmissionCard } from "./components/ProofReviewSubmissionCard";
import { QuestReviewModal } from "./components/QuestReviewModal";

export interface HirerProofReviewScreenProps {
  questId?: string;
}

/**
 * Hirer review list for every Proof Submission on a Quest. Each pending
 * submission opens the review Popup; decisions are made one at a time.
 */
export default function HirerProofReviewScreen({
  questId,
}: HirerProofReviewScreenProps) {
  const router = useRouter();
  const { locale } = useLocale();
  const messages = questBoardMessages[locale];
  const {
    canReview,
    closeProof,
    closeRatingReview,
    openProof,
    pendingCount,
    proofFileLinksQuery,
    proofForReview,
    ratingReviewQuestId,
    review,
    rows,
    selectedProof,
    snapshot,
    snapshotQuery,
  } = useHirerProofReviewFeature(questId);

  const modeHint =
    snapshot?.participation === questV2ParticipationSchema.enum.GROUP
      ? snapshot.mode === questV2ModeSchema.enum.CANDIDATE
        ? messages.proofReviewTeamHint
        : messages.proofReviewGroupHint
      : messages.proofReviewSingleHint;

  return (
    <ScreenLayout className="flex-1 bg-ku-background">
      <TopBar
        backLabel={messages.back}
        onBackPress={() => router.back()}
        title={messages.proofReviewTitle}
      />
      {snapshotQuery.isPending ? (
        <View className="p-ku-lg">
          <Text>{messages.loading}</Text>
        </View>
      ) : snapshotQuery.isError || !snapshot ? (
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
          description={messages.proofReviewNothingPending}
          onAction={() => router.back()}
          title={messages.proofReviewTitle}
          variant="empty"
        />
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerClassName="gap-ku-md px-ku-lg pt-ku-md pb-ku-xl"
          testID="hirer-proof-review-screen"
        >
          <View className="gap-ku-xs">
            <Text
              accessibilityRole="header"
              className="font-ku-bold text-ku-body text-ku-text-strong"
            >
              {snapshot.quest.title}
            </Text>
            <Text className="font-ku-regular text-ku-body-small text-ku-text-secondary">
              {modeHint}
            </Text>
            <Text
              accessibilityLiveRegion="polite"
              className="font-ku-semibold text-ku-body-small text-ku-text-strong"
              testID="proof-review-pending-count"
            >
              {messages.proofReviewPendingCount(pendingCount)}
            </Text>
          </View>
          {selectedProof && proofFileLinksQuery.isError ? (
            <View className="gap-ku-sm" testID="proof-review-links-error">
              <Text
                accessibilityRole="alert"
                className="font-ku-regular text-ku-body-small text-ku-danger-dark"
              >
                {messages.errorDescription}
              </Text>
              <Button
                onPress={() => void proofFileLinksQuery.refetch()}
                variant="secondary"
              >
                {messages.retry}
              </Button>
            </View>
          ) : null}
          {rows.map((row) => (
            <ProofReviewSubmissionCard
              canReview={canReview}
              key={row.key}
              onReview={openProof}
              opening={
                Boolean(row.proof) &&
                row.proof?.id === selectedProof?.id &&
                proofFileLinksQuery.isPending
              }
              row={row}
            />
          ))}
        </ScrollView>
      )}
      <ProofReviewModal
        dueAt={snapshot?.dueAt}
        onClose={closeProof}
        onReview={review}
        proof={proofForReview}
        visible={Boolean(proofForReview)}
      />
      <QuestReviewModal
        onClose={closeRatingReview}
        questId={ratingReviewQuestId}
      />
    </ScreenLayout>
  );
}
