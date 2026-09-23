import { useRouter } from "expo-router";

import { ScreenLayout } from "@/components/layout/ScreenLayout";
import { StateView } from "@/components/ui/StateView";
import { TopBar } from "@/components/ui/TopBar";
import { useLocale } from "@/features/preferences/localeStore";
import { questBoardMessages } from "@/locales/questBoardMessages";
import { Text, View } from "@/tw";

import { useHirerProofReviewFeature } from "./useHirerProofReviewFeature";
import { ProofReviewPanel } from "./components/ProofReviewPanel";

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
  const {
    pendingProof,
    proofFileLinksQuery,
    proofForReview,
    review,
    snapshot,
    snapshotQuery,
  } = useHirerProofReviewFeature(questId);

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
          <View className="flex-1 px-ku-lg">
            {proofFileLinksQuery.isPending ? (
              <Text className="p-ku-lg">{messages.loading}</Text>
            ) : proofFileLinksQuery.isError ? (
              <StateView
                actionLabel={messages.retry}
                description={messages.errorDescription}
                onAction={() => void proofFileLinksQuery.refetch()}
                title={messages.errorTitle}
                variant="error"
              />
            ) : proofForReview ? (
              <ProofReviewPanel
                dueAt={snapshot.dueAt}
                key={proofForReview.id}
                onDone={() => router.back()}
                onReview={review}
                proof={proofForReview}
              />
            ) : null}
          </View>
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
