import {
  serverMessageToChatMessage,
  type ServerChatAttachment,
  type ServerChatMessage,
} from "@/api/ChatApi";
import type { ChatAttachment, ChatMessage } from "./chatTypes";

/** Canonical Adapter for pure conversation-message and attachment projections. */
export type RenderAttachment = ChatAttachment & {
  id: string;
  mediaType?: string;
  width?: number;
  height?: number;
};

export type DisplayChatMessage = ChatMessage & {
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
    attachments,
    ...(attachments[0] ? { attachment: attachments[0] } : {}),
  };
}
