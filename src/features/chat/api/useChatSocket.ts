import { useCallback, useEffect, useRef, useState } from "react";
import { z } from "zod";

import { toWebSocketUrl } from "@/api/ApiClient";
import { authClient } from "@/features/auth/authClient";
import {
  chatApi,
  chatMessageSchema,
  type ServerChatMessage,
} from "@/api/ChatApi";
export const ChatSocketEventType = {
  WORK_CONVERSATION_MESSAGE: "WORK_CONVERSATION_MESSAGE",
  CANDIDATE_INQUIRY_MESSAGE: "CANDIDATE_INQUIRY_MESSAGE",
  MESSAGE_ACCEPTED: "MESSAGE_ACCEPTED",
  MESSAGE_REJECTED: "MESSAGE_REJECTED",
  SEND_MESSAGE: "SEND_MESSAGE",
  CHAT_MESSAGE_CREATED: "chat.message.created",
  CHAT_READ_UPDATED: "chat.read.updated",
  QUEST_STATE_CHANGED: "quest.state.changed",
} as const;

const chatSocketEventSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal(ChatSocketEventType.WORK_CONVERSATION_MESSAGE),
    message: chatMessageSchema,
  }),
  z.object({
    type: z.literal(ChatSocketEventType.CANDIDATE_INQUIRY_MESSAGE),
    message: chatMessageSchema,
  }),
  z.object({
    type: z.literal(ChatSocketEventType.MESSAGE_ACCEPTED),
    clientMessageId: z.string().min(1),
    message: chatMessageSchema,
  }),
  z.object({
    type: z.literal(ChatSocketEventType.MESSAGE_REJECTED),
    clientMessageId: z.string().min(1),
    error: z.union([z.string(), z.record(z.string(), z.unknown())]),
  }),
  z.object({
    type: z.literal(ChatSocketEventType.CHAT_MESSAGE_CREATED),
    data: z.object({
      conversationId: z.string(),
      message: chatMessageSchema,
    }),
  }),
  z.object({
    type: z.literal(ChatSocketEventType.CHAT_READ_UPDATED),
    data: z.object({
      conversationId: z.string(),
      userId: z.string(),
      lastReadMessageId: z.string(),
      readAt: z.string(),
    }),
  }),
  z.object({
    type: z.literal(ChatSocketEventType.QUEST_STATE_CHANGED),
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

export interface ChatSocketSendMessage {
  clientMessageId: string;
  text?: string;
  attachmentIds?: string[];
}

interface PendingMessage {
  resolve(message: ServerChatMessage): void;
  reject(error: Error): void;
  timeout: number;
}

interface UseChatSocketOptions {
  conversationId: string;
  conversationType: ConversationType;
  enabled: boolean;
  onEvent: (event: ChatSocketEvent) => void;
}

export interface UseChatSocketResult {
  status: ChatSocketStatus;
  reconnectAttempt: number;
  sendMessage: (message: ChatSocketSendMessage) => Promise<ServerChatMessage>;
}

const MAX_RECONNECT_DELAY_MS = 15_000;
const MESSAGE_ACK_TIMEOUT_MS = 15_000;
type NativeWebSocketConstructor = new (
  url: string,
  protocols: string[],
  options: { headers: Record<string, string> }
) => WebSocket;

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
  const socketRef = useRef<WebSocket | null>(null);
  const pendingMessagesRef = useRef(new Map<string, PendingMessage>());

  const sendMessage = useCallback((message: ChatSocketSendMessage) => {
    const { clientMessageId } = message;
    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      return Promise.reject(new Error("Chat connection is not ready."));
    }
    if (pendingMessagesRef.current.has(clientMessageId)) {
      return Promise.reject(new Error("This message is already pending."));
    }

    return new Promise<ServerChatMessage>((resolve, reject) => {
      const timeout = setTimeout(() => {
        pendingMessagesRef.current.delete(clientMessageId);
        reject(new Error("The server did not confirm the message in time."));
      }, MESSAGE_ACK_TIMEOUT_MS);
      pendingMessagesRef.current.set(clientMessageId, {
        resolve,
        reject,
        timeout,
      });

      try {
        socket.send(
          JSON.stringify({
            type: ChatSocketEventType.SEND_MESSAGE,
            clientMessageId,
            ...(message.text?.trim() ? { text: message.text } : {}),
            ...(message.attachmentIds?.length
              ? { attachmentIds: message.attachmentIds }
              : {}),
          })
        );
      } catch (error) {
        clearTimeout(timeout);
        pendingMessagesRef.current.delete(clientMessageId);
        reject(
          error instanceof Error
            ? error
            : new Error("The message could not be sent.")
        );
      }
    });
  }, []);

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

    const sessionCookie = authClient.getCookie().trim();
    if (!sessionCookie) {
      setStatus("unavailable");
      setReconnectAttempt(0);
      return;
    }

    const eventsPath =
      conversationType === "CANDIDATE_INQUIRY"
        ? chatApi.getCandidateInquiryEventsPath(conversationId)
        : chatApi.getWorkConversationEventsPath(conversationId);
    const eventsUrl = toWebSocketUrl(apiBaseUrl, eventsPath);
    const NativeWebSocket = WebSocket as unknown as NativeWebSocketConstructor;
    let active = true;
    let socket: WebSocket | null = null;
    let reconnectTimer: number | null = null;
    let attempt = 0;

    const rejectPendingMessages = (error: Error) => {
      for (const pending of pendingMessagesRef.current.values()) {
        clearTimeout(pending.timeout);
        pending.reject(error);
      }
      pendingMessagesRef.current.clear();
    };

    const clearReconnectTimer = () => {
      if (reconnectTimer !== null) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
    };

    const connect = () => {
      if (!active) return;
      setStatus(attempt === 0 ? "connecting" : "reconnecting");
      socket = new NativeWebSocket(eventsUrl, [], {
        headers: { Cookie: sessionCookie },
      });
      const currentSocket = socket;

      currentSocket.onopen = () => {
        if (!active || socket !== currentSocket) return;
        socketRef.current = currentSocket;
        attempt = 0;
        setReconnectAttempt(0);
        setStatus("connected");
      };

      currentSocket.onmessage = (message) => {
        if (!active || typeof message.data !== "string") return;
        try {
          const parsed = chatSocketEventSchema.safeParse(
            JSON.parse(message.data) as unknown
          );
          if (!parsed.success) return;
          const event = parsed.data;
          if (event.type === ChatSocketEventType.MESSAGE_ACCEPTED) {
            const pending = pendingMessagesRef.current.get(
              event.clientMessageId
            );
            if (pending) {
              clearTimeout(pending.timeout);
              pendingMessagesRef.current.delete(event.clientMessageId);
              pending.resolve(event.message);
            }
          } else if (event.type === ChatSocketEventType.MESSAGE_REJECTED) {
            const pending = pendingMessagesRef.current.get(
              event.clientMessageId
            );
            if (pending) {
              clearTimeout(pending.timeout);
              pendingMessagesRef.current.delete(event.clientMessageId);
              const error = event.error;
              const messageText =
                typeof error === "string"
                  ? error
                  : error &&
                      typeof error === "object" &&
                      "message" in error &&
                      typeof error.message === "string"
                    ? error.message
                    : "The server rejected this message.";
              pending.reject(new Error(messageText));
            }
          }
          onEventRef.current(event);
        } catch {
          // Ignore malformed server messages without disrupting the connection.
        }
      };

      currentSocket.onerror = () => {
        if (active && socket === currentSocket) setStatus("reconnecting");
      };

      currentSocket.onclose = (event) => {
        if (!active || socket !== currentSocket) return;
        socket = null;
        socketRef.current = null;
        rejectPendingMessages(
          new Error(
            event.reason || "Chat connection closed before confirmation."
          )
        );
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
      socketRef.current = null;
      rejectPendingMessages(
        new Error("Chat connection closed before confirmation.")
      );
      socket?.close();
    };
  }, [conversationId, conversationType, enabled]);
  /* eslint-enable react-hooks/set-state-in-effect */

  return { status, reconnectAttempt, sendMessage };
}
