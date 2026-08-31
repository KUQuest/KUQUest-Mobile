import {
  act,
  fireEvent,
  render,
  waitFor,
  within,
} from "@testing-library/react-native";
import mockReact, { type ReactNode } from "react";
import { Alert, BackHandler } from "react-native";

import QuestDetailScreen from "../QuestDetailScreen";
import { setActivePrototypePersona } from "../../auth/authEnvironment";
import { questFixtureAdapter } from "../questFixtureAdapter";

const mockRouter = {
  back: jest.fn(),
  canGoBack: jest.fn(() => true),
  push: jest.fn(),
  replace: jest.fn(),
};
const mockRouteParams: {
  id?: string;
  intent?: string;
  mode?: string;
  joinStatus?: string;
  studentId?: string;
} = {};

jest.mock("expo-router", () => ({
  useRouter: () => mockRouter,
  useLocalSearchParams: () => mockRouteParams,
  useFocusEffect: (effect: () => void | (() => void)) =>
    mockReact.useEffect(effect, [effect]),
}));

jest.mock("react-native/Libraries/Modal/Modal", () => ({
  __esModule: true,
  default: ({
    visible,
    children,
  }: {
    visible: boolean;
    children: ReactNode;
  }) =>
    visible
      ? mockReact.createElement(mockReact.Fragment, null, children)
      : null,
}));

describe("Quest Detail screen", () => {
  beforeEach(() => {
    questFixtureAdapter.reset();
    mockRouter.back.mockClear();
    mockRouter.canGoBack.mockReset();
    mockRouter.canGoBack.mockReturnValue(true);
    mockRouter.push.mockClear();
    mockRouter.replace.mockClear();
    delete mockRouteParams.id;
    delete mockRouteParams.intent;
    delete mockRouteParams.mode;
    delete mockRouteParams.joinStatus;
    delete mockRouteParams.studentId;
  });

  it("falls back to the Quest Board when a cold deep link has no back stack", async () => {
    mockRouter.canGoBack.mockReturnValue(false);
    const view = await render(
      <QuestDetailScreen questId="team-forming-demo" />
    );

    await fireEvent.press(view.getByTestId("header-back-button"));

    expect(mockRouter.replace).toHaveBeenCalledWith("/(tabs)");
    expect(mockRouter.back).not.toHaveBeenCalled();
  });

  it("handles Android Back with the same stack-aware fallback", async () => {
    mockRouter.canGoBack.mockReturnValue(false);
    const addEventListener = jest.spyOn(BackHandler, "addEventListener");
    const view = await render(
      <QuestDetailScreen questId="team-forming-demo" />
    );
    const onBackPress = addEventListener.mock.calls.find(
      ([eventName]) => eventName === "hardwareBackPress"
    )?.[1] as (() => boolean) | undefined;

    expect(onBackPress).toBeDefined();
    expect(onBackPress?.()).toBe(true);
    expect(mockRouter.replace).toHaveBeenCalledWith("/(tabs)");
    expect(mockRouter.back).not.toHaveBeenCalled();

    view.unmount();
    addEventListener.mockRestore();
  });

  it("uses the existing stack for normal in-app back navigation", async () => {
    const view = await render(
      <QuestDetailScreen questId="team-forming-demo" />
    );

    await fireEvent.press(view.getByTestId("header-back-button"));

    expect(mockRouter.back).toHaveBeenCalledTimes(1);
    expect(mockRouter.replace).not.toHaveBeenCalled();
  });

  it("requires confirmation and shows an immediate Accepted outcome for first-come Quests", async () => {
    const view = await render(<QuestDetailScreen questId="print-documents" />);

    expect(view.getByText("Photocopy course documents")).toBeTruthy();
    expect(view.getByText("Join Quest")).toBeTruthy();
    expect(view.getByText("15 Aug 2026")).toBeTruthy();
    expect(view.getByTestId("quest-schedule-timeline")).toBeTruthy();
    expect(view.getByText("Start work")).toBeTruthy();
    expect(view.getByText("Work window")).toBeTruthy();
    expect(view.getByText("Finish by")).toBeTruthy();
    expect(view.getByText("12:00–13:00")).toBeTruthy();
    expect(view.getAllByText("On campus").length).toBeGreaterThan(0);

    await fireEvent.press(view.getByTestId("quest-apply-button"));
    expect(view.getByText("Confirm your participation")).toBeTruthy();
    expect(view.getAllByText("฿80 / person")).toHaveLength(2);

    await fireEvent.press(view.getByTestId("confirm-quest-application"));

    await waitFor(() =>
      expect(view.getByText("Participation confirmed")).toBeTruthy()
    );
    expect(view.getByTestId("view-my-quests")).toBeTruthy();
    expect(view.queryByText("Join Quest")).toBeNull();
  });

  it("renders up to three Quest reference images in Detail", async () => {
    const view = await render(<QuestDetailScreen questId="move-boxes" />);

    expect(view.getByLabelText("3 photos")).toBeTruthy();
    expect(view.getByLabelText("Quest image 1")).toBeTruthy();
    expect(view.getByLabelText("Quest image 3")).toBeTruthy();
  });

  it("shows Application pending for reviewed-candidate Quests", async () => {
    const view = await render(<QuestDetailScreen questId="move-boxes" />);

    await fireEvent.press(view.getByTestId("quest-apply-button"));
    await fireEvent.press(view.getByTestId("confirm-quest-application"));

    await waitFor(() =>
      expect(view.getByText("Application pending")).toBeTruthy()
    );
    expect(
      view.getByText("The Quest owner will review your application.")
    ).toBeTruthy();
    expect(view.getByTestId("view-my-quests")).toBeTruthy();
  });

  it("shows a Leave action for a joined Quest and removes the active state after confirmation", async () => {
    const view = await render(
      <QuestDetailScreen
        questId="print-documents"
        mode="join"
        joinStatus="accepted"
      />
    );

    expect(view.getByText("Participation confirmed")).toBeTruthy();
    expect(view.getByTestId("quest-leave-button")).toBeTruthy();
    expect(view.queryByTestId("quest-apply-button")).toBeNull();

    const alertSpy = jest
      .spyOn(Alert, "alert")
      .mockImplementation(() => undefined);
    await fireEvent.press(view.getByTestId("quest-leave-button"));
    expect(alertSpy).toHaveBeenCalledWith(
      "Leave Quest",
      "You will leave this Quest and lose your confirmed place.",
      expect.any(Array)
    );
    const leaveConfirmation = alertSpy.mock.calls[0][2]?.find(
      (button) => button.text === "Leave Quest"
    );
    await act(async () => {
      leaveConfirmation?.onPress?.();
    });

    await waitFor(() =>
      expect(view.getByText("You left this Quest")).toBeTruthy()
    );
    expect(view.queryByTestId("quest-leave-button")).toBeNull();
    alertSpy.mockRestore();
  });

  it("shows Edit post for the owner view and opens the create flow with the Quest id", async () => {
    const view = await render(
      <QuestDetailScreen questId="clean-fan" mode="post" />
    );

    expect(view.getByText("Your Quest post")).toBeTruthy();
    expect(view.getByTestId("quest-edit-post-button")).toBeTruthy();
    expect(view.queryByTestId("quest-apply-button")).toBeNull();
    expect(view.queryByTestId("quest-leave-button")).toBeNull();

    await fireEvent.press(view.getByTestId("quest-edit-post-button"));
    expect(mockRouter.push).toHaveBeenCalledWith({
      pathname: "/create",
      params: { editQuestId: "clean-fan" },
    });
  });

  it("opens a direct chat with the Quest owner using stable route identity", async () => {
    const view = await render(<QuestDetailScreen questId="print-documents" />);

    const initialActionBar = within(view.getByTestId("quest-action-bar"));
    expect(
      initialActionBar.queryByTestId("quest-message-owner-button")
    ).toBeNull();
    await fireEvent.press(initialActionBar.getByTestId("quest-apply-button"));
    await fireEvent.press(view.getByTestId("confirm-quest-application"));
    await waitFor(() =>
      expect(view.getByText("Participation confirmed")).toBeTruthy()
    );

    await fireEvent.press(view.getByTestId("quest-message-owner-button"));

    expect(mockRouter.push).toHaveBeenCalledWith({
      pathname: "/chat/[id]",
      params: {
        id: "conversation-fixture-print-documents",
        conversationId: "conversation-fixture-print-documents",
        questId: "print-documents",
        viewerId: "student-demo",
        ownerName: "Mild P.",
        questTitle: "Photocopy course documents",
      },
    });
  });

  it("opens terminal Quest chat with stable route identity", async () => {
    const view = await render(
      <QuestDetailScreen
        questId="clean-study-table"
        studentId="demo-worker-3"
        mode="join"
        joinStatus="history"
      />
    );

    await fireEvent.press(view.getByTestId("quest-message-owner-button"));

    expect(mockRouter.push).toHaveBeenCalledWith({
      pathname: "/chat/[id]",
      params: {
        id: "conversation-fixture-clean-study-table",
        conversationId: "conversation-fixture-clean-study-table",
        questId: "clean-study-table",
        viewerId: "demo-worker-3",
        ownerName: "Pim C.",
        questTitle: "Clean a study table",
      },
    });
  });

  it("opens authorized disputed Quest chat with stable route identity", async () => {
    const view = await render(
      <QuestDetailScreen
        questId="clean-fridge"
        studentId="demo-worker-3"
        mode="join"
        joinStatus="accepted"
      />
    );

    await fireEvent.press(view.getByTestId("quest-message-owner-button"));

    expect(mockRouter.push).toHaveBeenCalledWith({
      pathname: "/chat/[id]",
      params: {
        id: "conversation-fixture-clean-fridge",
        conversationId: "conversation-fixture-clean-fridge",
        questId: "clean-fridge",
        viewerId: "demo-worker-3",
        ownerName: "Game T.",
        questTitle: "Clean a dorm fridge",
      },
    });
  });

  it("navigates accepted participants to My Quests", async () => {
    const view = await render(<QuestDetailScreen questId="print-documents" />);

    await fireEvent.press(view.getByTestId("quest-apply-button"));
    await fireEvent.press(view.getByTestId("confirm-quest-application"));
    await waitFor(() =>
      expect(view.getByTestId("view-my-quests")).toBeTruthy()
    );
    await fireEvent.press(view.getByTestId("view-my-quests"));

    expect(mockRouter.push).toHaveBeenCalledWith("/my-quests");
  });

  it("opens confirmation when entered through Take Quest", async () => {
    mockRouteParams.id = "move-boxes";
    mockRouteParams.intent = "apply";

    const view = await render(<QuestDetailScreen />);

    await waitFor(() =>
      expect(view.getByText("Confirm your application")).toBeTruthy()
    );
    expect(view.getByTestId("confirm-quest-application")).toBeTruthy();
  });

  it("explains unavailable application states in Detail", async () => {
    const view = await render(
      <QuestDetailScreen previewState="full" questId="print-documents" />
    );

    expect(view.getByText("Quest full")).toBeTruthy();
    expect(
      view.getByText("This Quest is no longer accepting applications.")
    ).toBeTruthy();
    expect(view.queryByTestId("view-my-quests")).toBeNull();
    expect(view.queryByTestId("quest-apply-button")).toBeNull();
  });

  it("renders a not-found state for an unknown route id", async () => {
    mockRouteParams.id = "does-not-exist";

    const view = await render(<QuestDetailScreen />);

    expect(view.getByText("Quest not found")).toBeTruthy();
    expect(view.queryByText("Help move boxes to the dorm")).toBeNull();
  });

  it("uses the active persona from the Prototype menu for capability surfaces", async () => {
    setActivePrototypePersona("student-demo");
    const view = await render(
      <QuestDetailScreen questId="single-candidate-demo" />
    );

    expect(
      view.getByTestId("quest-detail-prototype-menu-trigger")
    ).toBeTruthy();
    expect(view.queryByTestId("quest-candidate-review-entry")).toBeNull();

    await fireEvent.press(
      view.getByTestId("quest-detail-prototype-menu-trigger")
    );
    expect(
      view.getByRole("button", {
        name: "Single candidate (/quest/single-candidate-demo)",
      }).props.accessibilityState
    ).toMatchObject({ selected: true });
    await fireEvent.press(
      view.getByTestId("quest-detail-prototype-menu-persona-demo-hirer")
    );

    await waitFor(() =>
      expect(view.getByTestId("quest-candidate-review-entry")).toBeTruthy()
    );
  });

  it("confirms an individual Candidate rejection without changing the open Quest", async () => {
    setActivePrototypePersona("demo-hirer");
    const alertSpy = jest
      .spyOn(Alert, "alert")
      .mockImplementation(() => undefined);
    const view = await render(
      <QuestDetailScreen questId="single-candidate-demo" />
    );

    await fireEvent.press(
      view.getByTestId("quest-open-candidate-review-sheet")
    );
    await fireEvent.press(
      view.getByTestId(
        "candidate-review-reject-fixture-application-single-candidate-demo-single-applicant-b"
      )
    );

    expect(alertSpy).toHaveBeenCalledWith(
      "Reject",
      expect.stringContaining("Select a campus helper"),
      expect.any(Array)
    );
    const confirmationButtons = alertSpy.mock.calls[0]?.[2];
    const rejectButton = confirmationButtons?.find(
      (button) => button.text === "Reject"
    );
    await act(async () => {
      rejectButton?.onPress?.();
    });

    await waitFor(() =>
      expect(
        questFixtureAdapter
          .getState("single-candidate-demo", "demo-hirer")
          ?.applications.find(
            (item) => item.applicantId === "single-applicant-b"
          )?.status
      ).toBe("APPLICATION_REJECTED")
    );
    expect(
      questFixtureAdapter.getState("single-candidate-demo", "demo-hirer")?.quest
        .status
    ).toBe("QUEST_OPEN");
    expect(view.getByText("Rejected")).toBeTruthy();
    alertSpy.mockRestore();
  });
});
