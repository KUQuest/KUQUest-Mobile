import { authClient } from "@/features/auth/authClient";
import {
  subscribeToCandidateRosterEvents,
  subscribeToQuestEvents,
} from "../questEvents";

class MockWebSocket {
  static instances: MockWebSocket[] = [];

  readonly close = jest.fn();
  readonly send = jest.fn();
  onclose: ((event: { code: number; reason: string }) => void) | null = null;
  onmessage: ((event: { data: unknown }) => void) | null = null;

  constructor(
    readonly url: string,
    readonly protocols?: string[] | null,
    readonly options?: { headers?: Record<string, string> }
  ) {
    MockWebSocket.instances.push(this);
  }

  receive(data: unknown) {
    this.onmessage?.({ data });
  }

  disconnect(code = 1006) {
    this.onclose?.({ code, reason: "network closed" });
  }
}

const originalApiUrl = process.env.EXPO_PUBLIC_API_URL;
const originalWebSocket = globalThis.WebSocket;

describe("Quest event subscription", () => {
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
    jest.useRealTimers();
    globalThis.WebSocket = originalWebSocket;
    if (originalApiUrl === undefined) {
      delete process.env.EXPO_PUBLIC_API_URL;
    } else {
      process.env.EXPO_PUBLIC_API_URL = originalApiUrl;
    }
  });

  it("uses the configured API host and authenticated Quest event path", () => {
    const stop = subscribeToQuestEvents("quest-1", jest.fn());
    const socket = MockWebSocket.instances[0];

    expect(socket?.url).toBe("wss://api.example.com/v2/quests/quest-1/events");
    expect(socket?.protocols).toEqual([]);
    expect(socket?.options).toEqual({
      headers: { Cookie: "better-auth.session_token=session" },
    });

    stop();
    expect(socket?.close).toHaveBeenCalledTimes(1);
  });
  it("subscribes to Candidate roster events on the authenticated WSS path", () => {
    const onRosterUpdated = jest.fn();
    const stop = subscribeToCandidateRosterEvents("quest-1", onRosterUpdated);
    const socket = MockWebSocket.instances[0];

    expect(socket?.url).toBe(
      "wss://api.example.com/v2/quests/quest-1/candidate-roster/events"
    );
    expect(socket?.options).toEqual({
      headers: { Cookie: "better-auth.session_token=session" },
    });
    if (!socket) throw new Error("Expected a Candidate roster event socket");

    socket.receive(
      JSON.stringify({
        type: "CANDIDATE_ROSTER_UPDATED",
        version: 1,
        questId: "quest-1",
      })
    );
    socket.receive(
      JSON.stringify({ type: "SUBSCRIBED", version: 1, questId: "other" })
    );
    socket.receive(
      JSON.stringify({ type: "SUBSCRIBED", version: 1, questId: "quest-1" })
    );
    socket.receive(
      JSON.stringify({
        type: "CANDIDATE_ROSTER_UPDATED",
        version: 2,
        questId: "quest-1",
      })
    );
    socket.receive(
      JSON.stringify({
        type: "CANDIDATE_ROSTER_UPDATED",
        version: 1,
        questId: "other",
      })
    );
    socket.receive(
      JSON.stringify({
        type: "CANDIDATE_ROSTER_UPDATED",
        version: 1,
        questId: "quest-1",
      })
    );

    expect(onRosterUpdated).toHaveBeenCalledTimes(1);
    expect(onRosterUpdated).toHaveBeenCalledWith({
      type: "CANDIDATE_ROSTER_UPDATED",
      version: 1,
      questId: "quest-1",
    });
    expect(socket.send).not.toHaveBeenCalled();
    stop();
    expect(socket.close).toHaveBeenCalledTimes(1);
  });

  it("forwards only matching versioned Quest updates", () => {
    const onQuestUpdated = jest.fn();
    const stop = subscribeToQuestEvents("quest-1", onQuestUpdated);
    const socket = MockWebSocket.instances[0];
    if (!socket) throw new Error("Expected a Quest event socket");

    socket.receive(
      JSON.stringify({ type: "SUBSCRIBED", version: 1, questId: "quest-1" })
    );
    socket.receive("not-json");
    socket.receive(
      JSON.stringify({
        type: "QUEST_UPDATED",
        version: 2,
        questId: "quest-1",
        changeType: "PROOF_SUBMITTED",
      })
    );
    socket.receive(
      JSON.stringify({
        type: "QUEST_UPDATED",
        version: 1,
        questId: "another-quest",
        changeType: "PROOF_SUBMITTED",
      })
    );
    socket.receive(
      JSON.stringify({
        type: "QUEST_UPDATED",
        version: 1,
        questId: "quest-1",
        changeType: "QUEST_EDIT_UPDATED",
      })
    );
    expect(onQuestUpdated).not.toHaveBeenCalled();

    const changeTypes = [
      "ASSIGNMENT_ROSTER_UPDATED",
      "QUEST_STARTED",
      "PROOF_SUBMITTED",
      "PROOF_REVIEWED",
      "PROOF_AUTO_APPROVED",
      "COMPLETION_CONFIRMED",
      "QUEST_COMPLETED",
      "QUEST_FAILED",
      "QUEST_CANCELLED",
      "QUEST_EDIT_UPDATED",
    ] as const;
    for (const changeType of changeTypes) {
      socket.receive(
        JSON.stringify({
          type: "QUEST_UPDATED",
          version: 1,
          questId: "quest-1",
          changeType,
          ...(changeType === "QUEST_EDIT_UPDATED"
            ? { editRequestId: "edit-1" }
            : {}),
        })
      );
    }

    expect(onQuestUpdated).toHaveBeenCalledTimes(changeTypes.length);
    expect(onQuestUpdated).toHaveBeenLastCalledWith(
      expect.objectContaining({
        changeType: "QUEST_EDIT_UPDATED",
        editRequestId: "edit-1",
      })
    );
    socket.receive(
      JSON.stringify({
        type: "QUEST_UPDATED",
        version: 1,
        questId: "quest-1",
        changeType: "FUTURE_CHANGE",
      })
    );
    expect(onQuestUpdated).toHaveBeenCalledTimes(changeTypes.length + 1);
    expect(onQuestUpdated).toHaveBeenLastCalledWith(
      expect.objectContaining({ changeType: "FUTURE_CHANGE" })
    );
    stop();
  });

  it("does not connect without a session cookie", () => {
    jest.mocked(authClient.getCookie).mockReturnValue("");

    const stop = subscribeToQuestEvents("quest-1", jest.fn());

    expect(MockWebSocket.instances).toHaveLength(0);
    stop();
  });
  it("stops reconnecting after Quest access is denied", () => {
    jest.useFakeTimers();
    const stop = subscribeToQuestEvents("quest-1", jest.fn());
    const socket = MockWebSocket.instances[0];
    if (!socket) throw new Error("Expected a Quest event socket");

    socket.disconnect(4403);
    jest.advanceTimersByTime(60_000);

    expect(MockWebSocket.instances).toHaveLength(1);
    stop();
  });

  it("reconnects after a close and stops when unsubscribed", () => {
    jest.useFakeTimers();
    const getCookie = jest.mocked(authClient.getCookie);
    const stop = subscribeToQuestEvents("quest-1", jest.fn());
    const firstSocket = MockWebSocket.instances[0];
    if (!firstSocket) throw new Error("Expected an initial Quest event socket");

    getCookie.mockReturnValue("better-auth.session_token=refreshed");
    firstSocket.disconnect();
    jest.advanceTimersByTime(1_000);

    const secondSocket = MockWebSocket.instances[1];
    expect(secondSocket?.options?.headers?.Cookie).toBe(
      "better-auth.session_token=refreshed"
    );
    expect(MockWebSocket.instances).toHaveLength(2);

    stop();
    expect(secondSocket?.close).toHaveBeenCalledTimes(1);
  });
  it("stops reconnecting after Candidate roster access is lost", () => {
    jest.useFakeTimers();
    const stop = subscribeToCandidateRosterEvents("quest-1", jest.fn());
    const socket = MockWebSocket.instances[0];
    if (!socket) throw new Error("Expected a Candidate roster event socket");

    socket.disconnect(4403);
    jest.advanceTimersByTime(60_000);

    expect(MockWebSocket.instances).toHaveLength(1);
    stop();
  });
});
