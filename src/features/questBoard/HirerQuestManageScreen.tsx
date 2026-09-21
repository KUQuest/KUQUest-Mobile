import { useCallback, useState } from "react";
import { Alert, RefreshControl } from "react-native";
import { useRouter } from "expo-router";

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
import {
  createQuestIdempotencyKey,
  type QuestV2ProofReviewPayload,
} from "@/api/QuestApi";
import { useSessionQuery } from "@/features/auth/sessionQueries";
import {
  useCancelQuestMutation,
  useCreateEditRequestMutation,
  useDecideUnderfilledMutation,
  useLiveQuestSnapshotQuery,
  useReviewProofMutation,
  useSelectApplicationMutation,
  useSelectCandidateTeamMutation,
} from "@/features/questBoard/api/questBoardQueries";
import {
  CandidateReviewSheet,
  PartialGroupStartConsentSheet,
  QuestConditionEditModal,
  QuestConditionEditStatusCard,
  ProofReviewModal,
} from "@/features/questBoard/components";
import { getChatRouteParams } from "@/features/chat/chatData";
import { useLocale } from "@/features/preferences/localeStore";
import { questBoardMessages } from "@/locales/questBoardMessages";
import { colors } from "@/theme/colors";

export interface HirerQuestManageScreenProps {
  questId?: string;
}

export default function HirerQuestManageScreen({
  questId,
}: HirerQuestManageScreenProps) {
  const router = useRouter();
  const { locale } = useLocale();
  const sessionQuery = useSessionQuery();
  const viewerId = sessionQuery.data?.user.id || "";
  const [candidateOpen, setCandidateOpen] = useState(false);
  const [underfilledOpen, setUnderfilledOpen] = useState(false);
  const [conditionEditOpen, setConditionEditOpen] = useState(false);
  const [editRequestId, setEditRequestId] = useState<string>();
  const [conditionEditSubmitting, setConditionEditSubmitting] = useState(false);
  const [conditionEditError, setConditionEditError] = useState<string>();
  const messages = questBoardMessages[locale];
  const [proofReviewOpen, setProofReviewOpen] = useState(false);

  const snapshotQuery = useLiveQuestSnapshotQuery(
    questId ?? null,
    viewerId || null,
    editRequestId ? { editRequestId } : undefined
  );
  const selectApplicationMutation = useSelectApplicationMutation();
  const selectCandidateTeamMutation = useSelectCandidateTeamMutation();
  const decideUnderfilledMutation = useDecideUnderfilledMutation();
  const cancelQuestMutation = useCancelQuestMutation();
  const reviewProofMutation = useReviewProofMutation();
  const createEditRequestMutation = useCreateEditRequestMutation();
  const snapshot = snapshotQuery.data;
  const refetchSnapshot = snapshotQuery.refetch;
  const error =
    snapshotQuery.error instanceof Error
      ? snapshotQuery.error.message
      : snapshotQuery.error
        ? "Unable to load Quest"
        : undefined;
  const command = useCallback(
    async (run: (key: string) => Promise<unknown>): Promise<boolean> => {
      if (!questId || !viewerId) return false;
      try {
        await run(createQuestIdempotencyKey());
        return true;
      } catch (caught) {
        await refetchSnapshot();
        Alert.alert(
          "Quest",
          caught instanceof Error ? caught.message : "Action failed"
        );
        return false;
      }
    },
    [questId, refetchSnapshot, viewerId]
  );

  if (snapshotQuery.isPending)
    return (
      <ScreenLayout className="flex-1 bg-ku-background">
        <TopBar
          title="Manage Quest"
          onBackPress={() => router.back()}
          backLabel="Back"
        />
        <View className="p-6">
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
        <View className="p-6">
          <Text>{error ?? "Quest not found"}</Text>
          <Pressable
            className="mt-4 rounded-xl bg-ku-primary p-4"
            onPress={() => void snapshotQuery.refetch()}
          >
            <Text className="text-center text-ku-on-primary">Retry</Text>
          </Pressable>
        </View>
      </ScreenLayout>
    );
  const quest = snapshot.quest;
  const originalConditionItems = quest.condition.items
    .slice()
    .sort((a, b) => a.position - b.position)
    .map((item) => item.text);
  const pendingProof = snapshot.proofs.find(
    (proof) => proof.status === "PROOF_PENDING"
  );
  const terminal = [
    "QUEST_COMPLETED",
    "QUEST_CANCELLED",
    "QUEST_FAILED",
  ].includes(snapshot.state);
  const canReviewCandidateProposals =
    snapshot.actor === "HIRER" &&
    snapshot.mode === "CANDIDATE" &&
    (snapshot.participation === "GROUP"
      ? snapshot.capabilities.canSelectTeam
      : snapshot.capabilities.canSelectCandidate);
  const canProposeConditionEdit =
    snapshot.actor === "HIRER" &&
    snapshot.state === "QUEST_ASSIGNED" &&
    snapshot.capabilities.canRequestEdit &&
    snapshot.editRequest?.status !== "EDIT_REQUEST_PENDING";
  const openChat = () => {
    if (!snapshot.workConversation || !viewerId) return;
    router.push({
      pathname: "/chat/[id]",
      params: getChatRouteParams({
        conversationId: snapshot.workConversation.id,
        questId: quest.id,
        viewerId,
        questTitle: quest.title,
      }),
    });
  };
  const selectApplication = (id: string) =>
    void command((key) =>
      selectApplicationMutation.mutateAsync({
        questId: quest.id,
        applicationId: id,
        viewerId,
        idempotencyKey: key,
      })
    );
  const selectTeam = (id: string) =>
    void command((key) =>
      selectCandidateTeamMutation.mutateAsync({
        questId: quest.id,
        teamId: id,
        viewerId,
        idempotencyKey: key,
      })
    );
  const cancel = () =>
    Alert.alert("Cancel Quest", "Cancel this Quest?", [
      { text: "Keep", style: "cancel" },
      {
        text: "Cancel Quest",
        style: "destructive",
        onPress: () =>
          void command((key) =>
            cancelQuestMutation
              .mutateAsync({
                questId: quest.id,
                viewerId,
                idempotencyKey: key,
              })
              .then((outcome) => {
                Alert.alert(
                  "Cancellation complete",
                  `Paid ${outcome.paidSatang} satang · Refunded ${outcome.refundedSatang} satang`
                );
              })
          ),
      },
    ]);
  const reviewProof = () => {
    if (!pendingProof || !snapshot.capabilities.canReviewProof) return;
    setProofReviewOpen(true);
  };
  const submitProofReview = (
    payload: QuestV2ProofReviewPayload
  ): Promise<boolean> => {
    if (!pendingProof || !snapshot.capabilities.canReviewProof) {
      return Promise.resolve(false);
    }
    return command((key) =>
      reviewProofMutation.mutateAsync({
        questId: quest.id,
        proofSubmissionId: pendingProof.id,
        payload,
        viewerId,
        idempotencyKey: key,
      })
    );
  };
  const submitConditionEdit = (items: string[]) => {
    setConditionEditSubmitting(true);
    setConditionEditError(undefined);
    createEditRequestMutation
      .mutateAsync({
        questId: quest.id,
        payload: { condition: { items } },
        viewerId,
        idempotencyKey: createQuestIdempotencyKey(),
      })
      .then((request) => {
        setEditRequestId(request.requestId);
        setConditionEditOpen(false);
      })
      .catch((caught) => {
        setConditionEditError(
          caught instanceof Error
            ? caught.message
            : messages.conditionEditSubmitError
        );
        return snapshotQuery.refetch();
      })
      .finally(() => setConditionEditSubmitting(false));
  };

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
        contentContainerClassName="p-5 pb-12"
      >
        <Text
          accessibilityRole="header"
          className="font-ku-bold text-ku-title text-ku-text-strong"
        >
          {quest.title}
        </Text>
        <Text
          testID="hirer-manage-state"
          className="mt-2 font-ku-bold text-ku-primary"
        >
          {snapshot.state} · {snapshot.mode}
        </Text>
        <View className="mt-5 rounded-2xl bg-ku-card p-4">
          <Text className="font-ku-bold text-ku-text-strong">Roster</Text>
          <Text className="mt-2 text-ku-text-secondary">
            {snapshot.assignments.length} assigned · {snapshot.quest.headcount}{" "}
            requested
          </Text>
          <Text className="mt-1 text-ku-text-secondary">
            {snapshot.applications.length} applications ·{" "}
            {snapshot.teams.length} submitted teams
          </Text>
        </View>
        {canReviewCandidateProposals &&
        (snapshot.participation === "GROUP"
          ? snapshot.teams.some((team) => team.state === "TEAM_SUBMITTED")
          : snapshot.applications.some(
              (application) => application.state === "APPLICATION_APPLIED"
            )) ? (
          <Pressable
            testID="hirer-manage-candidate-review"
            className="mt-3 rounded-2xl bg-ku-primary p-4"
            onPress={() => setCandidateOpen(true)}
          >
            <Text className="text-center font-ku-bold text-ku-on-primary">
              Review candidates and teams
            </Text>
          </Pressable>
        ) : null}
        {snapshot.state === "QUEST_FAILED" ? (
          <Pressable
            testID="hirer-manage-dispute"
            className="mt-3 flex-row items-center justify-center rounded-2xl bg-ku-danger p-4"
            onPress={() =>
              router.push({
                pathname: "/quest/[id]/dispute",
                params: { id: quest.id },
              })
            }
          >
            <AlertTriangle color={colors.onPrimary} size={20} />
            <Text className="ml-2 font-ku-bold text-ku-on-primary">
              {messages.fileDispute}
            </Text>
          </Pressable>
        ) : null}
        {snapshot.nextAction === "DECIDE_UNDERFILLED" &&
        snapshot.capabilities.canDecideUnderfilled ? (
          <Pressable
            testID="hirer-manage-underfilled"
            className="mt-3 rounded-2xl bg-ku-warning p-4"
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
            className="mt-3 flex-row items-center rounded-2xl border border-ku-primary p-4"
            onPress={() => setConditionEditOpen(true)}
          >
            <FileEdit color={colors.primary} size={20} />
            <Text className="ml-3 font-ku-bold text-ku-primary">
              {messages.proposeConditionChanges}
            </Text>
          </Pressable>
        ) : null}
        {snapshot.editRequest?.status === "EDIT_REQUEST_PENDING" ? (
          <View className="mt-3">
            <QuestConditionEditStatusCard
              editRequest={snapshot.editRequest}
              messages={messages}
            />
          </View>
        ) : null}
        {pendingProof && snapshot.capabilities.canReviewProof ? (
          <Pressable
            testID="hirer-manage-proof-review"
            className="mt-3 rounded-2xl border border-ku-primary p-4"
            onPress={reviewProof}
          >
            <ShieldCheck color={colors.primary} size={20} />
            <Text className="mt-2 font-ku-bold text-ku-primary">
              Review pending proof
            </Text>
          </Pressable>
        ) : null}
        {snapshot.capabilities.canReadWorkChat && snapshot.workConversation ? (
          <Pressable
            testID="hirer-manage-work-chat"
            className="mt-3 flex-row items-center rounded-2xl bg-ku-card p-4"
            onPress={openChat}
          >
            <MessageSquare color={colors.primary} size={20} />
            <Text className="ml-3 font-ku-bold text-ku-primary">
              Open Work Chat
            </Text>
          </Pressable>
        ) : null}
        {!terminal && snapshot.capabilities.canCancel ? (
          <Pressable
            testID="hirer-manage-cancel"
            className="mt-3 flex-row items-center rounded-2xl border border-ku-danger p-4"
            onPress={cancel}
          >
            <X color={colors.danger} size={20} />
            <Text className="ml-3 font-ku-bold text-ku-danger">
              Cancel Quest
            </Text>
          </Pressable>
        ) : null}
      </ScrollView>
      <CandidateReviewSheet
        visible={candidateOpen}
        applications={snapshot.applications}
        teams={snapshot.teams.filter((team) => team.state === "TEAM_SUBMITTED")}
        mode={snapshot.participation === "GROUP" ? "team" : "individual"}
        questTitle={quest.title}
        requestedHeadcount={quest.headcount}
        actualHeadcount={snapshot.assignments.length}
        onClose={() => setCandidateOpen(false)}
        onAcceptProposal={
          snapshot.participation === "GROUP"
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
        onHirerDecision={(decision) => {
          setUnderfilledOpen(false);
          void command((key) =>
            decideUnderfilledMutation.mutateAsync({
              questId: quest.id,
              decision,
              viewerId,
              idempotencyKey: key,
            })
          );
        }}
        onClose={() => setUnderfilledOpen(false)}
        locale={locale}
      />
      <QuestConditionEditModal
        visible={conditionEditOpen}
        originalItems={originalConditionItems}
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
