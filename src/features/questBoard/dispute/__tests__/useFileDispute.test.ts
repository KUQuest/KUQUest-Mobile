import { createElement, Fragment } from "react";
import { Pressable, Text } from "react-native";
import { act, fireEvent, render } from "@testing-library/react-native";

import { SweetAlertHost } from "@/components/ui/SweetAlert";
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

function DisputeAction() {
  const { confirmFileDispute } = useFileDispute();
  return createElement(
    Pressable,
    {
      accessibilityRole: "button",
      accessibilityLabel: "File dispute",
      onPress: () => confirmFileDispute("quest-1"),
    },
    createElement(Text, null, "File dispute")
  );
}

function renderDisputeAction() {
  return render(
    createElement(
      Fragment,
      null,
      createElement(DisputeAction),
      createElement(SweetAlertHost)
    )
  );
}

describe("useFileDispute", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("files only after the viewer confirms, then reports the case number", async () => {
    const dialog = await renderDisputeAction();

    await fireEvent.press(dialog.getByRole("button", { name: "File dispute" }));
    expect(dialog.getByText(messages.confirmTitle)).toBeTruthy();
    expect(
      dialog.getByText(messages.rules.map((rule) => `• ${rule}`).join("\n"))
    ).toBeTruthy();
    await fireEvent.press(
      dialog.getByRole("button", { name: messages.cancel })
    );
    expect(mockMutate).not.toHaveBeenCalled();

    await fireEvent.press(dialog.getByRole("button", { name: "File dispute" }));
    await fireEvent.press(
      dialog.getByRole("button", { name: messages.confirm })
    );
    expect(mockMutate).toHaveBeenCalledWith(
      { questId: "quest-1", viewerId: "viewer-1" },
      expect.anything()
    );

    await act(async () => {
      mockMutate.mock.calls[0][1].onSuccess({ displayId: "DC-000123" });
    });
    expect(dialog.getByText(messages.successTitle)).toBeTruthy();
    expect(
      dialog.getByText(messages.successDescription("DC-000123"))
    ).toBeTruthy();
    await fireEvent.press(dialog.getByRole("button", { name: "OK" }));
  });

  it("shows the Server's reason when filing is rejected", async () => {
    const dialog = await renderDisputeAction();

    await fireEvent.press(dialog.getByRole("button", { name: "File dispute" }));
    await fireEvent.press(
      dialog.getByRole("button", { name: messages.confirm })
    );
    await act(async () => {
      mockMutate.mock.calls[0][1].onError(
        new Error("The dispute filing window has closed")
      );
    });

    expect(dialog.getByText(messages.errorTitle)).toBeTruthy();
    expect(
      dialog.getByText("The dispute filing window has closed")
    ).toBeTruthy();
    await fireEvent.press(dialog.getByRole("button", { name: "OK" }));
  });
});
