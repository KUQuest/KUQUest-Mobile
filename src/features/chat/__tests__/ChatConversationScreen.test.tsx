import React from "react";
import { fireEvent, render } from "@testing-library/react-native";
import type { ImperativeRouter } from "expo-router";
import { FlatList as NativeFlatList } from "react-native";
import { chatMessages } from "@/locales/chatMessages";
import ChatConversationScreen from "../ChatConversationScreen";
import { useChatConversationController } from "../workflow/useChatConversationController";
import type { DisplayChatMessage } from "../domain/conversationModule";

jest.mock("../workflow/useChatConversationController", () => ({
  MAX_MESSAGE_LENGTH: 1000,
  useChatConversationController: jest.fn(),
}));

const mockedUseChatConversationController =
  useChatConversationController as jest.MockedFunction<
    typeof useChatConversationController
  >;

describe("ChatConversationScreen", () => {
  beforeEach(() => {
    mockedUseChatConversationController.mockReturnValue({
      router: { back: jest.fn() } as unknown as ImperativeRouter,
      locale: "en",
      messages: chatMessages.en,
      insets: { top: 0, bottom: 0, left: 0, right: 0 },
      viewerId: "viewer-1",
      conversationType: "WORK",
      conversationPending: true,
      conversationLoadFailed: false,
      conversation: null,
      refreshing: false,
      refresh: jest.fn(),
      retryLoad: jest.fn(),
      role: "member",
      conversationKind: "work",
      canWrite: false,
      readOnlyDescription: "",
      messagePlaceholder: "Message",
      canReportConversation: false,
      handleReportConversation: jest.fn(),
      searchOpen: false,
      setSearchOpen: jest.fn(),
      searchScope: "messages",
      setSearchScope: jest.fn(),
      searchQuery: "",
      setSearchQuery: jest.fn(),
      searchedMessages: [],
      files: [],
      draft: "",
      setDraft: jest.fn(),
      pendingAttachments: [],
      pendingAttachmentIds: [],
      handleRemovePendingAttachment: jest.fn(),
      openAttachmentMenu: jest.fn(),
      sendMessage: jest.fn(),
      viewerState: { visible: false, url: null },
      setViewerState: jest.fn(),
      handleImagePress: jest.fn(),
      openFile: jest.fn(),
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("renders the loading shell while the conversation is pending", async () => {
    const view = await render(<ChatConversationScreen />);
    expect(view.getByTestId("chat-loading-back-button")).toBeTruthy();
    expect(view.getByLabelText(chatMessages.en.loading)).toBeTruthy();
  });

  it("shows conversation identity without role or header actions", async () => {
    const getController =
      mockedUseChatConversationController.getMockImplementation();
    if (!getController) {
      throw new Error("Chat conversation controller mock is not configured");
    }
    mockedUseChatConversationController.mockReturnValue({
      ...getController("WORK"),
      conversationPending: false,
      role: chatMessages.en.questOwner,
      conversation: {
        id: "conversation-1",
        questId: "quest-1",
        questTitle: { en: "Campus cleanup", th: "ทำความสะอาดวิทยาเขต" },
        participantName: "Sora Student",
        participantRole: "owner",
        initials: "SS",
        avatarColor: "#208AEF",
        latestMessage: { en: "Hello", th: "สวัสดี" },
        latestAt: "2026-09-24T03:30:00Z",
        unreadCount: 0,
        messages: [],
      },
    });

    const view = await render(<ChatConversationScreen />);

    expect(view.getByLabelText(chatMessages.en.backToChat)).toBeTruthy();
    expect(view.getAllByText("Campus cleanup")).toHaveLength(2);
    expect(view.getByText("Sora Student")).toBeTruthy();
    expect(
      view.queryByText(`Sora Student · ${chatMessages.en.questOwner}`)
    ).toBeNull();
    expect(view.queryByLabelText(chatMessages.en.search)).toBeNull();
    expect(view.queryByLabelText(chatMessages.en.searchFiles)).toBeNull();
    expect(view.queryByLabelText(chatMessages.en.moreOptions)).toBeNull();
  });

  it("follows new messages without jumping when history is prepended", async () => {
    const scrollToEnd = jest
      .spyOn(NativeFlatList.prototype, "scrollToEnd")
      .mockImplementation(() => undefined);
    const getController =
      mockedUseChatConversationController.getMockImplementation();
    if (!getController) {
      throw new Error("Chat conversation controller mock is not configured");
    }
    const controller = getController("WORK");
    const conversation = {
      id: "conversation-1",
      questId: "quest-1",
      questTitle: { en: "Campus cleanup", th: "ทำความสะอาดวิทยาเขต" },
      participantName: "Sora Student",
      participantRole: "owner" as const,
      initials: "SS",
      avatarColor: "#208AEF",
      latestMessage: { en: "Hello", th: "สวัสดี" },
      latestAt: "2026-09-24T03:30:00Z",
      unreadCount: 0,
      messages: [],
    };
    const firstMessage: DisplayChatMessage = {
      id: "message-1",
      sender: "other",
      text: { en: "First", th: "แรก" },
      createdAt: "2026-09-24T03:30:00Z",
      attachments: [],
    };

    mockedUseChatConversationController.mockReturnValue({
      ...controller,
      conversationPending: false,
      conversation,
      searchedMessages: [firstMessage],
    });
    const view = await render(<ChatConversationScreen />);
    await fireEvent(
      view.getByTestId("chat-message-list"),
      "contentSizeChange",
      { width: 320, height: 240 }
    );
    expect(scrollToEnd).toHaveBeenCalledTimes(1);

    const newMessage: DisplayChatMessage = {
      ...firstMessage,
      id: "message-2",
      text: { en: "Second", th: "ที่สอง" },
      createdAt: "2026-09-24T03:31:00Z",
    };
    mockedUseChatConversationController.mockReturnValue({
      ...controller,
      conversationPending: false,
      conversation,
      searchedMessages: [firstMessage, newMessage],
    });
    await view.rerender(<ChatConversationScreen />);
    expect(view.getByText("Second")).toBeTruthy();
    await fireEvent(
      view.getByTestId("chat-message-list"),
      "contentSizeChange",
      { width: 320, height: 360 }
    );
    expect(scrollToEnd).toHaveBeenCalledTimes(2);

    const olderMessage: DisplayChatMessage = {
      ...firstMessage,
      id: "message-0",
      text: { en: "Earlier", th: "ก่อนหน้า" },
      createdAt: "2026-09-24T03:29:00Z",
    };
    mockedUseChatConversationController.mockReturnValue({
      ...controller,
      conversationPending: false,
      conversation,
      searchedMessages: [olderMessage, firstMessage, newMessage],
    });
    await view.rerender(<ChatConversationScreen />);
    await fireEvent(
      view.getByTestId("chat-message-list"),
      "contentSizeChange",
      { width: 320, height: 480 }
    );
    expect(scrollToEnd).toHaveBeenCalledTimes(2);
  });
});
