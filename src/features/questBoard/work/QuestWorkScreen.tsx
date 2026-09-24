import { useEffect, useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform, RefreshControl } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { RefreshCw } from "lucide-react-native";

import { ActivityIndicator, Pressable, ScrollView, Text, View } from "@/tw";
import { ScreenLayout } from "@/components/layout/ScreenLayout";
import { StateView } from "@/components/ui/StateView";
import { TopBar } from "@/components/ui/TopBar";
import { WorkerProofForm } from "@/features/workerWork/components/WorkerProofForm";
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
import type { QuestStatus } from "../domain/types";
import QuestWorkActionsCard from "./components/QuestWorkActionsCard";
import QuestWorkStatusCard from "./components/QuestWorkStatusCard";
import {
  useQuestWorkFeature,
  type QuestWorkFeatureProps,
} from "./useQuestWorkFeature";

export type QuestWorkScreenProps = QuestWorkFeatureProps;

export default function QuestWorkScreen(props: QuestWorkScreenProps) {
  const insets = useSafeAreaInsets();
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
  } = useQuestWorkFeature(props);
  const { colors } = useAppTheme();
  const questMessages = questBoardMessages[locale];
  const [now, setNow] = useState(() => Date.now());
  const dueAtMs = snapshot?.dueAt
    ? new Date(snapshot.dueAt).getTime()
    : Number.NaN;
  const hasLiveDeadline = Number.isFinite(dueAtMs) && dueAtMs > now;

  useEffect(() => {
    if (!hasLiveDeadline) return undefined;
    const timer = setInterval(() => setNow(Date.now()), 1_000);
    return () => clearInterval(timer);
  }, [hasLiveDeadline]);

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
  const canPressStartWork = mustStartWork && now >= startTimeMs;
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
        rightAction={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={messages.refresh}
            hitSlop={8}
            className="h-12 w-12 items-center justify-center rounded-ku-pill active:bg-ku-surface-raised"
            onPress={() => void refreshSnapshot().catch(() => undefined)}
          >
            <RefreshCw color={colors.primaryDark} size={20} />
          </Pressable>
        }
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => void refreshSnapshot().catch(() => undefined)}
              tintColor={colors.primary}
            />
          }
          contentContainerStyle={{ paddingBottom: contentBottom }}
          testID="quest-work-screen"
        >
          <View className="gap-ku-md px-ku-md pt-ku-md">
            <QuestWorkStatusCard
              snapshot={snapshot}
              status={status}
              assignment={assignmentLabel(snapshot.assignment, locale)}
              nextAction={nextActionLabel(
                snapshot.nextAction,
                messages,
                locale
              )}
              countdown={countdown}
              dueAtDetail={
                snapshot.dueAt
                  ? formatTimestamp(snapshot.dueAt, locale, "")
                  : undefined
              }
              isTerminal={isTerminal}
              messages={messages}
            />

            {snapshot.actor === "WORKER" &&
            resolvedQuestId &&
            resolvedViewerId ? (
              <WorkerProofForm
                onSubmitted={() => refreshSnapshot().catch(() => undefined)}
                questId={resolvedQuestId}
                snapshot={snapshot}
                viewerId={resolvedViewerId}
              />
            ) : null}

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
              isTerminal={isTerminal}
              canOpenChat={canOpenChat}
              onRespondToEdit={respondToEdit}
              onConfirmCompletion={confirmCompletion}
              onFileDispute={resolvedQuestId ? openDispute : undefined}
              onOpenChat={openChat}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenLayout>
  );
}
