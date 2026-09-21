import React from "react";
import { render } from "@testing-library/react-native";
import type { ImperativeRouter } from "expo-router";
import { chatMessages } from "@/locales/chatMessages";
import ChatConversationScreen from "../ChatConversationScreen";
import { useChatConversationController } from "../useChatConversationController";

jest.mock("../useChatConversationController", () => ({
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
      socketStatus: "idle",
    });
  });

  it("renders the loading shell while the conversation is pending", async () => {
    const view = await render(<ChatConversationScreen />);
    expect(view.getByTestId("chat-loading-back-button")).toBeTruthy();
    expect(view.getByLabelText(chatMessages.en.loading)).toBeTruthy();
  });
});
