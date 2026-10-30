import { ApiClient } from "../ApiClient";
import { NotificationApi } from "../NotificationApi";

function respond(body: unknown, status = 200) {
  return {
    ok: status < 400,
    status,
    headers: new Headers({ "content-type": "application/json" }),
    text: async () => JSON.stringify(body),
  };
}

describe("NotificationApi", () => {
  let fetchMock: jest.Mock;
  let api: NotificationApi;

  beforeEach(() => {
    fetchMock = jest.fn();
    api = new NotificationApi(
      new ApiClient({
        baseUrl: "https://api.example.test",
        fetchImpl: fetchMock as unknown as typeof fetch,
        cookieProvider: () => "better-auth.session_token=test-token",
      })
    );
  });

  it("lists a page with the cursor and keeps an unknown type as a row", async () => {
    fetchMock.mockResolvedValue(
      respond({
        success: true,
        data: {
          items: [
            {
              id: "n-1",
              type: "PENALTY_BAN_APPLIED",
              createdAt: "2026-10-30T10:00:00Z",
              readAt: null,
              questId: null,
              result: "TEMPORARY_BAN",
              expiresAt: "2026-11-06T10:00:00Z",
            },
            {
              id: "n-2",
              type: "QUEST_ASSIGNED",
              createdAt: "2026-10-29T10:00:00Z",
              readAt: "2026-10-29T11:00:00Z",
              questId: "q-1",
              result: null,
              expiresAt: null,
            },
          ],
          nextCursor: "next",
        },
      })
    );

    const page = await api.listNotifications({
      cursor: "abc",
      limit: 20,
      unreadOnly: true,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.test/api/v1/notifications?limit=20&cursor=abc&unreadOnly=true",
      expect.objectContaining({ method: "GET" })
    );
    expect(page.items.map((item) => item.type)).toEqual([
      "PENALTY_BAN_APPLIED",
      "QUEST_ASSIGNED",
    ]);
    expect(page.nextCursor).toBe("next");
  });

  it("reads the unread count", async () => {
    fetchMock.mockResolvedValue(respond({ success: true, data: { count: 3 } }));
    await expect(api.countUnread()).resolves.toBe(3);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.test/api/v1/notifications/unread-count",
      expect.anything()
    );
  });

  it("marks ids or all as read and accepts the data-less success body", async () => {
    fetchMock.mockResolvedValue(respond({ success: true }));
    await api.markRead({ ids: ["n-1"] });
    await api.markRead({ all: true });
    const bodies = fetchMock.mock.calls.map(([, init]) =>
      JSON.parse(init.body as string)
    );
    expect(bodies).toEqual([{ ids: ["n-1"] }, { all: true }]);
    expect(fetchMock.mock.calls[0][0]).toBe(
      "https://api.example.test/api/v1/notifications/read"
    );
  });
});
