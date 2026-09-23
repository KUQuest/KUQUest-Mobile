import { ActivityIndicator } from "react-native";

import { ScreenLayout } from "@/components/layout/ScreenLayout";
import { TopBar } from "@/components/ui/TopBar";
import { colors } from "@/theme/colors";
import { ScrollView, Text, View } from "@/tw";

import { QuestProofActionSection } from "./components/QuestProofActionSection";
import { QuestProofStatusCard } from "./components/QuestProofStatusCard";
import { QuestProofSummaryCard } from "./components/QuestProofSummaryCard";
import { ProofSubmissionSheet } from "./components/ProofSubmissionSheet";
import { useQuestProofFeature } from "./useQuestProofFeature";

export interface QuestProofScreenProps {
  questId?: string;
  viewerId?: string;
  onReturnToWorkHub?: () => void;
}

export default function QuestProofScreen({
  questId,
  viewerId,
  onReturnToWorkHub,
}: QuestProofScreenProps) {
  const {
    countdown,
    confirmCompletion,
    deleteDraft,
    draftAssets,
    error,
    isDraft,
    isLocked,
    loading,
    messages,
    proof,
    refreshAuthoritatively,
    refreshing,
    resolvedQuestId,
    resolvedViewerId,
    retryAssets,
    retryUpload,
    saveDraft,
    setSheetOpen,
    sheetOpen,
    snapshot,
    status,
    statusLabel,
    submitDraft,
    goBack,
  } = useQuestProofFeature({ questId, viewerId, onReturnToWorkHub });

  if (!resolvedQuestId || !resolvedViewerId) {
    return (
      <ScreenLayout
        edges={["top", "left", "right", "bottom"]}
        className="flex-1 bg-ku-background"
      >
        <TopBar onBackPress={goBack} title={messages.proofBannerTitle} />
        <View className="flex-1 items-center justify-center px-ku-lg">
          <Text className="text-center text-ku-body text-ku-text-secondary">
            {messages.errorDescription}
          </Text>
        </View>
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout
      edges={["top", "left", "right", "bottom"]}
      className="flex-1 bg-ku-background"
    >
      <TopBar onBackPress={goBack} title={messages.proofBannerTitle} />
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.primary} />
          <Text className="mt-ku-12 text-ku-body text-ku-text-secondary">
            {messages.loading}
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerClassName="px-ku-20 pb-ku-40"
          showsVerticalScrollIndicator={false}
        >
          <QuestProofSummaryCard
            countdown={countdown}
            description={
              snapshot?.proofRequired
                ? messages.proofRequiredDescription
                : messages.proofNotNeededDescription
            }
            error={error}
            title={snapshot?.quest.title ?? messages.proofBannerTitle}
          />

          <QuestProofStatusCard
            description={proof?.description}
            icon={
              status === "PROOF_APPROVED"
                ? "approved"
                : status === "PROOF_NOT_APPROVED"
                  ? "not-approved"
                  : status === "PROOF_PENDING"
                    ? "pending"
                    : "draft"
            }
            label={statusLabel}
            lockDescription={
              isDraft ? messages.proofLockDescription : undefined
            }
            pendingDescription={
              status === "PROOF_PENDING" ? messages.proofPending : undefined
            }
            terminalDescription={
              status === "PROOF_NOT_APPROVED"
                ? messages.terminalDescription
                : undefined
            }
          />

          {snapshot?.proofRequired ? (
            <QuestProofActionSection
              canSubmit={
                snapshot.capabilities.canSubmitProof && (isDraft || !proof)
              }
              onOpenSubmission={() => setSheetOpen(true)}
              onRefresh={() => void refreshAuthoritatively()}
              refreshing={refreshing}
              retryLabel={messages.retry}
              submitLabel={messages.submitProof}
              variant="proof"
            />
          ) : snapshot ? (
            <QuestProofActionSection
              canConfirm={snapshot.capabilities.canConfirmCompletion}
              confirmLabel={messages.confirmCompletion}
              description={messages.confirmCompletionDescription}
              onConfirm={confirmCompletion}
              refreshing={refreshing}
              variant="completion"
            />
          ) : null}
        </ScrollView>
      )}

      <ProofSubmissionSheet
        retryAssets={retryAssets}
        draftAssets={draftAssets}
        error={error}
        loading={refreshing}
        locked={isLocked}
        onClose={() => setSheetOpen(false)}
        onDeleteDraft={
          proof && isDraft && snapshot?.capabilities.canSubmitProof
            ? deleteDraft
            : undefined
        }
        onRetryUpload={
          proof && isDraft && snapshot?.capabilities.canSubmitProof
            ? retryUpload
            : undefined
        }
        onSaveDraft={saveDraft}
        onSubmitDraft={submitDraft}
        proof={proof}
        visible={Boolean(
          sheetOpen &&
          snapshot?.capabilities.canSubmitProof &&
          (isDraft || !proof)
        )}
      />
    </ScreenLayout>
  );
}
