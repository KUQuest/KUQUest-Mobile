import { ApiClient, ApiError } from "../ApiClient";
import { DisputeApi } from "../DisputeApi";

function jsonResponse(status: number, payload: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers({ "content-type": "application/json" }),
    text: async () => JSON.stringify(payload),
  };
}

describe("DisputeApi", () => {
  let fetchMock: jest.Mock;
  let api: DisputeApi;

  beforeEach(() => {
    fetchMock = jest.fn();
    const fetchImpl: typeof fetch = (input, init) => fetchMock(input, init);
    const client = new ApiClient({
      baseUrl: "https://api.example.test",
      fetchImpl,
      cookieProvider: () => "better-auth.session_token=test-token",
    });
    api = new DisputeApi(client);
  });

  it("files without a request body and reads the Dispute Case from data", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(200, {
        success: true,
        data: {
          id: "5f0c7f58-3f7e-4f63-9d0b-0a4c3c1f7a11",
          displayId: "DC-000123",
          questId: "quest-101",
          filerUserId: "student-1",
          openedByAdminId: null,
          status: "DISPUTE_CASE_PENDING",
          version: 1,
          resolvedWorkerId: null,
          resolvedAmountSatang: null,
          resolvedByAdminId: null,
          resolvedAt: null,
          createdAt: "2026-09-17T15:30:00Z",
          updatedAt: "2026-09-17T15:30:00Z",
        },
      })
    );

    const result = await api.fileDispute("quest-101");

    expect(result).toMatchObject({
      displayId: "DC-000123",
      status: "DISPUTE_CASE_PENDING",
    });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(
      "https://api.example.test/api/v1/quests/quest-101/disputes"
    );
    expect(init).toMatchObject({ method: "POST" });
    expect(init.body).toBeUndefined();
  });

  it("rejects a response that does not carry the Dispute Case in data", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(200, { success: true, data: { dispute: { id: "x" } } })
    );

    await expect(api.fileDispute("quest-101")).rejects.toThrow();
  });

  it("surfaces the Server rejection when filing is no longer allowed", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(409, {
        success: false,
        error: {
          code: "DISPUTE_WINDOW_CLOSED",
          message: "The dispute filing window has closed",
        },
      })
    );

    const rejection = api.fileDispute("quest-101");

    await expect(rejection).rejects.toBeInstanceOf(ApiError);
    await expect(rejection).rejects.toMatchObject({
      status: 409,
      message: "The dispute filing window has closed",
    });
  });
});
