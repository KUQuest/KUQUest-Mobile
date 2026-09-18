import React, { useCallback, useEffect, useState } from "react";
import { Alert, RefreshControl } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

import { ScrollView, Text, View, Pressable } from "@/tw";
import { FileEdit, MessageSquare, ShieldCheck, X } from "lucide-react-native";

import { ScreenLayout } from "@/components/layout/ScreenLayout";
import { TopBar } from "@/components/ui/TopBar";
import { authService } from "@/features/auth/AuthService";
import {
  createQuestIdempotencyKey,
  type QuestV2ProofReviewPayload,
} from "@/api/QuestApi";
import {
  liveQuestService,
  type LiveQuestSnapshot,
} from "@/features/questBoard/liveQuestService";
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

function routeValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default function HirerQuestManageRoute() {
  const router = useRouter();
  const { locale } = useLocale();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const questId = routeValue(params.id);
  const [viewerId, setViewerId] = useState<string>();
  const [snapshot, setSnapshot] = useState<LiveQuestSnapshot>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string>();
  const [candidateOpen, setCandidateOpen] = useState(false);
  const [underfilledOpen, setUnderfilledOpen] = useState(false);
  const [conditionEditOpen, setConditionEditOpen] = useState(false);
  const [editRequestId, setEditRequestId] = useState<string>();
  const [conditionEditSubmitting, setConditionEditSubmitting] = useState(false);
  const [conditionEditError, setConditionEditError] = useState<string>();
  const messages = questBoardMessages[locale];
  const [proofReviewOpen, setProofReviewOpen] = useState(false);

  useEffect(() => {
    void authService
      .getSession()
      .then((session) => setViewerId(session?.user.id))
      .catch(() => undefined);
  }, []);

  const load = useCallback(
    async (background = false) => {
      if (!questId || !viewerId) return;
      if (background) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      try {
        const next = await liveQuestService.getLiveSnapshot(
          questId,
          viewerId,
          editRequestId ? { editRequestId } : undefined
        );
        setSnapshot(next);
        setError(undefined);
      } catch (caught) {
        setError(
          caught instanceof Error ? caught.message : "Unable to load Quest"
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [questId, viewerId, editRequestId]
  );

  useEffect(() => {
    let mounted = true;
    if (questId && viewerId) {
      void (async () => {
        try {
          const next = await liveQuestService.getLiveSnapshot(
            questId,
            viewerId
          );
          if (mounted) {
            setSnapshot(next);
            setError(undefined);
            setLoading(false);
          }
        } catch (caught) {
          if (mounted) {
            setError(
              caught instanceof Error ? caught.message : "Unable to load Quest"
            );
            setLoading(false);
          }
        }
      })();
    }
    return () => {
      mounted = false;
    };
  }, [questId, viewerId]);

  const command = useCallback(
    async (run: (key: string) => Promise<unknown>): Promise<boolean> => {
      if (!questId || !viewerId) return false;
      try {
        await run(createQuestIdempotencyKey());
        await load(true);
        return true;
      } catch (caught) {
        await load(true);
        Alert.alert(
          "Quest",
          caught instanceof Error ? caught.message : "Action failed"
        );
        return false;
      }
    },
    [load, questId, viewerId]
  );

  if (loading)
    return (
      <ScreenLayout className="bg-ku-bg flex-1">
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
      <ScreenLayout className="bg-ku-bg flex-1">
        <TopBar
          title="Manage Quest"
          onBackPress={() => router.back()}
          backLabel="Back"
        />
        <View className="p-6">
          <Text>{error ?? "Quest not found"}</Text>
          <Pressable
            className="mt-4 rounded-xl bg-ku-primary p-4"
            onPress={() => void load()}
          >
            <Text className="text-center text-white">Retry</Text>
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
      liveQuestService.selectApplication(quest.id, id, key)
    );
  const selectTeam = (id: string) =>
    void command((key) =>
      liveQuestService.selectCandidateTeam(quest.id, id, key)
    );
  const cancel = () =>
    Alert.alert("Cancel Quest", "Cancel this Quest?", [
      { text: "Keep", style: "cancel" },
      {
        text: "Cancel Quest",
        style: "destructive",
        onPress: () =>
          void command((key) =>
            liveQuestService.cancelQuest(quest.id, key).then((outcome) => {
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
      liveQuestService.reviewProof(quest.id, pendingProof.id, payload, key)
    );
  };
  const submitConditionEdit = (items: string[]) => {
    setConditionEditSubmitting(true);
    setConditionEditError(undefined);
    liveQuestService
      .createEditRequest(
        quest.id,
        { condition: { items } },
        createQuestIdempotencyKey()
      )
      .then((request) => {
        setEditRequestId(request.requestId);
        setConditionEditOpen(false);
        return load(true);
      })
      .catch((caught) => {
        setConditionEditError(
          caught instanceof Error
            ? caught.message
            : messages.conditionEditSubmitError
        );
        return load(true);
      })
      .finally(() => setConditionEditSubmitting(false));
  };

  return (
    <ScreenLayout className="bg-ku-bg flex-1">
      <TopBar
        title="Manage Quest"
        onBackPress={() => router.back()}
        backLabel="Back"
      />
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void load(true)}
          />
        }
        contentContainerClassName="p-5 pb-12"
      >
        <Text
          accessibilityRole="header"
          className="font-ku-bold text-2xl text-ku-text-strong"
        >
          {quest.title}
        </Text>
        <Text
          testID="hirer-manage-state"
          className="mt-2 font-ku-bold text-ku-primary"
        >
          {snapshot.state} · {snapshot.mode}
        </Text>
        <View className="mt-5 rounded-2xl bg-white p-4">
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
            <Text className="text-center font-ku-bold text-white">
              Review candidates and teams
            </Text>
          </Pressable>
        ) : null}
        {snapshot.nextAction === "DECIDE_UNDERFILLED" &&
        snapshot.capabilities.canDecideUnderfilled ? (
          <Pressable
            testID="hirer-manage-underfilled"
            className="bg-ku-warning mt-3 rounded-2xl p-4"
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
            className="mt-3 flex-row items-center rounded-2xl bg-white p-4"
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
            liveQuestService.decideUnderfilled(quest.id, decision, key)
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
