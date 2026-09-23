import React from "react";
import { Alert } from "react-native";
import { fireEvent, waitFor } from "@testing-library/react-native";

import { renderWithAppTheme as render } from "@/testing/queryTestUtils";

import QuestDisputeRoute from "../../../../app/quest/[id]/dispute";

const mockBack = jest.fn();
const mockMutateAsync = jest.fn();
const mockRouteParams: { id?: string | string[] } = {};

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
  useFileDisputeMutation: () => ({
    isPending: false,
    mutateAsync: mockMutateAsync,
  }),
}));

describe("Quest dispute route", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRouteParams.id = ["quest-first", "quest-second"];
    mockMutateAsync.mockResolvedValue({ id: "case-1" });
    jest.spyOn(Alert, "alert").mockImplementation(() => {});
  });

  it("normalizes the first route value and preserves submit/back timing", async () => {
    const view = await render(<QuestDisputeRoute />);

    const input = view.getByLabelText("File Dispute");
    await fireEvent.changeText(input, "  Details  ");
    const submit = view.getByRole("button", { name: "Submit Dispute" });
    await fireEvent.press(submit);

    await waitFor(() =>
      expect(mockMutateAsync).toHaveBeenCalledWith({
        questId: "quest-first",
        viewerId: "viewer-1",
        reason: "PROOF_REJECTED_UNFAIRLY",
        statement: "Details",
      })
    );

    const alertCall = jest.mocked(Alert.alert).mock.calls[0];
    expect(alertCall[0]).toBe("Dispute Filed");
    expect(mockBack).not.toHaveBeenCalled();

    const buttons = alertCall[2];
    buttons?.[0]?.onPress?.();
    expect(mockBack).toHaveBeenCalledTimes(1);
  });
});
