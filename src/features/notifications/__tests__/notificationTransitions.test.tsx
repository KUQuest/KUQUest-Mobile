import React from "react";
import { fireEvent, render } from "@testing-library/react-native";

import type { QuestV2CandidateApplication } from "@/api/questV2Contracts";
import type { ChatConversation } from "@/features/chat/chatTypes";
import { NotificationCoordinator } from "../NotificationBannerHost";
import {
  detectApplicationDecisions,
  detectUnreadIncreases,
  getOpenConversationId,
  shouldSuppressHirerQuestNotice,
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
});

const rejectedApplication = {
  ...appliedApplication,
  state: "APPLICATION_REJECTED",
} satisfies QuestV2CandidateApplication;

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
