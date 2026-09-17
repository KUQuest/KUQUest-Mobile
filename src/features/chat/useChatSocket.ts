import { useEffect, useRef, useState } from "react";
import { z } from "zod";

import { chatApi, chatMessageSchema } from "@/api/ChatApi";

const chatSocketEventSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("chat.message.created"),
    data: z.object({
      conversationId: z.string(),
      message: chatMessageSchema,
    }),
  }),
  z.object({
    type: z.literal("chat.read.updated"),
    data: z.object({
      conversationId: z.string(),
      userId: z.string(),
      lastReadMessageId: z.string(),
      readAt: z.string(),
    }),
  }),
  z.object({
    type: z.literal("quest.state.changed"),
    data: z.object({
      questId: z.string(),
      previousState: z.string(),
      newState: z.string(),
      timestamp: z.string(),
    }),
  }),
]);

export type ChatSocketEvent = z.infer<typeof chatSocketEventSchema>;

export type ChatSocketStatus =
  "idle" | "connecting" | "connected" | "reconnecting" | "unavailable";

type ConversationType = "WORK" | "CANDIDATE_INQUIRY";

interface UseChatSocketOptions {
  conversationId: string;
  conversationType: ConversationType;
  enabled: boolean;
  onEvent: (event: ChatSocketEvent) => void;
}

interface UseChatSocketResult {
  status: ChatSocketStatus;
  reconnectAttempt: number;
}

const MAX_RECONNECT_DELAY_MS = 15_000;

export function toWebSocketUrl(apiBaseUrl: string, path: string): string {
  const baseUrl = apiBaseUrl.trim().replace(/\/+$/, "");
  const socketBaseUrl = baseUrl
    .replace(/^https:/i, "wss:")
    .replace(/^http:/i, "ws:");
  return `${socketBaseUrl}/${path.replace(/^\/+/, "")}`;
}

function reconnectDelayMs(reconnectAttempt: number): number {
  return Math.min(
    1_000 * 2 ** Math.max(0, reconnectAttempt - 1),
    MAX_RECONNECT_DELAY_MS
  );
}

export function useChatSocket({
  conversationId,
  conversationType,
  enabled,
  onEvent,
}: UseChatSocketOptions): UseChatSocketResult {
  const [status, setStatus] = useState<ChatSocketStatus>("idle");
  const [reconnectAttempt, setReconnectAttempt] = useState(0);
  const onEventRef = useRef(onEvent);

  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);
  /* eslint-disable react-hooks/set-state-in-effect -- socket lifecycle updates status */
  useEffect(() => {
    const apiBaseUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
    if (!apiBaseUrl) {
      setStatus("unavailable");
      setReconnectAttempt(0);
      return;
    }

    if (!enabled || !conversationId) {
      setStatus("idle");
      setReconnectAttempt(0);
      return;
    }

    const eventsPath =
      conversationType === "CANDIDATE_INQUIRY"
        ? chatApi.getCandidateInquiryEventsPath(conversationId)
        : chatApi.getWorkConversationEventsPath(conversationId);
    const eventsUrl = toWebSocketUrl(apiBaseUrl, eventsPath);
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

    const connect = () => {
      if (!active) return;
      setStatus(attempt === 0 ? "connecting" : "reconnecting");
      socket = new WebSocket(eventsUrl);
      const currentSocket = socket;

      currentSocket.onopen = () => {
        if (!active || socket !== currentSocket) return;
        attempt = 0;
        setReconnectAttempt(0);
        setStatus("connected");
      };

      currentSocket.onmessage = (message) => {
        if (!active || typeof message.data !== "string") return;
        try {
          const event = chatSocketEventSchema.safeParse(
            JSON.parse(message.data) as unknown
          );
          if (event.success) onEventRef.current(event.data);
        } catch {
          // Ignore malformed server messages without disrupting the connection.
        }
      };

      currentSocket.onclose = () => {
        if (!active || socket !== currentSocket) return;
        socket = null;
        attempt += 1;
        setReconnectAttempt(attempt);
        setStatus("reconnecting");
        reconnectTimer = setTimeout(connect, reconnectDelayMs(attempt));
      };
    };

    connect();

    return () => {
      active = false;
      clearReconnectTimer();
      socket?.close();
    };
  }, [conversationId, conversationType, enabled]);
  /* eslint-enable react-hooks/set-state-in-effect */

  return { status, reconnectAttempt };
}
