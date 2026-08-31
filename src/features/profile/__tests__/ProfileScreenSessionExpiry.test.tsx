import React from "react";
import { render, waitFor } from "@testing-library/react-native";

import ProfileScreen from "../ProfileScreen";
import { profileModule } from "../profileModule";
import { AuthError } from "../../auth/types";
import { authService } from "../../auth/AuthService";
import { NavigationVisibilityProvider } from "../../../components/navigation/NavigationVisibilityContext";

// The suite in ProfileScreen.test.tsx mocks useFocusEffect as a one-shot
// useEffect(effect, []), so it can never observe a refocus. These cases exist
// specifically to model the navigator's real behaviour: replace('/') returns
// focus to this screen and re-runs the focus effect.
const mockFocusEffects: (() => void)[] = [];
const mockReplace = jest.fn(() => {
  mockFocusEffects.forEach((run) => run());
});

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: jest.fn(), replace: mockReplace }),
  useFocusEffect: (effect: () => (() => void) | void) => {
    jest.requireActual("react").useEffect(() => {
      mockFocusEffects.length = 0;
      mockFocusEffects.push(() => {
        effect();
      });
      effect();
    }, []);
  },
}));

jest.mock("../../auth/AuthService", () => ({
  authService: { signOut: jest.fn().mockResolvedValue(undefined) },
}));
jest.mock("../../../locales/LocaleProvider", () => ({
  useLocale: () => ({ locale: "en" }),
}));
jest.mock("../profileModule", () => ({
  profileModule: {
    loadProfile: jest.fn(),
  },
}));

const mockedLoad = profileModule.loadProfile as jest.MockedFunction<
  typeof profileModule.loadProfile
>;
const renderScreen = async () =>
  await render(
    <NavigationVisibilityProvider>
      <ProfileScreen />
    </NavigationVisibilityProvider>
  );

describe("Student Profile screen — expired session", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFocusEffects.length = 0;
  });

  it("redirects to the root route exactly once when the session is gone", async () => {
    mockedLoad.mockRejectedValue(
      new AuthError("SESSION_EXPIRED", "No active session")
    );

    await renderScreen();

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith("/"));
    // Give any runaway focus cycle room to spin before asserting it did not.
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(mockReplace).toHaveBeenCalledTimes(1);
    expect(mockedLoad).toHaveBeenCalledTimes(1);
  });

  it("does not sign out again when there is no session to end", async () => {
    mockedLoad.mockRejectedValue(
      new AuthError("SESSION_EXPIRED", "No active session")
    );

    await renderScreen();

    await waitFor(() => expect(mockReplace).toHaveBeenCalled());
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(authService.signOut).not.toHaveBeenCalled();
  });

  it("still surfaces the error state for non-auth failures", async () => {
    mockedLoad.mockRejectedValue(new Error("network down"));

    const view = await renderScreen();

    await waitFor(() =>
      expect(view.getByText("Unable to load your profile.")).toBeTruthy()
    );
    expect(mockReplace).not.toHaveBeenCalled();
  });
});
