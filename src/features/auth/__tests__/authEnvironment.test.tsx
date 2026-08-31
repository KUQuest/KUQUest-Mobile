import * as Linking from "expo-linking";
import * as SecureStore from "expo-secure-store";
import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import { Text, Button, View } from "react-native";

import {
  authEnvironment,
  isPrototypeDemoEnabled,
  PROTOTYPE_PERSONA_STORAGE_KEY,
  useAuthEnvironment,
} from "../authEnvironment";
import { questWorkflow } from "../../questBoard/questWorkflow";

jest.mock("../../questBoard/questWorkflow", () => ({
  questWorkflow: {
    reset: jest.fn(),
  },
}));

const devFlag = globalThis as typeof globalThis & { __DEV__?: boolean };
const initialDevFlag = devFlag.__DEV__;

describe("AuthEnvironment", () => {
  beforeAll(() => {
    devFlag.__DEV__ = true;
  });

  afterAll(() => {
    if (initialDevFlag === undefined) delete devFlag.__DEV__;
    else devFlag.__DEV__ = initialDevFlag;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.EXPO_PUBLIC_PROFILE_DEMO;
    authEnvironment.reset();
  });

  describe("demo mode", () => {
    it("is disabled by default when env flag is unset", () => {
      expect(authEnvironment.isDemoEnabled()).toBe(false);
      expect(isPrototypeDemoEnabled()).toBe(false);
    });

    it("enables demo mode when EXPO_PUBLIC_PROFILE_DEMO is true", () => {
      process.env.EXPO_PUBLIC_PROFILE_DEMO = "true";
      expect(authEnvironment.isDemoEnabled()).toBe(true);
    });

    it("enables offline demo and resets cleanly", () => {
      authEnvironment.enableOfflineDemo();
      expect(authEnvironment.isDemoEnabled()).toBe(true);

      authEnvironment.resetOfflineDemo();
      expect(authEnvironment.isDemoEnabled()).toBe(false);
    });
  });

  describe("persona state & persistence", () => {
    it("defaults to student-demo and updates active persona", () => {
      expect(authEnvironment.getActivePersonaId()).toBe("student-demo");

      authEnvironment.setActivePersona("demo-hirer");
      expect(authEnvironment.getActivePersonaId()).toBe("demo-hirer");
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        PROTOTYPE_PERSONA_STORAGE_KEY,
        "demo-hirer"
      );
    });

    it("persists and loads valid personas from SecureStore", async () => {
      await expect(
        authEnvironment.persistActivePersona("demo-worker-2")
      ).resolves.toBe(true);
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        PROTOTYPE_PERSONA_STORAGE_KEY,
        "demo-worker-2"
      );

      jest
        .mocked(SecureStore.getItemAsync)
        .mockResolvedValueOnce("demo-worker-3");
      await expect(authEnvironment.loadPersistedPersona()).resolves.toBe(
        "demo-worker-3"
      );

      jest
        .mocked(SecureStore.getItemAsync)
        .mockResolvedValueOnce("invalid-persona");
      await expect(authEnvironment.loadPersistedPersona()).resolves.toBeNull();
    });

    it("handles SecureStore errors safely", async () => {
      jest
        .mocked(SecureStore.getItemAsync)
        .mockRejectedValueOnce(new Error("SecureStore failed"));
      await expect(authEnvironment.loadPersistedPersona()).resolves.toBeNull();

      jest
        .mocked(SecureStore.setItemAsync)
        .mockRejectedValueOnce(new Error("SecureStore failed"));
      await expect(
        authEnvironment.persistActivePersona("demo-hirer")
      ).resolves.toBe(false);

      jest
        .mocked(SecureStore.deleteItemAsync)
        .mockRejectedValueOnce(new Error("SecureStore failed"));
      await expect(authEnvironment.deletePersistedPersona()).resolves.toBe(
        false
      );
    });

    it("deletes persisted persona safely and rejects invalid persona IDs", async () => {
      await expect(
        authEnvironment.persistActivePersona("not-a-persona" as never)
      ).resolves.toBe(false);
      expect(SecureStore.setItemAsync).not.toHaveBeenCalled();

      await expect(authEnvironment.deletePersistedPersona()).resolves.toBe(
        true
      );
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(
        PROTOTYPE_PERSONA_STORAGE_KEY
      );
    });

    it("resets fixtures through questWorkflow", () => {
      authEnvironment.resetFixtures("all");
      expect(questWorkflow.reset).toHaveBeenCalled();
    });
  });

  describe("deep linking", () => {
    it("normalizes scheme URIs and parses known prototype scenarios", () => {
      expect(
        authEnvironment.parseDeepLink(
          "kuquestmobile-debug:///quest/team-forming-demo"
        )
      ).toBe("/quest/team-forming-demo");
      expect(
        authEnvironment.parseDeepLink(
          "kuquestmobile-debug://quest/single-candidate-demo"
        )
      ).toBe("/quest/single-candidate-demo");
      expect(
        authEnvironment.parseDeepLink("kuquestmobile-debug:///settings")
      ).toBeUndefined();
      expect(authEnvironment.parseDeepLink(null)).toBeUndefined();
    });

    it("parses development client wrapped URLs", () => {
      const wrappedUrl =
        "exp+kuquest://expo-development-client/?url=kuquestmobile-debug%3A%2F%2Fquest%2Fteam-selection-demo";
      expect(authEnvironment.parseDeepLink(wrappedUrl)).toBe(
        "/quest/team-selection-demo"
      );
    });

    it("subscribes to Linking events and cleans up", () => {
      const mockRemove = jest.fn();
      const mockAddEventListener = jest
        .spyOn(Linking, "addEventListener")
        .mockReturnValueOnce({ remove: mockRemove } as never);
      const onRoute = jest.fn();

      const unsubscribe = authEnvironment.subscribeDeepLinks(onRoute);
      expect(mockAddEventListener).toHaveBeenCalledWith(
        "url",
        expect.any(Function)
      );

      unsubscribe();
      expect(mockRemove).toHaveBeenCalled();
    });
  });

  describe("useAuthEnvironment hook", () => {
    function TestConsumer() {
      const { isDemo, activePersonaId, setPersona } = useAuthEnvironment();
      return (
        <View>
          <Text testID="persona">{activePersonaId}</Text>
          <Text testID="is-demo">{isDemo ? "demo" : "live"}</Text>
          <Button
            title="Switch"
            onPress={() => setPersona("demo-worker-2")}
            testID="switch-button"
          />
          <Button
            title="ToggleDemo"
            onPress={() => authEnvironment.enableOfflineDemo()}
            testID="demo-button"
          />
        </View>
      );
    }

    it("provides reactive persona and demo state", async () => {
      const view = await render(<TestConsumer />);

      expect(view.getByTestId("persona").props.children).toBe("student-demo");
      expect(view.getByTestId("is-demo").props.children).toBe("live");

      fireEvent.press(view.getByTestId("switch-button"));
      await waitFor(() => {
        expect(view.getByTestId("persona").props.children).toBe(
          "demo-worker-2"
        );
      });

      fireEvent.press(view.getByTestId("demo-button"));
      await waitFor(() => {
        expect(view.getByTestId("is-demo").props.children).toBe("demo");
      });
    });
  });
});
