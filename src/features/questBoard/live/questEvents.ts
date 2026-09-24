import { z } from "zod";

import { toWebSocketUrl } from "@/api/ApiClient";
import { authClient } from "@/features/auth/authClient";

const questChangeTypeSchema = z.enum([
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
]);

const questEventSchema = z.union([
  z.object({
    type: z.literal("SUBSCRIBED"),
    version: z.literal(1),
    questId: z.string().min(1),
  }),
  z
    .object({
      type: z.literal("QUEST_UPDATED"),
      version: z.literal(1),
      questId: z.string().min(1),
      changeType: questChangeTypeSchema,
      editRequestId: z.string().min(1).optional(),
    })
    .refine(
      (event) =>
        event.changeType !== "QUEST_EDIT_UPDATED" ||
        Boolean(event.editRequestId)
    ),
]);

type QuestUpdatedEvent = Extract<
  z.infer<typeof questEventSchema>,
  { type: "QUEST_UPDATED" }
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

export function subscribeToQuestEvents(
  questId: string,
  onQuestUpdated: (event: QuestUpdatedEvent) => void
): () => void {
  const apiBaseUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (!apiBaseUrl || !questId) return () => {};

  const eventsUrl = toWebSocketUrl(
    apiBaseUrl,
    `/api/v2/quests/${encodeURIComponent(questId)}/events`
  );
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
      const parsed = questEventSchema.safeParse(payload);
      if (
        parsed.success &&
        parsed.data.type === "QUEST_UPDATED" &&
        parsed.data.questId === questId
      ) {
        onQuestUpdated(parsed.data);
      }
    };
    currentSocket.onclose = () => {
      if (!active || socket !== currentSocket) return;
      socket = null;
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
