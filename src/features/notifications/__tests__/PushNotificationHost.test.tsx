import { render, waitFor } from "@testing-library/react-native";
import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import { PushNotificationHost } from "../push/PushNotificationHost";

jest.mock("expo-constants", () => ({
  __esModule: true,
  default: { expoConfig: { extra: {} } },
}));
jest.mock("expo-device", () => ({ isDevice: true }));
jest.mock("expo-task-manager", () => ({ defineTask: jest.fn() }));
jest.mock("expo-notifications", () => ({
  AndroidImportance: { HIGH: 4 },
  addNotificationResponseReceivedListener: jest.fn(() => ({
    remove: jest.fn(),
  })),
  addPushTokenListener: jest.fn(() => ({ remove: jest.fn() })),
  clearLastNotificationResponse: jest.fn(),
  getDevicePushTokenAsync: jest.fn().mockResolvedValue({ data: "fcm-token" }),
  getLastNotificationResponse: jest.fn(() => null),
  getPermissionsAsync: jest.fn().mockResolvedValue({ granted: false }),
  registerTaskAsync: jest.fn().mockResolvedValue(undefined),
  requestPermissionsAsync: jest.fn().mockResolvedValue({ granted: false }),
  setNotificationChannelAsync: jest.fn().mockResolvedValue(undefined),
}));
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));
jest.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({}),
}));
jest.mock("@/features/auth/sessionQueries", () => ({
  useSessionQuery: () => ({ data: { user: { id: "member-1" } } }),
}));
jest.mock("@/features/questBoard/api/questBoardQueries", () => ({
  invalidateQuestReads: jest.fn(),
}));
jest.mock("@/api/PushApi", () => ({
  pushApi: { registerDevice: jest.fn(), unregisterDevice: jest.fn() },
}));
jest.mock("@/infrastructure/storage/keyValueStorage", () => ({
  secureStorage: {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue(undefined),
    remove: jest.fn().mockResolvedValue(undefined),
  },
}));

function setPushEnabled(pushEnabled: boolean) {
  (Constants.expoConfig as { extra: object }).extra = { pushEnabled };
}

describe("PushNotificationHost", () => {
  const initialPlatform = Platform.OS;

  beforeAll(() => {
    Platform.OS = "android";
  });

  afterAll(() => {
    Platform.OS = initialPlatform;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("does not ask for permission in a build without Firebase", async () => {
    setPushEnabled(false);

    await render(<PushNotificationHost />);

    expect(Notifications.setNotificationChannelAsync).not.toHaveBeenCalled();
    expect(Notifications.requestPermissionsAsync).not.toHaveBeenCalled();
  });

  it("asks for permission in a build with Firebase", async () => {
    setPushEnabled(true);

    await render(<PushNotificationHost />);

    await waitFor(() =>
      expect(Notifications.requestPermissionsAsync).toHaveBeenCalledTimes(1)
    );
  });
});
