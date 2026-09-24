import { Alert } from "react-native";
import { renderHook } from "@testing-library/react-native";

import { disputeMessages } from "@/locales/disputeMessages";

import { useFileDispute } from "../useFileDispute";

const messages = disputeMessages.en;
const mockMutate = jest.fn();

jest.mock("@/features/auth/sessionQueries", () => ({
  useSessionQuery: () => ({ data: { user: { id: "viewer-1" } } }),
}));

jest.mock("@/features/preferences/localeStore", () => ({
  useLocale: () => ({ locale: "en" }),
}));

jest.mock("@/features/questBoard/api/questBoardQueries", () => ({
  useFileDisputeMutation: () => ({ mutate: mockMutate, isPending: false }),
}));

function alertButton(call: number, text: string) {
  const buttons = jest.mocked(Alert.alert).mock.calls[call]?.[2] ?? [];
  return buttons.find((button) => button.text === text);
}

describe("useFileDispute", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, "alert").mockImplementation(() => {});
  });

  it("files only after the viewer confirms, then reports the case number", async () => {
    const { result } = await renderHook(() => useFileDispute());

    result.current.confirmFileDispute("quest-1");
    expect(jest.mocked(Alert.alert).mock.calls[0]?.[0]).toBe(
      messages.confirmTitle
    );
    alertButton(0, messages.cancel)?.onPress?.();
    expect(mockMutate).not.toHaveBeenCalled();

    alertButton(0, messages.confirm)?.onPress?.();
    expect(mockMutate).toHaveBeenCalledWith(
      { questId: "quest-1", viewerId: "viewer-1" },
      expect.anything()
    );

    mockMutate.mock.calls[0][1].onSuccess({ displayId: "DC-000123" });
    expect(Alert.alert).toHaveBeenLastCalledWith(
      messages.successTitle,
      messages.successDescription("DC-000123")
    );
  });

  it("shows the Server's reason when filing is rejected", async () => {
    const { result } = await renderHook(() => useFileDispute());

    result.current.confirmFileDispute("quest-1");
    alertButton(0, messages.confirm)?.onPress?.();
    mockMutate.mock.calls[0][1].onError(
      new Error("The dispute filing window has closed")
    );

    expect(Alert.alert).toHaveBeenLastCalledWith(
      messages.errorTitle,
      "The dispute filing window has closed"
    );
  });
});
