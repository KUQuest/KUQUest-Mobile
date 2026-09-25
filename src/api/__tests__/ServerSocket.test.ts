import { openServerSocket } from "@/api/ServerSocket";
import { authClient } from "@/features/auth/authClient";
import { installMockWebSocket, MockWebSocket } from "@/testing/mockWebSocket";

const originalApiUrl = process.env.EXPO_PUBLIC_API_URL;
let restoreWebSocket: () => void;

function latestSocket(): MockWebSocket {
  const socket = MockWebSocket.instances.at(-1);
  if (!socket) throw new Error("Expected a socket");
  return socket;
}

describe("openServerSocket", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    restoreWebSocket = installMockWebSocket();
    process.env.EXPO_PUBLIC_API_URL = "https://api.example.com///";
    jest
      .spyOn(authClient, "getCookie")
      .mockReturnValue("better-auth.session_token=first");
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
    restoreWebSocket();
    if (originalApiUrl === undefined) delete process.env.EXPO_PUBLIC_API_URL;
    else process.env.EXPO_PUBLIC_API_URL = originalApiUrl;
  });

  it("connects to the API host with the session cookie and app Origin", () => {
    const socket = openServerSocket("/api/v2/quests/board/events", {
      onFrame: jest.fn(),
    });

    expect(latestSocket().url).toBe(
      "wss://api.example.com/api/v2/quests/board/events"
    );
    expect(latestSocket().options).toEqual({
      headers: {
        Cookie: "better-auth.session_token=first",
        Origin: "kuquestmobile://",
      },
    });
    socket.close();
  });

  it("uses ws for an http API host", () => {
    process.env.EXPO_PUBLIC_API_URL = "http://localhost:3000";
    const socket = openServerSocket("api/v1/events", { onFrame: jest.fn() });

    expect(latestSocket().url).toBe("ws://localhost:3000/api/v1/events");
    socket.close();
  });

  it.each([
    ["API URL", () => (process.env.EXPO_PUBLIC_API_URL = "  ")],
    [
      "session cookie",
      () => jest.mocked(authClient.getCookie).mockReturnValue(""),
    ],
  ])("stops without a socket when the %s is missing", (_label, arrange) => {
    arrange();
    const onClose = jest.fn();

    openServerSocket("/events", { onFrame: jest.fn(), onClose });

    expect(MockWebSocket.instances).toHaveLength(0);
    expect(onClose).toHaveBeenCalledWith(
      expect.objectContaining({ code: null, terminal: true })
    );
  });

  it("delivers JSON text frames and drops malformed or binary frames", () => {
    const onFrame = jest.fn();
    const socket = openServerSocket("/events", { onFrame });

    latestSocket().receive("{not json");
    latestSocket().receive(new ArrayBuffer(1));
    latestSocket().receive(JSON.stringify({ type: "SUBSCRIBED" }));

    expect(onFrame).toHaveBeenCalledTimes(1);
    expect(onFrame).toHaveBeenCalledWith({ type: "SUBSCRIBED" });
    socket.close();
  });

  it("reconnects with backoff and a fresh cookie, resetting after open", () => {
    const onOpen = jest.fn();
    const onClose = jest.fn();
    const socket = openServerSocket("/events", {
      onFrame: jest.fn(),
      onOpen,
      onClose,
    });

    latestSocket().disconnect(1006);
    expect(onClose).toHaveBeenLastCalledWith(
      expect.objectContaining({ code: 1006, terminal: false, attempt: 1 })
    );
    jest.advanceTimersByTime(999);
    expect(MockWebSocket.instances).toHaveLength(1);
    jest.advanceTimersByTime(1);
    expect(MockWebSocket.instances).toHaveLength(2);

    latestSocket().disconnect(1006);
    jest.advanceTimersByTime(1_999);
    expect(MockWebSocket.instances).toHaveLength(2);
    jest
      .mocked(authClient.getCookie)
      .mockReturnValue("better-auth.session_token=second");
    jest.advanceTimersByTime(1);
    expect(latestSocket().options?.headers?.Cookie).toBe(
      "better-auth.session_token=second"
    );

    latestSocket().open();
    expect(onOpen).toHaveBeenCalledTimes(1);
    latestSocket().disconnect(1006);
    expect(onClose).toHaveBeenLastCalledWith(
      expect.objectContaining({ attempt: 1 })
    );
    jest.advanceTimersByTime(1_000);
    expect(MockWebSocket.instances).toHaveLength(4);
    socket.close();
  });

  it.each([1008, 4401, 4403])("stops after terminal close %i", (code) => {
    const onClose = jest.fn();
    openServerSocket("/events", { onFrame: jest.fn(), onClose });

    latestSocket().disconnect(code, "denied");
    jest.advanceTimersByTime(60_000);

    expect(MockWebSocket.instances).toHaveLength(1);
    expect(onClose).toHaveBeenCalledWith({
      code,
      reason: "denied",
      terminal: true,
      attempt: 0,
    });
  });

  it("stops reconnecting and ignores the old socket after close", () => {
    const onFrame = jest.fn();
    const onClose = jest.fn();
    const socket = openServerSocket("/events", { onFrame, onClose });
    const first = latestSocket();

    socket.close();
    socket.close();
    first.receive(JSON.stringify({ type: "LATE" }));
    first.disconnect(1006);
    jest.advanceTimersByTime(60_000);

    expect(first.close).toHaveBeenCalledTimes(1);
    expect(MockWebSocket.instances).toHaveLength(1);
    expect(onFrame).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("sends JSON only while open", () => {
    const socket = openServerSocket("/events", { onFrame: jest.fn() });

    expect(() => socket.send({ type: "PING" })).toThrow(
      "Connection is not ready."
    );
    latestSocket().open();
    socket.send({ type: "PING" });

    expect(latestSocket().send).toHaveBeenCalledWith('{"type":"PING"}');
    socket.close();
  });
});
