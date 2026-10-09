import { serverNow } from "@/api/serverClock";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigation } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ActivityIndicator, Text, View } from "@/tw";
import { ScreenLayout } from "@/components/layout/ScreenLayout";
import { StateView } from "@/components/ui/StateView";
import { TopBar } from "@/components/ui/TopBar";
import { showConfirmModal } from "@/components/ui/SweetAlert";
import { WorkerProofForm } from "@/features/workerWork/components/WorkerProofForm";
import { workerWorkMessages } from "@/locales/workerWorkMessages";
import { questBoardMessages } from "@/locales/questBoardMessages";
import { useAppTheme } from "@/features/workspace/AppThemeProvider";
import { formatTimestamp } from "@/domain/datetime";
import { isTerminalStatus } from "@/domain/questLifecycle";
import { spacing } from "@/theme/spacing";
import { formatWorkCountdown } from "@/utils";
import type { LiveQuestSnapshot } from "../live/liveQuestTypes";
import {
  assignmentLabel,
  nextActionLabel,
  workStatusLabel,
} from "../presentation/questLabels";
import {
  isWorkerActor,
  QuestTeamRole,
  type QuestStatus,
} from "../domain/types";
import QuestWorkActionsCard from "./components/QuestWorkActionsCard";
import QuestWorkSettlementCard from "./components/QuestWorkSettlementCard";
import QuestWorkStatusCard from "./components/QuestWorkStatusCard";
import { QuestWorkFrame } from "./QuestWorkFrame";
import TeamLeaderWorkScreen from "./TeamLeaderWorkScreen";
import TeamMemberWorkScreen from "./TeamMemberWorkScreen";
import {
  useQuestWorkFeature,
  type QuestWorkFeatureProps,
} from "./useQuestWorkFeature";
import { useQuestTagsQuery } from "../api/questTagsQueries";

export type QuestWorkScreenProps = QuestWorkFeatureProps;
export default function QuestWorkScreen(props: QuestWorkScreenProps) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const proofDirtyRef = useRef(false);
  const allowLeaveRef = useRef(false);
  const {
    canOpenChat,
    confirmationSending,
    editFeedback,
    editSending,
    errorText,
    handleBack,
    loading,
    locale,
    messages,
    openChat,
    openQuestDetail,
    openDispute,
    recordedStartedAt,
    refreshSnapshot,
    refreshing,
    respondToEdit,
    resolvedQuestId,
    resolvedViewerId,
    snapshot,
    stale,
    confirmCompletion,
    startWork,
    startWorkSending,
    submitTeamRewardAllocation,
    allocationSending,
  } = useQuestWorkFeature(props);
  const tagQuery = useQuestTagsQuery();
  const tagCatalog = tagQuery.data ?? [];
  const { colors } = useAppTheme();
  const questMessages = questBoardMessages[locale];
  const [now, setNow] = useState(() => serverNow());
  const dueAtMs = snapshot?.dueAt
    ? new Date(snapshot.dueAt).getTime()
    : Number.NaN;
  const hasLiveDeadline = Number.isFinite(dueAtMs) && dueAtMs > now;

  useEffect(() => {
    if (!hasLiveDeadline) return undefined;
    const timer = setInterval(() => setNow(serverNow()), 1_000);
    return () => clearInterval(timer);
  }, [hasLiveDeadline]);
  useEffect(
    () =>
      navigation.addListener("beforeRemove", (event) => {
        if (!proofDirtyRef.current || allowLeaveRef.current) {
          allowLeaveRef.current = false;
          return;
        }
        event.preventDefault();
        const t = workerWorkMessages[locale];
        showConfirmModal({
          title: t.discardProofTitle,
          message: t.discardProofMessage,
          cancelLabel: t.keepProof,
          confirmLabel: t.discardProof,
          onConfirm: () => {
            allowLeaveRef.current = true;
            navigation.dispatch(event.data.action);
          },
        });
      }),
    [locale, navigation]
  );

  const status = snapshot
    ? workStatusLabel(snapshot.state as QuestStatus, messages, locale)
    : "";
  const isTerminal = Boolean(
    snapshot && isTerminalStatus(snapshot.state as QuestStatus)
  );
  const countdown = useMemo(
    () => formatWorkCountdown(snapshot?.dueAt ?? null, now, messages),
    [messages, now, snapshot?.dueAt]
  );
  const conditions = useMemo(
    () =>
      snapshot?.quest.condition.items
        .slice()
        .sort(
          (
            a: LiveQuestSnapshot["quest"]["condition"]["items"][number],
            b: LiveQuestSnapshot["quest"]["condition"]["items"][number]
          ) => a.position - b.position
        ) ?? [],
    [snapshot?.quest.condition.items]
  );
  const startedAt = snapshot?.assignment?.startedAt ?? recordedStartedAt;
  const mustStartWork = Boolean(
    snapshot?.capabilities.canStartWork && !startedAt
  );
  const startTimeMs = snapshot
    ? new Date(snapshot.quest.startTime).getTime()
    : Number.NaN;
  const canPressStartWork =
    mustStartWork &&
    Number.isFinite(startTimeMs) &&
    Number.isFinite(dueAtMs) &&
    now >= startTimeMs &&
    now < dueAtMs;
  const contentBottom = Math.max(spacing.lg, insets.bottom + spacing.md);

  if (loading && !snapshot) {
    return (
      <ScreenLayout
        edges={["top", "left", "right", "bottom"]}
        className="flex-1 bg-ku-background"
      >
        <TopBar
          title={messages.title}
          backLabel={questMessages.back}
          onBackPress={handleBack}
          variant="detail"
        />
        <View
          className="flex-1 items-center justify-center px-ku-lg"
          testID="quest-work-loading"
        >
          <ActivityIndicator color={colors.primary} />
          <Text className="mt-ku-12 text-ku-label text-ku-text-secondary">
            {questMessages.loading}
          </Text>
        </View>
      </ScreenLayout>
    );
  }

  if (!snapshot) {
    return (
      <ScreenLayout
        edges={["top", "left", "right", "bottom"]}
        className="flex-1 bg-ku-background"
      >
        <TopBar
          title={messages.title}
          backLabel={questMessages.back}
          onBackPress={handleBack}
          variant="detail"
        />
        <View className="flex-1 justify-center" testID="quest-work-error">
          <StateView
            actionLabel={messages.retry}
            description={errorText ?? messages.missingRoute}
            onAction={() => void refreshSnapshot().catch(() => undefined)}
            title={messages.serverError}
            variant="error"
          />
        </View>
      </ScreenLayout>
    );
  }

  const frame = {
    messages,
    backLabel: questMessages.back,
    onBack: handleBack,
    refreshing,
    onRefresh: () => void refreshSnapshot().catch(() => undefined),
    contentBottom,
  };
  const statusCard = (
    <QuestWorkStatusCard
      snapshot={snapshot}
      status={status}
      assignment={assignmentLabel(snapshot.assignment, locale)}
      nextAction={nextActionLabel(snapshot.nextAction, messages, locale)}
      countdown={countdown}
      dueAtDetail={
        snapshot.dueAt ? formatTimestamp(snapshot.dueAt, locale, "") : undefined
      }
      isTerminal={isTerminal}
      messages={messages}
      tagCatalog={tagCatalog}
      onOpenQuestDetail={openQuestDetail}
    />
  );
  const settlementCard = <QuestWorkSettlementCard snapshot={snapshot} />;
  const proofForm =
    isWorkerActor(snapshot.actor) && resolvedQuestId && resolvedViewerId ? (
      <WorkerProofForm
        onDirtyChange={(dirty) => {
          proofDirtyRef.current = dirty;
        }}
        onSubmitted={() => refreshSnapshot().catch(() => undefined)}
        questId={resolvedQuestId}
        snapshot={snapshot}
        viewerId={resolvedViewerId}
      />
    ) : null;
  const actionsCard = (
    <QuestWorkActionsCard
      snapshot={snapshot}
      messages={messages}
      stale={stale}
      errorText={errorText}
      conditions={conditions}
      editSending={editSending}
      editFeedback={editFeedback}
      confirmationSending={confirmationSending}
      canPressStartWork={canPressStartWork}
      startWorkOpensAt={
        mustStartWork && !canPressStartWork
          ? formatTimestamp(snapshot.quest.startTime, locale, "")
          : undefined
      }
      startWorkRecordedAt={
        startedAt ? formatTimestamp(startedAt, locale, "") : undefined
      }
      startWorkSending={startWorkSending}
      onStartWork={startWork}
      canOpenChat={canOpenChat}
      onRespondToEdit={respondToEdit}
      onConfirmCompletion={confirmCompletion}
      onFileDispute={resolvedQuestId ? openDispute : undefined}
      onOpenChat={openChat}
    />
  );

  // Candidate Teams are exposed to their participants after selection so the
  // completed Work Hub can show each member's final reward allocation.
  const { team, teamRole } = snapshot;
  if (team && teamRole === QuestTeamRole.LEADER) {
    return (
      <TeamLeaderWorkScreen
        frame={frame}
        snapshot={snapshot}
        team={team}
        messages={messages}
        statusCard={statusCard}
        settlementCard={settlementCard}
        proofForm={proofForm}
        actionsCard={actionsCard}
        onSubmitAllocation={submitTeamRewardAllocation}
        allocationSending={allocationSending}
      />
    );
  }
  if (team && teamRole === QuestTeamRole.MEMBER) {
    return (
      <TeamMemberWorkScreen
        frame={frame}
        snapshot={snapshot}
        team={team}
        messages={messages}
        statusCard={statusCard}
        settlementCard={settlementCard}
        actionsCard={actionsCard}
      />
    );
  }
  return (
    <QuestWorkFrame {...frame}>
      {statusCard}
      {settlementCard}
      {proofForm}
      {actionsCard}
    </QuestWorkFrame>
  );
}
