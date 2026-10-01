import { ApiClient, ApiError } from "../ApiClient";
import { PushApi } from "../PushApi";

function response(status: number, payload: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers({ "content-type": "application/json" }),
    text: async () => JSON.stringify(payload),
  };
}

describe("PushApi", () => {
  const deviceId = "5f0c7f58-3f7e-4f63-9d0b-0a4c3c1f7a11";
  let fetchMock: jest.Mock;
  let api: PushApi;

  beforeEach(() => {
    fetchMock = jest.fn();
    api = new PushApi(
      new ApiClient({
        baseUrl: "https://api.example.test",
        fetchImpl: (input, init) => fetchMock(input, init),
        cookieProvider: () => "session=secret",
      })
    );
  });

  it("registers raw FCM token and returns validated device id", async () => {
    fetchMock.mockResolvedValue(
      response(201, { success: true, data: { device: { id: deviceId } } })
    );
    await expect(api.registerDevice("fcm-token")).resolves.toBe(deviceId);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.test/api/v1/push/devices",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ token: "fcm-token" }),
        credentials: "omit",
      })
    );
  });

  it("rejects malformed success data and propagates server failures", async () => {
    fetchMock.mockResolvedValueOnce(
      response(201, { success: true, data: { device: { id: "bad" } } })
    );
    await expect(api.registerDevice("fcm-token")).rejects.toThrow();
    fetchMock.mockResolvedValueOnce(
      response(503, {
        success: false,
        error: { code: "SERVICE_UNAVAILABLE", message: "Unavailable" },
      })
    );
    await expect(api.registerDevice("fcm-token")).rejects.toBeInstanceOf(
      ApiError
    );
  });

  it("deletes device using encoded path id", async () => {
    fetchMock.mockResolvedValue(response(200, { success: true, data: {} }));
    await api.unregisterDevice(deviceId);
    expect(fetchMock).toHaveBeenCalledWith(
      `https://api.example.test/api/v1/push/devices/${deviceId}`,
      expect.objectContaining({ method: "DELETE", credentials: "omit" })
    );
  });
});
