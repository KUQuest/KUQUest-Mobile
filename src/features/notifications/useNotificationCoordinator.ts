import { focusManager, useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter, useSegments, type Href } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";

import { useSessionQuery } from "@/features/auth/sessionQueries";
import { authEnvironment } from "@/features/auth/authEnvironment";
import { isPublicAuthRoute } from "@/features/auth/AuthMiddleware";
import { useChatNotificationConversationsQuery } from "@/features/chat/api/chatQueries";
import { getChatRouteParams } from "@/features/chat/chatData";
import { useLocale } from "@/features/preferences/localeStore";
import { serverNow } from "@/api/serverClock";
import { formatCountdown } from "@/features/questBoard/shared/useServerCountdown";
import { subscribeToHirerQuestEvents } from "@/features/questBoard/live/questEvents";
import { useRoleWorkspace } from "@/features/workspace/roleWorkspaceStore";
import { notificationMessages } from "@/locales/notificationMessages";
import {
  QuestApplicationStatus,
  QuestTeamStatus,
  QuestUnderfilledState,
} from "@/features/questBoard/domain/types";
import {
  myQuestsKeys,
  useMyWorkerCandidateApplicationsQuery,
} from "@/features/myQuests/api/myQuestsQueries";
import { useWorkerAssignmentsQuery } from "@/features/workerHome/api/workerHomeQueries";

import {
  detectApplicationDecisions,
  detectUnreadIncreases,
  detectWorkerQuestTransitions,
  getWorkerAssignmentNoticeKind,
  getOpenConversationId,
  shouldSuppressHirerQuestNotice,
  shouldSuppressWorkerQuestNotice,
} from "./notificationTransitions";
import type { WorkerQuestNoticeKind } from "./notificationTransitions";

const POLL_INTERVAL_MS = 30_000;
const MAX_VISIBLE_AND_QUEUED = 5;

export interface ForegroundNotice {
  id: number;
  title: string;
  message: string;
  href: Href;
}

export function useNotificationCoordinator() {
  const segments = useSegments();
  const isPublicRoute =
    authEnvironment.isDemoEnabled() || isPublicAuthRoute(segments);
  const sessionQuery = useSessionQuery({ enabled: !isPublicRoute });
  const viewerId = isPublicRoute ? "" : (sessionQuery.data?.user.id ?? "");
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { locale } = useLocale();
  const copy = notificationMessages[locale];
  const { isHirer, isWorker, workspace } = useRoleWorkspace();
  const [foreground, setForeground] = useState(
    focusManager.isFocused() ?? true
  );
  const scope = `${viewerId}:${workspace}`;
  const [noticeState, setNoticeState] = useState<{
    scope: string;
    notices: ForegroundNotice[];
  }>({ scope: "", notices: [] });
  const noticeId = useRef(0);
  const previousViewer = useRef("");
  const previousConversations = useRef<Map<string, number> | null>(null);
  const previousApplications = useRef<Map<string, string> | null>(null);
  const previousWorkerQuests = useRef<Map<
    string,
    WorkerQuestNoticeKind | null
  > | null>(null);
  const hirerEnabled = Boolean(viewerId) && isHirer && foreground;
  const workerEnabled = Boolean(viewerId) && isWorker && foreground;
  const conversationsQuery = useChatNotificationConversationsQuery(
    viewerId,
    Boolean(viewerId) && foreground
  );
  const applicationsQuery = useMyWorkerCandidateApplicationsQuery(
    viewerId || null,
    workerEnabled
  );
  const workerAssignmentsQuery = useWorkerAssignmentsQuery(
    "all",
    workerEnabled
  );

  const enqueue = useCallback(
    (title: string, message: string, href: Href) => {
      noticeId.current += 1;
      const next = { id: noticeId.current, title, message, href };
      setNoticeState((current) => ({
        scope,
        notices: [
          ...(current.scope === scope ? current.notices : []),
          next,
        ].slice(-MAX_VISIBLE_AND_QUEUED),
      }));
    },
    [scope]
  );
  const dismiss = useCallback(() => {
    setNoticeState((current) =>
      current.scope === scope
        ? { ...current, notices: current.notices.slice(1) }
        : current
    );
  }, [scope]);
  const open = useCallback(
    (notice: ForegroundNotice) => {
      router.push(notice.href);
      dismiss();
    },
    [dismiss, router]
  );

  useEffect(
    () => focusManager.subscribe((focused) => setForeground(focused ?? true)),
    []
  );

  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  useEffect(() => {
    if (previousViewer.current !== scope) {
      previousViewer.current = scope;
      previousConversations.current = null;
      previousApplications.current = null;
      previousWorkerQuests.current = null;
    }
  }, [scope]);

  useEffect(() => {
    if (!hirerEnabled) return;
    return subscribeToHirerQuestEvents((event) => {
      if (
        shouldSuppressHirerQuestNotice(
          pathnameRef.current,
          event.questId,
          event.changeType
        )
      ) {
        return;
      }
      const decisionCountdown =
        event.changeType ===
          QuestUnderfilledState.UNDERFILLED_DECISION_PENDING && event.expiresAt
          ? formatCountdown(Date.parse(event.expiresAt) - serverNow())
          : null;
      enqueue(
        copy.questUpdate,
        decisionCountdown
          ? copy.hirerDecisionPending(decisionCountdown)
          : (copy.questChanges[event.changeType] ?? copy.questUpdate),
        { pathname: "/quest/[id]", params: { id: event.questId } }
      );
    });
  }, [copy, enqueue, hirerEnabled]);

  useEffect(() => {
    if (!foreground || !viewerId) return;
    const { conversations, inquiries } = conversationsQuery.data ?? {};
    if (!conversations || !inquiries) return;
    const combined = [...conversations, ...inquiries];
    const activeConversationId = getOpenConversationId(pathname, combined);
    const inquiryIds = new Set(
      inquiries.map((conversation) => conversation.id)
    );
    const increased = detectUnreadIncreases(
      previousConversations.current,
      combined,
      activeConversationId
    );
    for (const conversation of increased) {
      const questTitle =
        conversation.questTitle[locale] || conversation.questTitle.en;
      const href = inquiryIds.has(conversation.id)
        ? {
            pathname: "/quest/[id]/inquiry/[conversationId]" as const,
            params: {
              id: conversation.questId ?? "",
              conversationId: conversation.id,
              viewerId,
            },
          }
        : {
            pathname: "/chat/[id]" as const,
            params: getChatRouteParams({
              conversationId: conversation.id,
              questId: conversation.questId,
              viewerId,
              ownerName: conversation.participantName,
              questTitle,
            }),
          };
      enqueue(copy.chatTitle, copy.newMessage(questTitle), href);
    }
    previousConversations.current = new Map(
      combined.map((conversation) => [
        conversation.id,
        conversation.unreadCount,
      ])
    );
  }, [
    conversationsQuery.data,
    copy,
    enqueue,
    foreground,
    locale,
    pathname,
    viewerId,
  ]);

  useEffect(() => {
    const applications = applicationsQuery.data;
    if (!workerEnabled || !applications) return;
    const changed = detectApplicationDecisions(
      previousApplications.current,
      applications
    );
    for (const application of changed) {
      const selected =
        application.state === QuestApplicationStatus.APPLICATION_SELECTED ||
        application.state === QuestTeamStatus.TEAM_SELECTED;
      enqueue(
        copy.applicationTitle,
        selected
          ? copy.applicationSelected(application.quest.title)
          : copy.applicationRejected(application.quest.title),
        selected
          ? {
              pathname: "/quest/[id]/work",
              params: { id: application.questId },
            }
          : { pathname: "/quest/[id]", params: { id: application.questId } }
      );
    }
    previousApplications.current = new Map(
      applications.map((application) => [application.id, application.state])
    );
  }, [applicationsQuery.data, copy, enqueue, workerEnabled]);

  useEffect(() => {
    const assignments = workerAssignmentsQuery.data;
    if (!workerEnabled || !assignments) return;
    const transitions = detectWorkerQuestTransitions(
      previousWorkerQuests.current,
      assignments
    );
    for (const transition of transitions) {
      if (
        shouldSuppressWorkerQuestNotice(
          pathnameRef.current,
          transition.questId,
          transition.href
        )
      ) {
        continue;
      }
      const message = {
        RESPONSE_REQUIRED: copy.underfilledConsentRequired(),
        DECISION_PENDING: copy.underfilledDecisionPending(),
        FULL_OR_ASSIGNED: copy.questFullOrAssigned(),
        CANCELLED: copy.underfilledCancelled(transition.cancellationReason),
      }[transition.kind];
      enqueue(copy.questUpdate, message, {
        pathname: transition.href,
        params: { id: transition.questId },
      });
    }
    const nextWorkerQuests = new Map(previousWorkerQuests.current ?? []);
    for (const assignment of assignments) {
      nextWorkerQuests.set(
        assignment.questId,
        getWorkerAssignmentNoticeKind(assignment)
      );
    }
    previousWorkerQuests.current = nextWorkerQuests;
  }, [copy, enqueue, workerEnabled, workerAssignmentsQuery.data]);

  useEffect(() => {
    if (!workerEnabled) return;
    const interval = setInterval(() => {
      void queryClient.refetchQueries({
        queryKey: myQuestsKeys.workerCandidateApplications(viewerId),
        type: "active",
      });
    }, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [queryClient, viewerId, workerEnabled]);

  return {
    notices: noticeState.scope === scope ? noticeState.notices : [],
    dismiss,
    open,
  };
}
