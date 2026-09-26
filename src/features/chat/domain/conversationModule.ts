import {
  serverMessageToChatMessage,
  type ServerChatAttachment,
  type ServerChatMessage,
} from "@/api/ChatApi";
import type { ChatAttachment, ChatMessage } from "../chatTypes";

/** Canonical Adapter for pure conversation-message and attachment projections. */
export type RenderAttachment = ChatAttachment & {
  id: string;
  mediaType?: string;
  width?: number;
  height?: number;
};

export type DisplayChatMessage = ChatMessage & {
  sequence?: number;
  attachment?: RenderAttachment;
  attachments: RenderAttachment[];
};

const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".heic"];

function isImageAttachmentMetadata(attachment: {
  mediaType?: string;
  fileName?: string;
}): boolean {
  if (attachment.mediaType?.toLowerCase().startsWith("image/")) return true;
  const fileName = attachment.fileName?.toLowerCase() ?? "";
  return IMAGE_EXTENSIONS.some((extension) => fileName.endsWith(extension));
}

function attachmentToRenderAttachment(
  attachment: ServerChatAttachment
): RenderAttachment {
  const isImage = isImageAttachmentMetadata(attachment);
  return {
    id: attachment.id,
    name: attachment.fileName,
    mediaType: attachment.mediaType,
    width: attachment.width,
    height: attachment.height,
    meta:
      attachment.sizeBytes >= 1024 * 1024
        ? `${(attachment.sizeBytes / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.max(1, Math.round(attachment.sizeBytes / 1024))} KB`,
    kind: isImage
      ? "image"
      : attachment.mediaType === "application/pdf"
        ? "pdf"
        : "file",
  };
}

export function toDisplayMessage(
  message: ServerChatMessage,
  viewerId: string
): DisplayChatMessage {
  const converted = serverMessageToChatMessage(message, viewerId);
  const attachments = message.attachments.map(attachmentToRenderAttachment);
  const { attachment: _legacyAttachment, ...convertedWithoutAttachment } =
    converted;
  return {
    ...convertedWithoutAttachment,
    sequence: message.sequence,
    attachments,
    ...(attachments[0] ? { attachment: attachments[0] } : {}),
  };
}
export function mergeDisplayMessages(
  current: DisplayChatMessage[],
  incoming: DisplayChatMessage[]
): DisplayChatMessage[] {
  const messagesById = new Map<string, DisplayChatMessage>();
  for (const message of current) messagesById.set(message.id, message);
  for (const message of incoming) messagesById.set(message.id, message);

  return [...messagesById.values()].sort((left, right) => {
    if (left.sequence !== undefined && right.sequence !== undefined) {
      return left.sequence - right.sequence;
    }
    if (left.sequence !== undefined) return -1;
    if (right.sequence !== undefined) return 1;
    return Date.parse(left.createdAt) - Date.parse(right.createdAt);
  });
}

export function isReportableMessage(
  message: DisplayChatMessage | null | undefined
): boolean {
  if (!message) return false;
  if (message.sender === "me") return false;
  if (message.kind === "SYSTEM") return false;
  if (Boolean(message.pending)) return false;
  if (Boolean(message.hidden)) return false;
  if (message.id.startsWith("temp-") || message.id.startsWith("pending-")) {
    return false;
  }
  return Boolean(message.id && message.id.trim().length > 0);
}
