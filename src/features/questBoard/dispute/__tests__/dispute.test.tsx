import React from "react";
import { Alert } from "react-native";
import { fireEvent } from "@testing-library/react-native";

import { disputeMessages } from "@/locales/disputeMessages";
import { renderWithAppTheme as render } from "@/testing/queryTestUtils";

import QuestDisputeRoute from "../../../../app/quest/[id]/dispute";

const messages = disputeMessages.en;
const mockBack = jest.fn();
const mockMutate = jest.fn();
const mockRouteParams: { id?: string | string[] } = {};
let mockMutation: {
  isPending: boolean;
  data?: { displayId: string };
  error: Error | null;
};

jest.mock("expo-router", () => ({
  useRouter: () => ({ back: mockBack }),
  useLocalSearchParams: () => mockRouteParams,
}));

jest.mock("@/features/auth/sessionQueries", () => ({
  useSessionQuery: () => ({ data: { user: { id: "viewer-1" } } }),
}));

jest.mock("@/features/preferences/localeStore", () => ({
  useLocale: () => ({ locale: "en" }),
}));

jest.mock("@/features/questBoard/api/questBoardQueries", () => ({
  useFileDisputeMutation: () => ({ ...mockMutation, mutate: mockMutate }),
}));

function alertButton(text: string) {
  const buttons = jest.mocked(Alert.alert).mock.calls[0]?.[2] ?? [];
  return buttons.find((button) => button.text === text);
}

describe("Quest dispute route", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRouteParams.id = ["quest-first", "quest-second"];
    mockMutation = { isPending: false, error: null };
    jest.spyOn(Alert, "alert").mockImplementation(() => {});
  });

  it("files for the first route Quest only after the viewer confirms", async () => {
    const view = await render(<QuestDisputeRoute />);

    await fireEvent.press(view.getByRole("button", { name: messages.submit }));
    expect(jest.mocked(Alert.alert).mock.calls[0]?.[0]).toBe(
      messages.confirmTitle
    );
    alertButton(messages.cancel)?.onPress?.();
    expect(mockMutate).not.toHaveBeenCalled();

    alertButton(messages.confirm)?.onPress?.();
    expect(mockMutate).toHaveBeenCalledWith({
      questId: "quest-first",
      viewerId: "viewer-1",
    });
  });

  it("shows the filed case number and returns on Done", async () => {
    mockMutation = {
      isPending: false,
      data: { displayId: "DC-000123" },
      error: null,
    };
    const view = await render(<QuestDisputeRoute />);

    expect(
      view.getByText(messages.successDescription("DC-000123"))
    ).toBeTruthy();
    expect(view.queryByRole("button", { name: messages.submit })).toBeNull();
    await fireEvent.press(view.getByRole("button", { name: messages.done }));
    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  it("shows the Server's reason when filing is rejected", async () => {
    mockMutation = {
      isPending: false,
      error: new Error("The dispute filing window has closed"),
    };
    const view = await render(<QuestDisputeRoute />);

    expect(view.getByTestId("dispute-error")).toHaveTextContent(
      /The dispute filing window has closed/
    );
  });
});
