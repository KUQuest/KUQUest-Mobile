import React from "react";
import { fireEvent, render } from "@testing-library/react-native";

import type { WorkerQuestNoticeKind } from "../notificationTransitions";
import type {
  QuestV2CandidateApplication,
  QuestV2MyAssignment,
  QuestV2UnderfilledSummary,
} from "@/api/questV2Contracts";
import type { ChatConversation } from "@/features/chat/chatTypes";
import { NotificationCoordinator } from "../NotificationBannerHost";
import {
  detectApplicationDecisions,
  detectUnreadIncreases,
  detectWorkerQuestTransitions,
  getOpenConversationId,
  shouldSuppressHirerQuestNotice,
  shouldSuppressWorkerQuestNotice,
} from "../notificationTransitions";
import type { ForegroundNotice } from "../useNotificationCoordinator";

const mockUseNotificationCoordinator = jest.fn();
jest.mock("../useNotificationCoordinator", () => ({
  useNotificationCoordinator: () => mockUseNotificationCoordinator(),
}));
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 20, right: 0, bottom: 0, left: 0 }),
}));
jest.mock("@/features/workspace/AppThemeProvider", () => ({
  useAppTheme: () => ({ colors: { textSecondary: "#444444" } }),
}));
jest.mock("@/features/preferences/localeStore", () => ({
  useLocale: () => ({ locale: "en" }),
}));

function makeConversation(id: string, unreadCount: number): ChatConversation {
  return {
    id,
    questId: "quest-1",
    questTitle: { en: "Campus cleanup", th: "ทำความสะอาดมหาวิทยาลัย" },
    participantName: "Nok",
    participantRole: "member",
    initials: "N",
    avatarColor: "#888888",
    latestMessage: { en: "Hello", th: "สวัสดี" },
    latestAt: "2026-09-26T00:00:00.000Z",
    unreadCount,
    messages: [],
  };
}

const appliedApplication = {
  id: "application-1",
  questId: "quest-1",
  memberId: "worker-1",
  kind: "SINGLE",
  state: "APPLICATION_APPLIED",
  appliedAt: "2026-09-26T00:00:00.000Z",
  quest: {
    title: "Campus cleanup",
    startTime: "2026-09-27T00:00:00.000Z",
    dueAt: null,
    mode: "CANDIDATE",
    participation: "SINGLE",
    state: "QUEST_OPEN",
  },
} satisfies QuestV2CandidateApplication;

function makeWorkerAssignment(
  state: QuestV2UnderfilledSummary["state"],
  questState: QuestV2MyAssignment["questState"] = "QUEST_OPEN",
  cancellationReason: QuestV2UnderfilledSummary["cancellationReason"] = null
): QuestV2MyAssignment {
  const needsConsent = state === "UNDERFILLED_CONSENT_PENDING";
  return {
    id: "assignment-1",
    questId: "quest-1",
    workerId: "worker-1",
    state:
      state === "UNDERFILLED_CANCELLED"
        ? "ASSIGNMENT_CANCELLED"
        : "ASSIGNMENT_ACTIVE",
    questState,
    startedAt: null,
    createdAt: "2026-10-01T00:00:00.000Z",
    underfilled: {
      state,
      decision: { expiresAt: "2026-10-01T00:10:00.000Z" },
      consent: {
        expiresAt: needsConsent ? "2026-10-01T00:05:00.000Z" : null,
      },
      activeWorkerCount: 1,
      headcount: 2,
      cancellationReason,
    },
  };
}

describe("notification transitions", () => {
  it("uses initial unread observations as a baseline", () => {
    expect(
      detectUnreadIncreases(null, [makeConversation("conversation-1", 3)])
    ).toEqual([]);
    expect(
      detectUnreadIncreases(new Map(), [makeConversation("conversation-1", 0)])
    ).toEqual([]);
    expect(detectApplicationDecisions(null, [rejectedApplication])).toEqual([]);
  });

  it("notifies for new unread conversations and unread increases", () => {
    const current = [
      makeConversation("conversation-new", 1),
      makeConversation("conversation-1", 2),
    ];
    const increased = detectUnreadIncreases(
      new Map([["conversation-1", 1]]),
      current
    );
    expect(increased.map((conversation) => conversation.id)).toEqual([
      "conversation-new",
      "conversation-1",
    ]);
  });

  it("excludes the open conversation, including a new conversation", () => {
    expect(
      detectUnreadIncreases(
        new Map(),
        [makeConversation("conversation-1", 2)],
        "conversation-1"
      )
    ).toEqual([]);
  });

  it("matches open conversations by exact path segment", () => {
    const conversations = [makeConversation("conversation-1", 2)];
    expect(getOpenConversationId("/chat/conversation-1", conversations)).toBe(
      "conversation-1"
    );
    expect(
      getOpenConversationId("/chat/conversation-10", conversations)
    ).toBeUndefined();
    expect(
      detectUnreadIncreases(
        new Map([["conversation-1", 1]]),
        conversations,
        getOpenConversationId("/chat/conversation-10", conversations)
      )
    ).toHaveLength(1);
  });

  it("notifies for new applications already in a decision state", () => {
    expect(
      detectApplicationDecisions(new Map(), [rejectedApplication])
    ).toEqual([rejectedApplication]);
  });

  it("notifies when an application transitions from applied to rejected", () => {
    expect(
      detectApplicationDecisions(
        new Map([[appliedApplication.id, appliedApplication.state]]),
        [rejectedApplication]
      )
    ).toEqual([rejectedApplication]);
  });

  it("suppresses proven Hirer-only updates and updates for open Quest routes", () => {
    expect(
      shouldSuppressHirerQuestNotice(
        "/quest/quest-1",
        "quest-1",
        "QUEST_CREATED"
      )
    ).toBe(true);
    expect(
      shouldSuppressHirerQuestNotice(
        "/quest/quest-1/manage",
        "quest-1",
        "QUEST_STARTED"
      )
    ).toBe(true);
    expect(
      shouldSuppressHirerQuestNotice(
        "/quest/quest-10",
        "quest-1",
        "QUEST_STARTED"
      )
    ).toBe(false);
    expect(
      shouldSuppressHirerQuestNotice(
        "/chat/conversation-1",
        "quest-1",
        "QUEST_STARTED"
      )
    ).toBe(false);
  });

  it("detects assignment-list transitions once, routes correctly, and suppresses exact routes", () => {
    const consent = makeWorkerAssignment("UNDERFILLED_CONSENT_PENDING");
    expect(detectWorkerQuestTransitions(null, [consent])).toEqual([]);
    const consentTransition = {
      questId: "quest-1",
      kind: "RESPONSE_REQUIRED",
      cancellationReason: null,
      href: "/quest/[id]/partial-start" as const,
    };
    expect(
      detectWorkerQuestTransitions(new Map([["quest-1", null]]), [consent])
    ).toEqual([consentTransition]);
    expect(
      detectWorkerQuestTransitions(
        new Map<string, WorkerQuestNoticeKind | null>([
          ["quest-1", "RESPONSE_REQUIRED"],
        ]),
        [consent]
      )
    ).toEqual([]);
    expect(
      shouldSuppressWorkerQuestNotice(
        "/quest/quest-1/partial-start",
        "quest-1",
        consentTransition.href
      )
    ).toBe(true);
    expect(
      shouldSuppressWorkerQuestNotice(
        "/quest/quest-10/partial-start",
        "quest-1",
        consentTransition.href
      )
    ).toBe(false);

    const waiting = makeWorkerAssignment("UNDERFILLED_DECISION_PENDING");
    expect(
      detectWorkerQuestTransitions(new Map([["quest-1", null]]), [waiting])
    ).toEqual([
      {
        questId: "quest-1",
        kind: "DECISION_PENDING",
        cancellationReason: null,
        href: "/quest/[id]",
      },
    ]);
    expect(
      shouldSuppressWorkerQuestNotice(
        "/quest/quest-1",
        "quest-1",
        "/quest/[id]" as const
      )
    ).toBe(true);
  });

  it("detects assigned and cancelled outcomes with authoritative summary reason", () => {
    const assigned = makeWorkerAssignment(
      "UNDERFILLED_COMPLETED",
      "QUEST_ASSIGNED"
    );
    const cancelled = makeWorkerAssignment(
      "UNDERFILLED_CANCELLED",
      "QUEST_CANCELLED",
      "WORKER_DECLINED"
    );
    expect(
      detectWorkerQuestTransitions(
        new Map([
          ["quest-1", null],
          ["quest-2", null],
        ]),
        [assigned, { ...cancelled, id: "assignment-2", questId: "quest-2" }]
      )
    ).toEqual([
      {
        questId: "quest-1",
        kind: "FULL_OR_ASSIGNED",
        cancellationReason: null,
        href: "/quest/[id]",
      },
      {
        questId: "quest-2",
        kind: "CANCELLED",
        cancellationReason: "WORKER_DECLINED",
        href: "/quest/[id]",
      },
    ]);
  });
  it("tells a Worker whose work was not completed that the Quest failed, once, and points at the Work Hub", () => {
    const failed = {
      ...makeWorkerAssignment("UNDERFILLED_COMPLETED", "QUEST_FAILED"),
      state: "ASSIGNMENT_INCOMPLETE" as const,
    };
    expect(detectWorkerQuestTransitions(null, [failed])).toEqual([]);
    const transition = {
      questId: "quest-1",
      kind: "FAILED",
      cancellationReason: null,
      href: "/quest/[id]/work" as const,
    };
    expect(
      detectWorkerQuestTransitions(new Map([["quest-1", null]]), [failed])
    ).toEqual([transition]);
    expect(
      detectWorkerQuestTransitions(
        new Map<string, WorkerQuestNoticeKind | null>([["quest-1", "FAILED"]]),
        [failed]
      )
    ).toEqual([]);
    expect(
      shouldSuppressWorkerQuestNotice(
        "/quest/quest-1/work",
        "quest-1",
        transition.href
      )
    ).toBe(true);
    expect(
      shouldSuppressWorkerQuestNotice(
        "/quest/quest-1",
        "quest-1",
        transition.href
      )
    ).toBe(false);
  });

  it("also tells a Worker the Server left ASSIGNMENT_ACTIVE on the failed Quest", () => {
    const stillActive = makeWorkerAssignment(
      "UNDERFILLED_COMPLETED",
      "QUEST_FAILED"
    );
    expect(
      detectWorkerQuestTransitions(new Map([["quest-1", null]]), [stillActive])
    ).toEqual([
      {
        questId: "quest-1",
        kind: "FAILED",
        cancellationReason: null,
        href: "/quest/[id]/work",
      },
    ]);
  });

  it("does not announce a failure to a Worker who completed their Assignment", () => {
    const completed = {
      ...makeWorkerAssignment("UNDERFILLED_COMPLETED", "QUEST_FAILED"),
      state: "ASSIGNMENT_COMPLETED" as const,
    };
    expect(
      detectWorkerQuestTransitions(new Map([["quest-1", null]]), [completed])
    ).toEqual([]);
  });

  const rejectedApplication = {
    ...appliedApplication,
    state: "APPLICATION_REJECTED",
  } satisfies QuestV2CandidateApplication;
});

describe("notification banner", () => {
  it("renders notice copy and opens its destination when tapped", async () => {
    const notice: ForegroundNotice = {
      id: 1,
      title: "New message",
      message: "Campus cleanup",
      href: { pathname: "/chat/[id]", params: { id: "conversation-1" } },
    };
    const mockDismiss = jest.fn();
    const mockOpen = jest.fn();
    mockUseNotificationCoordinator.mockReturnValue({
      notices: [notice],
      dismiss: mockDismiss,
      open: mockOpen,
    });

    const view = await render(<NotificationCoordinator />);
    expect(view.getByText("New message")).toBeTruthy();
    expect(view.getByText("Campus cleanup")).toBeTruthy();
    await fireEvent.press(view.getByTestId("notification-banner-open"));
    expect(mockOpen).toHaveBeenCalledWith(notice);
  });
});
