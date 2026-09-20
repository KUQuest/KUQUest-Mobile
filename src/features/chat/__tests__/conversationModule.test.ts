import type { ServerChatMessage } from "../../../api/ChatApi";
import { toDisplayMessage } from "../conversationModule";

function makeServerMessage(
  overrides: Partial<ServerChatMessage> = {}
): ServerChatMessage {
  return {
    id: "server-message-1",
    conversationId: "conversation-1",
    sequence: 1,
    kind: "USER",
    sender: { id: "user-1", displayName: "Somchai" },
    text: "First message",
    attachments: [],
    systemType: null,
    createdAt: "2026-09-15T12:05:00Z",
    ...overrides,
  };
}

describe("conversationModule Canonical Adapter", () => {
  it("normalizes a raw message into the active presentation shape", () => {
    expect(toDisplayMessage(makeServerMessage(), "user-1")).toEqual({
      id: "server-message-1",
      sender: "me",
      text: { en: "First message", th: "First message" },
      createdAt: "2026-09-15T12:05:00Z",
      attachments: [],
    });
  });

  it("preserves server message identifiers for optimistic and socket reconciliation", () => {
    const normalized = toDisplayMessage(
      makeServerMessage({
        id: "server-accepted-id",
        sender: { id: "user-2", displayName: "Suda" },
      }),
      "user-1"
    );

    expect(normalized.id).toBe("server-accepted-id");
    expect(normalized.sender).toBe("other");
  });

  it("normalizes attachment metadata, dimensions, and presentation kind", () => {
    const normalized = toDisplayMessage(
      makeServerMessage({
        attachments: [
          {
            id: "image-1",
            fileName: "brief.HEIC",
            mediaType: "application/octet-stream",
            sizeBytes: 1_572_864,
            width: 1200,
            height: 800,
            createdAt: "2026-09-15T12:05:00Z",
          },
          {
            id: "pdf-1",
            fileName: "brief.pdf",
            mediaType: "application/pdf",
            sizeBytes: 1536,
            createdAt: "2026-09-15T12:05:00Z",
          },
          {
            id: "file-1",
            fileName: "notes.txt",
            mediaType: "text/plain",
            sizeBytes: 1,
            createdAt: "2026-09-15T12:05:00Z",
          },
        ],
      }),
      "user-1"
    );

    expect(normalized.attachments).toEqual([
      {
        id: "image-1",
        name: "brief.HEIC",
        mediaType: "application/octet-stream",
        width: 1200,
        height: 800,
        meta: "1.5 MB",
        kind: "image",
      },
      {
        id: "pdf-1",
        name: "brief.pdf",
        mediaType: "application/pdf",
        width: undefined,
        height: undefined,
        meta: "2 KB",
        kind: "pdf",
      },
      {
        id: "file-1",
        name: "notes.txt",
        mediaType: "text/plain",
        width: undefined,
        height: undefined,
        meta: "1 KB",
        kind: "file",
      },
    ]);
    expect(normalized.attachment).toEqual(normalized.attachments[0]);
  });

  it("keeps optional text and attachment arrays usable for attachment-only messages", () => {
    const normalized = toDisplayMessage(
      makeServerMessage({
        text: null,
        attachments: [
          {
            id: "attachment-only",
            fileName: "photo.jpg",
            mediaType: "image/jpeg",
            sizeBytes: 2048,
            createdAt: "2026-09-15T12:05:00Z",
          },
        ],
      }),
      "user-1"
    );

    expect(normalized.text).toEqual({ en: "", th: "" });
    expect(normalized.attachments).toHaveLength(1);
    expect(normalized.attachments[0].kind).toBe("image");
  });
});
