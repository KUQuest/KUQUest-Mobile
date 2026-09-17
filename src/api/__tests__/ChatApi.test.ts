jest.mock("expo-file-system", () => ({
  File: class MockFile extends Blob {
    readonly uri: string;

    constructor(uri: string) {
      super();
      this.uri = uri;
    }
  },
}));

import { ApiClient } from "../ApiClient";
import { ChatApi, serverConversationToChatConversation } from "../ChatApi";

describe("ChatApi", () => {
  let fetchMock: jest.Mock;
  let api: ChatApi;

  beforeEach(() => {
    fetchMock = jest.fn();
    const client = new ApiClient({
      baseUrl: "https://api.example.test",
      fetchImpl: fetchMock as unknown as typeof fetch,
      cookieProvider: () => "better-auth.session_token=test-token",
    });
    api = new ChatApi(client);
  });

  it("lists conversations and formats for UI consumption", async () => {
    const data = {
      success: true,
      data: {
        items: [
          {
            id: "conv-1",
            type: "CONVERSATION_WORK",
            quest: {
              id: "quest-1",
              title: "Simple staging Quest",
              status: "QUEST_IN_PROGRESS",
            },
            latestMessage: {
              id: "msg-1",
              kind: "USER",
              preview: "Hello from staging",
              createdAt: "2026-09-15T12:00:00Z",
            },
            lastActivityAt: "2026-09-15T12:00:00Z",
            archived: false,
            readOnly: false,
            unreadCount: 2,
          },
        ],
        nextCursor: null,
      },
    };

    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ "content-type": "application/json" }),
      text: async () => JSON.stringify(data),
    });

    const result = await api.listConversations();
    expect(result.items).toHaveLength(1);
    expect(result.items[0].quest.title).toBe("Simple staging Quest");

    const formatted = serverConversationToChatConversation(result.items[0]);
    expect(formatted.id).toBe("conv-1");
    expect(formatted.questTitle.en).toBe("Simple staging Quest");
    expect(formatted.unreadCount).toBe(2);
    expect(formatted.capability?.canWrite).toBe(true);
  });

  it("starts the conversation and message requests together", async () => {
    const conversationData = {
      success: true,
      data: {
        items: [
          {
            id: "conv-1",
            type: "CONVERSATION_WORK",
            quest: {
              id: "quest-1",
              title: "Simple staging Quest",
              status: "QUEST_IN_PROGRESS",
            },
            latestMessage: null,
            lastActivityAt: null,
            archived: false,
            readOnly: false,
            unreadCount: 0,
          },
        ],
        nextCursor: null,
      },
    };
    const messageData = {
      success: true,
      data: {
        items: [],
        nextCursor: null,
        hasMore: false,
      },
    };
    const conversationsGate = Promise.withResolvers<unknown>();
    const response = (data: unknown) => ({
      ok: true,
      status: 200,
      headers: new Headers({ "content-type": "application/json" }),
      text: async () => JSON.stringify(data),
    });

    fetchMock.mockImplementation((url: string) => {
      if (url.includes("/messages")) {
        return Promise.resolve(response(messageData));
      }
      return conversationsGate.promise;
    });

    const pending = api.loadConversation("conv-1");
    await Promise.resolve();

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual(
      expect.arrayContaining([
        "https://api.example.test/api/v1/chat/conversations?limit=20",
        "https://api.example.test/api/v1/chat/conversations/conv-1/messages?limit=50",
      ])
    );

    conversationsGate.resolve(response(conversationData));

    await expect(pending).resolves.toMatchObject({
      conversation: { id: "conv-1" },
      messages: { items: [] },
    });
  });

  it("sends a message to the conversation endpoint", async () => {
    const data = {
      success: true,
      data: {
        message: {
          id: "msg-new",
          conversationId: "conv-1",
          sequence: 5,
          kind: "USER",
          sender: {
            id: "user-1",
            displayName: "Me",
          },
          text: "New message",
          attachments: [],
          systemType: null,
          createdAt: "2026-09-15T12:05:00Z",
        },
      },
    };

    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ "content-type": "application/json" }),
      text: async () => JSON.stringify(data),
    });

    const message = await api.sendMessage(
      "conv-1",
      "New message",
      "client-id-1"
    );
    expect(message.id).toBe("msg-new");
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.test/api/v1/chat/conversations/conv-1/messages",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          clientMessageId: "client-id-1",
          text: "New message",
        }),
      })
    );
  });
  it("sends Work Chat attachment payloads and parses attachment responses", async () => {
    const attachment = {
      id: "attachment-1",
      fileName: "brief.pdf",
      mediaType: "application/pdf",
      sizeBytes: 256,
      createdAt: "2026-09-15T12:00:00Z",
    };
    const message = {
      id: "msg-with-file",
      conversationId: "conv-1",
      sequence: 6,
      kind: "USER",
      sender: { id: "user-1", displayName: "Me" },
      text: "See the brief",
      attachments: [attachment],
      systemType: null,
      createdAt: "2026-09-15T12:05:00Z",
    };
    fetchMock.mockImplementation((url: string, init?: RequestInit) => {
      if (url.endsWith("/attachments") && init?.method === "POST") {
        return Promise.resolve({
          ok: true,
          status: 200,
          headers: new Headers({ "content-type": "application/json" }),
          text: async () =>
            JSON.stringify({ success: true, data: { attachment } }),
        });
      }
      if (url.endsWith("/link")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          headers: new Headers({ "content-type": "application/json" }),
          text: async () =>
            JSON.stringify({
              success: true,
              data: {
                attachmentId: "attachment-1",
                url: "https://example.test/brief.pdf",
                expiresAt: "2026-09-16T12:00:00Z",
              },
            }),
        });
      }
      if (init?.method === "DELETE") {
        return Promise.resolve({
          ok: true,
          status: 200,
          headers: new Headers({ "content-type": "application/json" }),
          text: async () =>
            JSON.stringify({
              success: true,
              data: { attachmentId: "attachment-1" },
            }),
        });
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        headers: new Headers({ "content-type": "application/json" }),
        text: async () => JSON.stringify({ success: true, data: { message } }),
      });
    });

    await expect(
      api.sendMessage("conv-1", "See the brief", "client-msg-2", [
        "attachment-1",
      ])
    ).resolves.toEqual(message);
    await expect(
      api.uploadAttachment("conv-1", {
        uri: "file:///tmp/brief.pdf",
        name: "brief.pdf",
        type: "application/pdf",
      })
    ).resolves.toEqual(attachment);
    const uploadInit = fetchMock.mock.calls[1][1] as RequestInit;
    expect(uploadInit.method).toBe("POST");
    expect((uploadInit.body as FormData).get("file")).toEqual(expect.any(Blob));
    await expect(
      api.getAttachmentLink("conv-1", "attachment-1")
    ).resolves.toEqual({
      attachmentId: "attachment-1",
      url: "https://example.test/brief.pdf",
      expiresAt: "2026-09-16T12:00:00Z",
    });
    await expect(
      api.deleteAttachment("conv-1", "attachment-1")
    ).resolves.toEqual({
      attachmentId: "attachment-1",
    });

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "https://api.example.test/api/v1/chat/conversations/conv-1/messages",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          clientMessageId: "client-msg-2",
          text: "See the brief",
          attachmentIds: ["attachment-1"],
        }),
      })
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "https://api.example.test/api/v1/chat/conversations/conv-1/attachments",
      expect.objectContaining({ method: "POST" })
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      "https://api.example.test/api/v1/chat/conversations/conv-1/attachments/attachment-1/link",
      expect.objectContaining({ method: "GET" })
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      4,
      "https://api.example.test/api/v1/chat/conversations/conv-1/attachments/attachment-1",
      expect.objectContaining({ method: "DELETE" })
    );
  });

  it("keeps Candidate Inquiry transport on its dedicated routes", async () => {
    const inquiry = {
      id: "inquiry-1",
      type: "CONVERSATION_CANDIDATE_INQUIRY",
      state: "INQUIRY_OPEN",
      quest: { id: "quest-1", title: "Design quest", status: "QUEST_OPEN" },
      participants: [
        { id: "hirer-1", role: "HIRER", displayName: "Hirer" },
        {
          id: "candidate-1",
          role: "PROSPECTIVE_WORKER",
          displayName: "Candidate",
        },
      ],
      latestMessage: null,
      lastActivityAt: null,
      unreadCount: 0,
    };
    const message = {
      id: "inquiry-msg-1",
      conversationId: "inquiry-1",
      sequence: 1,
      kind: "USER",
      sender: { id: "candidate-1", displayName: "Candidate" },
      text: "Can I ask about the schedule?",
      attachments: [],
      systemType: null,
      createdAt: "2026-09-15T12:00:00Z",
    };
    const response = (data: unknown) => ({
      ok: true,
      status: 200,
      headers: new Headers({ "content-type": "application/json" }),
      text: async () => JSON.stringify(data),
    });
    fetchMock.mockImplementation((url: string, init?: RequestInit) => {
      if (url.endsWith("/candidate-inquiries") && init?.method === "POST") {
        return Promise.resolve(response({ success: true, data: { inquiry } }));
      }
      if (url.includes("/candidate-inquiries?") && init?.method === "GET") {
        return Promise.resolve(
          response({
            success: true,
            data: { items: [inquiry], nextCursor: null },
          })
        );
      }
      if (url.endsWith("/messages") && init?.method === "POST") {
        return Promise.resolve(response({ success: true, data: { message } }));
      }
      if (url.includes("/messages")) {
        return Promise.resolve(
          response({
            success: true,
            data: { items: [message], nextCursor: null, hasMore: false },
          })
        );
      }
      if (url.endsWith("/read")) {
        return Promise.resolve(
          response({
            success: true,
            data: { conversationId: "inquiry-1", messageId: "inquiry-msg-1" },
          })
        );
      }
      return Promise.resolve(response({ success: true, data: { inquiry } }));
    });

    await expect(api.createCandidateInquiry("quest-1")).resolves.toEqual(
      inquiry
    );
    await expect(
      api.listCandidateInquiries({ limit: 10, cursor: "cursor-1" })
    ).resolves.toEqual({ items: [inquiry], nextCursor: null });
    await expect(api.getCandidateInquiry("inquiry-1")).resolves.toEqual(
      inquiry
    );
    await expect(
      api.getCandidateInquiryMessages("inquiry-1", {
        limit: 25,
        before: "msg-old",
      })
    ).resolves.toEqual({ items: [message], nextCursor: null, hasMore: false });
    await expect(
      api.sendCandidateInquiryMessage(
        "inquiry-1",
        "Can I ask about the schedule?",
        "inquiry-client-1",
        ["attachment-1"]
      )
    ).resolves.toEqual(message);
    await expect(
      api.markCandidateInquiryRead("inquiry-1", "inquiry-msg-1")
    ).resolves.toEqual({
      conversationId: "inquiry-1",
      messageId: "inquiry-msg-1",
    });

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "https://api.example.test/api/v1/chat/candidate-inquiries",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ questId: "quest-1" }),
      })
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "https://api.example.test/api/v1/chat/candidate-inquiries?limit=10&cursor=cursor-1",
      expect.objectContaining({ method: "GET" })
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      4,
      "https://api.example.test/api/v1/chat/candidate-inquiries/inquiry-1/messages?limit=25&before=msg-old",
      expect.objectContaining({ method: "GET" })
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      5,
      "https://api.example.test/api/v1/chat/candidate-inquiries/inquiry-1/messages",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          clientMessageId: "inquiry-client-1",
          text: "Can I ask about the schedule?",
          attachmentIds: ["attachment-1"],
        }),
      })
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      6,
      "https://api.example.test/api/v1/chat/candidate-inquiries/inquiry-1/read",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ messageId: "inquiry-msg-1" }),
      })
    );
    expect(
      fetchMock.mock.calls.every(
        ([url]) => !url.includes("/chat/conversations")
      )
    ).toBe(true);
  });
});
