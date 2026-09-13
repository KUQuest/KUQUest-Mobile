import { ApiClient, ApiError } from "../ApiClient";

function response(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => JSON.stringify(body),
  } as Response;
}

function rawResponse(body: string, status: number): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => body,
  } as Response;
}

describe("ApiClient transport", () => {
  test("injects the Better Auth cookie without overriding a caller Cookie", async () => {
    const fetchMock = jest.fn().mockResolvedValue(response({ success: true }));
    const client = new ApiClient({
      baseUrl: "https://api.example.test",
      fetchImpl: fetchMock as unknown as typeof fetch,
      cookieProvider: () => "better-auth.session_token=stored-cookie",
    });

    await client.request("/api/v1/profile");
    await client.request("/api/v1/profile", {
      headers: { Cookie: "better-auth.session_token=caller-cookie" },
    });

    const storedRequest = fetchMock.mock.calls[0][1] as RequestInit;
    const callerRequest = fetchMock.mock.calls[1][1] as RequestInit;
    expect(storedRequest.credentials).toBe("omit");
    expect(storedRequest.headers).toEqual(
      expect.objectContaining({
        Cookie: "better-auth.session_token=stored-cookie",
      })
    );
    expect(callerRequest.headers).toEqual(
      expect.objectContaining({
        Cookie: "better-auth.session_token=caller-cookie",
      })
    );
    expect(callerRequest.headers).not.toEqual(
      expect.objectContaining({
        Authorization: expect.anything(),
      })
    );
  });

  test("uses JSON headers for JSON bodies and leaves FormData boundaries to fetch", async () => {
    const fetchMock = jest.fn().mockResolvedValue(response({ success: true }));
    const client = new ApiClient({
      baseUrl: "https://api.example.test",
      fetchImpl: fetchMock as unknown as typeof fetch,
      cookieProvider: () => "",
    });

    await client.requestJson(
      "/api/v1/profile",
      { bio: "Updated" },
      {
        method: "PATCH",
        headers: { "Idempotency-Key": "profile-1" },
      }
    );
    const formData = new FormData();
    formData.append("file", "avatar");
    await client.requestForm("/api/v1/profile/avatar", formData, {
      method: "POST",
    });

    const jsonRequest = fetchMock.mock.calls[0][1] as RequestInit;
    const formRequest = fetchMock.mock.calls[1][1] as RequestInit;
    expect(jsonRequest.headers).toEqual(
      expect.objectContaining({
        "Content-Type": "application/json",
        "Idempotency-Key": "profile-1",
      })
    );
    expect(jsonRequest.body).toBe(JSON.stringify({ bio: "Updated" }));
    expect(formRequest.body).toBe(formData);
    expect(formRequest.headers).not.toEqual(
      expect.objectContaining({ "Content-Type": expect.anything() })
    );
  });

  test("maps nested and flat non-success responses to typed errors", async () => {
    const fetchMock = jest
      .fn()
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
      );
    const client = new ApiClient({
      baseUrl: "https://api.example.test",
      fetchImpl: fetchMock as unknown as typeof fetch,
      cookieProvider: () => "",
    });

    await expect(client.request("/api/v1/profile")).rejects.toEqual(
      new ApiError(409, "PROFILE_CONFLICT", "Profile changed")
    );
    await expect(client.request("/api/v1/profile")).rejects.toEqual(
      new ApiError(401, "UNAUTHORIZED", "No session")
    );
  });

  test("normalizes relative URLs while preserving absolute URLs", async () => {
    const fetchMock = jest.fn().mockResolvedValue(response({ success: true }));
    const client = new ApiClient({
      baseUrl: "https://api.example.test/",
      fetchImpl: fetchMock as unknown as typeof fetch,
      cookieProvider: () => "",
    });

    await client.request("api/v1/profile");
    await client.request("https://other.example.test/api/v1/profile");

    expect(fetchMock.mock.calls[0][0]).toBe(
      "https://api.example.test/api/v1/profile"
    );
    expect(fetchMock.mock.calls[1][0]).toBe(
      "https://other.example.test/api/v1/profile"
    );
  });

  test("treats a 204 response as an empty successful result", async () => {
    const fetchMock = jest.fn().mockResolvedValue(response(undefined, 204));
    const client = new ApiClient({
      baseUrl: "https://api.example.test",
      fetchImpl: fetchMock as unknown as typeof fetch,
      cookieProvider: () => "",
    });

    await expect(client.request("/api/v1/profile")).resolves.toBeUndefined();
  });

  test("uses raw non-JSON error text in the typed error envelope", async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValue(rawResponse("upstream unavailable", 502));
    const client = new ApiClient({
      baseUrl: "https://api.example.test",
      fetchImpl: fetchMock as unknown as typeof fetch,
      cookieProvider: () => "",
    });

    await expect(client.request("/api/v1/profile")).rejects.toEqual(
      new ApiError(502, "HTTP_502", "upstream unavailable")
    );
  });
});
