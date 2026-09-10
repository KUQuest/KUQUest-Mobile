import { ApiClient } from "../../ApiClient";
import { TagApi, resetTagApiCache } from "../TagApi";

function response(body: unknown): Response {
  return {
    ok: true,
    status: 200,
    text: async () => JSON.stringify(body),
  } as Response;
}

describe("TagApi", () => {
  beforeEach(() => resetTagApiCache());

  test("parses the authenticated tag catalog response", async () => {
    const fetchMock = jest.fn().mockResolvedValue(response({
      success: true,
      data: [{
        id: "58818dc3-6dad-424f-8dfd-d20b6747aeb3",
        name: "Design",
      }],
    }));
    const api = new TagApi(new ApiClient({
      baseUrl: "https://api.example.test",
      fetchImpl: fetchMock as unknown as typeof fetch,
      cookieProvider: () => "better-auth.session_token=session-cookie",
    }));

    await expect(api.listTags()).resolves.toEqual([{
      id: "58818dc3-6dad-424f-8dfd-d20b6747aeb3",
      name: "Design",
    }]);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.test/api/v1/tags",
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({
          Cookie: "better-auth.session_token=session-cookie",
        }),
      }),
    );
  });

  test("caches the catalog for the app session", async () => {
    const fetchMock = jest.fn().mockResolvedValue(response({
      success: true,
      data: [{
        id: "58818dc3-6dad-424f-8dfd-d20b6747aeb3",
        name: "Design",
      }],
    }));
    const api = new TagApi(new ApiClient({
      baseUrl: "https://api.example.test",
      fetchImpl: fetchMock as unknown as typeof fetch,
    }));

    await api.listTags();
    await api.listTags();

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
