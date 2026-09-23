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
  useHasUnreadChatQuery,
  useMessagesQuery,
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

describe("useHasUnreadChatQuery", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("aggregates unread Work Conversations and Candidate Inquiries", async () => {
    const listConversations = jest
      .spyOn(chatApi, "listConversations")
      .mockResolvedValue({
        items: [{ unreadCount: 0 }],
        nextCursor: null,
      } as never);
    const listCandidateInquiries = jest
      .spyOn(chatApi, "listCandidateInquiries")
      .mockResolvedValue({
        items: [{ unreadCount: 1 }],
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
      items: [{ unreadCount: 0 }],
      nextCursor: null,
    } as never);
    jest.spyOn(chatApi, "listCandidateInquiries").mockResolvedValue({
      items: [{ unreadCount: 0 }],
      nextCursor: null,
    } as never);

    const { result } = await renderHook(
      () => useHasUnreadChatQuery("viewer-1"),
      { wrapper: createWrapper() }
    );

    await waitFor(() => expect(result.current.data).toBe(false));
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

  it("keeps attachment sends on the existing HTTP transport", async () => {
    const acceptedMessage = makeServerMessage("server-message", 1);
    const sendMessage = jest.fn().mockResolvedValue(undefined);
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
        text: "File",
        clientMessageId: "client-file",
        attachmentIds: ["attachment-1"],
        viewerId: "member-1",
      });
    });

    expect(sendMessage).not.toHaveBeenCalled();
    expect(restSend).toHaveBeenCalledWith(
      "conversation-1",
      "File",
      "client-file",
      ["attachment-1"]
    );
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
