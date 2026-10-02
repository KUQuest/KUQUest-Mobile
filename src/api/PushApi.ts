import { z } from "zod";
import { ApiClient } from "./ApiClient";

const registerDeviceDataSchema = z.object({
  device: z.object({ id: z.string().uuid() }),
});

export class PushApi {
  constructor(private readonly client: ApiClient = new ApiClient()) {}

  async registerDevice(token: string): Promise<string> {
    const result = await this.client.send(
      "POST",
      "/api/v1/push/devices",
      registerDeviceDataSchema,
      { json: { token } }
    );
    return result.device.id;
  }

  async unregisterDevice(deviceId: string): Promise<void> {
    await this.client.send(
      "DELETE",
      `/api/v1/push/devices/${encodeURIComponent(deviceId)}`,
      z.unknown()
    );
  }
}

export const pushApi = new PushApi();
