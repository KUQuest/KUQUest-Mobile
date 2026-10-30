import { createElement, Fragment } from "react";
import { Pressable, Text } from "react-native";
import { act, fireEvent } from "@testing-library/react-native";

import { ApiError } from "@/api/ApiClient";
import { SweetAlertHost } from "@/components/ui/SweetAlert";
import { disputeMessages } from "@/locales/disputeMessages";
import { DisputeFormHost } from "../DisputeFormHost";
import { useFileDispute } from "../useFileDispute";
import { renderWithQueryClient } from "@/testing/queryTestUtils";

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
  questBoardKeys: {
    disputeFiling: () => ["questBoard", "dispute-filing"],
    myDisputeCase: (questId: string, viewerId: string) => [
      "questBoard",
      "my-dispute-case",
      questId,
      viewerId,
    ],
  },
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
  return renderWithQueryClient(
    createElement(
      Fragment,
      null,
      createElement(DisputeAction),
      createElement(DisputeFormHost),
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
    expect(dialog.getByText(`• ${messages.rules[0]}`)).toBeTruthy();
    expect(
      dialog.getByRole("button", { name: messages.confirm }).props
        .accessibilityState.disabled
    ).toBe(true);
    await fireEvent.press(
      dialog.getByRole("button", { name: messages.cancel })
    );
    expect(mockMutate).not.toHaveBeenCalled();

    await fireEvent.press(dialog.getByRole("button", { name: "File dispute" }));
    await fireEvent.press(dialog.getByRole("radio", { name: "Other" }));
    await fireEvent.changeText(
      dialog.getByLabelText("Dispute details"),
      " Details "
    );
    await fireEvent.press(
      dialog.getByRole("button", { name: messages.confirm })
    );
    expect(mockMutate).toHaveBeenCalledWith(
      {
        questId: "quest-1",
        viewerId: "viewer-1",
        input: { category: "OTHER", submittedDetail: "Details" },
      },
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

  it("explains a rejected filing in localized copy, not the Server's text", async () => {
    const dialog = await renderDisputeAction();

    await fireEvent.press(dialog.getByRole("button", { name: "File dispute" }));
    await fireEvent.press(dialog.getByRole("radio", { name: "Other" }));
    await fireEvent.changeText(
      dialog.getByLabelText("Dispute details"),
      " Details "
    );
    await fireEvent.press(
      dialog.getByRole("button", { name: messages.confirm })
    );
    await act(async () => {
      mockMutate.mock.calls[0][1].onError(
        new ApiError(
          409,
          "DISPUTE_WINDOW_CLOSED",
          "The dispute filing window has closed"
        )
      );
    });

    expect(dialog.getByText(messages.errorTitle)).toBeTruthy();
    expect(dialog.getByText(messages.errorFallback)).toBeTruthy();
    expect(
      dialog.queryByText("The dispute filing window has closed")
    ).toBeNull();
    await fireEvent.press(dialog.getByRole("button", { name: "OK" }));
  });
  it("keeps the form and its input open when filing fails, closing only on success", async () => {
    const dialog = await renderDisputeAction();
    await fireEvent.press(dialog.getByRole("button", { name: "File dispute" }));
    await fireEvent.press(dialog.getByRole("radio", { name: "Other" }));
    await fireEvent.changeText(
      dialog.getByLabelText("Dispute details"),
      "Details"
    );
    await fireEvent.press(
      dialog.getByRole("button", { name: messages.confirm })
    );
    expect(dialog.getByText(messages.confirmTitle)).toBeTruthy();

    await act(async () => {
      const callbacks = mockMutate.mock.calls[0][1];
      callbacks.onError(new Error("Network request failed"));
      callbacks.onSettled();
    });
    await fireEvent.press(dialog.getByRole("button", { name: "OK" }));
    expect(dialog.getByLabelText("Dispute details").props.value).toBe(
      "Details"
    );

    await fireEvent.press(
      dialog.getByRole("button", { name: messages.confirm })
    );
    await act(async () => {
      mockMutate.mock.calls[1][1].onSuccess({ displayId: "DC-000124" });
    });
    expect(dialog.queryByText(messages.confirmTitle)).toBeNull();
  });

  it("submits only once when confirmation fires twice while pending", async () => {
    const dialog = await renderDisputeAction();
    await fireEvent.press(dialog.getByRole("button", { name: "File dispute" }));
    await fireEvent.press(dialog.getByRole("radio", { name: "Other" }));
    await fireEvent.changeText(
      dialog.getByLabelText("Dispute details"),
      "Details"
    );
    const confirmButton = dialog.getByRole("button", {
      name: messages.confirm,
    });

    await fireEvent.press(confirmButton);
    await fireEvent.press(confirmButton);

    expect(mockMutate).toHaveBeenCalledTimes(1);
  });
});
