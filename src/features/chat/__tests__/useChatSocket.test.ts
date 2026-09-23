import { act, renderHook } from "@testing-library/react-native";

import { authClient } from "@/features/auth/authClient";
import { toWebSocketUrl, useChatSocket } from "../api/useChatSocket";

class MockWebSocket {
  static instances: MockWebSocket[] = [];
  static readonly OPEN = 1;
  static readonly CLOSED = 3;

  readonly close = jest.fn(() => {
    this.readyState = MockWebSocket.CLOSED;
  });
  readonly send = jest.fn();
  readyState = 0;
  onclose: ((event: { code: number; reason: string }) => void) | null = null;
  onerror: (() => void) | null = null;
  onmessage: ((event: { data: unknown }) => void) | null = null;
  onopen: (() => void) | null = null;

  constructor(
    readonly url: string,
    readonly protocols?: string | string[] | null,
    readonly options?: { headers?: Record<string, string> }
  ) {
    MockWebSocket.instances.push(this);
  }

  open() {
    this.readyState = MockWebSocket.OPEN;
    this.onopen?.();
  }

  receive(data: unknown) {
    this.onmessage?.({ data });
  }
}

const originalApiUrl = process.env.EXPO_PUBLIC_API_URL;
const originalWebSocket = globalThis.WebSocket;
describe("useChatSocket", () => {
  beforeEach(() => {
    MockWebSocket.instances = [];
    process.env.EXPO_PUBLIC_API_URL = "https://api.example.com/";
    jest
      .spyOn(authClient, "getCookie")
      .mockReturnValue("better-auth.session_token=session");
    globalThis.WebSocket = MockWebSocket as unknown as typeof WebSocket;
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

  it("converts HTTP API URLs into WebSocket URLs", () => {
    expect(toWebSocketUrl("https://api.example.com///", "/api/v1/events")).toBe(
      "wss://api.example.com/api/v1/events"
    );
    expect(toWebSocketUrl("http://localhost:3000", "api/v1/events")).toBe(
      "ws://localhost:3000/api/v1/events"
    );
  });

  it.each([
    ["WORK", "/api/v1/chat/conversations/conversation-1/events"],
    [
      "CANDIDATE_INQUIRY",
      "/api/v1/chat/candidate-inquiries/conversation-1/events",
    ],
  ] as const)(
    "uses the correct %s event path",
    async (conversationType, path) => {
      const { unmount } = await renderHook(() =>
        useChatSocket({
          conversationId: "conversation-1",
          conversationType,
          enabled: true,
          onEvent: jest.fn(),
        })
      );

      expect(MockWebSocket.instances).toHaveLength(1);
      expect(MockWebSocket.instances[0]?.url).toBe(
        `wss://api.example.com${path}`
      );
      expect(MockWebSocket.instances[0]?.protocols).toEqual([]);
      expect(MockWebSocket.instances[0]?.options).toEqual({
        headers: { Cookie: "better-auth.session_token=session" },
      });

      await unmount();
    }
  );

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

  it("forwards only valid recognized socket events", async () => {
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
      socket.receive(
        JSON.stringify({
          type: "chat.message.created",
          data: {
            conversationId: "conversation-1",
            message: {
              id: "message-1",
              conversationId: "conversation-1",
              sequence: 1,
              kind: "USER",
              sender: { id: "member-1", displayName: "Arthit" },
              text: "I have arrived.",
              attachments: [],
              createdAt: "2026-09-17T16:05:00+07:00",
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
            readAt: "2026-09-17T16:05:30+07:00",
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
            timestamp: "2026-09-17T16:10:00+07:00",
          },
        })
      );
      socket.receive("{not json");
      socket.receive(JSON.stringify({ type: "chat.typing", data: {} }));
      socket.receive(
        JSON.stringify({
          type: "chat.read.updated",
          data: { userId: "member-1" },
        })
      );
      socket.receive({ type: "chat.read.updated" });
    });

    expect(onEvent).toHaveBeenCalledTimes(3);
    expect(onEvent.mock.calls[0]?.[0]).toMatchObject({
      type: "chat.message.created",
      data: { conversationId: "conversation-1" },
    });
    expect(onEvent.mock.calls[1]?.[0]).toMatchObject({
      type: "chat.read.updated",
      data: { lastReadMessageId: "message-1" },
    });
    expect(onEvent.mock.calls[2]?.[0]).toMatchObject({
      type: "quest.state.changed",
      data: { questId: "quest-1" },
    });

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

  it("sends text and resolves only when the matching acceptance arrives", async () => {
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
    const accepted = result.current.sendMessage({
      clientMessageId: "client-message-1",
      text: "Hello",
    });

    expect(socket.send).toHaveBeenCalledWith(
      JSON.stringify({
        type: "SEND_MESSAGE",
        clientMessageId: "client-message-1",
        text: "Hello",
      })
    );

    socket.receive(
      JSON.stringify({
        type: "MESSAGE_ACCEPTED",
        clientMessageId: "client-message-1",
      })
    );

    await expect(accepted).resolves.toBeUndefined();
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
});
