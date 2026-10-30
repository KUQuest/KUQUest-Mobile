import { useCallback, useEffect, useRef, useState } from "react";
import { z } from "zod";

import { ApiError } from "@/api/ApiClient";
import { openServerSocket, type ServerSocket } from "@/api/ServerSocket";
import {
  chatApi,
  chatMessageSchema,
  type ServerChatMessage,
} from "@/api/ChatApi";
import { ConversationMode } from "../chatTypes";
export const ChatSocketEventType = {
  WORK_CONVERSATION_MESSAGE: "WORK_CONVERSATION_MESSAGE",
  CANDIDATE_INQUIRY_MESSAGE: "CANDIDATE_INQUIRY_MESSAGE",
  MESSAGE_ACCEPTED: "MESSAGE_ACCEPTED",
  MESSAGE_REJECTED: "MESSAGE_REJECTED",
  SEND_MESSAGE: "SEND_MESSAGE",
} as const;

const clientMessageIdSchema = z
  .string()
  .min(1)
  .max(128)
  .refine((value) => value.trim().length > 0);

const messageTextSchema = z
  .string()
  .min(1)
  .max(1000)
  .refine((value) => value.trim().length > 0);

const attachmentIdsSchema = z
  .array(z.string().uuid())
  .refine((ids) => new Set(ids).size === ids.length);

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
    clientMessageId: clientMessageIdSchema,
    message: chatMessageSchema,
  }),
  z.object({
    type: z.literal(ChatSocketEventType.MESSAGE_REJECTED),
    clientMessageId: clientMessageIdSchema.nullable(),
    error: z.object({
      code: z.string().min(1),
      message: z.string().min(1),
    }),
  }),
]);

export type ChatSocketEvent = z.infer<typeof chatSocketEventSchema>;

export type ChatSocketStatus =
  "idle" | "connecting" | "connected" | "reconnecting" | "unavailable";

export type ConversationType = ConversationMode;

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

const MESSAGE_ACK_TIMEOUT_MS = 15_000;

// MESSAGE_REJECTED carries only a code, so mirror the REST status the Work
// Chat and Candidate Inquiry controllers send for the same code; any other
// code is a 409 business-rule conflict there too.
const REJECTION_STATUS_BY_CODE: Partial<Record<string, number>> = {
  CONVERSATION_NOT_FOUND: 404,
  INQUIRY_NOT_AVAILABLE: 404,
  ATTACHMENT_NOT_FOUND: 404,
  MESSAGE_CONTENT_REQUIRED: 400,
  MESSAGE_TOO_LONG: 400,
  ATTACHMENT_IDS_DUPLICATE: 400,
  RATE_LIMITED: 429,
};

function messageRejectionError(error: {
  code: string;
  message: string;
}): ApiError {
  return new ApiError(
    REJECTION_STATUS_BY_CODE[error.code] ?? 409,
    error.code,
    error.message
  );
}
const sendMessageCommandSchema = z
  .object({
    type: z.literal(ChatSocketEventType.SEND_MESSAGE),
    clientMessageId: clientMessageIdSchema,
    text: messageTextSchema.optional(),
    attachmentIds: attachmentIdsSchema.optional(),
  })
  .strict()
  .refine((command) => Boolean(command.text || command.attachmentIds?.length));
export function useChatSocket({
  conversationId,
  conversationType,
  enabled,
  onEvent,
}: UseChatSocketOptions): UseChatSocketResult {
  const [status, setStatus] = useState<ChatSocketStatus>("idle");
  const [reconnectAttempt, setReconnectAttempt] = useState(0);
  const onEventRef = useRef(onEvent);
  const socketRef = useRef<ServerSocket | null>(null);
  const pendingMessagesRef = useRef(new Map<string, PendingMessage>());

  const sendMessage = useCallback((message: ChatSocketSendMessage) => {
    const { clientMessageId } = message;
    const socket = socketRef.current;
    if (!socket) {
      return Promise.reject(new Error("Chat connection is not ready."));
    }
    if (pendingMessagesRef.current.has(clientMessageId)) {
      return Promise.reject(new Error("This message is already pending."));
    }

    const command = sendMessageCommandSchema.safeParse({
      type: ChatSocketEventType.SEND_MESSAGE,
      clientMessageId,
      ...(typeof message.text === "string" && message.text.trim()
        ? { text: message.text }
        : message.text === undefined || typeof message.text === "string"
          ? {}
          : { text: message.text }),
      ...(message.attachmentIds === undefined
        ? {}
        : { attachmentIds: message.attachmentIds }),
    });
    if (!command.success) {
      return Promise.reject(
        new Error(command.error.issues[0]?.message ?? "Invalid chat message.")
      );
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
        socket.send(command.data);
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
    if (!enabled || !conversationId) {
      setStatus("idle");
      setReconnectAttempt(0);
      return;
    }

    const rejectPendingMessages = (error: Error) => {
      for (const pending of pendingMessagesRef.current.values()) {
        clearTimeout(pending.timeout);
        pending.reject(error);
      }
      pendingMessagesRef.current.clear();
    };

    setStatus("connecting");
    const socket = openServerSocket(
      conversationType === ConversationMode.CANDIDATE_INQUIRY
        ? chatApi.getCandidateInquiryEventsPath(conversationId)
        : chatApi.getWorkConversationEventsPath(conversationId),
      {
        onOpen: () => {
          socketRef.current = socket;
          setReconnectAttempt(0);
          setStatus("connected");
        },
        onFrame: (payload) => {
          const parsed = chatSocketEventSchema.safeParse(payload);
          if (!parsed.success) return;
          const event = parsed.data;
          if (
            (event.type === ChatSocketEventType.MESSAGE_ACCEPTED ||
              event.type === ChatSocketEventType.MESSAGE_REJECTED) &&
            event.clientMessageId !== null
          ) {
            const pending = pendingMessagesRef.current.get(
              event.clientMessageId
            );
            if (pending) {
              clearTimeout(pending.timeout);
              pendingMessagesRef.current.delete(event.clientMessageId);
              if (event.type === ChatSocketEventType.MESSAGE_ACCEPTED) {
                pending.resolve(event.message);
              } else {
                // The send's own error handling reports this rejection.
                pending.reject(messageRejectionError(event.error));
                return;
              }
            }
          }
          onEventRef.current(event);
        },
        onClose: ({ reason, terminal, attempt }) => {
          socketRef.current = null;
          rejectPendingMessages(
            new Error(reason || "Chat connection closed before confirmation.")
          );
          setReconnectAttempt(attempt);
          setStatus(terminal ? "unavailable" : "reconnecting");
        },
      }
    );

    return () => {
      socket.close();
      socketRef.current = null;
      rejectPendingMessages(
        new Error("Chat connection closed before confirmation.")
      );
    };
  }, [conversationId, conversationType, enabled]);
  /* eslint-enable react-hooks/set-state-in-effect */

  return { status, reconnectAttempt, sendMessage };
}
