import { useEffect, useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform, RefreshControl } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChevronLeft, RefreshCw } from "lucide-react-native";

import { ActivityIndicator, Pressable, ScrollView, Text, View } from "@/tw";
import { ScreenLayout } from "@/components/layout/ScreenLayout";
import { WorkerProofForm } from "@/features/workerWork/components/WorkerProofForm";
import { questBoardMessages } from "@/locales/questBoardMessages";
import { colors } from "@/theme/colors";
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
    refreshSnapshot,
    refreshing,
    respondToEdit,
    resolvedQuestId,
    resolvedViewerId,
    snapshot,
    stale,
    confirmCompletion,
  } = useQuestWorkFeature(props);
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
  const contentBottom = Math.max(spacing.lg, insets.bottom + spacing.md);

  if (loading && !snapshot) {
    return (
      <ScreenLayout
        edges={["top", "left", "right", "bottom"]}
        className="flex-1 bg-ku-background"
      >
        <View
          className="flex-1 items-center justify-center px-ku-lg"
          testID="quest-work-loading"
        >
          <ActivityIndicator color={colors.worker} />
          <Text className="mt-ku-12 text-ku-label text-ku-text-subtle">
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
        <View
          className="flex-1 justify-center px-ku-lg"
          testID="quest-work-error"
        >
          <Text className="font-ku-bold text-ku-title-small text-ku-text-strong">
            {messages.serverError}
          </Text>
          <Text className="mt-ku-sm text-ku-body-small text-ku-text-secondary">
            {errorText ?? messages.missingRoute}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={messages.retry}
            className="mt-ku-20 rounded-xl bg-ku-worker px-ku-md py-ku-12"
            onPress={() => void refreshSnapshot().catch(() => undefined)}
          >
            <Text className="text-center font-ku-semibold text-ku-on-worker">
              {messages.retry}
            </Text>
          </Pressable>
        </View>
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout
      edges={["top", "left", "right", "bottom"]}
      className="flex-1 bg-ku-background"
    >
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
              tintColor={colors.worker}
            />
          }
          contentContainerStyle={{ paddingBottom: contentBottom }}
          testID="quest-work-screen"
        >
          <View className="px-ku-20 pt-ku-12">
            <View className="mb-ku-20 flex-row items-center justify-between">
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={questMessages.back}
                className="h-10 w-10 items-center justify-center rounded-full bg-ku-surface"
                onPress={handleBack}
              >
                <ChevronLeft color={colors.workerDeep} size={23} />
              </Pressable>
              <Text className="font-ku-bold text-ku-body text-ku-text-strong">
                {messages.title}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={messages.refresh}
                className="h-10 w-10 items-center justify-center rounded-full bg-ku-surface"
                onPress={() => void refreshSnapshot().catch(() => undefined)}
              >
                <RefreshCw color={colors.workerDeep} size={18} />
              </Pressable>
            </View>

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
