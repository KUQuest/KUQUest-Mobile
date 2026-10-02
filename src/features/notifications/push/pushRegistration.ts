import type { KeyValueStorage } from "@/infrastructure/storage/keyValueStorage";
import { secureStorage } from "@/infrastructure/storage/keyValueStorage";
import { pushApi } from "@/api/PushApi";

export const PUSH_DEVICE_ID_STORAGE_KEY = "kuquest_push_device_id";
const PUSH_PERMISSION_DENIED_KEY = "kuquest_push_permission_denied";

export interface PushRegistrationNative {
  createChannel(): Promise<void>;
  getPermission(): Promise<{ granted: boolean; canAskAgain?: boolean }>;
  requestPermission(): Promise<{ granted: boolean }>;
  getToken(): Promise<string>;
  addTokenListener(listener: (token: string) => void): { remove(): void };
}

export interface PushRegistrationApi {
  registerDevice(token: string): Promise<string>;
  unregisterDevice(deviceId: string): Promise<void>;
}

export class PushRegistrationManager {
  private tokenSubscription: { remove(): void } | null = null;
  private active = false;

  constructor(
    private readonly native: PushRegistrationNative,
    private readonly api: PushRegistrationApi,
    private readonly storage: KeyValueStorage,
    private readonly platform: string,
    private readonly isDevice: boolean
  ) {}

  async start(): Promise<void> {
    if (this.platform !== "android" || !this.isDevice || this.active) return;
    this.active = true;
    try {
      await this.native.createChannel();
      let permission = await this.native.getPermission();
      if (!permission.granted) {
        if ((await this.storage.get(PUSH_PERMISSION_DENIED_KEY)) === "1")
          return;
        permission = await this.native.requestPermission();
        if (!permission.granted) {
          await this.storage.set(PUSH_PERMISSION_DENIED_KEY, "1");
          return;
        }
      }
      await this.register(await this.native.getToken());
      this.tokenSubscription = this.native.addTokenListener((token) => {
        void this.register(token);
      });
    } catch (error) {
      this.active = false;
      throw error;
    }
  }

  stop(): void {
    this.active = false;
    this.tokenSubscription?.remove();
    this.tokenSubscription = null;
  }

  private async register(token: string): Promise<void> {
    if (!this.active || !token) return;
    const deviceId = await this.api.registerDevice(token);
    await this.storage.set(PUSH_DEVICE_ID_STORAGE_KEY, deviceId);
  }
}

export async function unregisterPushDevice(
  api: PushRegistrationApi = pushApi,
  storage: KeyValueStorage = secureStorage
): Promise<void> {
  const deviceId = await storage.get(PUSH_DEVICE_ID_STORAGE_KEY);
  try {
    if (deviceId) await api.unregisterDevice(deviceId);
  } finally {
    await storage.remove(PUSH_DEVICE_ID_STORAGE_KEY);
  }
}
