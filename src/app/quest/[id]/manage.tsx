import React, { useCallback, useEffect, useState } from "react";
import { Alert, RefreshControl } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { MessageSquare, ShieldCheck, X } from "lucide-react-native";
import { SafeAreaView, ScrollView, Text, View, Pressable } from "@/tw";
import { TopBar } from "@/components/ui/TopBar";
import { authService } from "@/features/auth/AuthService";
import { createQuestIdempotencyKey } from "@/api/QuestApi";
import {
  liveQuestService,
  type LiveQuestSnapshot,
} from "@/features/questBoard/liveQuestService";
import {
  CandidateReviewSheet,
  PartialGroupStartConsentSheet,
} from "@/features/questBoard/components";
import { getChatRouteParams } from "@/features/chat/chatData";
import { useLocale } from "@/locales/LocaleProvider";
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
        const next = await liveQuestService.getLiveSnapshot(questId, viewerId);
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
    [questId, viewerId]
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
    async (run: (key: string) => Promise<unknown>) => {
      if (!questId || !viewerId) return;
      try {
        await run(createQuestIdempotencyKey());
        await load(true);
      } catch (caught) {
        await load(true);
        Alert.alert(
          "Quest",
          caught instanceof Error ? caught.message : "Action failed"
        );
      }
    },
    [load, questId, viewerId]
  );

  if (loading)
    return (
      <SafeAreaView className="flex-1 bg-ku-bg">
        <TopBar
          title="Manage Quest"
          onBackPress={() => router.back()}
          backLabel="Back"
        />
        <View className="p-6">
          <Text>Loading live Quest…</Text>
        </View>
      </SafeAreaView>
    );
  if (error || !snapshot)
    return (
      <SafeAreaView className="flex-1 bg-ku-bg">
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
      </SafeAreaView>
    );

  const quest = snapshot.quest;
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
    Alert.alert("Review proof", "Approve this proof submission?", [
      { text: "Close", style: "cancel" },
      {
        text: "Reject unavailable",
        style: "destructive",
        onPress: () =>
          Alert.alert(
            "Backend contract blocker",
            "PROOF_NOT_APPROVED requires a rejection reason. This screen has no reason input, so no rejection request was sent."
          ),
      },
      {
        text: "Approve",
        onPress: () =>
          void command((key) =>
            liveQuestService.reviewProof(
              quest.id,
              pendingProof.id,
              { decision: "PROOF_APPROVED" },
              key
            )
          ),
      },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-ku-bg">
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
          className="text-ku-text-strong text-2xl font-ku-bold"
        >
          {quest.title}
        </Text>
        <Text
          testID="hirer-manage-state"
          className="mt-2 text-ku-primary font-ku-bold"
        >
          {snapshot.state} · {snapshot.mode}
        </Text>
        <View className="mt-5 rounded-2xl bg-white p-4">
          <Text className="text-ku-text-strong font-ku-bold">Roster</Text>
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
            <Text className="text-center text-white font-ku-bold">
              Review candidates and teams
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
            <Text className="text-center text-ku-text-strong font-ku-bold">
              Decide underfilled Quest
            </Text>
          </Pressable>
        ) : null}
        {pendingProof && snapshot.capabilities.canReviewProof ? (
          <Pressable
            testID="hirer-manage-proof-review"
            className="mt-3 rounded-2xl border border-ku-primary p-4"
            onPress={reviewProof}
          >
            <ShieldCheck color={colors.primary} size={20} />
            <Text className="mt-2 text-ku-primary font-ku-bold">
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
            <Text className="ml-3 text-ku-primary font-ku-bold">
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
            <Text className="ml-3 text-ku-danger font-ku-bold">
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
    </SafeAreaView>
  );
}
