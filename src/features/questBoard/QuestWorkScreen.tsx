import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { RefreshControl } from "react-native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  Clock3,
  MessageCircle,
  RefreshCw,
  ShieldCheck,
} from "lucide-react-native";

import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  View,
} from "@/tw";
import { ApiError } from "@/api/ApiClient";
import { createQuestIdempotencyKey } from "@/api/QuestApi";
import { authService } from "@/features/auth/AuthService";
import { getChatRouteParams } from "@/features/chat/chatData";
import { useLocale } from "@/locales/LocaleProvider";
import { questBoardMessages } from "@/locales/questBoardMessages";
import {
  questWorkMessages,
  type QuestWorkMessages,
} from "@/locales/questWorkMessages";
import { colors } from "@/theme/colors";
import { spacing } from "@/theme/spacing";

import {
  liveQuestService,
  type LiveQuestNextAction,
  type LiveQuestSnapshot,
} from "./liveQuestService";

const POLL_INTERVAL_MS = 5_000;
const POLL_WINDOW_BEFORE_START_MS = 60_000;
const POLL_WINDOW_AFTER_START_MS = 120_000;
const MAX_START_POLLS = 36;

type WorkLoadState = "pending" | "ready" | "error";

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

function formatDateTime(
  value: string | null | undefined,
  locale: "en" | "th"
): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(locale === "th" ? "th-TH" : "en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Bangkok",
  }).format(date);
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

function StateCard({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "warning" | "success";
}) {
  return (
    <View
      className={`rounded-2xl border p-4 ${
        tone === "warning"
          ? "border-amber-300 bg-amber-50"
          : tone === "success"
            ? "border-emerald-300 bg-emerald-50"
            : "border-slate-200 bg-white"
      }`}
    >
      {children}
    </View>
  );
}

function WorkRow({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <View className="mb-3 flex-row justify-between gap-3">
      <Text className="flex-1 text-sm text-slate-500">{label}</Text>
      <View className="flex-1 items-end">
        <Text className="text-right text-sm font-semibold text-slate-900">
          {value}
        </Text>
        {detail ? (
          <Text className="mt-1 text-right text-xs text-slate-500">
            {detail}
          </Text>
        ) : null}
      </View>
    </View>
  );
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
  const [sessionViewerId, setSessionViewerId] = useState<string>();
  const [sessionResolved, setSessionResolved] = useState(
    Boolean(routeViewerId)
  );
  const [snapshot, setSnapshot] = useState<LiveQuestSnapshot | null>(null);
  const snapshotRef = useRef<LiveQuestSnapshot | null>(null);
  const [loadState, setLoadState] = useState<WorkLoadState>("pending");
  const [refreshing, setRefreshing] = useState(false);
  const [stale, setStale] = useState(false);
  const [errorText, setErrorText] = useState<string>();
  const [now, setNow] = useState(() => Date.now());
  const [editSending, setEditSending] = useState(false);
  const [editFeedback, setEditFeedback] = useState<string>();
  const [confirmationSending, setConfirmationSending] = useState(false);
  const latestRouteRef = useRef(
    `${resolvedQuestId ?? ""}:${routeViewerId ?? ""}`
  );
  const routeMountedRef = useRef(false);
  const loadedAtRef = useRef<number | null>(null);
  const pollAttemptsRef = useRef(0);
  const pollDeadlineRef = useRef<number | null>(null);

  useEffect(() => {
    let active = true;
    const resetTimer = setTimeout(() => {
      if (!active) return;
      if (routeViewerId) {
        setSessionViewerId(undefined);
        setSessionResolved(true);
      } else {
        setSessionResolved(false);
      }
    }, 0);
    if (!routeViewerId) {
      void authService
        .getSession()
        .then((session) => {
          if (!active) return;
          setSessionViewerId(session?.user.id);
          setSessionResolved(true);
        })
        .catch(() => {
          if (active) setSessionResolved(true);
        });
    }
    return () => {
      active = false;
      clearTimeout(resetTimer);
    };
  }, [routeViewerId]);
  const resolvedViewerId = routeViewerId ?? sessionViewerId;
  const routeKey = `${resolvedQuestId ?? ""}:${resolvedViewerId ?? ""}`;
  useEffect(() => {
    const isInitialRoute = !routeMountedRef.current;
    routeMountedRef.current = true;
    latestRouteRef.current = routeKey;
    snapshotRef.current = null;
    loadedAtRef.current = null;
    pollAttemptsRef.current = 0;
    pollDeadlineRef.current = null;
    if (isInitialRoute) return undefined;
    const resetTimer = setTimeout(() => {
      if (latestRouteRef.current !== routeKey) return;
      setSnapshot(null);
      setStale(false);
      setErrorText(undefined);
      setLoadState("pending");
    }, 0);
    return () => clearTimeout(resetTimer);
  }, [routeKey]);

  const loadSnapshot = useCallback(
    async (force = false): Promise<LiveQuestSnapshot | undefined> => {
      if (!resolvedQuestId || !resolvedViewerId) {
        if (sessionResolved) {
          setLoadState("error");
          setErrorText(messages.missingRoute);
        }
        return undefined;
      }
      if (
        !force &&
        loadedAtRef.current &&
        Date.now() - loadedAtRef.current < 10_000
      )
        return snapshotRef.current ?? undefined;
      setRefreshing(true);
      try {
        const nextSnapshot = await liveQuestService.getLiveSnapshot(
          resolvedQuestId,
          resolvedViewerId,
          resolvedEditRequestId
            ? { editRequestId: resolvedEditRequestId }
            : undefined
        );
        if (latestRouteRef.current !== `${resolvedQuestId}:${resolvedViewerId}`)
          return nextSnapshot;
        snapshotRef.current = nextSnapshot;
        setSnapshot(nextSnapshot);
        setLoadState("ready");
        setStale(false);
        setErrorText(undefined);
        loadedAtRef.current = Date.now();
        return nextSnapshot;
      } catch (error) {
        if (latestRouteRef.current !== `${resolvedQuestId}:${resolvedViewerId}`)
          return undefined;
        const previousSnapshot = snapshotRef.current;
        setStale(Boolean(previousSnapshot));
        setLoadState(previousSnapshot ? "ready" : "error");
        setErrorText(getErrorText(error, messages));
        throw error;
      } finally {
        if (latestRouteRef.current === `${resolvedQuestId}:${resolvedViewerId}`)
          setRefreshing(false);
      }
    },
    [
      messages,
      resolvedEditRequestId,
      resolvedQuestId,
      resolvedViewerId,
      sessionResolved,
    ]
  );

  useFocusEffect(
    useCallback(() => {
      if (!resolvedQuestId || !resolvedViewerId) {
        if (sessionResolved) void loadSnapshot(false).catch(() => undefined);
        return undefined;
      }
      void loadSnapshot(false).catch(() => undefined);
      return undefined;
    }, [loadSnapshot, resolvedQuestId, resolvedViewerId, sessionResolved])
  );

  useEffect(() => {
    if (!snapshot?.dueAt) return undefined;
    const timer = setInterval(() => setNow(Date.now()), 1_000);
    return () => clearInterval(timer);
  }, [snapshot?.dueAt]);

  useEffect(() => {
    if (!snapshot || snapshot.state !== "QUEST_ASSIGNED") return undefined;
    const startAt = new Date(snapshot.quest.startTime).getTime();
    if (!Number.isFinite(startAt)) return undefined;
    const nowAt = Date.now();
    const pollDeadline =
      pollDeadlineRef.current ?? startAt + POLL_WINDOW_AFTER_START_MS;
    pollDeadlineRef.current = pollDeadline;
    if (nowAt > pollDeadline) return undefined;
    let startTimer: ReturnType<typeof setTimeout> | undefined;
    let pollTimer: ReturnType<typeof setInterval> | undefined;
    const startPolling = () => {
      if (
        pollAttemptsRef.current < MAX_START_POLLS &&
        Date.now() <= pollDeadline
      ) {
        pollAttemptsRef.current += 1;
        void loadSnapshot(true).catch(() => undefined);
      }
      pollTimer = setInterval(() => {
        if (
          pollAttemptsRef.current >= MAX_START_POLLS ||
          Date.now() > pollDeadline
        ) {
          if (pollTimer) clearInterval(pollTimer);
          return;
        }
        pollAttemptsRef.current += 1;
        void loadSnapshot(true).catch(() => undefined);
      }, POLL_INTERVAL_MS);
    };
    const pollStartAt = startAt - POLL_WINDOW_BEFORE_START_MS;
    if (nowAt >= pollStartAt) {
      startPolling();
    } else {
      startTimer = setTimeout(startPolling, pollStartAt - nowAt);
    }
    return () => {
      if (startTimer) {
        clearTimeout(startTimer);
        startTimer = undefined;
      }
      if (pollTimer) {
        clearInterval(pollTimer);
        pollTimer = undefined;
      }
    };
  }, [loadSnapshot, snapshot]);

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
        await loadSnapshot(true).catch(() => undefined);
      } catch (error) {
        setErrorText(getErrorText(error, messages));
        setStale(Boolean(snapshot));
      } finally {
        setEditSending(false);
      }
    },
    [loadSnapshot, messages, snapshot]
  );
  const confirmCompletion = useCallback(async () => {
    if (
      !snapshot?.capabilities.canConfirmCompletion ||
      !resolvedQuestId ||
      confirmationSending
    )
      return;
    setConfirmationSending(true);
    setErrorText(undefined);
    try {
      await liveQuestService.confirmCompletion(
        resolvedQuestId,
        createQuestIdempotencyKey()
      );
      const refreshedSnapshot = await loadSnapshot(true);
      if (refreshedSnapshot && terminalStates[refreshedSnapshot.state]) {
        router.replace("/my-quests");
      }
    } catch (error) {
      setStale(Boolean(snapshot));
      setErrorText(getErrorText(error, messages));
    } finally {
      setConfirmationSending(false);
    }
  }, [
    confirmationSending,
    loadSnapshot,
    messages,
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
  const conditions =
    snapshot?.quest.condition.items
      .slice()
      .sort(
        (
          a: LiveQuestSnapshot["quest"]["condition"]["items"][number],
          b: LiveQuestSnapshot["quest"]["condition"]["items"][number]
        ) => a.position - b.position
      ) ?? [];
  const conversationId = snapshot?.workConversation?.id;
  const canOpenChat = Boolean(
    snapshot?.capabilities.canReadWorkChat && conversationId && resolvedViewerId
  );
  const contentBottom = Math.max(spacing.lg, insets.bottom + spacing.md);

  if (loadState === "pending" && !snapshot) {
    return (
      <SafeAreaView
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
      </SafeAreaView>
    );
  }

  if (!snapshot) {
    return (
      <SafeAreaView
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
            onPress={() => void loadSnapshot(true).catch(() => undefined)}
          >
            <Text className="text-center font-semibold text-white">
              {messages.retry}
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      edges={["top", "left", "right", "bottom"]}
      className="flex-1 bg-slate-50"
    >
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void loadSnapshot(true).catch(() => undefined)}
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
              onPress={() => void loadSnapshot(true).catch(() => undefined)}
            >
              <RefreshCw color={colors.primaryDeep} size={18} />
            </Pressable>
          </View>

          <StateCard
            tone={
              isTerminal
                ? "neutral"
                : snapshot.state === "QUEST_IN_PROGRESS"
                  ? "success"
                  : "warning"
            }
          >
            <View className="flex-row items-start justify-between gap-3">
              <View className="flex-1">
                <Text className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  {status}
                </Text>
                <Text className="mt-1 text-2xl font-bold text-slate-950">
                  {snapshot.quest.title}
                </Text>
              </View>
              <Clock3
                color={isTerminal ? colors.textMuted : colors.primary}
                size={22}
              />
            </View>
            <View className="mt-4 border-t border-slate-200 pt-3">
              <WorkRow
                label={messages.assignment}
                value={assignmentLabel(snapshot, questMessages)}
              />
              <WorkRow
                label={messages.nextAction}
                value={nextActionLabel(
                  snapshot.nextAction,
                  messages,
                  questMessages
                )}
              />
              <WorkRow
                label={messages.dueAt}
                value={countdown}
                detail={
                  snapshot.dueAt
                    ? formatDateTime(snapshot.dueAt, locale)
                    : undefined
                }
              />
            </View>
          </StateCard>

          {stale ? (
            <View className="mt-3 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2">
              <Text className="text-sm text-amber-900">{messages.stale}</Text>
              {errorText ? (
                <Text className="mt-1 text-xs text-amber-800">{errorText}</Text>
              ) : null}
            </View>
          ) : null}

          {snapshot.state === "QUEST_ASSIGNED" ? (
            <View className="mt-3 flex-row items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 px-3 py-3">
              <ShieldCheck color={colors.primary} size={20} />
              <View className="flex-1">
                <Text className="font-semibold text-blue-950">
                  {messages.waitingForStart}
                </Text>
                <Text className="mt-1 text-sm leading-5 text-blue-900">
                  {messages.startsAutomatically}
                </Text>
              </View>
            </View>
          ) : null}

          {isTerminal ? (
            <View className="mt-3 rounded-xl border border-slate-200 bg-slate-100 px-3 py-3">
              <Text className="text-sm leading-5 text-slate-700">
                {messages.archiveDescription}
              </Text>
              {snapshot.state === "QUEST_FAILED" && resolvedQuestId ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={messages.fileDispute}
                  className="mt-3 flex-row items-center justify-center gap-2 rounded-xl bg-amber-600 px-3 py-2.5"
                  onPress={() => {
                    router.push(`../quest/${resolvedQuestId}/dispute`);
                  }}
                >
                  <AlertTriangle color="white" size={16} />
                  <Text className="text-center text-sm font-semibold text-white">
                    {messages.fileDispute}
                  </Text>
                </Pressable>
              ) : null}
            </View>
          ) : null}

          <View className="mt-5">
            <Text className="mb-3 text-lg font-bold text-slate-950">
              {messages.conditions}
            </Text>
            <StateCard>
              {conditions.length ? (
                conditions.map((condition) => (
                  <View
                    key={`${condition.position}-${condition.text}`}
                    className="mb-3 flex-row items-start gap-2 last:mb-0"
                  >
                    <CheckCircle2 color={colors.primary} size={18} />
                    <Text className="flex-1 text-sm leading-5 text-slate-700">
                      {condition.text}
                    </Text>
                  </View>
                ))
              ) : (
                <Text className="text-sm text-slate-500">
                  {messages.actionUnavailable}
                </Text>
              )}
            </StateCard>
          </View>

          {snapshot.editRequest?.status === "EDIT_REQUEST_PENDING" ? (
            <StateCard tone="warning">
              <Text className="text-lg font-bold text-slate-950">
                {messages.editTitle}
              </Text>
              <Text className="mt-1 text-sm leading-5 text-slate-700">
                {messages.editDescription}
              </Text>
              <View className="mt-3 rounded-xl bg-white px-3 py-3">
                {snapshot.editRequest.proposedCondition.items.map((item) => (
                  <Text
                    key={`${item.position}-${item.text}`}
                    className="mb-1 text-sm text-slate-700"
                  >
                    • {item.text}
                  </Text>
                ))}
              </View>
              {snapshot.capabilities.canRespondToEdit ? (
                <View className="mt-3 flex-row gap-2">
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={messages.acceptEdit}
                    disabled={editSending}
                    className="flex-1 rounded-xl bg-slate-950 px-3 py-3 disabled:opacity-50"
                    onPress={() => void respondToEdit("EDIT_RESPONSE_ACCEPTED")}
                  >
                    <Text className="text-center text-sm font-semibold text-white">
                      {messages.acceptEdit}
                    </Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={messages.declineEdit}
                    disabled={editSending}
                    className="flex-1 rounded-xl border border-slate-300 bg-white px-3 py-3 disabled:opacity-50"
                    onPress={() => void respondToEdit("EDIT_RESPONSE_DECLINED")}
                  >
                    <Text className="text-center text-sm font-semibold text-slate-900">
                      {messages.declineEdit}
                    </Text>
                  </Pressable>
                </View>
              ) : (
                <Text className="mt-3 text-sm text-slate-500">
                  {messages.actionUnavailable}
                </Text>
              )}
            </StateCard>
          ) : null}
          {editFeedback ? (
            <Text className="mt-2 text-sm text-emerald-700">
              {editFeedback}
            </Text>
          ) : null}

          {snapshot.capabilities.canSubmitProof ? (
            <View className="mt-5 rounded-2xl border border-slate-200 bg-white p-4">
              <View className="flex-row items-center gap-2">
                <CheckCircle2 color={colors.primaryDeep} size={20} />
                <Text className="font-bold text-slate-950">
                  {messages.proofCta}
                </Text>
              </View>
              <Text className="mt-2 text-sm leading-5 text-slate-600">
                {messages.proofPlaceholder}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={messages.proofCta}
                className="mt-3 rounded-xl bg-slate-950 px-3 py-3"
                onPress={openProof}
              >
                <Text className="text-center text-sm font-semibold text-white">
                  {messages.proofCta}
                </Text>
              </Pressable>
            </View>
          ) : null}

          {snapshot.capabilities.canConfirmCompletion ? (
            <View className="mt-5 rounded-2xl border border-slate-200 bg-white p-4">
              <View className="flex-row items-center gap-2">
                <CheckCircle2 color={colors.primaryDeep} size={20} />
                <Text className="font-bold text-slate-950">
                  {messages.confirmationCta}
                </Text>
              </View>
              <Text className="mt-2 text-sm leading-5 text-slate-600">
                {messages.confirmationPlaceholder}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={messages.confirmationCta}
                disabled={confirmationSending}
                className="mt-3 rounded-xl bg-slate-950 px-3 py-3 disabled:opacity-50"
                onPress={() => void confirmCompletion()}
              >
                {confirmationSending ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-center text-sm font-semibold text-white">
                    {messages.confirmationCta}
                  </Text>
                )}
              </Pressable>
            </View>
          ) : null}

          <View className="mt-5">
            {canOpenChat ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={messages.workChat}
                className="flex-row items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3"
                onPress={() => {
                  if (!conversationId || !resolvedQuestId || !resolvedViewerId)
                    return;
                  router.push({
                    pathname: "/chat/[id]",
                    params: getChatRouteParams({
                      conversationId,
                      questId: resolvedQuestId,
                      viewerId: resolvedViewerId,
                    }),
                  });
                }}
              >
                <MessageCircle color="white" size={18} />
                <Text className="font-semibold text-white">
                  {messages.workChat}
                </Text>
              </Pressable>
            ) : (
              <Text className="text-center text-sm text-slate-500">
                {messages.noChat}
              </Text>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
