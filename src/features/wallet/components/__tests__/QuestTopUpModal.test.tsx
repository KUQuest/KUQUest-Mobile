import React from "react";
import { render } from "@testing-library/react-native";
import { QuestTopUpModal } from "../QuestTopUpModal";

const mockOpenTopUp = jest.fn();

jest.mock("../questTopUpModal/useQuestTopUpFlow", () => ({
  useQuestTopUpFlow: () => ({
    openTopUp: mockOpenTopUp,
    topUpStep: "promptPay",
    activeTopUp: null,
    isConfirming: false,
    handleTopUpBack: jest.fn(),
  }),
}));
jest.mock("@/features/workspace/AppThemeProvider", () => ({
  useAppTheme: () => ({ scheme: "light" }),
}));
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock("../TopUpHeader", () => ({ TopUpHeader: () => null }));

describe("QuestTopUpModal", () => {
  beforeEach(() => mockOpenTopUp.mockClear());

  it("keeps the active top-up when the suggested amount changes while open", async () => {
    const props = { locale: "en" as const, onClose: jest.fn() };
    const { rerender } = await render(
      <QuestTopUpModal {...props} suggestedAmountSatang={5000} visible />
    );
    await rerender(
      <QuestTopUpModal {...props} suggestedAmountSatang={2000} visible />
    );

    expect(mockOpenTopUp).toHaveBeenCalledTimes(1);
    expect(mockOpenTopUp).toHaveBeenCalledWith(5000);
  });

  it("seeds the latest suggested amount when reopened", async () => {
    const props = { locale: "en" as const, onClose: jest.fn() };
    const { rerender } = await render(
      <QuestTopUpModal {...props} suggestedAmountSatang={5000} visible />
    );
    await rerender(
      <QuestTopUpModal
        {...props}
        suggestedAmountSatang={2000}
        visible={false}
      />
    );
    await rerender(
      <QuestTopUpModal {...props} suggestedAmountSatang={2000} visible />
    );

    expect(mockOpenTopUp).toHaveBeenLastCalledWith(2000);
    expect(mockOpenTopUp).toHaveBeenCalledTimes(2);
  });
});
