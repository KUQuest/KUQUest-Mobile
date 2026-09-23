import { RefreshControl } from "react-native";

import { ScrollView, Text, View, Pressable } from "@/tw";
import {
  AlertTriangle,
  FileEdit,
  MessageSquare,
  ShieldCheck,
  X,
} from "lucide-react-native";

import { ScreenLayout } from "@/components/layout/ScreenLayout";
import { TopBar } from "@/components/ui/TopBar";
import { CandidateReviewSheet } from "@/features/questBoard/teamAssemble/components/CandidateReviewSheet";
import { PartialGroupStartConsentSheet } from "@/features/questBoard/teamAssemble/components/PartialGroupStartConsentSheet";
import { QuestConditionEditModal } from "@/features/questBoard/shared/components/QuestConditionEditModal";
import { QuestConditionEditStatusCard } from "@/features/questBoard/shared/components/QuestConditionEditStatusCard";
import { ProofReviewModal } from "@/features/questBoard/review/components/ProofReviewModal";
import { useHirerQuestManageFeature } from "./useHirerQuestManageFeature";
import { colors } from "@/theme/colors";
import {
  QuestApplicationStatus,
  QuestEditRequestStatus,
  QuestNextAction,
  QuestParticipation,
  QuestStatus,
  QuestTeamStatus,
} from "../domain/types";

export interface HirerQuestManageScreenProps {
  questId?: string;
}

export default function HirerQuestManageScreen({
  questId,
}: HirerQuestManageScreenProps) {
  const view = useHirerQuestManageFeature(questId);
  const {
    router,
    locale,
    messages,
    viewerId,
    snapshotQuery,
    snapshot,
    error,
    originalConditionItems,
    pendingProof,
    terminal,
    canReviewCandidateProposals,
    canProposeConditionEdit,
    candidateOpen,
    setCandidateOpen,
    underfilledOpen,
    setUnderfilledOpen,
    conditionEditOpen,
    setConditionEditOpen,
    conditionEditSubmitting,
    conditionEditError,
    proofReviewOpen,
    setProofReviewOpen,
    decideUnderfilled,
    openChat,
    selectApplication,
    selectTeam,
    cancel,
    reviewProof,
    submitProofReview,
    submitConditionEdit,
  } = view;

  if (snapshotQuery.isPending)
    return (
      <ScreenLayout className="flex-1 bg-ku-background">
        <TopBar
          title="Manage Quest"
          onBackPress={() => router.back()}
          backLabel="Back"
        />
        <View className="p-ku-lg">
          <Text>Loading live Quest…</Text>
        </View>
      </ScreenLayout>
    );
  if (error || !snapshot)
    return (
      <ScreenLayout className="flex-1 bg-ku-background">
        <TopBar
          title="Manage Quest"
          onBackPress={() => router.back()}
          backLabel="Back"
        />
        <View className="p-ku-lg">
          <Text>{error ?? "Quest not found"}</Text>
          <Pressable
            className="mt-ku-md rounded-xl bg-ku-primary p-ku-md"
            onPress={() => void snapshotQuery.refetch()}
          >
            <Text className="text-center text-ku-on-primary">Retry</Text>
          </Pressable>
        </View>
      </ScreenLayout>
    );
  const quest = snapshot.quest;

  return (
    <ScreenLayout className="flex-1 bg-ku-background">
      <TopBar
        title="Manage Quest"
        onBackPress={() => router.back()}
        backLabel="Back"
      />
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={snapshotQuery.isRefetching}
            onRefresh={() => void snapshotQuery.refetch()}
          />
        }
        contentContainerClassName="p-ku-20 pb-ku-48"
      >
        <Text
          accessibilityRole="header"
          className="font-ku-bold text-ku-title text-ku-text-strong"
        >
          {quest.title}
        </Text>
        <Text
          testID="hirer-manage-state"
          className="mt-ku-sm font-ku-bold text-ku-primary"
        >
          {snapshot.state} · {snapshot.mode}
        </Text>
        <View className="mt-ku-20 rounded-2xl bg-ku-card p-ku-md">
          <Text className="font-ku-bold text-ku-text-strong">Roster</Text>
          <Text className="mt-ku-sm text-ku-text-secondary">
            {snapshot.assignments.length} assigned · {snapshot.quest.headcount}{" "}
            requested
          </Text>
          <Text className="mt-ku-xs text-ku-text-secondary">
            {snapshot.applications.length} applications ·{" "}
            {snapshot.teams.length} submitted teams
          </Text>
        </View>
        {canReviewCandidateProposals &&
        (snapshot.participation === QuestParticipation.GROUP
          ? snapshot.teams.some(
              (team) => team.state === QuestTeamStatus.TEAM_SUBMITTED
            )
          : snapshot.applications.some(
              (application) =>
                application.state === QuestApplicationStatus.APPLICATION_APPLIED
            )) ? (
          <Pressable
            testID="hirer-manage-candidate-review"
            className="mt-ku-12 rounded-2xl bg-ku-primary p-ku-md"
            onPress={() => setCandidateOpen(true)}
          >
            <Text className="text-center font-ku-bold text-ku-on-primary">
              Review candidates and teams
            </Text>
          </Pressable>
        ) : null}
        {snapshot.state === QuestStatus.QUEST_FAILED ? (
          <Pressable
            testID="hirer-manage-dispute"
            className="mt-ku-12 flex-row items-center justify-center rounded-2xl bg-ku-danger p-ku-md"
            onPress={() =>
              router.push({
                pathname: "/quest/[id]/dispute",
                params: { id: quest.id },
              })
            }
          >
            <AlertTriangle color={colors.onPrimary} size={20} />
            <Text className="ml-ku-sm font-ku-bold text-ku-on-primary">
              {messages.fileDispute}
            </Text>
          </Pressable>
        ) : null}
        {snapshot.nextAction === QuestNextAction.DECIDE_UNDERFILLED &&
        snapshot.capabilities.canDecideUnderfilled ? (
          <Pressable
            testID="hirer-manage-underfilled"
            className="mt-ku-12 rounded-2xl bg-ku-warning p-ku-md"
            onPress={() => setUnderfilledOpen(true)}
          >
            <Text className="text-center font-ku-bold text-ku-text-strong">
              Decide underfilled Quest
            </Text>
          </Pressable>
        ) : null}
        {canProposeConditionEdit ? (
          <Pressable
            testID="hirer-manage-condition-edit"
            className="mt-ku-12 flex-row items-center rounded-2xl border border-ku-primary p-ku-md"
            onPress={() => setConditionEditOpen(true)}
          >
            <FileEdit color={colors.primary} size={20} />
            <Text className="ml-ku-12 font-ku-bold text-ku-primary">
              {messages.proposeConditionChanges}
            </Text>
          </Pressable>
        ) : null}
        {snapshot.editRequest?.status ===
        QuestEditRequestStatus.EDIT_REQUEST_PENDING ? (
          <View className="mt-ku-12">
            <QuestConditionEditStatusCard
              editRequest={snapshot.editRequest}
              messages={messages}
            />
          </View>
        ) : null}
        {pendingProof && snapshot.capabilities.canReviewProof ? (
          <Pressable
            testID="hirer-manage-proof-review"
            className="mt-ku-12 rounded-2xl border border-ku-primary p-ku-md"
            onPress={reviewProof}
          >
            <ShieldCheck color={colors.primary} size={20} />
            <Text className="mt-ku-sm font-ku-bold text-ku-primary">
              Review pending proof
            </Text>
          </Pressable>
        ) : null}
        {snapshot.capabilities.canReadWorkChat && snapshot.workConversation ? (
          <Pressable
            testID="hirer-manage-work-chat"
            className="mt-ku-12 flex-row items-center rounded-2xl bg-ku-card p-ku-md"
            onPress={openChat}
          >
            <MessageSquare color={colors.primary} size={20} />
            <Text className="ml-ku-12 font-ku-bold text-ku-primary">
              Open Work Chat
            </Text>
          </Pressable>
        ) : null}
        {!terminal && snapshot.capabilities.canCancel ? (
          <Pressable
            testID="hirer-manage-cancel"
            className="mt-ku-12 flex-row items-center rounded-2xl border border-ku-danger p-ku-md"
            onPress={cancel}
          >
            <X color={colors.danger} size={20} />
            <Text className="ml-ku-12 font-ku-bold text-ku-danger">
              Cancel Quest
            </Text>
          </Pressable>
        ) : null}
      </ScrollView>
      <CandidateReviewSheet
        visible={candidateOpen}
        applications={snapshot.applications}
        teams={snapshot.teams.filter(
          (team) => team.state === QuestTeamStatus.TEAM_SUBMITTED
        )}
        mode={
          snapshot.participation === QuestParticipation.GROUP
            ? "team"
            : "individual"
        }
        questTitle={quest.title}
        requestedHeadcount={quest.headcount}
        actualHeadcount={snapshot.assignments.length}
        onClose={() => setCandidateOpen(false)}
        onAcceptProposal={
          snapshot.participation === QuestParticipation.GROUP
            ? snapshot.capabilities.canSelectTeam
              ? selectTeam
              : undefined
            : snapshot.capabilities.canSelectCandidate
              ? selectApplication
              : undefined
        }
        locale={locale}
        fullScreen
      />
      <PartialGroupStartConsentSheet
        visible={underfilledOpen}
        underfilled={snapshot.underfilled}
        hirerId={viewerId}
        viewerId={viewerId}
        questTitle={quest.title}
        canDecide={snapshot.capabilities.canDecideUnderfilled}
        onHirerDecision={decideUnderfilled}
        onClose={() => setUnderfilledOpen(false)}
        locale={locale}
      />
      <QuestConditionEditModal
        visible={conditionEditOpen}
        originalItems={originalConditionItems ?? []}
        onClose={() => setConditionEditOpen(false)}
        onSubmit={submitConditionEdit}
        submitting={conditionEditSubmitting}
        error={conditionEditError}
      />
      <ProofReviewModal
        dueAt={snapshot.dueAt}
        onClose={() => setProofReviewOpen(false)}
        onReview={submitProofReview}
        proof={pendingProof}
        visible={proofReviewOpen && Boolean(pendingProof)}
      />
    </ScreenLayout>
  );
}
