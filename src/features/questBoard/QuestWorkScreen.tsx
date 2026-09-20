import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshControl } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChevronLeft, RefreshCw } from "lucide-react-native";

import { ActivityIndicator, Pressable, ScrollView, Text, View } from "@/tw";
import { ScreenLayout } from "@/components/layout/ScreenLayout";
import { ApiError } from "@/api/ApiClient";
import { createQuestIdempotencyKey } from "@/api/QuestApi";
import { useSessionQuery } from "@/features/auth/sessionQueries";
import { getChatRouteParams } from "@/features/chat/chatData";
import { useLocale } from "@/features/preferences/localeStore";
import { questBoardMessages } from "@/locales/questBoardMessages";
import {
  questWorkMessages,
  type QuestWorkMessages,
} from "@/locales/questWorkMessages";
import { colors } from "@/theme/colors";
import { formatTimestamp } from "@/domain/datetime";
import { spacing } from "@/theme/spacing";

import { useLiveQuestSnapshotQuery } from "./api/questBoardQueries";
import {
  liveQuestService,
  type LiveQuestNextAction,
  type LiveQuestSnapshot,
} from "./liveQuestService";
import QuestWorkActionsCard from "./components/QuestWorkActionsCard";
import QuestWorkStatusCard from "./components/QuestWorkStatusCard";

const POLL_INTERVAL_MS = 5_000;
const POLL_WINDOW_BEFORE_START_MS = 60_000;
const POLL_WINDOW_AFTER_START_MS = 120_000;

export interface QuestWorkScreenProps {
  questId?: string;
  viewerId?: string;
  /** Compatibility alias used by existing Quest detail routes. */
  studentId?: string;
  editRequestId?: string;
}

const terminalStates: Record<string, true> = {
  QUEST_COMPLETED: true,
  QUEST_CANCELLED: true,
  QUEST_FAILED: true,
};

function routeValue(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

function formatCountdown(
  value: string | null,
  now: number,
  messages: QuestWorkMessages
): string {
  if (!value) return messages.noDueAt;
  const due = new Date(value).getTime();
  if (!Number.isFinite(due)) return messages.noDueAt;
  const remaining = due - now;
  if (remaining <= 0) return messages.dueNow;
  const totalMinutes = Math.ceil(remaining / 60_000);
  const days = Math.floor(totalMinutes / 1_440);
  const hours = Math.floor((totalMinutes % 1_440) / 60);
  const minutes = totalMinutes % 60;
  const parts: string[] = [];
  if (days) parts.push(`${days}d`);
  if (hours || days) parts.push(`${hours}h`);
  parts.push(`${minutes}m`);
  return `${parts.join(" ")} ${messages.remaining}`;
}

function nextActionLabel(
  action: LiveQuestNextAction,
  messages: QuestWorkMessages,
  questMessages: typeof questBoardMessages.en
): string {
  switch (action) {
    case "WAIT_FOR_START":
      return messages.waitingForStart;
    case "SUBMIT_PROOF":
      return messages.proofCta;
    case "CONFIRM_COMPLETION":
      return messages.confirmationCta;
    case "RESPOND_TO_EDIT":
      return messages.editTitle;
    case "NONE":
      return questMessages.statusLabel("NONE");
    default:
      return questMessages.statusLabel(action);
  }
}

function statusLabel(
  snapshot: LiveQuestSnapshot,
  messages: QuestWorkMessages,
  questMessages: typeof questBoardMessages.en
): string {
  if (snapshot.state === "QUEST_ASSIGNED") return messages.assigned;
  if (snapshot.state === "QUEST_IN_PROGRESS") return messages.inProgress;
  if (terminalStates[snapshot.state]) return messages.terminal;
  return questMessages.statusLabel(snapshot.state);
}

function assignmentLabel(
  snapshot: LiveQuestSnapshot,
  questMessages: typeof questBoardMessages.en
): string {
  return snapshot.assignment?.state
    ? questMessages.statusLabel(snapshot.assignment.state)
    : "—";
}

function getErrorText(error: unknown, messages: QuestWorkMessages): string {
  if (error instanceof ApiError && error.code)
    return `${messages.serverError} (${error.code})`;
  if (error instanceof Error && error.message)
    return `${messages.serverError} ${error.message}`;
  return messages.serverError;
}

export default function QuestWorkScreen({
  questId,
  viewerId,
  studentId,
  editRequestId,
}: QuestWorkScreenProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    id?: string | string[];
    viewerId?: string | string[];
    studentId?: string | string[];
    editRequestId?: string | string[];
  }>();
  const { locale } = useLocale();
  const messages = questWorkMessages[locale];
  const questMessages = questBoardMessages[locale];
  const resolvedQuestId = questId ?? routeValue(params.id);
  const routeViewerId =
    viewerId ??
    studentId ??
    routeValue(params.viewerId) ??
    routeValue(params.studentId);
  const resolvedEditRequestId =
    editRequestId ?? routeValue(params.editRequestId);
  const sessionQuery = useSessionQuery();
  const resolvedViewerId = routeViewerId ?? sessionQuery.data?.user.id;
  const snapshotPollingInterval = useCallback(
    (currentSnapshot: LiveQuestSnapshot | undefined): number | false => {
      if (!currentSnapshot || currentSnapshot.state !== "QUEST_ASSIGNED")
        return false;
      const startAt = new Date(currentSnapshot.quest.startTime).getTime();
      if (!Number.isFinite(startAt)) return false;
      const nowAt = Date.now();
      const pollStartAt = startAt - POLL_WINDOW_BEFORE_START_MS;
      const pollDeadline = startAt + POLL_WINDOW_AFTER_START_MS;
      if (nowAt < pollStartAt) return pollStartAt - nowAt;
      if (nowAt > pollDeadline) return false;

      const elapsedPolls = Math.floor((nowAt - pollStartAt) / POLL_INTERVAL_MS);
      const maxPolls =
        (POLL_WINDOW_BEFORE_START_MS + POLL_WINDOW_AFTER_START_MS) /
        POLL_INTERVAL_MS;
      if (elapsedPolls >= maxPolls - 1) return false;
      return POLL_INTERVAL_MS;
    },
    []
  );

  const snapshotOptions = resolvedEditRequestId
    ? { editRequestId: resolvedEditRequestId }
    : {};
  const snapshotQuery = useLiveQuestSnapshotQuery(
    resolvedQuestId ?? null,
    resolvedViewerId ?? null,
    snapshotOptions,
    Boolean(routeViewerId || !sessionQuery.isPending),
    snapshotPollingInterval
  );
  const snapshot = snapshotQuery.data ?? null;
  const loading =
    (!routeViewerId && sessionQuery.isPending) || snapshotQuery.isPending;
  const refreshing = snapshotQuery.isRefetching;
  const { refetch: refetchSnapshot } = snapshotQuery;
  const [now, setNow] = useState(() => Date.now());
  const [editSending, setEditSending] = useState(false);
  const [editFeedback, setEditFeedback] = useState<string>();
  const [confirmationSending, setConfirmationSending] = useState(false);
  const [commandError, setCommandError] = useState<string | null>(null);
  const snapshotErrorText = snapshotQuery.error
    ? getErrorText(snapshotQuery.error, messages)
    : undefined;
  const errorText = commandError ?? snapshotErrorText;
  const stale = Boolean(snapshot && (snapshotQuery.isError || commandError));

  const refreshSnapshot = useCallback(async () => {
    const result = await refetchSnapshot();
    if (result.error) throw result.error;
    setCommandError(null);
    return result.data;
  }, [refetchSnapshot]);

  const dueAtMs = snapshot?.dueAt
    ? new Date(snapshot.dueAt).getTime()
    : Number.NaN;
  const hasLiveDeadline = Number.isFinite(dueAtMs) && dueAtMs > now;
  useEffect(() => {
    if (!hasLiveDeadline) return undefined;
    const timer = setInterval(() => setNow(Date.now()), 1_000);
    return () => clearInterval(timer);
  }, [hasLiveDeadline]);

  const handleBack = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace("/(tabs)");
  }, [router]);

  const respondToEdit = useCallback(
    async (decision: "EDIT_RESPONSE_ACCEPTED" | "EDIT_RESPONSE_DECLINED") => {
      if (!snapshot?.editRequest || !snapshot.capabilities.canRespondToEdit)
        return;
      setEditSending(true);
      setEditFeedback(undefined);
      try {
        await liveQuestService.respondToEditRequest(
          snapshot.editRequest.requestId,
          { decision },
          createQuestIdempotencyKey()
        );
        setEditFeedback(messages.editUpdated);
        await refreshSnapshot().catch(() => undefined);
      } catch (error) {
        setCommandError(getErrorText(error, messages));
      } finally {
        setEditSending(false);
      }
    },
    [messages, refreshSnapshot, snapshot]
  );
  const confirmCompletion = useCallback(async () => {
    if (
      !snapshot?.capabilities.canConfirmCompletion ||
      !resolvedQuestId ||
      confirmationSending
    )
      return;
    setConfirmationSending(true);
    setCommandError(null);
    try {
      await liveQuestService.confirmCompletion(
        resolvedQuestId,
        createQuestIdempotencyKey()
      );
      const refreshedSnapshot = await refreshSnapshot();
      if (refreshedSnapshot && terminalStates[refreshedSnapshot.state]) {
        router.replace("/my-quests");
      }
    } catch (error) {
      setCommandError(getErrorText(error, messages));
    } finally {
      setConfirmationSending(false);
    }
  }, [
    confirmationSending,
    messages,
    refreshSnapshot,
    resolvedQuestId,
    router,
    snapshot,
  ]);

  const openProof = useCallback(() => {
    if (!resolvedQuestId || !resolvedViewerId) return;
    router.push({
      pathname: "../proof",
      params: {
        id: resolvedQuestId,
        viewerId: resolvedViewerId,
        studentId: resolvedViewerId,
      },
    });
  }, [resolvedQuestId, resolvedViewerId, router]);

  const status = snapshot ? statusLabel(snapshot, messages, questMessages) : "";
  const isTerminal = Boolean(snapshot && terminalStates[snapshot.state]);
  const countdown = useMemo(
    () => formatCountdown(snapshot?.dueAt ?? null, now, messages),
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
  const conversationId = snapshot?.workConversation?.id;
  const canOpenChat = Boolean(
    snapshot?.capabilities.canReadWorkChat && conversationId && resolvedViewerId
  );
  const openDispute = useCallback(() => {
    if (!resolvedQuestId) return;
    router.push(`../quest/${resolvedQuestId}/dispute`);
  }, [resolvedQuestId, router]);
  const openChat = useCallback(() => {
    if (!conversationId || !resolvedQuestId || !resolvedViewerId) return;
    router.push({
      pathname: "/chat/[id]",
      params: getChatRouteParams({
        conversationId,
        questId: resolvedQuestId,
        viewerId: resolvedViewerId,
      }),
    });
  }, [conversationId, resolvedQuestId, resolvedViewerId, router]);
  const contentBottom = Math.max(spacing.lg, insets.bottom + spacing.md);

  if (loading && !snapshot) {
    return (
      <ScreenLayout
        edges={["top", "left", "right", "bottom"]}
        className="flex-1 bg-slate-50"
      >
        <View
          className="flex-1 items-center justify-center px-6"
          testID="quest-work-loading"
        >
          <ActivityIndicator color={colors.primary} />
          <Text className="mt-3 text-sm text-slate-500">
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
        className="flex-1 bg-slate-50"
      >
        <View className="flex-1 justify-center px-6" testID="quest-work-error">
          <Text className="text-xl font-bold text-slate-950">
            {messages.serverError}
          </Text>
          <Text className="mt-2 text-sm leading-5 text-slate-600">
            {errorText ?? messages.missingRoute}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={messages.retry}
            className="mt-5 rounded-xl bg-slate-950 px-4 py-3"
            onPress={() => void refreshSnapshot().catch(() => undefined)}
          >
            <Text className="text-center font-semibold text-white">
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
      className="flex-1 bg-slate-50"
    >
      <ScrollView
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
        <View className="px-5 pt-3">
          <View className="mb-5 flex-row items-center justify-between">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={questMessages.back}
              className="h-10 w-10 items-center justify-center rounded-full bg-white"
              onPress={handleBack}
            >
              <ChevronLeft color={colors.primaryDeep} size={23} />
            </Pressable>
            <Text className="text-base font-bold text-slate-950">
              {messages.title}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={messages.refresh}
              className="h-10 w-10 items-center justify-center rounded-full bg-white"
              onPress={() => void refreshSnapshot().catch(() => undefined)}
            >
              <RefreshCw color={colors.primaryDeep} size={18} />
            </Pressable>
          </View>

          <QuestWorkStatusCard
            snapshot={snapshot}
            status={status}
            assignment={assignmentLabel(snapshot, questMessages)}
            nextAction={nextActionLabel(
              snapshot.nextAction,
              messages,
              questMessages
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
            onOpenProof={openProof}
            onConfirmCompletion={confirmCompletion}
            onFileDispute={resolvedQuestId ? openDispute : undefined}
            onOpenChat={openChat}
          />
        </View>
      </ScrollView>
    </ScreenLayout>
  );
}
