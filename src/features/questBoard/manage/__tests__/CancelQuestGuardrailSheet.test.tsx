import React from "react";
import { fireEvent, render } from "@testing-library/react-native";
import { CancelQuestGuardrailSheet } from "../CancelQuestGuardrailSheet";

interface GestureMockChain {
  onUpdate: () => GestureMockChain;
  onEnd: () => GestureMockChain;
  enabled: () => GestureMockChain;
}

jest.mock("react-native-gesture-handler", () => {
  const { View } = jest.requireActual("react-native");
  const chain: GestureMockChain = {
    onUpdate: () => chain,
    onEnd: () => chain,
    enabled: () => chain,
  };
  return {
    Gesture: { Pan: () => chain },
    GestureDetector: ({ children }: { children: React.ReactNode }) => children,
    GestureHandlerRootView: View,
  };
});

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

const props = {
  visible: true,
  tier: 3 as const,
  title: "Cancel Quest?",
  description: "Workers receive their full Reward.",
  confirmLabel: "Confirm cancellation",
  cancelLabel: "Keep Quest",
  keyword: "CANCEL",
  keywordLabel: "Type CANCEL to confirm",
  keywordPlaceholder: "CANCEL",
  slideLabel: "Slide to cancel this Quest",
  onConfirm: jest.fn(),
  onClose: jest.fn(),
};

describe("CancelQuestGuardrailSheet", () => {
  beforeEach(() => jest.clearAllMocks());

  it("keeps confirm disabled for a near-miss and confirms once on exact case-insensitive match", async () => {
    const view = await render(<CancelQuestGuardrailSheet {...props} />);
    const confirm = view.getByTestId("cancel-guardrail-confirm");
    expect(confirm.props.accessibilityState.disabled).toBe(true);

    await fireEvent.changeText(
      view.getByLabelText(props.keywordLabel),
      "CANCEL!"
    );
    expect(
      view.getByTestId("cancel-guardrail-confirm").props.accessibilityState
        .disabled
    ).toBe(true);
    await fireEvent.changeText(
      view.getByLabelText(props.keywordLabel),
      " cancel "
    );
    expect(
      view.getByTestId("cancel-guardrail-confirm").props.accessibilityState
        .disabled
    ).toBe(false);
    await fireEvent.press(view.getByTestId("cancel-guardrail-confirm"));
    expect(props.onConfirm).toHaveBeenCalledTimes(1);
  });

  it("tier 2 confirm button works without dragging", async () => {
    const view = await render(
      <CancelQuestGuardrailSheet {...props} tier={2} />
    );
    expect(view.getByText(props.slideLabel)).toBeTruthy();
    await fireEvent.press(view.getByTestId("cancel-guardrail-confirm"));
    expect(props.onConfirm).toHaveBeenCalledTimes(1);
  });

  it("busy disables confirm but not Keep", async () => {
    const view = await render(<CancelQuestGuardrailSheet {...props} busy />);
    expect(
      view.getByTestId("cancel-guardrail-confirm").props.accessibilityState
    ).toEqual({ busy: true, disabled: true });
    await fireEvent.press(view.getByLabelText(props.cancelLabel));
    expect(props.onClose).toHaveBeenCalledTimes(1);
    await fireEvent.press(view.getByTestId("cancel-guardrail-confirm"));
    expect(props.onConfirm).not.toHaveBeenCalled();
  });
});
