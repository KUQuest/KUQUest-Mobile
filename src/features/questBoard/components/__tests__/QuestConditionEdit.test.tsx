import React from "react";
import { act, fireEvent, render } from "@testing-library/react-native";

import { QuestConditionEditModal } from "../QuestConditionEditModal";
import { QuestConditionEditStatusCard } from "../QuestConditionEditStatusCard";
import { questBoardMessages } from "@/locales/questBoardMessages";
import type { QuestV2EditRequest } from "@/api/questV2Contracts";

jest.mock("@/locales/LocaleProvider", () => ({
  useLocale: () => ({ locale: "en" }),
}));

jest.mock("react-native/Libraries/Modal/Modal", () => ({
  __esModule: true,
  default: ({
    visible,
    children,
  }: {
    visible: boolean;
    children: React.ReactNode;
  }) => (visible ? <>{children}</> : null),
}));

const messages = questBoardMessages.en;

function makeEditRequest(
  overrides: Partial<QuestV2EditRequest> = {}
): QuestV2EditRequest {
  return {
    requestId: "edit-1",
    questId: "quest-1",
    status: "EDIT_REQUEST_PENDING",
    failureCode: null,
    createdAt: "2026-08-12T09:00:00.000Z",
    expiresAt: "2026-08-12T09:05:00.000Z",
    appliedAt: null,
    failedAt: null,
    previousCondition: { items: [{ position: 0, text: "Old condition" }] },
    proposedCondition: { items: [{ position: 0, text: "New condition" }] },
    responseSummary: {
      totalCount: 3,
      acceptedCount: 1,
      declinedCount: 0,
      pendingCount: 2,
    },
    ...overrides,
  };
}

describe("QuestConditionEditModal", () => {
  it("renders the original condition items when opened", async () => {
    const view = await render(
      <QuestConditionEditModal
        visible
        originalItems={["Finish the mural", "Clean the wall"]}
        onClose={jest.fn()}
        onSubmit={jest.fn()}
      />
    );
    expect(view.getByTestId("quest-condition-item-0").props.value).toBe(
      "Finish the mural"
    );
    expect(view.getByTestId("quest-condition-item-1").props.value).toBe(
      "Clean the wall"
    );
  });

  it("disables submit until a change is made, then submits trimmed items", async () => {
    const onSubmit = jest.fn();
    const view = await render(
      <QuestConditionEditModal
        visible
        originalItems={["Finish the mural"]}
        onClose={jest.fn()}
        onSubmit={onSubmit}
      />
    );
    expect(
      view.getByTestId("quest-condition-submit").props.accessibilityState
        .disabled
    ).toBe(true);

    await fireEvent.changeText(
      view.getByTestId("quest-condition-item-0"),
      "Finish the mural in blue  "
    );
    expect(
      view.getByTestId("quest-condition-submit").props.accessibilityState
        .disabled
    ).toBe(false);

    await fireEvent.press(view.getByTestId("quest-condition-submit"));
    expect(onSubmit).toHaveBeenCalledWith(["Finish the mural in blue"]);
  });

  it("prevents removing the last remaining condition item", async () => {
    const view = await render(
      <QuestConditionEditModal
        visible
        originalItems={["Only condition"]}
        onClose={jest.fn()}
        onSubmit={jest.fn()}
      />
    );
    expect(
      view.getByTestId("quest-condition-remove-0").props.accessibilityState
        .disabled
    ).toBe(true);
  });

  it("adds and removes condition items, updating the diff preview", async () => {
    const view = await render(
      <QuestConditionEditModal
        visible
        originalItems={["Finish the mural"]}
        onClose={jest.fn()}
        onSubmit={jest.fn()}
      />
    );
    expect(view.queryByText(messages.conditionNoChanges)).toBeTruthy();

    await fireEvent.press(view.getByTestId("quest-condition-add"));
    await fireEvent.changeText(
      view.getByTestId("quest-condition-item-1"),
      "Return the tools"
    );
    expect(view.getByText("+ Return the tools")).toBeTruthy();

    await fireEvent.press(view.getByTestId("quest-condition-remove-0"));
    expect(view.getByText("Finish the mural")).toBeTruthy();
  });

  it("reorders items and reports the change as a reorder, not add/remove", async () => {
    const view = await render(
      <QuestConditionEditModal
        visible
        originalItems={["First step", "Second step"]}
        onClose={jest.fn()}
        onSubmit={jest.fn()}
      />
    );
    await fireEvent.press(view.getByTestId("quest-condition-move-down-0"));
    expect(view.getByTestId("quest-condition-item-0").props.value).toBe(
      "Second step"
    );
    expect(view.getByTestId("quest-condition-item-1").props.value).toBe(
      "First step"
    );
    expect(view.getByText(messages.conditionDiffReordered)).toBeTruthy();
  });

  it("blocks submission while a condition item is left empty", async () => {
    const onSubmit = jest.fn();
    const view = await render(
      <QuestConditionEditModal
        visible
        originalItems={["Finish the mural"]}
        onClose={jest.fn()}
        onSubmit={onSubmit}
      />
    );
    await fireEvent.press(view.getByTestId("quest-condition-add"));
    expect(view.getByText(messages.conditionItemRequired)).toBeTruthy();
    await fireEvent.press(view.getByTestId("quest-condition-submit"));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("shows the submitting label while a submission is in flight", async () => {
    const view = await render(
      <QuestConditionEditModal
        visible
        originalItems={["Finish the mural"]}
        onClose={jest.fn()}
        onSubmit={jest.fn()}
        submitting
      />
    );
    expect(view.getByText(messages.submittingConditionEdit)).toBeTruthy();
  });

  it("surfaces a submit error passed from the caller", async () => {
    const view = await render(
      <QuestConditionEditModal
        visible
        originalItems={["Finish the mural"]}
        onClose={jest.fn()}
        onSubmit={jest.fn()}
        error="Unable to submit the condition edit. Try again."
      />
    );
    expect(
      view.getByText("Unable to submit the condition edit. Try again.")
    ).toBeTruthy();
  });
});

describe("QuestConditionEditStatusCard", () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it("shows the voting progress and a live countdown", async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-08-12T09:00:00.000Z"));
    const editRequest = makeEditRequest({
      expiresAt: "2026-08-12T09:01:30.000Z",
    });
    const view = await render(
      <QuestConditionEditStatusCard
        editRequest={editRequest}
        messages={messages}
      />
    );
    expect(
      view.getByTestId("hirer-condition-edit-progress").props.children
    ).toBe(messages.conditionEditVotingProgress(1, 3));
    expect(
      view.getByTestId("hirer-condition-edit-countdown").props.children
    ).toBe("01:30");

    await act(async () => {
      jest.advanceTimersByTime(30 * 1000);
    });
    expect(
      view.getByTestId("hirer-condition-edit-countdown").props.children
    ).toBe("01:00");
  });

  it("floors the countdown at zero once the deadline has passed", async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-08-12T09:00:00.000Z"));
    const editRequest = makeEditRequest({
      expiresAt: "2026-08-12T08:59:59.000Z",
    });
    const view = await render(
      <QuestConditionEditStatusCard
        editRequest={editRequest}
        messages={messages}
      />
    );
    expect(
      view.getByTestId("hirer-condition-edit-countdown").props.children
    ).toBe("00:00");
  });
});
