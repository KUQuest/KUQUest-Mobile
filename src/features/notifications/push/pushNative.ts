import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import { pushApi } from "@/api/PushApi";
import { secureStorage } from "@/infrastructure/storage/keyValueStorage";
import { PUSH_CHANNEL_ID } from "./pushPayload";
import {
  PushRegistrationManager,
  type PushRegistrationNative,
} from "./pushRegistration";

const pushRegistrationNative: PushRegistrationNative = {
  createChannel: async () => {
    await Notifications.setNotificationChannelAsync(PUSH_CHANNEL_ID, {
      name: "KUQuest updates",
      description: "Quest assignments and time-sensitive decisions",
      importance: Notifications.AndroidImportance.HIGH,
    });
  },
  getPermission: async () => {
    const { granted, canAskAgain } = await Notifications.getPermissionsAsync();
    return { granted, canAskAgain };
  },
  requestPermission: async () => {
    const { granted } = await Notifications.requestPermissionsAsync();
    return { granted };
  },
  getToken: async () => (await Notifications.getDevicePushTokenAsync()).data,
  addTokenListener: (listener) =>
    Notifications.addPushTokenListener((token) => listener(token.data)),
};

export function createPushRegistrationManager(isDevice: boolean) {
  return new PushRegistrationManager(
    pushRegistrationNative,
    pushApi,
    secureStorage,
    Platform.OS,
    isDevice
  );
}
