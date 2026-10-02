import { act, renderHook } from "@testing-library/react-native";

import { authClient } from "@/features/auth/authClient";
import { useChatSocket } from "../api/useChatSocket";
import { MockWebSocket } from "@/testing/mockWebSocket";

const originalApiUrl = process.env.EXPO_PUBLIC_API_URL;
const originalWebSocket = globalThis.WebSocket;
describe("useChatSocket", () => {
  beforeEach(() => {
    MockWebSocket.instances = [];
    process.env.EXPO_PUBLIC_API_URL = "https://api.example.com/";
    jest
      .spyOn(authClient, "getCookie")
      .mockReturnValue("better-auth.session_token=session");
    Object.defineProperty(globalThis, "WebSocket", {
      configurable: true,
      value: MockWebSocket,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
    if (originalApiUrl === undefined) {
      delete process.env.EXPO_PUBLIC_API_URL;
    } else {
      process.env.EXPO_PUBLIC_API_URL = originalApiUrl;
    }
  });

  afterAll(() => {
    globalThis.WebSocket = originalWebSocket;
  });

  it("does not create a socket when the API URL is blank", async () => {
    process.env.EXPO_PUBLIC_API_URL = "   ";

    const { result, unmount } = await renderHook(() =>
      useChatSocket({
        conversationId: "conversation-1",
        conversationType: "WORK",
        enabled: true,
        onEvent: jest.fn(),
      })
    );

    expect(result.current).toMatchObject({
      status: "unavailable",
      reconnectAttempt: 0,
    });
    expect(MockWebSocket.instances).toHaveLength(0);

    await unmount();
  });
  it("does not connect without a session cookie", async () => {
    jest.mocked(authClient.getCookie).mockReturnValue("");

    const { result, unmount } = await renderHook(() =>
      useChatSocket({
        conversationId: "conversation-1",
        conversationType: "WORK",
        enabled: true,
        onEvent: jest.fn(),
      })
    );

    expect(result.current.status).toBe("unavailable");
    expect(MockWebSocket.instances).toHaveLength(0);

    await unmount();
  });

  it("ignores legacy and malformed socket events", async () => {
    const onEvent = jest.fn();
    const { unmount } = await renderHook(() =>
      useChatSocket({
        conversationId: "conversation-1",
        conversationType: "WORK",
        enabled: true,
        onEvent,
      })
    );
    const socket = MockWebSocket.instances[0];

    if (!socket) throw new Error("Expected a WebSocket connection");

    socket.receive(
      JSON.stringify({
        type: "chat.message.created",
        data: {
          conversationId: "conversation-1",
          message: {
            id: "legacy-message",
            conversationId: "conversation-1",
            sequence: 1,
            kind: "USER",
            sender: { id: "member-1", displayName: "Arthit" },
            text: "Legacy event",
            attachments: [],
            createdAt: "2026-09-17T16:05:00Z",
          },
        },
      })
    );
    socket.receive(
      JSON.stringify({
        type: "chat.read.updated",
        data: {
          conversationId: "conversation-1",
          userId: "member-1",
          lastReadMessageId: "message-1",
          readAt: "2026-09-17T16:05:30Z",
        },
      })
    );
    socket.receive(
      JSON.stringify({
        type: "quest.state.changed",
        data: {
          questId: "quest-1",
          previousState: "QUEST_ASSIGNED",
          newState: "QUEST_IN_PROGRESS",
          timestamp: "2026-09-17T16:10:00Z",
        },
      })
    );
    socket.receive("not json");
    socket.receive(JSON.stringify({ type: "chat.typing", data: {} }));

    expect(onEvent).not.toHaveBeenCalled();
    await unmount();
  });
  it("forwards both conversation-specific message events", async () => {
    const onEvent = jest.fn();
    const { unmount } = await renderHook(() =>
      useChatSocket({
        conversationId: "conversation-1",
        conversationType: "WORK",
        enabled: true,
        onEvent,
      })
    );
    const socket = MockWebSocket.instances[0];

    if (!socket) throw new Error("Expected a WebSocket connection");

    socket.receive(
      JSON.stringify({
        type: "WORK_CONVERSATION_MESSAGE",
        message: {
          id: "work-message",
          conversationId: "conversation-1",
          sequence: 1,
          kind: "USER",
          sender: { id: "member-1", displayName: "Arthit" },
          text: "Work update",
          attachments: [],
          createdAt: "2026-09-24T12:00:00Z",
        },
      })
    );
    socket.receive(
      JSON.stringify({
        type: "CANDIDATE_INQUIRY_MESSAGE",
        message: {
          id: "inquiry-message",
          conversationId: "conversation-1",
          sequence: 2,
          kind: "USER",
          sender: { id: "member-2", displayName: "Suda" },
          text: "Inquiry update",
          attachments: [],
          createdAt: "2026-09-24T12:01:00Z",
        },
      })
    );

    expect(onEvent).toHaveBeenCalledTimes(2);
    expect(onEvent.mock.calls[0]?.[0]).toMatchObject({
      type: "WORK_CONVERSATION_MESSAGE",
      message: { id: "work-message" },
    });
    expect(onEvent.mock.calls[1]?.[0]).toMatchObject({
      type: "CANDIDATE_INQUIRY_MESSAGE",
      message: { id: "inquiry-message" },
    });

    await unmount();
  });

  it("sends text with attachments and resolves only after acceptance", async () => {
    const { result, unmount } = await renderHook(() =>
      useChatSocket({
        conversationId: "conversation-1",
        conversationType: "WORK",
        enabled: true,
        onEvent: jest.fn(),
      })
    );
    const socket = MockWebSocket.instances[0];

    if (!socket) throw new Error("Expected a WebSocket connection");

    await act(async () => {
      socket.open();
    });
    const attachmentId = "b199ae67-3939-4da3-8c78-2fa1c282926d";
    const accepted = result.current.sendMessage({
      clientMessageId: "client-message-1",
      text: "Hello",
      attachmentIds: [attachmentId],
    });

    expect(socket.send).toHaveBeenCalledWith(
      JSON.stringify({
        type: "SEND_MESSAGE",
        clientMessageId: "client-message-1",
        text: "Hello",
        attachmentIds: [attachmentId],
      })
    );

    socket.receive(
      JSON.stringify({
        type: "MESSAGE_ACCEPTED",
        clientMessageId: "client-message-1",
        message: {
          id: "server-message-1",
          conversationId: "conversation-1",
          sequence: 1,
          kind: "USER",
          sender: { id: "member-1", displayName: "Arthit" },
          text: "Hello",
          attachments: [
            {
              id: attachmentId,
              fileName: "hello.pdf",
              mediaType: "application/pdf",
              sizeBytes: 1024,
              createdAt: "2026-09-24T12:00:00Z",
            },
          ],
          createdAt: "2026-09-24T12:00:00Z",
        },
      })
    );

    await expect(accepted).resolves.toMatchObject({
      id: "server-message-1",
      text: "Hello",
    });
    await unmount();
  });

  it("sends attachment-only messages without text and resolves saved files", async () => {
    const { result, unmount } = await renderHook(() =>
      useChatSocket({
        conversationId: "conversation-1",
        conversationType: "WORK",
        enabled: true,
        onEvent: jest.fn(),
      })
    );
    const socket = MockWebSocket.instances[0];

    if (!socket) throw new Error("Expected a WebSocket connection");

    await act(async () => {
      socket.open();
    });
    const attachmentId = "b199ae67-3939-4da3-8c78-2fa1c282926d";
    const accepted = result.current.sendMessage({
      clientMessageId: "client-file-1",
      attachmentIds: [attachmentId],
    });

    expect(socket.send).toHaveBeenCalledWith(
      JSON.stringify({
        type: "SEND_MESSAGE",
        clientMessageId: "client-file-1",
        attachmentIds: [attachmentId],
      })
    );

    socket.receive(
      JSON.stringify({
        type: "MESSAGE_ACCEPTED",
        clientMessageId: "client-file-1",
        message: {
          id: "server-message-2",
          conversationId: "conversation-1",
          sequence: "2",
          kind: "USER",
          sender: { id: "member-1", displayName: "Arthit" },
          text: null,
          attachments: [
            {
              id: attachmentId,
              fileName: "brief.pdf",
              mediaType: "application/pdf",
              sizeBytes: "1024",
              createdAt: "2026-09-24T12:01:00Z",
            },
          ],
          createdAt: "2026-09-24T12:01:00Z",
        },
      })
    );

    await expect(accepted).resolves.toMatchObject({
      id: "server-message-2",
      sequence: 2,
      text: null,
      attachments: [{ id: attachmentId, sizeBytes: 1024 }],
    });
    await unmount();
  });

  it("rejects a pending message with the server rejection error", async () => {
    const { result, unmount } = await renderHook(() =>
      useChatSocket({
        conversationId: "conversation-1",
        conversationType: "CANDIDATE_INQUIRY",
        enabled: true,
        onEvent: jest.fn(),
      })
    );
    const socket = MockWebSocket.instances[0];

    if (!socket) throw new Error("Expected a WebSocket connection");

    await act(async () => {
      socket.open();
    });
    const rejected = result.current.sendMessage({
      clientMessageId: "client-message-2",
      text: "Hello",
    });
    socket.receive(
      JSON.stringify({
        type: "MESSAGE_REJECTED",
        clientMessageId: "client-message-2",
        error: { code: "RATE_LIMITED", message: "Try again later." },
      })
    );

    await expect(rejected).rejects.toThrow("Try again later.");
    await unmount();
  });
  it("delivers MESSAGE_REJECTED with null clientMessageId to onEvent", async () => {
    const onEvent = jest.fn();
    const { unmount } = await renderHook(() =>
      useChatSocket({
        conversationId: "conversation-1",
        conversationType: "WORK",
        enabled: true,
        onEvent,
      })
    );
    const socket = MockWebSocket.instances[0];
    if (!socket) throw new Error("Expected a WebSocket connection");

    await act(async () => {
      socket.open();
    });

    socket.receive(
      JSON.stringify({
        type: "MESSAGE_REJECTED",
        clientMessageId: null,
        error: { code: "MALFORMED_FRAME", message: "Frame was unparseable." },
      })
    );

    expect(onEvent).toHaveBeenCalledWith({
      type: "MESSAGE_REJECTED",
      clientMessageId: null,
      error: { code: "MALFORMED_FRAME", message: "Frame was unparseable." },
    });
    await unmount();
  });

  it("closes the socket when the hook unmounts", async () => {
    const { unmount } = await renderHook(() =>
      useChatSocket({
        conversationId: "conversation-1",
        conversationType: "WORK",
        enabled: true,
        onEvent: jest.fn(),
      })
    );
    const socket = MockWebSocket.instances[0];

    if (!socket) throw new Error("Expected a WebSocket connection");

    await unmount();

    expect(socket.close).toHaveBeenCalledTimes(1);
  });
  it("rejects commands outside the shared send contract", async () => {
    const { result, unmount } = await renderHook(() =>
      useChatSocket({
        conversationId: "conversation-1",
        conversationType: "WORK",
        enabled: true,
        onEvent: jest.fn(),
      })
    );
    const socket = MockWebSocket.instances[0];

    if (!socket) throw new Error("Expected a WebSocket connection");
    await act(async () => {
      socket.open();
    });

    const attachmentId = "b199ae67-3939-4da3-8c78-2fa1c282926d";
    const invalidMessages = [
      { clientMessageId: "", text: "Hello" },
      { clientMessageId: "c".repeat(129), text: "Hello" },
      { clientMessageId: "too-long", text: "x".repeat(1001) },
      { clientMessageId: "blank", text: "  " },
      { clientMessageId: "empty" },
      {
        clientMessageId: "duplicate",
        attachmentIds: [attachmentId, attachmentId],
      },
      { clientMessageId: "bad-id", attachmentIds: ["not-a-uuid"] },
    ];
    const results = invalidMessages.map((message) =>
      result.current.sendMessage(message).then(
        () => "resolved",
        () => "rejected"
      )
    );

    await unmount();
    expect(socket.send).not.toHaveBeenCalled();
    await expect(Promise.all(results)).resolves.toEqual(
      invalidMessages.map(() => "rejected")
    );
  });

  it.each([1008, 4403])(
    "does not reconnect after policy/access close code %i",
    async (code) => {
      jest.useFakeTimers();
      try {
        const { result, unmount } = await renderHook(() =>
          useChatSocket({
            conversationId: "conversation-1",
            conversationType: "WORK",
            enabled: true,
            onEvent: jest.fn(),
          })
        );
        const socket = MockWebSocket.instances[0];

        if (!socket) throw new Error("Expected a WebSocket connection");
        await act(async () => {
          socket.open();
          socket.onclose?.({ code, reason: "closed" });
        });
        await act(async () => {
          jest.advanceTimersByTime(60_000);
        });

        expect(result.current.status).toBe("unavailable");
        expect(MockWebSocket.instances).toHaveLength(1);
        await unmount();
      } finally {
        jest.useRealTimers();
      }
    }
  );
});
