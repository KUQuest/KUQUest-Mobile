import type {
  ServerChatConversation,
  ServerChatMessage,
} from "../../../api/ChatApi";
import {
  ConversationModule,
  type ConversationTransport,
} from "../conversationModule";

function makeServerConversation(
  overrides: Partial<ServerChatConversation> = {}
): ServerChatConversation {
  return {
    id: "conv-1",
    type: "CONVERSATION_WORK",
    quest: {
      id: "quest-1",
      title: "Campus Survey Crew",
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
    ...overrides,
  };
}

function makeServerMessage(
  overrides: Partial<ServerChatMessage> = {}
): ServerChatMessage {
  return {
    id: "msg-1",
    conversationId: "conv-1",
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

function makeFakeTransport({
  conversations = [],
  messages = [],
  sentMessage = makeServerMessage(),
}: {
  conversations?: ServerChatConversation[];
  messages?: ServerChatMessage[];
  sentMessage?: ServerChatMessage;
} = {}): ConversationTransport {
  return {
    async listConversations() {
      return { items: conversations, nextCursor: null };
    },
    async getMessages() {
      return { items: messages, nextCursor: null, hasMore: false };
    },
    async sendMessage() {
      return sentMessage;
    },
  };
}

describe("conversationModule", () => {
  it("maps a server conversation payload to the domain shape the screens render", async () => {
    const conversationModule = new ConversationModule(
      makeFakeTransport({ conversations: [makeServerConversation()] })
    );

    const conversations = await conversationModule.listConversations("user-1");

    expect(conversations).toHaveLength(1);
    expect(conversations[0]).toMatchObject({
      id: "conv-1",
      questId: "quest-1",
      status: "QUEST_IN_PROGRESS",
      questTitle: { en: "Campus Survey Crew", th: "Campus Survey Crew" },
      participantName: "Campus Survey Crew",
      participantRole: "member",
      initials: "CA",
      avatarColor: "#208AEF",
      latestMessage: { en: "Hello from staging", th: "Hello from staging" },
      unreadCount: 2,
      messages: [],
    });
    expect(conversations[0].capability).toEqual({
      conversationId: "conv-1",
      canRead: true,
      canWrite: true,
      readOnly: false,
    });
    expect(conversations[0].latestTime).toMatch(/^\d{2}:\d{2}$/);
  });

  it("maps server message payloads, marking the viewer's own messages", async () => {
    const conversationModule = new ConversationModule(
      makeFakeTransport({
        conversations: [makeServerConversation()],
        messages: [
          makeServerMessage({
            id: "msg-mine",
            sender: { id: "user-1", displayName: "Somchai" },
          }),
          makeServerMessage({
            id: "msg-other",
            sender: { id: "user-2", displayName: "Suda" },
            text: "Second message",
          }),
        ],
      })
    );

    const loaded = await conversationModule.loadConversation(
      "conv-1",
      "user-1"
    );

    expect(loaded.conversation).not.toBeNull();
    expect(loaded.messages).toEqual([
      {
        id: "msg-mine",
        sender: "me",
        text: { en: "First message", th: "First message" },
        time: expect.stringMatching(/^\d{2}:\d{2}$/),
      },
      {
        id: "msg-other",
        sender: "other",
        text: { en: "Second message", th: "Second message" },
        time: expect.stringMatching(/^\d{2}:\d{2}$/),
      },
    ]);
  });

  it("maps the server response of a sent message for the composer append", async () => {
    const conversationModule = new ConversationModule(
      makeFakeTransport({
        sentMessage: makeServerMessage({
          id: "msg-new",
          text: "New message",
          sender: { id: "user-1", displayName: "Somchai" },
        }),
      })
    );

    const message = await conversationModule.sendMessage(
      "conv-1",
      "New message",
      "user-1"
    );

    expect(message).toEqual({
      id: "msg-new",
      sender: "me",
      text: { en: "New message", th: "New message" },
      time: expect.stringMatching(/^\d{2}:\d{2}$/),
    });
  });

  it("derives canPost true for a member of a writable conversation", async () => {
    const conversationModule = new ConversationModule(
      makeFakeTransport({ conversations: [makeServerConversation()] })
    );

    const loaded = await conversationModule.loadConversation(
      "conv-1",
      "user-1"
    );

    expect(loaded.conversation?.capability?.canWrite).toBe(true);
    expect(loaded.canPost).toBe(true);
  });

  it("derives canPost false when the conversation is read-only", async () => {
    const conversationModule = new ConversationModule(
      makeFakeTransport({
        conversations: [makeServerConversation({ readOnly: true })],
      })
    );

    const loaded = await conversationModule.loadConversation(
      "conv-1",
      "user-1"
    );

    expect(loaded.conversation?.capability?.readOnly).toBe(true);
    expect(loaded.canPost).toBe(false);
  });

  it("derives canPost false for a viewer who is not a member", async () => {
    const conversationModule = new ConversationModule(
      makeFakeTransport({
        conversations: [makeServerConversation({ id: "other-conv" })],
      })
    );

    const loaded = await conversationModule.loadConversation(
      "conv-1",
      "user-1"
    );

    expect(loaded.conversation).toBeNull();
    expect(loaded.messages).toEqual([]);
    expect(loaded.canPost).toBe(false);
  });
});
