import { useCallback, useEffect, useRef, useState } from "react";

import {
  chatApi,
  chatSocketCommandSchema,
  parseChatSocketMessage,
  type ChatSocketCommand,
  type ServerChatEvent,
  type ServerChatMessage,
} from "@/api/ChatApi";
import { authClient } from "@/features/auth/authClient";

export type ChatSocketEvent = ServerChatEvent;

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
  sendMessage: (command: ChatSocketCommand) => Promise<ServerChatMessage>;
}

interface NativeWebSocketOptions {
  headers?: Record<string, string>;
}

type NativeWebSocketConstructor = new (
  url: string,
  protocols?: string | string[],
  options?: NativeWebSocketOptions
) => WebSocket;

export class ChatSocketError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "ChatSocketError";
    this.code = code;
  }
}

const MAX_RECONNECT_DELAY_MS = 15_000;
const ACK_TIMEOUT_MS = 10_000;

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
  const socketRef = useRef<WebSocket | null>(null);
  const socketOpenRef = useRef(false);
  const activeRef = useRef(false);
  const pendingAcksRef = useRef(
    new Map<
      string,
      {
        resolve: (message: ServerChatMessage) => void;
        reject: (error: Error) => void;
        timeout: ReturnType<typeof setTimeout>;
      }
    >()
  );

  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);

  const sendMessage = useCallback(async (command: ChatSocketCommand) => {
    const parsedCommand = chatSocketCommandSchema.parse(command);
    const socket = socketRef.current;
    if (!activeRef.current || !socket || !socketOpenRef.current) {
      return Promise.reject(
        new ChatSocketError(
          "SOCKET_UNAVAILABLE",
          "Chat WebSocket is not connected."
        )
      );
    }

    return new Promise<ServerChatMessage>((resolve, reject) => {
      const timeout = setTimeout(() => {
        pendingAcksRef.current.delete(parsedCommand.clientMessageId);
        reject(
          new ChatSocketError(
            "ACK_TIMEOUT",
            "Chat WebSocket acknowledgement timed out."
          )
        );
      }, ACK_TIMEOUT_MS);
      pendingAcksRef.current.set(parsedCommand.clientMessageId, {
        resolve,
        reject,
        timeout,
      });
      try {
        socket.send(JSON.stringify(parsedCommand));
      } catch (error) {
        clearTimeout(timeout);
        pendingAcksRef.current.delete(parsedCommand.clientMessageId);
        reject(error instanceof Error ? error : new Error(String(error)));
      }
    });
  }, []);

  /* eslint-disable react-hooks/set-state-in-effect -- socket lifecycle updates status */
  useEffect(() => {
    const apiBaseUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
    if (!apiBaseUrl) {
      activeRef.current = false;
      socketRef.current = null;
      socketOpenRef.current = false;
      setStatus("unavailable");
      setReconnectAttempt(0);
      return;
    }

    if (!enabled || !conversationId) {
      activeRef.current = false;
      socketRef.current = null;
      socketOpenRef.current = false;
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
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let attempt = 0;
    activeRef.current = true;

    const rejectPendingAcks = (error: Error) => {
      for (const [clientMessageId, pending] of pendingAcksRef.current) {
        clearTimeout(pending.timeout);
        pendingAcksRef.current.delete(clientMessageId);
        pending.reject(error);
      }
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
      const cookie = authClient.getCookie();
      const WebSocketConstructor =
        globalThis.WebSocket as unknown as NativeWebSocketConstructor;
      socket = new WebSocketConstructor(
        eventsUrl,
        undefined,
        cookie ? { headers: { Cookie: cookie } } : undefined
      );
      socketRef.current = socket;
      socketOpenRef.current = false;
      const currentSocket = socket;

      currentSocket.onopen = () => {
        if (!active || socket !== currentSocket) return;
        attempt = 0;
        setReconnectAttempt(0);
        socketOpenRef.current = true;
        setStatus("connected");
      };

      currentSocket.onmessage = (message) => {
        if (!active || typeof message.data !== "string") return;
        try {
          const parsed = parseChatSocketMessage(
            JSON.parse(message.data) as unknown
          );
          if (
            parsed.type === "MESSAGE_ACCEPTED" ||
            parsed.type === "MESSAGE_REJECTED"
          ) {
            if (parsed.type === "MESSAGE_ACCEPTED") {
              const pending = pendingAcksRef.current.get(
                parsed.clientMessageId
              );
              if (!pending) return;
              clearTimeout(pending.timeout);
              pendingAcksRef.current.delete(parsed.clientMessageId);
              pending.resolve(parsed.message);
              return;
            }
            const error = new ChatSocketError(
              parsed.error.code,
              parsed.error.message
            );
            if (parsed.clientMessageId) {
              const pending = pendingAcksRef.current.get(
                parsed.clientMessageId
              );

              if (!pending) return;
              clearTimeout(pending.timeout);
              pendingAcksRef.current.delete(parsed.clientMessageId);
              pending.reject(error);
              return;
            }
            rejectPendingAcks(error);
            return;
          }
          onEventRef.current(parsed);
        } catch {
          // Ignore malformed server messages without disrupting the connection.
        }
      };
      currentSocket.onerror = () => {
        if (!active || socket !== currentSocket) return;
        socketOpenRef.current = false;
        rejectPendingAcks(
          new ChatSocketError(
            "SOCKET_ERROR",
            "Chat WebSocket connection failed."
          )
        );
      };

      currentSocket.onclose = () => {
        if (!active || socket !== currentSocket) return;
        socket = null;
        socketRef.current = null;
        socketOpenRef.current = false;
        rejectPendingAcks(
          new ChatSocketError(
            "SOCKET_CLOSED",
            "Chat WebSocket connection closed."
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
      activeRef.current = false;
      clearReconnectTimer();
      socketOpenRef.current = false;
      socketRef.current = null;
      rejectPendingAcks(
        new ChatSocketError(
          "SOCKET_UNAVAILABLE",
          "Chat WebSocket is no longer available."
        )
      );
      socket?.close();
    };
  }, [conversationId, conversationType, enabled]);
  /* eslint-enable react-hooks/set-state-in-effect */

  return { status, reconnectAttempt, sendMessage };
}
