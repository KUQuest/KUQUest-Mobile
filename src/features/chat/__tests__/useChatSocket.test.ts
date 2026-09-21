import { act, renderHook } from "@testing-library/react-native";

jest.mock("@/features/auth/authClient", () => ({
  authClient: { getCookie: () => "better-auth.session_token=test-cookie" },
}));

import { toWebSocketUrl, useChatSocket } from "../useChatSocket";

class MockWebSocket {
  static instances: MockWebSocket[] = [];

  readonly close = jest.fn();
  readonly send = jest.fn();
  onclose: (() => void) | null = null;
  onmessage: ((event: { data: unknown }) => void) | null = null;
  onopen: (() => void) | null = null;

  constructor(
    readonly url: string,
    readonly protocols?: string | string[],
    readonly options?: { headers?: Record<string, string> }
  ) {
    MockWebSocket.instances.push(this);
  }

  open() {
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
    globalThis.WebSocket = MockWebSocket as unknown as typeof WebSocket;
  });

  afterEach(() => {
    if (originalApiUrl === undefined) {
      delete process.env.EXPO_PUBLIC_API_URL;
      return;
    }
    process.env.EXPO_PUBLIC_API_URL = originalApiUrl;
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
    "uses the correct %s event path and authenticated constructor",
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
      expect(MockWebSocket.instances[0]?.options).toEqual({
        headers: { Cookie: "better-auth.session_token=test-cookie" },
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

    expect(result.current.status).toBe("unavailable");
    expect(result.current.reconnectAttempt).toBe(0);
    expect(MockWebSocket.instances).toHaveLength(0);

    await unmount();
  });

  it("forwards backend committed events and resolves accepted commands", async () => {
    const onEvent = jest.fn();
    const { result, unmount } = await renderHook(() =>
      useChatSocket({
        conversationId: "conversation-1",
        conversationType: "WORK",
        enabled: true,
        onEvent,
      })
    );
    const socket = MockWebSocket.instances[0];

    if (!socket) throw new Error("Expected a WebSocket connection");

    const acceptedMessage = {
      id: "message-1",
      conversationId: "conversation-1",
      sequence: 1,
      kind: "USER",
      sender: { id: "member-1", displayName: "Arthit" },
      text: "I have arrived.",
      attachments: [],
      createdAt: "2026-09-17T16:05:00+07:00",
    };

    await act(async () => {
      socket.open();
      const pending = result.current.sendMessage({
        type: "SEND_MESSAGE",
        clientMessageId: "client-message-1",
        text: "I have arrived.",
        attachmentIds: [],
      });
      expect(socket.send).toHaveBeenCalledWith(
        JSON.stringify({
          type: "SEND_MESSAGE",
          clientMessageId: "client-message-1",
          text: "I have arrived.",
          attachmentIds: [],
        })
      );
      socket.receive(
        JSON.stringify({
          type: "MESSAGE_ACCEPTED",
          clientMessageId: "client-message-1",
          message: acceptedMessage,
        })
      );
      await expect(pending).resolves.toEqual(acceptedMessage);
      socket.receive(
        JSON.stringify({
          type: "WORK_CONVERSATION_MESSAGE",
          message: acceptedMessage,
        })
      );
      socket.receive(
        JSON.stringify({
          type: "CANDIDATE_INQUIRY_MESSAGE",
          message: acceptedMessage,
        })
      );
      socket.receive("{not json");
    });

    expect(onEvent).toHaveBeenCalledTimes(2);
    expect(onEvent.mock.calls[0]?.[0]).toMatchObject({
      type: "WORK_CONVERSATION_MESSAGE",
      message: { id: "message-1" },
    });
    expect(onEvent.mock.calls[1]?.[0]).toMatchObject({
      type: "CANDIDATE_INQUIRY_MESSAGE",
      message: { id: "message-1" },
    });

    await unmount();
  });

  it("rejects a command with the backend error code and message", async () => {
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
      const pending = result.current.sendMessage({
        type: "SEND_MESSAGE",
        clientMessageId: "client-message-2",
        text: "Rejected",
        attachmentIds: [],
      });
      socket.receive(
        JSON.stringify({
          type: "MESSAGE_REJECTED",
          clientMessageId: "client-message-2",
          error: { code: "NOT_ALLOWED", message: "Conversation is read-only." },
        })
      );
      await expect(pending).rejects.toMatchObject({
        code: "NOT_ALLOWED",
        message: "Conversation is read-only.",
      });
    });

    await unmount();
  });

  it("reconnects after the socket closes", async () => {
    jest.useFakeTimers();
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
      socket.onclose?.();
      jest.advanceTimersByTime(1_000);
    });

    expect(result.current.status).toBe("reconnecting");
    expect(MockWebSocket.instances).toHaveLength(2);

    await unmount();
    jest.useRealTimers();
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
