import React from "react";
import { Alert } from "react-native";
import { fireEvent, waitFor } from "@testing-library/react-native";
import { renderWithQueryClient } from "@/testing/queryTestUtils";
import { walletApi, type WalletBalances } from "@/api/WalletApi";
import { walletMessages } from "@/locales/walletMessages";
import { TransferEarningsModal } from "../TransferEarningsModal";

jest.mock("@/api/WalletApi", () => ({
  walletApi: {
    convertEarnings: jest.fn(),
  },
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

const mockBalances: WalletBalances = {
  spendingBalanceSatang: 200_000,
  earningsBalanceSatang: 50_000,
  fundingReservedSatang: 0,
  reservedForPayoutsSatang: 0,
};

const m = walletMessages.th;

describe("TransferEarningsModal", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, "alert").mockImplementation(() => {});
  });

  it("renders modal with compartment flow, policy note, and available balances", async () => {
    const view = await renderWithQueryClient(
      <TransferEarningsModal
        balances={mockBalances}
        messages={m}
        onClose={jest.fn()}
        onSuccess={jest.fn()}
        visible={true}
      />
    );

    expect(view.getByTestId("transfer-earnings-modal")).toBeTruthy();
    expect(view.getByText(m.transferEarningsTitle)).toBeTruthy();
    expect(view.getByTestId("transfer-current-earnings")).toHaveTextContent(
      "฿500.00"
    );
    expect(view.getByTestId("transfer-current-spending")).toHaveTextContent(
      "฿2,000.00"
    );
    expect(view.getByText(m.transferFeeFree)).toBeTruthy();
    expect(view.getByText(m.transferPolicyNote)).toBeTruthy();
  });

  it("sets maximum available earnings when 'โอนทั้งหมด' (Max) is pressed", async () => {
    const view = await renderWithQueryClient(
      <TransferEarningsModal
        balances={mockBalances}
        messages={m}
        onClose={jest.fn()}
        onSuccess={jest.fn()}
        visible={true}
      />
    );

    fireEvent.press(view.getByTestId("transfer-amount-max-btn"));

    await waitFor(() => {
      const input = view.getByTestId("transfer-amount-input");
      expect(input.props.value).toBe("500.00");
    });
  });

  it("sets preset amount when preset chip is pressed", async () => {
    const view = await renderWithQueryClient(
      <TransferEarningsModal
        balances={mockBalances}
        messages={m}
        onClose={jest.fn()}
        onSuccess={jest.fn()}
        visible={true}
      />
    );

    fireEvent.press(view.getByTestId("transfer-preset-100"));

    await waitFor(() => {
      const input = view.getByTestId("transfer-amount-input");
      expect(input.props.value).toBe("100.00");
    });
  });

  it("executes transfer and calls walletApi.convertEarnings with correct satang", async () => {
    (walletApi.convertEarnings as jest.Mock).mockResolvedValueOnce({
      id: "conv-1",
      amountSatang: 10_000,
    });

    const onSuccess = jest.fn();
    const onClose = jest.fn();

    const view = await renderWithQueryClient(
      <TransferEarningsModal
        balances={mockBalances}
        messages={m}
        onClose={onClose}
        onSuccess={onSuccess}
        visible={true}
      />
    );

    // Enter 100 Baht (10,000 Satang)
    fireEvent.changeText(view.getByTestId("transfer-amount-input"), "100.00");

    await waitFor(() => {
      expect(view.getByTestId("transfer-amount-input").props.value).toBe(
        "100.00"
      );
    });

    // Press confirm transfer button
    fireEvent.press(view.getByTestId("transfer-confirm-btn"));
    await waitFor(() => {
      expect(walletApi.convertEarnings).toHaveBeenCalledWith(10_000);
      expect(onSuccess).toHaveBeenCalledWith(10_000);
      expect(onClose).toHaveBeenCalled();
      expect(Alert.alert).toHaveBeenCalledWith(
        m.transferSuccessTitle,
        expect.stringContaining("฿100")
      );
    });
  });

  it("shows warning when user has zero earnings", async () => {
    const zeroBalances: WalletBalances = {
      ...mockBalances,
      earningsBalanceSatang: 0,
    };

    const view = await renderWithQueryClient(
      <TransferEarningsModal
        balances={zeroBalances}
        messages={m}
        onClose={jest.fn()}
        onSuccess={jest.fn()}
        visible={true}
      />
    );

    expect(view.getByTestId("transfer-no-earnings-hint")).toBeTruthy();
    expect(view.getByText(m.noEarningsAvailable)).toBeTruthy();

    const confirmBtn = view.getByTestId("transfer-confirm-btn");
    expect(confirmBtn.props.accessibilityState.disabled).toBe(true);
  });

  it("displays error message when conversion API fails", async () => {
    (walletApi.convertEarnings as jest.Mock).mockRejectedValueOnce(
      new Error("Wallet is frozen")
    );

    const view = await renderWithQueryClient(
      <TransferEarningsModal
        balances={mockBalances}
        messages={m}
        onClose={jest.fn()}
        onSuccess={jest.fn()}
        visible={true}
      />
    );

    fireEvent.changeText(view.getByTestId("transfer-amount-input"), "50");
    await waitFor(() => {
      expect(view.getByTestId("transfer-amount-input").props.value).toBe("50");
    });
    fireEvent.press(view.getByTestId("transfer-confirm-btn"));

    await waitFor(() => {
      expect(view.getByText("Wallet is frozen")).toBeTruthy();
    });
  });

  it("calls onClose when close button is pressed", async () => {
    const onClose = jest.fn();
    const view = await renderWithQueryClient(
      <TransferEarningsModal
        balances={mockBalances}
        messages={m}
        onClose={onClose}
        onSuccess={jest.fn()}
        visible={true}
      />
    );

    fireEvent.press(view.getByTestId("transfer-modal-close-btn"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
