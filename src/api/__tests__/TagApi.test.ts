import { ApiClient } from "../ApiClient";
import { TagApi } from "../TagApi";

describe("TagApi", () => {
  it("parses live tags response correctly", async () => {
    const data = {
      success: true,
      data: [
        { id: "tag-1", name: "Content" },
        { id: "tag-2", name: "Frontend" },
      ],
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
    const tags = await api.listTags();

    expect(tags).toEqual([
      { id: "tag-1", name: "Content" },
      { id: "tag-2", name: "Frontend" },
    ]);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.test/api/v1/tags",
      expect.objectContaining({ method: "GET" })
    );
  });
});
