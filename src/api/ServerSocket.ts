import { debugLog } from "./debugLog";
import { authClient } from "@/features/auth/authClient";

export interface ServerSocketClose {
  /** `null` when no socket was opened: API URL or session cookie is missing. */
  code: number | null;
  reason: string;
  /** `true` when no reconnect follows. */
  terminal: boolean;
  /** Number of the next reconnect attempt; `0` when terminal. */
  attempt: number;
}

export interface ServerSocketHandlers {
  /** Called on every successful (re)connection. */
  onOpen?(): void;
  /** Called with each JSON text frame; malformed or binary frames are dropped. */
  onFrame(payload: unknown): void;
  onClose?(close: ServerSocketClose): void;
}

export interface ServerSocket {
  /** Throws when the socket is not open. */
  send(frame: unknown): void;
  /** Idempotent; stops reconnecting. */
  close(): void;
}

type NativeWebSocketConstructor = new (
  url: string,
  protocols: string[],
  options: { headers: Record<string, string> }
) => WebSocket;

const MAX_RECONNECT_DELAY_MS = 15_000;
// Client message (1008), session expiry (4401), denied Origin or access (4403).
const TERMINAL_CLOSE_CODES = [1008, 4401, 4403];
// React Native otherwise sends the API host as Origin, which Quest event
// endpoints reject with 4403. The server allows the app scheme (app.json).
const APP_ORIGIN = "kuquestmobile://";

function toWebSocketUrl(
  apiBaseUrl: string,
  path: string,
  traceId?: string
): string {
  const socketBaseUrl = apiBaseUrl
    .trim()
    .replace(/\/+$/, "")
    .replace(/^https:/i, "wss:")
    .replace(/^http:/i, "ws:");
  const normalizedPath = path.replace(/^\/+/, "");
  const base = `${socketBaseUrl}/${normalizedPath}`;
  if (!traceId || base.includes("traceId=")) return base;
  const separator = base.includes("?") ? "&" : "?";
  return `${base}${separator}traceId=${encodeURIComponent(traceId)}`;
}

function reconnectDelayMs(attempt: number): number {
  return Math.min(
    1_000 * 2 ** Math.max(0, attempt - 1),
    MAX_RECONNECT_DELAY_MS
  );
}

/**
 * Opens an authenticated, auto-reconnecting API WebSocket. The session cookie
 * is read on every connection attempt. The server replays nothing, so callers
 * must resync REST state after `onOpen` or their channel handshake.
 */
export function openServerSocket(
  path: string,
  handlers: ServerSocketHandlers,
  options?: { traceId?: string }
): ServerSocket {
  const NativeWebSocket: NativeWebSocketConstructor = WebSocket;
  const apiBaseUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
  let active = true;
  let socket: WebSocket | null = null;
  let reconnectTimer: number | null = null;
  let attempt = 0;

  const stop = (code: number | null, reason: string) => {
    active = false;
    debugLog("socket", `close ${path}`, {
      code,
      reason,
      terminal: true,
      attempt: 0,
    });
    handlers.onClose?.({ code, reason, terminal: true, attempt: 0 });
  };

  const scheduleReconnect = (code: number | null, reason: string) => {
    attempt += 1;
    debugLog("socket", `close ${path}`, {
      code,
      reason,
      terminal: false,
      attempt,
    });
    handlers.onClose?.({ code, reason, terminal: false, attempt });
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null;
      connect();
    }, reconnectDelayMs(attempt));
  };

  const connect = () => {
    if (!active) return;
    const sessionCookie = authClient.getCookie().trim();
    if (!apiBaseUrl || !sessionCookie) {
      const reason = apiBaseUrl ? "missing session cookie" : "missing API URL";
      debugLog("socket", `not started ${path}`, { reason });
      stop(null, apiBaseUrl ? "Missing session." : "Missing API URL.");
      return;
    }

    let currentSocket: WebSocket;
    try {
      currentSocket = new NativeWebSocket(
        toWebSocketUrl(apiBaseUrl, path, options?.traceId),
        [],
        { headers: { Cookie: sessionCookie, Origin: APP_ORIGIN } }
      );
    } catch (error) {
      scheduleReconnect(
        null,
        error instanceof Error ? error.message : "Connection failed."
      );
      return;
    }
    socket = currentSocket;

    currentSocket.onopen = () => {
      if (!active || socket !== currentSocket) return;
      attempt = 0;
      debugLog("socket", `open ${path}`);
      handlers.onOpen?.();
    };
    currentSocket.onmessage = (message) => {
      if (!active || socket !== currentSocket) return;
      if (typeof message.data !== "string") return;
      let payload: unknown;
      try {
        payload = JSON.parse(message.data);
      } catch {
        return;
      }
      handlers.onFrame(payload);
    };
    currentSocket.onclose = (event) => {
      if (!active || socket !== currentSocket) return;
      socket = null;
      if (TERMINAL_CLOSE_CODES.includes(event.code)) {
        stop(event.code, event.reason);
        return;
      }
      scheduleReconnect(event.code, event.reason);
    };
  };

  connect();

  return {
    send(frame) {
      if (!socket || socket.readyState !== WebSocket.OPEN) {
        throw new Error("Connection is not ready.");
      }
      socket.send(JSON.stringify(frame));
    },
    close() {
      active = false;
      if (reconnectTimer !== null) clearTimeout(reconnectTimer);
      reconnectTimer = null;
      socket?.close();
      socket = null;
    },
  };
}
