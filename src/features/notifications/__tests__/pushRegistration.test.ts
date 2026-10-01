import {
  PUSH_DEVICE_ID_STORAGE_KEY,
  PushRegistrationManager,
  unregisterPushDevice,
  type PushRegistrationNative,
} from "../push/pushRegistration";
import type { KeyValueStorage } from "@/infrastructure/storage/keyValueStorage";

function memoryStorage(): KeyValueStorage {
  const values = new Map<string, string>();
  return {
    get: async (key) => values.get(key) ?? null,
    set: async (key, value) => void values.set(key, value),
    remove: async (key) => void values.delete(key),
  };
}

function setup(options: { granted?: boolean; requestGranted?: boolean } = {}) {
  let refresh: (token: string) => void = () => undefined;
  const remove = jest.fn();
  const native: PushRegistrationNative = {
    createChannel: jest.fn().mockResolvedValue(undefined),
    getPermission: jest
      .fn()
      .mockResolvedValue({ granted: options.granted ?? true }),
    requestPermission: jest
      .fn()
      .mockResolvedValue({ granted: options.requestGranted ?? true }),
    getToken: jest.fn().mockResolvedValue("fcm-token-1"),
    addTokenListener: jest.fn((listener) => {
      refresh = listener;
      return { remove };
    }),
  };
  const api = {
    registerDevice: jest.fn().mockResolvedValue("device-1"),
    unregisterDevice: jest.fn().mockResolvedValue(undefined),
  };
  const storage = memoryStorage();
  const manager = (platform = "android", isDevice = true) =>
    new PushRegistrationManager(native, api, storage, platform, isDevice);
  return {
    native,
    api,
    storage,
    manager,
    refresh: (t: string) => refresh(t),
    remove,
  };
}

describe("push registration", () => {
  it("registers the device token once and stores the device id", async () => {
    const { api, storage, manager } = setup();
    const instance = manager();
    await instance.start();
    await instance.start();
    expect(api.registerDevice).toHaveBeenCalledTimes(1);
    expect(api.registerDevice).toHaveBeenCalledWith("fcm-token-1");
    expect(await storage.get(PUSH_DEVICE_ID_STORAGE_KEY)).toBe("device-1");
  });

  it("re-registers on token refresh and stops listening on stop", async () => {
    const { api, manager, refresh, remove } = setup();
    const instance = manager();
    await instance.start();
    refresh("fcm-token-2");
    await Promise.resolve();
    expect(api.registerDevice).toHaveBeenLastCalledWith("fcm-token-2");
    instance.stop();
    expect(remove).toHaveBeenCalled();
  });

  it("does not register when permission is denied and does not re-prompt", async () => {
    const { api, native, manager } = setup({
      granted: false,
      requestGranted: false,
    });
    await manager().start();
    await manager().start();
    expect(api.registerDevice).not.toHaveBeenCalled();
    expect(native.requestPermission).toHaveBeenCalledTimes(1);
  });

  it("is a no-op off Android and on emulators", async () => {
    const { api, native, manager } = setup();
    await manager("ios").start();
    await manager("android", false).start();
    expect(native.createChannel).not.toHaveBeenCalled();
    expect(api.registerDevice).not.toHaveBeenCalled();
  });

  it("clears the stored device id even when the server delete fails", async () => {
    const { api, storage } = setup();
    await storage.set(PUSH_DEVICE_ID_STORAGE_KEY, "device-1");
    api.unregisterDevice.mockRejectedValue(new Error("offline"));
    await expect(unregisterPushDevice(api, storage)).rejects.toThrow("offline");
    expect(api.unregisterDevice).toHaveBeenCalledWith("device-1");
    expect(await storage.get(PUSH_DEVICE_ID_STORAGE_KEY)).toBeNull();
  });
});
