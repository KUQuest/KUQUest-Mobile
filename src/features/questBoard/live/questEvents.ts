import { z } from "zod";

import { toWebSocketUrl } from "@/api/ApiClient";
import { authClient } from "@/features/auth/authClient";

const questSubscribedEventSchema = z.object({
  type: z.literal("SUBSCRIBED"),
  version: z.literal(1),
  questId: z.string().min(1),
});

const questUpdatedEventSchema = z
  .object({
    type: z.literal("QUEST_UPDATED"),
    version: z.literal(1),
    questId: z.string().min(1),
    changeType: z.string().min(1),
    editRequestId: z.string().min(1).optional(),
  })
  .refine(
    (event) =>
      event.changeType !== "QUEST_EDIT_UPDATED" || Boolean(event.editRequestId)
  );

type QuestUpdatedEvent = z.infer<typeof questUpdatedEventSchema>;

const candidateRosterUpdatedEventSchema = z.object({
  type: z.literal("CANDIDATE_ROSTER_UPDATED"),
  version: z.literal(1).optional(),
  questId: z.string().min(1).optional(),
});

export type CandidateRosterUpdatedEvent = z.infer<
  typeof candidateRosterUpdatedEventSchema
>;

type NativeWebSocketConstructor = new (
  url: string,
  protocols: string[],
  options: { headers: Record<string, string> }
) => WebSocket;

const MAX_RECONNECT_DELAY_MS = 15_000;

function reconnectDelayMs(attempt: number): number {
  return Math.min(
    1_000 * 2 ** Math.max(0, attempt - 1),
    MAX_RECONNECT_DELAY_MS
  );
}

function subscribeToQuestEventStream<T extends { questId?: string }>(
  questId: string,
  eventsPath: string,
  updateSchema: z.ZodType<T>,
  onUpdate: (event: T) => void
): () => void {
  const apiBaseUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (!apiBaseUrl || !questId) return () => {};

  const eventsUrl = toWebSocketUrl(apiBaseUrl, eventsPath);
  const NativeWebSocket = WebSocket as unknown as NativeWebSocketConstructor;
  let active = true;
  let socket: WebSocket | null = null;
  let reconnectTimer: number | null = null;
  let attempt = 0;

  const clearReconnectTimer = () => {
    if (reconnectTimer !== null) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
  };

  const scheduleReconnect = () => {
    if (!active) return;
    attempt += 1;
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null;
      connect();
    }, reconnectDelayMs(attempt));
  };

  const connect = () => {
    if (!active) return;
    const sessionCookie = authClient.getCookie().trim();
    if (!sessionCookie) return;

    let currentSocket: WebSocket;
    try {
      currentSocket = new NativeWebSocket(eventsUrl, [], {
        headers: { Cookie: sessionCookie },
      });
    } catch {
      scheduleReconnect();
      return;
    }
    socket = currentSocket;
    let subscribed = false;

    currentSocket.onopen = () => {
      if (active && socket === currentSocket) attempt = 0;
    };
    currentSocket.onmessage = (message) => {
      if (!active || typeof message.data !== "string") return;
      let payload: unknown;
      try {
        payload = JSON.parse(message.data) as unknown;
      } catch {
        return;
      }

      const subscription = questSubscribedEventSchema.safeParse(payload);
      if (subscription.success) {
        subscribed = subscription.data.questId === questId;
        return;
      }
      if (!subscribed) return;

      const parsed = updateSchema.safeParse(payload);
      if (
        parsed.success &&
        (!parsed.data.questId || parsed.data.questId === questId)
      ) {
        onUpdate(parsed.data);
      }
    };
    currentSocket.onclose = (event) => {
      if (!active || socket !== currentSocket) return;
      socket = null;
      if (event.code === 1008 || event.code === 4403) {
        active = false;
        return;
      }
      scheduleReconnect();
    };
  };

  connect();

  return () => {
    active = false;
    clearReconnectTimer();
    socket?.close();
    socket = null;
  };
}

export function subscribeToQuestEvents(
  questId: string,
  onQuestUpdated: (event: QuestUpdatedEvent) => void
): () => void {
  return subscribeToQuestEventStream(
    questId,
    `/api/v2/quests/${encodeURIComponent(questId)}/events`,
    questUpdatedEventSchema,
    onQuestUpdated
  );
}

export function subscribeToCandidateRosterEvents(
  questId: string,
  onRosterUpdated: (event: CandidateRosterUpdatedEvent) => void
): () => void {
  return subscribeToQuestEventStream(
    questId,
    `/api/v2/quests/${encodeURIComponent(questId)}/candidate-roster/events`,
    candidateRosterUpdatedEventSchema,
    onRosterUpdated
  );
}
