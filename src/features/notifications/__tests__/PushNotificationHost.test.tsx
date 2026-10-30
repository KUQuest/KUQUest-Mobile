import React from "react";
import { act, render, waitFor } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import { clearSessionCache, sessionKeys } from "@/features/auth/sessionQueries";
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
const mockPush = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush }),
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

function signedInClient(viewerId = "member-1") {
  const queryClient = new QueryClient();
  queryClient.setQueryData(sessionKeys.detail(), { user: { id: viewerId } });
  return queryClient;
}

function renderHost(queryClient = signedInClient()) {
  return render(
    <QueryClientProvider client={queryClient}>
      <PushNotificationHost />
    </QueryClientProvider>
  );
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

    await renderHost();

    expect(Notifications.setNotificationChannelAsync).not.toHaveBeenCalled();
    expect(Notifications.requestPermissionsAsync).not.toHaveBeenCalled();
  });

  it("asks for permission in a build with Firebase", async () => {
    setPushEnabled(true);

    await renderHost();

    await waitFor(() =>
      expect(Notifications.requestPermissionsAsync).toHaveBeenCalledTimes(1)
    );
  });

  it("registers again after an in-app logout and login", async () => {
    setPushEnabled(true);
    const queryClient = signedInClient("member-a");
    await renderHost(queryClient);
    await waitFor(() =>
      expect(Notifications.setNotificationChannelAsync).toHaveBeenCalledTimes(1)
    );

    await act(async () => clearSessionCache(queryClient));
    await act(async () => {
      queryClient.setQueryData(sessionKeys.detail(), {
        user: { id: "member-b" },
      });
    });

    await waitFor(() =>
      expect(Notifications.setNotificationChannelAsync).toHaveBeenCalledTimes(2)
    );
  });

  it("opens the notification inbox for a penalty Push tap", async () => {
    setPushEnabled(false);
    jest.mocked(Notifications.getLastNotificationResponse).mockReturnValueOnce({
      notification: {
        request: {
          content: {
            data: {
              type: "PENALTY_RED_FLAG_APPLIED",
              eventKey: "penalty-applied:p-1",
            },
          },
        },
      },
    } as unknown as Notifications.NotificationResponse);

    await renderHost();

    expect(mockPush).toHaveBeenCalledWith("/notifications");
  });
});
