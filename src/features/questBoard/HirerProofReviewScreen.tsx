import { useRouter } from "expo-router";

import { ScreenLayout } from "@/components/layout/ScreenLayout";
import { StateView } from "@/components/ui/StateView";
import { TopBar } from "@/components/ui/TopBar";
import {
  createQuestIdempotencyKey,
  type QuestV2ProofReviewPayload,
} from "@/api/QuestApi";
import { useSessionQuery } from "@/features/auth/sessionQueries";
import {
  useLiveQuestSnapshotQuery,
  useReviewProofMutation,
} from "@/features/questBoard/api/questBoardQueries";
import { ProofReviewPanel } from "@/features/questBoard/components";
import { useLocale } from "@/features/preferences/localeStore";
import { questBoardMessages } from "@/locales/questBoardMessages";
import { Text, View } from "@/tw";
import { QuestProofStatus } from "./types";

export interface HirerProofReviewScreenProps {
  questId?: string;
}

/** Dedicated page where the owning Hirer decides a pending Proof. */
export default function HirerProofReviewScreen({
  questId,
}: HirerProofReviewScreenProps) {
  const router = useRouter();
  const { locale } = useLocale();
  const messages = questBoardMessages[locale];
  const viewerId = useSessionQuery().data?.user.id || null;
  const snapshotQuery = useLiveQuestSnapshotQuery(questId ?? null, viewerId);
  const reviewProofMutation = useReviewProofMutation();
  const snapshot = snapshotQuery.data;
  const pendingProof = snapshot?.capabilities.canReviewProof
    ? snapshot.proofs.find(
        (proof) => proof.status === QuestProofStatus.PROOF_PENDING
      )
    : undefined;

  const review = async (payload: QuestV2ProofReviewPayload) => {
    if (!questId || !pendingProof) return false;
    try {
      await reviewProofMutation.mutateAsync({
        questId,
        proofSubmissionId: pendingProof.id,
        payload,
        viewerId: viewerId ?? undefined,
        idempotencyKey: createQuestIdempotencyKey(),
      });
      return true;
    } catch (caught) {
      // A conflict means the Server state moved; reload before the retry.
      await snapshotQuery.refetch();
      throw caught;
    }
  };

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
      ) : pendingProof ? (
        <View className="flex-1" testID="hirer-proof-review-screen">
          <Text className="px-ku-lg pt-ku-md font-ku-bold text-ku-body text-ku-text-strong">
            {snapshot.quest.title}
          </Text>
          <ProofReviewPanel
            dueAt={snapshot.dueAt}
            key={pendingProof.id}
            onDone={() => router.back()}
            onReview={review}
            proof={pendingProof}
          />
        </View>
      ) : (
        <StateView
          actionLabel={messages.back}
          description={messages.proofReviewNothingPending}
          onAction={() => router.back()}
          title={messages.proofReviewTitle}
          variant="empty"
        />
      )}
    </ScreenLayout>
  );
}
