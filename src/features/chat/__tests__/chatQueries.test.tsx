import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react-native";

import {
  chatApi,
  type ServerChatMessage,
  type ServerChatMessagePage,
} from "@/api/ChatApi";
import {
  chatKeys,
  useChatNotificationConversationsQuery,
  useHasUnreadChatQuery,
  useMessagesQuery,
  useOlderMessages,
  useSendChatMessageMutation,
} from "../api/chatQueries";
import {
  toDisplayMessage,
  type DisplayChatMessage,
} from "../domain/conversationModule";

function createQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
}

function createWrapper(queryClient = createQueryClient()) {
  return function QueryWrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

function makeServerMessage(id: string, sequence: number): ServerChatMessage {
  return {
    id,
    conversationId: "conversation-1",
    sequence,
    kind: "USER",
    sender: { id: "member-1", displayName: "Arthit" },
    text: id,
    attachments: [],
    systemType: null,
    systemPayload: null,
    eventId: null,
    createdAt: `2026-09-24T12:00:0${sequence}Z`,
  };
}

function workConversation(unreadCount: number) {
  return {
    id: "work-1",
    type: "CONVERSATION_WORK",
    quest: { id: "quest-1", title: "Work Quest", status: "QUEST_ASSIGNED" },
    latestMessage: null,
    lastActivityAt: null,
    archived: false,
    readOnly: false,
    unreadCount,
  };
}

function candidateInquiry(unreadCount: number) {
  return {
    id: "inquiry-1",
    type: "CONVERSATION_CANDIDATE_INQUIRY",
    state: "INQUIRY_OPEN",
    quest: { id: "quest-2", title: "Inquiry Quest", status: "QUEST_OPEN" },
    participants: [
      { id: "hirer-1", role: "HIRER", displayName: "Hirer" },
      { id: "viewer-1", role: "PROSPECTIVE_WORKER", displayName: "Worker" },
    ],
    latestMessage: null,
    lastActivityAt: null,
    unreadCount,
  };
}

describe("useHasUnreadChatQuery", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("aggregates unread Work Conversations and Candidate Inquiries", async () => {
    const listConversations = jest
      .spyOn(chatApi, "listConversations")
      .mockResolvedValue({
        items: [workConversation(0)],
        nextCursor: null,
      } as never);
    const listCandidateInquiries = jest
      .spyOn(chatApi, "listCandidateInquiries")
      .mockResolvedValue({
        items: [candidateInquiry(1)],
        nextCursor: null,
      } as never);

    const { result } = await renderHook(
      () => useHasUnreadChatQuery("viewer-1"),
      { wrapper: createWrapper() }
    );

    await waitFor(() => expect(result.current.data).toBe(true));
    expect(listConversations).toHaveBeenCalledTimes(1);
    expect(listCandidateInquiries).toHaveBeenCalledTimes(1);
  });

  it("returns false when both inbox sections have no unread activity", async () => {
    jest.spyOn(chatApi, "listConversations").mockResolvedValue({
      items: [workConversation(0)],
      nextCursor: null,
    } as never);
    jest.spyOn(chatApi, "listCandidateInquiries").mockResolvedValue({
      items: [candidateInquiry(0)],
      nextCursor: null,
    } as never);

    const { result } = await renderHook(
      () => useHasUnreadChatQuery("viewer-1"),
      { wrapper: createWrapper() }
    );

    await waitFor(() => expect(result.current.data).toBe(false));
  });

  it("loads notification conversations with two list requests and no participant fetches", async () => {
    const listConversations = jest
      .spyOn(chatApi, "listConversations")
      .mockResolvedValue({
        items: [workConversation(2)],
        nextCursor: null,
      } as never);
    const listCandidateInquiries = jest
      .spyOn(chatApi, "listCandidateInquiries")
      .mockResolvedValue({
        items: [candidateInquiry(1)],
        nextCursor: null,
      } as never);
    const listParticipants = jest
      .spyOn(chatApi, "listParticipants")
      .mockResolvedValue([]);

    const { result } = await renderHook(
      () => useChatNotificationConversationsQuery("viewer-1"),
      { wrapper: createWrapper() }
    );

    await waitFor(() =>
      expect(
        result.current.data?.conversations.map(({ id, unreadCount }) => [
          id,
          unreadCount,
        ])
      ).toEqual([["work-1", 2]])
    );
    expect(
      result.current.data?.inquiries.map(({ id, unreadCount }) => [
        id,
        unreadCount,
      ])
    ).toEqual([["inquiry-1", 1]]);
    expect(listConversations).toHaveBeenCalledTimes(1);
    expect(listCandidateInquiries).toHaveBeenCalledTimes(1);
    expect(listParticipants).not.toHaveBeenCalled();
  });
});

describe("chat message transport", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("keeps a socket message received while the history request is pending", async () => {
    let resolveHistory!: (page: ServerChatMessagePage) => void;
    const history = new Promise<ServerChatMessagePage>((resolve) => {
      resolveHistory = resolve;
    });
    jest.spyOn(chatApi, "getMessages").mockReturnValue(history);
    const queryClient = createQueryClient();
    const { result } = await renderHook(
      () => useMessagesQuery("conversation-1", "member-1", "WORK"),
      { wrapper: createWrapper(queryClient) }
    );

    await waitFor(() => expect(chatApi.getMessages).toHaveBeenCalledTimes(1));
    await act(async () => {
      queryClient.setQueryData(
        chatKeys.messages("conversation-1", "member-1", "WORK"),
        [toDisplayMessage(makeServerMessage("socket-message", 2), "member-1")]
      );
    });

    await act(async () => {
      resolveHistory({
        items: [makeServerMessage("history-message", 1)],
        nextCursor: null,
        hasMore: false,
      });
      await history;
    });

    await waitFor(() =>
      expect(result.current.data?.map((message) => message.id)).toEqual([
        "history-message",
        "socket-message",
      ])
    );
  });

  it("loads older history through the page cursor until the start is reached", async () => {
    const getMessages = jest
      .spyOn(chatApi, "getMessages")
      .mockImplementation(async (_conversationId, params = {}) =>
        params.before === "cursor-older"
          ? {
              items: [
                makeServerMessage("message-1", 1),
                makeServerMessage("message-2", 2),
              ],
              nextCursor: null,
              hasMore: false,
            }
          : {
              items: [
                makeServerMessage("message-3", 3),
                makeServerMessage("message-4", 4),
              ],
              nextCursor: "cursor-older",
              hasMore: true,
            }
      );
    const { result } = await renderHook(
      () => ({
        messages: useMessagesQuery("conversation-1", "member-1", "WORK"),
        older: useOlderMessages("conversation-1", "member-1", "WORK"),
      }),
      { wrapper: createWrapper() }
    );
    await waitFor(() =>
      expect(result.current.older.hasOlderMessages).toBe(true)
    );

    await act(async () => {
      await result.current.older.loadOlderMessages();
    });

    expect(getMessages).toHaveBeenLastCalledWith(
      "conversation-1",
      { limit: 50, before: "cursor-older" },
      expect.anything()
    );
    await waitFor(() =>
      expect(
        result.current.messages.data?.map((message) => message.id)
      ).toEqual(["message-1", "message-2", "message-3", "message-4"])
    );
    expect(result.current.older.hasOlderMessages).toBe(false);

    await act(async () => {
      await result.current.messages.refetch();
    });
    expect(result.current.messages.data).toHaveLength(4);
    expect(result.current.older.hasOlderMessages).toBe(false);
  });

  it("sends connected text over WebSocket and replaces its optimistic message", async () => {
    const acceptedMessage = makeServerMessage("server-message", 1);
    const sendMessage = jest.fn().mockResolvedValue(acceptedMessage);
    const socket = {
      status: "connected" as const,
      reconnectAttempt: 0,
      sendMessage,
    };
    const restSend = jest
      .spyOn(chatApi, "sendMessage")
      .mockResolvedValue(acceptedMessage);
    const queryClient = createQueryClient();
    const optimisticMessage: DisplayChatMessage = {
      id: "client-message",
      sender: "me",
      text: { en: "Hello", th: "สวัสดี" },
      createdAt: "2026-09-24T12:00:00Z",
      attachments: [],
    };
    const { result } = await renderHook(
      () => useSendChatMessageMutation(socket),
      { wrapper: createWrapper(queryClient) }
    );
    await waitFor(() => expect(result.current).not.toBeNull());

    await act(async () => {
      await result.current.mutateAsync({
        conversationId: "conversation-1",
        mode: "WORK",
        text: "Hello",
        clientMessageId: "client-message",
        attachmentIds: [],
        viewerId: "member-1",
        optimisticMessage,
      });
    });

    expect(sendMessage).toHaveBeenCalledWith({
      clientMessageId: "client-message",
      text: "Hello",
    });
    expect(restSend).not.toHaveBeenCalled();
    expect(
      queryClient
        .getQueryData<DisplayChatMessage[]>(
          chatKeys.messages("conversation-1", "member-1", "WORK")
        )
        ?.map((message) => message.id)
    ).toEqual(["server-message"]);
  });

  it("sends connected Candidate Inquiry attachments over WebSocket", async () => {
    const acceptedMessage = makeServerMessage("server-message", 1);
    const attachmentId = "b199ae67-3939-4da3-8c78-2fa1c282926d";
    const sendMessage = jest.fn().mockResolvedValue(acceptedMessage);
    const inquirySend = jest
      .spyOn(chatApi, "sendCandidateInquiryMessage")
      .mockResolvedValue(acceptedMessage);
    const { result } = await renderHook(
      () =>
        useSendChatMessageMutation({
          status: "connected",
          reconnectAttempt: 0,
          sendMessage,
        }),
      { wrapper: createWrapper() }
    );
    await waitFor(() => expect(result.current).not.toBeNull());

    await act(async () => {
      await result.current.mutateAsync({
        conversationId: "conversation-1",
        mode: "CANDIDATE_INQUIRY",
        text: "File",
        clientMessageId: "client-file",
        attachmentIds: [attachmentId],
        viewerId: "member-1",
      });
    });

    expect(sendMessage).toHaveBeenCalledWith({
      clientMessageId: "client-file",
      text: "File",
      attachmentIds: [attachmentId],
    });
    expect(inquirySend).not.toHaveBeenCalled();
  });

  it("sends attachment-only Work messages over the connected WebSocket", async () => {
    const acceptedMessage = makeServerMessage("server-message", 1);
    const sendMessage = jest.fn().mockResolvedValue(acceptedMessage);
    const restSend = jest
      .spyOn(chatApi, "sendMessage")
      .mockResolvedValue(acceptedMessage);
    const { result } = await renderHook(
      () =>
        useSendChatMessageMutation({
          status: "connected",
          reconnectAttempt: 0,
          sendMessage,
        }),
      { wrapper: createWrapper() }
    );
    await waitFor(() => expect(result.current).not.toBeNull());

    await act(async () => {
      await result.current.mutateAsync({
        conversationId: "conversation-1",
        mode: "WORK",
        text: "",
        clientMessageId: "client-file",
        attachmentIds: ["b199ae67-3939-4da3-8c78-2fa1c282926d"],
        viewerId: "member-1",
      });
    });

    expect(sendMessage).toHaveBeenCalledWith({
      clientMessageId: "client-file",
      attachmentIds: ["b199ae67-3939-4da3-8c78-2fa1c282926d"],
    });
    expect(restSend).not.toHaveBeenCalled();
  });

  it("falls back to HTTP when the WebSocket is not connected", async () => {
    const acceptedMessage = makeServerMessage("server-message", 1);
    const sendMessage = jest.fn().mockResolvedValue(undefined);
    const restSend = jest
      .spyOn(chatApi, "sendMessage")
      .mockResolvedValue(acceptedMessage);
    const { result } = await renderHook(
      () =>
        useSendChatMessageMutation({
          status: "reconnecting",
          reconnectAttempt: 1,
          sendMessage,
        }),
      { wrapper: createWrapper() }
    );
    await waitFor(() => expect(result.current).not.toBeNull());

    await act(async () => {
      await result.current.mutateAsync({
        conversationId: "conversation-1",
        mode: "WORK",
        text: "Hello",
        clientMessageId: "client-message",
        attachmentIds: [],
        viewerId: "member-1",
      });
    });

    expect(sendMessage).not.toHaveBeenCalled();
    expect(restSend).toHaveBeenCalledTimes(1);
  });
});
