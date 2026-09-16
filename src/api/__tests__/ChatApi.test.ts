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
});
