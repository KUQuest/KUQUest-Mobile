import { getChatRouteParams } from "../chatData";

describe("chat route params", () => {
  it("keeps capabilities off the chat route", () => {
    const params = getChatRouteParams({
      conversationId: "conversation-server-a",
      viewerId: "worker-1",
    });

    expect(params).toEqual({
      id: "conversation-server-a",
      conversationId: "conversation-server-a",
      viewerId: "worker-1",
    });
  });
});
