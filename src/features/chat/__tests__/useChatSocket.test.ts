import { act, renderHook } from "@testing-library/react-native";

import { toWebSocketUrl, useChatSocket } from "../useChatSocket";

class MockWebSocket {
  static instances: MockWebSocket[] = [];

  readonly close = jest.fn();
  onclose: (() => void) | null = null;
  onmessage: ((event: { data: unknown }) => void) | null = null;
  onopen: (() => void) | null = null;

  constructor(readonly url: string) {
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

    expect(result.current).toEqual({
      status: "unavailable",
      reconnectAttempt: 0,
    });
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
