import { authClient } from "@/features/auth/authClient";
import {
  subscribeToCandidateRosterEvents,
  subscribeToHirerQuestEvents,
  subscribeToQuestBoardEvents,
  subscribeToQuestEvents,
} from "../questEvents";
import { MockWebSocket } from "@/testing/mockWebSocket";

const originalApiUrl = process.env.EXPO_PUBLIC_API_URL;
const originalWebSocket = globalThis.WebSocket;

describe("Quest event subscription", () => {
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

    expect(socket?.url).toBe(
      "wss://api.example.com/api/v2/quests/quest-1/events"
    );
    expect(socket?.protocols).toEqual([]);
    expect(socket?.options).toEqual({
      headers: {
        Cookie: "better-auth.session_token=session",
        Origin: "kuquestmobile://",
      },
    });

    stop();
    expect(socket?.close).toHaveBeenCalledTimes(1);
  });
  it("subscribes to authorized Candidate roster updates", () => {
    const questId = "00000000-0000-4000-8000-000000000001";
    const otherQuestId = "00000000-0000-4000-8000-000000000002";
    const onRosterUpdated = jest.fn();
    const stop = subscribeToCandidateRosterEvents(questId, onRosterUpdated);
    const socket = MockWebSocket.instances[0];

    expect(socket?.url).toBe(
      `wss://api.example.com/api/v2/quests/${questId}/candidate-roster/events`
    );
    expect(socket?.options).toEqual({
      headers: {
        Cookie: "better-auth.session_token=session",
        Origin: "kuquestmobile://",
      },
    });
    if (!socket) throw new Error("Expected a Candidate roster event socket");

    socket.receive(
      JSON.stringify({
        type: "CANDIDATE_ROSTER_UPDATED",
        version: 1,
        questId,
      })
    );
    socket.receive(
      JSON.stringify({ type: "SUBSCRIBED", version: 1, questId: otherQuestId })
    );
    socket.receive(
      JSON.stringify({
        type: "CANDIDATE_ROSTER_UPDATED",
        version: 1,
        questId,
      })
    );
    socket.receive(JSON.stringify({ type: "SUBSCRIBED", version: 1, questId }));
    socket.receive(
      JSON.stringify({
        type: "CANDIDATE_ROSTER_UPDATED",
        version: 1,
        questId,
      })
    );
    socket.receive(
      JSON.stringify({
        type: "CANDIDATE_ROSTER_UPDATED",
        version: 2,
        questId,
      })
    );
    socket.receive(
      JSON.stringify({
        type: "CANDIDATE_ROSTER_UPDATED",
        version: 1,
        questId: otherQuestId,
      })
    );
    socket.receive(
      JSON.stringify({
        type: "CANDIDATE_ROSTER_UPDATED",
        version: 1,
        questId,
        team: { id: "ignored" },
      })
    );
    socket.receive(
      JSON.stringify({ type: "CANDIDATE_ROSTER_UPDATED", version: 1 })
    );
    socket.receive(
      JSON.stringify({ type: "CANDIDATE_ROSTER_UPDATED", questId })
    );

    expect(onRosterUpdated).toHaveBeenCalledTimes(1);
    expect(onRosterUpdated).toHaveBeenCalledWith({
      type: "CANDIDATE_ROSTER_UPDATED",
      version: 1,
      questId,
    });
    expect(socket.send).not.toHaveBeenCalled();
    stop();
    expect(socket.close).toHaveBeenCalledTimes(1);
  });

  it("rejects Candidate roster messages with a non-UUID Quest ID", () => {
    const questId = "not-a-uuid";
    const onRosterUpdated = jest.fn();
    const stop = subscribeToCandidateRosterEvents(questId, onRosterUpdated);
    const socket = MockWebSocket.instances[0];
    if (!socket) throw new Error("Expected a Candidate roster event socket");

    socket.receive(JSON.stringify({ type: "SUBSCRIBED", version: 1, questId }));
    socket.receive(
      JSON.stringify({
        type: "CANDIDATE_ROSTER_UPDATED",
        version: 1,
        questId,
      })
    );

    expect(onRosterUpdated).not.toHaveBeenCalled();
    stop();
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
      "TEAM_REWARD_ALLOCATED",
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

  it("subscribes to strict, scoped Quest Board invalidations", () => {
    const onInvalidated = jest.fn();
    const onSubscribed = jest.fn();
    const stop = subscribeToQuestBoardEvents(onInvalidated, onSubscribed);
    const socket = MockWebSocket.instances[0];

    expect(socket?.url).toBe(
      "wss://api.example.com/api/v2/quests/board/events"
    );
    expect(socket?.options).toEqual({
      headers: {
        Cookie: "better-auth.session_token=session",
        Origin: "kuquestmobile://",
      },
    });
    if (!socket) throw new Error("Expected a Quest Board event socket");

    const invalidation = {
      type: "QUEST_BOARD_INVALIDATED",
      version: 1,
      questId: "00000000-0000-4000-8000-000000000001",
    };
    socket.receive(JSON.stringify(invalidation));
    socket.receive(
      JSON.stringify({ type: "SUBSCRIBED", version: 1, scope: "QUEST" })
    );
    socket.receive(
      JSON.stringify({
        type: "SUBSCRIBED",
        version: 1,
        scope: "QUEST_BOARD",
        extra: true,
      })
    );
    socket.receive("not-json");

    expect(onSubscribed).not.toHaveBeenCalled();
    expect(onInvalidated).not.toHaveBeenCalled();

    socket.receive(
      JSON.stringify({
        type: "SUBSCRIBED",
        version: 1,
        scope: "QUEST_BOARD",
      })
    );
    socket.receive(JSON.stringify({ ...invalidation, extra: true }));
    socket.receive(
      JSON.stringify({
        ...invalidation,
        questId: "not-a-uuid",
      })
    );
    socket.receive(JSON.stringify(invalidation));

    expect(onSubscribed).toHaveBeenCalledTimes(1);
    expect(onInvalidated).toHaveBeenCalledTimes(1);
    expect(onInvalidated).toHaveBeenCalledWith(invalidation);
    expect(socket.send).not.toHaveBeenCalled();

    stop();
    expect(socket.close).toHaveBeenCalledTimes(1);
  });

  it("resyncs after each accepted Quest Board handshake on reconnect", () => {
    jest.useFakeTimers();
    const onInvalidated = jest.fn();
    const onSubscribed = jest.fn();
    const stop = subscribeToQuestBoardEvents(onInvalidated, onSubscribed);
    const firstSocket = MockWebSocket.instances[0];
    if (!firstSocket) throw new Error("Expected an initial Board event socket");

    firstSocket.receive(
      JSON.stringify({
        type: "SUBSCRIBED",
        version: 1,
        scope: "QUEST_BOARD",
      })
    );
    firstSocket.disconnect();
    jest.advanceTimersByTime(1_000);

    const secondSocket = MockWebSocket.instances[1];
    if (!secondSocket) throw new Error("Expected a reconnected Board socket");
    secondSocket.receive(
      JSON.stringify({
        type: "QUEST_BOARD_INVALIDATED",
        version: 1,
        questId: "00000000-0000-4000-8000-000000000001",
      })
    );
    expect(onInvalidated).not.toHaveBeenCalled();

    secondSocket.receive(
      JSON.stringify({
        type: "SUBSCRIBED",
        version: 1,
        scope: "QUEST_BOARD",
      })
    );
    secondSocket.receive(
      JSON.stringify({
        type: "QUEST_BOARD_INVALIDATED",
        version: 1,
        questId: "00000000-0000-4000-8000-000000000001",
      })
    );

    expect(onSubscribed).toHaveBeenCalledTimes(2);
    expect(onInvalidated).toHaveBeenCalledTimes(1);
    stop();
  });
  it("subscribes to owned Quest updates on hirer-quests/events", () => {
    const onQuestUpdated = jest.fn();
    const onSubscribed = jest.fn();
    const stop = subscribeToHirerQuestEvents(onQuestUpdated, onSubscribed);
    const socket = MockWebSocket.instances[0];

    expect(socket?.url).toBe(
      "wss://api.example.com/api/v2/me/hirer-quests/events"
    );
    expect(socket?.options).toEqual({
      headers: {
        Cookie: "better-auth.session_token=session",
        Origin: "kuquestmobile://",
      },
    });

    const update = {
      type: "HIRER_QUEST_UPDATED",
      version: 1,
      questId: "00000000-0000-4000-8000-000000000001",
      changeType: "QUEST_STARTED",
    };

    socket?.receive(JSON.stringify(update));
    expect(onQuestUpdated).not.toHaveBeenCalled();

    socket?.receive(
      JSON.stringify({
        type: "SUBSCRIBED",
        version: 1,
      })
    );
    socket?.receive(JSON.stringify(update));

    expect(onSubscribed).toHaveBeenCalledTimes(1);
    expect(onQuestUpdated).toHaveBeenCalledTimes(1);
    expect(onQuestUpdated).toHaveBeenCalledWith(update);

    stop();
    expect(socket?.close).toHaveBeenCalledTimes(1);
  });
  it("accepts decision-window expiry and rejects unknown hirer event fields", () => {
    const onQuestUpdated = jest.fn();
    const stop = subscribeToHirerQuestEvents(onQuestUpdated);
    const socket = MockWebSocket.instances[0];
    if (!socket) throw new Error("Expected a hirer event socket");
    socket.receive(JSON.stringify({ type: "SUBSCRIBED", version: 1 }));

    const pending = {
      type: "HIRER_QUEST_UPDATED",
      version: 1,
      questId: "00000000-0000-4000-8000-000000000001",
      changeType: "UNDERFILLED_DECISION_PENDING",
      expiresAt: "2026-10-02T04:10:00.000Z",
    };
    socket.receive(JSON.stringify(pending));
    expect(onQuestUpdated).toHaveBeenLastCalledWith(pending);

    socket.receive(
      JSON.stringify({
        ...pending,
        unexpected: true,
      })
    );
    expect(onQuestUpdated).toHaveBeenCalledTimes(1);

    const started = { ...pending, changeType: "QUEST_STARTED" };
    delete (started as Partial<typeof started>).expiresAt;
    socket.receive(JSON.stringify(started));
    expect(onQuestUpdated).toHaveBeenLastCalledWith(started);
    stop();
  });
  it("shares hirer updates and closes the socket after the last unsubscribe", () => {
    const firstUpdate = jest.fn();
    const firstSubscribed = jest.fn();
    const stopFirst = subscribeToHirerQuestEvents(firstUpdate, firstSubscribed);
    const socket = MockWebSocket.instances[0];
    if (!socket) throw new Error("Expected a hirer event socket");
    socket.receive(JSON.stringify({ type: "SUBSCRIBED", version: 1 }));

    const lateUpdate = jest.fn();
    const lateSubscribed = jest.fn();
    const stopLate = subscribeToHirerQuestEvents(lateUpdate, lateSubscribed);

    expect(MockWebSocket.instances).toHaveLength(1);
    expect(lateSubscribed).toHaveBeenCalledTimes(1);
    socket.receive(
      JSON.stringify({
        type: "HIRER_QUEST_UPDATED",
        version: 1,
        questId: "00000000-0000-4000-8000-000000000001",
        changeType: "QUEST_STARTED",
      })
    );
    expect(firstUpdate).toHaveBeenCalledTimes(1);
    expect(lateUpdate).toHaveBeenCalledTimes(1);

    stopFirst();
    expect(socket.close).not.toHaveBeenCalled();
    stopLate();
    expect(socket.close).toHaveBeenCalledTimes(1);
    stopLate();
    expect(socket.close).toHaveBeenCalledTimes(1);
  });

  it("notifies hirer listeners after each accepted handshake on reconnect", () => {
    jest.useFakeTimers();
    const onSubscribed = jest.fn();
    const stop = subscribeToHirerQuestEvents(jest.fn(), onSubscribed);
    const firstSocket = MockWebSocket.instances[0];
    if (!firstSocket) throw new Error("Expected an initial hirer event socket");
    firstSocket.receive(JSON.stringify({ type: "SUBSCRIBED", version: 1 }));
    firstSocket.disconnect();
    jest.advanceTimersByTime(1_000);

    const secondSocket = MockWebSocket.instances[1];
    if (!secondSocket)
      throw new Error("Expected a reconnected hirer event socket");
    secondSocket.receive(JSON.stringify({ type: "SUBSCRIBED", version: 1 }));

    expect(onSubscribed).toHaveBeenCalledTimes(2);
    stop();
    expect(secondSocket.close).toHaveBeenCalledTimes(1);
  });

  it("opens a fresh hirer socket after a terminal close and keeps listeners", () => {
    const firstUpdate = jest.fn();
    const stopFirst = subscribeToHirerQuestEvents(firstUpdate);
    const firstSocket = MockWebSocket.instances[0];
    if (!firstSocket) throw new Error("Expected an initial hirer event socket");
    firstSocket.disconnect(4403, "Origin not allowed");

    const nextUpdate = jest.fn();
    const stopNext = subscribeToHirerQuestEvents(nextUpdate);
    const nextSocket = MockWebSocket.instances[1];
    if (!nextSocket) throw new Error("Expected a fresh hirer event socket");

    nextSocket.receive(JSON.stringify({ type: "SUBSCRIBED", version: 1 }));
    const update = {
      type: "HIRER_QUEST_UPDATED",
      version: 1,
      questId: "00000000-0000-4000-8000-000000000001",
      changeType: "QUEST_STARTED",
    };
    nextSocket.receive(JSON.stringify(update));

    expect(firstUpdate).toHaveBeenCalledWith(update);
    expect(nextUpdate).toHaveBeenCalledWith(update);
    stopFirst();
    expect(nextSocket.close).not.toHaveBeenCalled();
    stopNext();
    expect(nextSocket.close).toHaveBeenCalledTimes(1);
  });
});
