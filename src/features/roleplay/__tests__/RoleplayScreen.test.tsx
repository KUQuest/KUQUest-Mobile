import {
  cleanup,
  fireEvent,
  render,
  waitFor,
} from "@testing-library/react-native";

import { authEnvironment } from "@/features/auth/authEnvironment";

import RoleplayScreen from "../RoleplayScreen";
import { roleplayMock } from "../roleplayMock";

const mockRouter = {
  back: jest.fn(),
  canGoBack: jest.fn(() => true),
  replace: jest.fn(),
};

jest.mock("expo-router", () => ({
  useRouter: () => mockRouter,
}));

jest.mock("../../../locales/LocaleProvider", () => ({
  useLocale: () => ({ locale: "en" }),
}));

describe("RoleplayScreen", () => {
  it("returns to the previous screen from the roleplay route", async () => {
    const view = await render(<RoleplayScreen />);

    await fireEvent.press(view.getByTestId("roleplay-back"));

    expect(mockRouter.canGoBack).toHaveBeenCalledTimes(1);
    expect(mockRouter.back).toHaveBeenCalledTimes(1);
  });

  afterEach(() => {
    cleanup();
    mockRouter.back.mockClear();
    mockRouter.canGoBack.mockClear();
    mockRouter.replace.mockClear();
  });

  beforeEach(() => {
    authEnvironment.reset();
    roleplayMock.reset();
    roleplayMock.setScenario("single-candidate-demo");
    roleplayMock.setPersona("student-demo");
  });

  it("switches between the four rulebook roleplay scenarios", async () => {
    const view = await render(<RoleplayScreen />);

    await fireEvent.press(view.getByTestId("roleplay-scenario-print-documents"));

    await waitFor(() => {
      expect(view.getByTestId("roleplay-scenario")).toHaveTextContent(
        /2\. Single First Come First Serve/
      );
      expect(view.getByTestId("roleplay-action-direct-join")).toBeTruthy();
    });
  });

  it("renders Team Candidate selection from the shared fixture workflow", async () => {
    roleplayMock.setScenario("team-selection-demo");
    roleplayMock.setPersona("demo-hirer");
    const teamId = roleplayMock.getViewModel().state.teams[0]?.id;
    const view = await render(<RoleplayScreen />);

    expect(teamId).toBeDefined();
    expect(
      view.getByTestId(`roleplay-action-select-team-${teamId}`)
    ).toBeTruthy();

    await fireEvent.press(
      view.getByTestId(`roleplay-action-select-team-${teamId}`)
    );

    await waitFor(() => {
      expect(view.getByTestId("roleplay-state")).toHaveTextContent(
        /QUEST_ASSIGNED/
      );
    });
  });

  it("switches persona and shows only that persona's actions", async () => {
    const view = await render(<RoleplayScreen />);

    expect(view.getByTestId("roleplay-action-apply")).toBeTruthy();
    expect(view.queryByTestId("roleplay-action-cancel")).toBeNull();

    await fireEvent.press(view.getByTestId("roleplay-persona-demo-hirer"));

    await waitFor(() => {
      expect(view.queryByTestId("roleplay-action-apply")).toBeNull();
      expect(view.getByTestId("roleplay-action-cancel")).toBeTruthy();
      expect(
        view.getByTestId("roleplay-persona-demo-hirer").props.accessibilityState
      ).toEqual(expect.objectContaining({ selected: true }));
    });
  });

  it("shows feedback and canonical state after an allowed action", async () => {
    roleplayMock.setPersona("demo-hirer");
    const application = roleplayMock
      .getViewModel()
      .state.applications.find((item) => item.status === "APPLICATION_APPLIED");
    const view = await render(<RoleplayScreen />);

    expect(application).toBeDefined();
    await fireEvent.press(
      view.getByTestId(`roleplay-action-select-${application?.id}`)
    );

    await waitFor(() => {
      expect(view.getByTestId("roleplay-state")).toHaveTextContent(
        /QUEST_ASSIGNED/
      );
      expect(view.getByTestId("roleplay-feedback")).toHaveTextContent(
        /Select Candidate completed/
      );
    });
  });

  it("resets the in-memory state to the open scenario", async () => {
    const view = await render(<RoleplayScreen />);

    await fireEvent.press(view.getByTestId("roleplay-reset"));

    await waitFor(() => {
      expect(view.getByTestId("roleplay-state")).toHaveTextContent(
        /QUEST_OPEN/
      );
      expect(view.getByTestId("roleplay-feedback")).toHaveTextContent(
        /Prototype state reset\./
      );
    });
  });
});
