import { ApiClient } from "../ApiClient";
import { TagApi } from "../TagApi";

describe("TagApi", () => {
  it("parses paginated live tags response correctly", async () => {
    const data = {
      success: true,
      data: {
        items: [
          { id: "tag-1", name: "Content" },
          { id: "tag-2", name: "Frontend" },
        ],
        nextCursor: "cursor-2",
      },
    };
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ "content-type": "application/json" }),
      text: async () => JSON.stringify(data),
    });

    const client = new ApiClient({
      baseUrl: "https://api.example.test",
      fetchImpl: fetchMock as unknown as typeof fetch,
      cookieProvider: () => "",
    });

    const api = new TagApi(client);
    const page = await api.listTags({
      q: "front end",
      limit: 10,
      cursor: "cursor-1",
    });

    expect(page).toEqual(data.data);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.test/api/v1/tags?q=front+end&limit=10&cursor=cursor-1",
      expect.objectContaining({ method: "GET" })
    );
  });
});
