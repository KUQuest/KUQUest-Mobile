import type { ServerChatMessage } from "../../../api/ChatApi";
import {
  isReportableMessage,
  toDisplayMessage,
  type DisplayChatMessage,
} from "../domain/conversationModule";

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
      sequence: 1,
      attachments: [],
      kind: "USER",
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

  describe("isReportableMessage", () => {
    const validOtherMessage: DisplayChatMessage = {
      id: "a1b2c3d4-e5f6-4789-a012-3456789abcde",
      sender: "other",
      text: { en: "Hello", th: "สวัสดี" },
      createdAt: "2026-09-26T10:00:00Z",
      attachments: [],
      kind: "USER",
    };

    it("allows reporting a visible message sent by another participant", () => {
      expect(isReportableMessage(validOtherMessage)).toBe(true);
    });

    it("disallows reporting own messages", () => {
      expect(isReportableMessage({ ...validOtherMessage, sender: "me" })).toBe(
        false
      );
    });

    it("disallows reporting system messages", () => {
      expect(
        isReportableMessage({ ...validOtherMessage, kind: "SYSTEM" })
      ).toBe(false);
    });

    it("disallows reporting pending or temporary messages", () => {
      expect(isReportableMessage({ ...validOtherMessage, pending: true })).toBe(
        false
      );
      expect(
        isReportableMessage({ ...validOtherMessage, id: "temp-12345" })
      ).toBe(false);
      expect(
        isReportableMessage({ ...validOtherMessage, id: "pending-client-1" })
      ).toBe(false);
    });

    it("disallows reporting hidden messages", () => {
      expect(isReportableMessage({ ...validOtherMessage, hidden: true })).toBe(
        false
      );
    });

    it("disallows reporting messages with missing or empty id", () => {
      expect(isReportableMessage(null)).toBe(false);
      expect(isReportableMessage(undefined)).toBe(false);
      expect(isReportableMessage({ ...validOtherMessage, id: "" })).toBe(false);
      expect(isReportableMessage({ ...validOtherMessage, id: "   " })).toBe(
        false
      );
    });
  });
});
