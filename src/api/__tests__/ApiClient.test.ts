import { z, ZodError } from "zod";

import { ApiClient, ApiError } from "../ApiClient";

function response(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => JSON.stringify(body),
  };
}

function rawResponse(body: string, status: number) {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => body,
  };
}

function setup(cookie = "", baseUrl = "https://api.example.test") {
  const fetchMock = jest
    .fn()
    .mockResolvedValue(response({ success: true, data: null }));
  const fetchImpl: typeof fetch = (input, init) => fetchMock(input, init);
  const client = new ApiClient({
    baseUrl,
    fetchImpl,
    cookieProvider: () => cookie,
  });
  const requestAt = (index: number) => ({
    url: fetchMock.mock.calls[index][0] as string,
    init: fetchMock.mock.calls[index][1] as RequestInit & {
      headers: Record<string, string>;
    },
  });
  return { client, fetchMock, requestAt };
}

describe("ApiClient", () => {
  test("returns the validated data of the success envelope", async () => {
    const { client, fetchMock } = setup();
    fetchMock.mockResolvedValue(
      response({ success: true, data: { id: "q-1", reward: "150" } })
    );

    const data = await client.get(
      "/api/v2/quests/q-1",
      z.object({ id: z.string(), reward: z.coerce.number() })
    );

    expect(data).toEqual({ id: "q-1", reward: 150 });
  });

  test.each([
    ["a body without the success flag", { data: { id: "q-1" } }],
    ["data of the wrong shape", { success: true, data: { id: 1 } }],
  ])("rejects %s as a contract error", async (_case, body) => {
    const { client, fetchMock } = setup();
    fetchMock.mockResolvedValue(response(body));

    await expect(
      client.get("/api/v2/quests/q-1", z.object({ id: z.string() }))
    ).rejects.toBeInstanceOf(ZodError);
  });

  test("drops empty query values but keeps zero and false", async () => {
    const { client, requestAt } = setup();

    await client.get("/api/v2/quests", z.unknown(), {
      query: {
        q: "",
        tagId: undefined,
        cursor: null,
        limit: 0,
        proofRequired: false,
      },
    });
    await client.get("/api/v2/quests?mode=FCFS", z.unknown(), {
      query: { limit: 20 },
    });
    await client.get("/api/v2/quests", z.unknown(), { query: { q: "" } });

    expect(requestAt(0).url).toBe(
      "https://api.example.test/api/v2/quests?limit=0&proofRequired=false"
    );
    expect(requestAt(1).url).toBe(
      "https://api.example.test/api/v2/quests?mode=FCFS&limit=20"
    );
    expect(requestAt(2).url).toBe("https://api.example.test/api/v2/quests");
  });

  test("sends one idempotency-key header with caller headers", async () => {
    const { client, requestAt } = setup();

    await client.send("PATCH", "/api/v2/quests/q-1", z.unknown(), {
      json: { title: "New" },
      idempotencyKey: "edit-1",
      headers: { "If-Match": "3" },
    });

    const { headers, body, method } = requestAt(0).init;
    expect(method).toBe("PATCH");
    expect(body).toBe(JSON.stringify({ title: "New" }));
    const keyHeaders = Object.keys(headers).filter(
      (name) => name.toLowerCase() === "idempotency-key"
    );
    expect(keyHeaders).toEqual(["idempotency-key"]);
    expect(headers["idempotency-key"]).toBe("edit-1");
    expect(headers["If-Match"]).toBe("3");
  });

  test.each([
    ["blank", "   "],
    ["longer than 200 characters", "k".repeat(201)],
  ])("rejects a %s idempotency key before sending", async (_case, key) => {
    const { client, fetchMock } = setup();

    await expect(
      client.send("POST", "/api/v2/quests", z.unknown(), {
        json: {},
        idempotencyKey: key,
      })
    ).rejects.toThrow("Idempotency keys");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test("labels JSON bodies and leaves multipart boundaries to fetch", async () => {
    const { client, requestAt } = setup();
    const formData = new FormData();
    formData.append("file", "avatar");

    await client.send("PATCH", "/api/v1/profile", z.unknown(), {
      json: { bio: "Updated" },
    });
    await client.send("POST", "/api/v1/profile/avatar", z.unknown(), {
      form: formData,
    });
    await client.send("POST", "/api/v1/quests/q-1/disputes", z.unknown());

    expect(requestAt(0).init.headers["Content-Type"]).toBe("application/json");
    expect(requestAt(1).init.body).toBe(formData);
    expect(requestAt(1).init.headers["Content-Type"]).toBeUndefined();
    expect(requestAt(2).init.body).toBeUndefined();
  });

  test("injects the session cookie without overriding a caller Cookie", async () => {
    const { client, requestAt } = setup(
      "better-auth.session_token=stored-cookie"
    );

    await client.get("/api/v1/profile", z.unknown());
    await client.get("/api/v1/profile", z.unknown(), {
      headers: { Cookie: "better-auth.session_token=caller-cookie" },
    });

    expect(requestAt(0).init.credentials).toBe("omit");
    expect(requestAt(0).init.headers.Cookie).toBe(
      "better-auth.session_token=stored-cookie"
    );
    expect(requestAt(1).init.headers.Cookie).toBe(
      "better-auth.session_token=caller-cookie"
    );
    expect(requestAt(1).init.headers.Authorization).toBeUndefined();
  });

  test("maps nested, flat, and non-JSON failures to ApiError", async () => {
    const { client, fetchMock } = setup();
    fetchMock
      .mockResolvedValueOnce(
        response(
          {
            success: false,
            error: { code: "PROFILE_CONFLICT", message: "Profile changed" },
          },
          409
        )
      )
      .mockResolvedValueOnce(
        response({ code: "UNAUTHORIZED", message: "No session" }, 401)
      )
      .mockResolvedValueOnce(rawResponse("upstream unavailable", 502));

    await expect(client.get("/api/v1/profile", z.unknown())).rejects.toEqual(
      new ApiError(409, "PROFILE_CONFLICT", "Profile changed")
    );
    await expect(client.get("/api/v1/profile", z.unknown())).rejects.toEqual(
      new ApiError(401, "UNAUTHORIZED", "No session")
    );
    await expect(client.get("/api/v1/profile", z.unknown())).rejects.toEqual(
      new ApiError(502, "HTTP_502", "upstream unavailable")
    );
  });

  test("joins relative paths to the base URL and keeps absolute URLs", async () => {
    const { client, requestAt } = setup("", "https://api.example.test/");

    await client.get("api/v1/profile", z.unknown());
    await client.get("https://other.example.test/api/v1/profile", z.unknown());

    expect(requestAt(0).url).toBe("https://api.example.test/api/v1/profile");
    expect(requestAt(1).url).toBe("https://other.example.test/api/v1/profile");
  });
});
