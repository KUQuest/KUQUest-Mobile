import React from "react";
import { fireEvent, waitFor } from "@testing-library/react-native";
import { renderWithQueryClient } from "@/testing/queryTestUtils";
import { PayoutModal } from "../PayoutModal";
import { walletApi } from "@/api/WalletApi";

jest.mock("@/api/WalletApi", () => {
  const original = jest.requireActual("@/api/WalletApi");
  return {
    ...original,
    walletApi: {
      listPayoutDestinations: jest.fn(),
      createPayoutDestination: jest.fn(),
      requestPayout: jest.fn(),
    },
  };
});

describe("PayoutModal", () => {
  const mockOnClose = jest.fn();
  const mockOnPayoutSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders earnings balance in THB and loads destinations", async () => {
    (walletApi.listPayoutDestinations as jest.Mock).mockResolvedValue([
      {
        id: "dest-1",
        type: "PROMPTPAY",
        accountHolderName: "Somchai Jaidee",
        maskedAccount: "xxx-xxx-1234",
        isDefault: true,
        createdAt: "2026-09-17T10:00:00Z",
      },
    ]);

    const view = await renderWithQueryClient(
      <PayoutModal
        earningsSatang={50000}
        locale="en"
        onClose={mockOnClose}
        onPayoutSuccess={mockOnPayoutSuccess}
        visible={true}
      />
    );

    expect(view.getByTestId("payout-modal")).toBeTruthy();
    expect(view.getByTestId("payout-available-balance")).toBeTruthy();
    expect(view.getByText("฿500.00")).toBeTruthy();

    await waitFor(() => {
      expect(view.getByText("Somchai Jaidee")).toBeTruthy();
      expect(view.getByText("xxx-xxx-1234")).toBeTruthy();
      expect(
        view.getByTestId("payout-destination-item-dest-1").props
          .accessibilityState
      ).toEqual({ selected: true });
    });
  });

  it("validates amount < 10000 satang (min ฿100)", async () => {
    (walletApi.listPayoutDestinations as jest.Mock).mockResolvedValue([
      {
        id: "dest-1",
        type: "PROMPTPAY",
        accountHolderName: "Somchai Jaidee",
        maskedAccount: "xxx-xxx-1234",
        isDefault: true,
        createdAt: "2026-09-17T10:00:00Z",
      },
    ]);

    const view = await renderWithQueryClient(
      <PayoutModal
        earningsSatang={50000}
        locale="en"
        onClose={mockOnClose}
        onPayoutSuccess={mockOnPayoutSuccess}
        visible={true}
      />
    );

    await waitFor(() => {
      expect(view.getByText("Somchai Jaidee")).toBeTruthy();
    });

    fireEvent.changeText(view.getByTestId("payout-amount-input"), "50");
    await waitFor(() => {
      expect(view.getByTestId("payout-amount-input").props.value).toBe("50");
    });

    fireEvent.press(view.getByTestId("payout-submit-button"));
    expect(walletApi.requestPayout).not.toHaveBeenCalled();
  });

  it("allows creating a new payout destination", async () => {
    (walletApi.listPayoutDestinations as jest.Mock).mockResolvedValue([]);
    (walletApi.createPayoutDestination as jest.Mock).mockResolvedValue({
      id: "dest-new",
      type: "PROMPTPAY",
      accountHolderName: "Anan S.",
      maskedAccount: "xxx-xxx-9999",
      isDefault: false,
      createdAt: "2026-09-17T11:00:00Z",
    });

    const view = await renderWithQueryClient(
      <PayoutModal
        earningsSatang={50000}
        locale="en"
        onClose={mockOnClose}
        onPayoutSuccess={mockOnPayoutSuccess}
        visible={true}
      />
    );

    await waitFor(() => {
      expect(view.getByTestId("payout-account-number-input")).toBeTruthy();
    });

    fireEvent.changeText(
      view.getByTestId("payout-account-number-input"),
      "0899999999"
    );
    await waitFor(() => {
      expect(view.getByTestId("payout-account-number-input").props.value).toBe(
        "0899999999"
      );
    });
    fireEvent.changeText(
      view.getByTestId("payout-holder-name-input"),
      "Anan S."
    );
    await waitFor(() => {
      expect(view.getByTestId("payout-holder-name-input").props.value).toBe(
        "Anan S."
      );
    });

    fireEvent.press(view.getByTestId("payout-save-destination-button"));

    await waitFor(() => {
      expect(walletApi.createPayoutDestination).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "PROMPTPAY",
          accountNumber: "0899999999",
          accountHolderName: "Anan S.",
        })
      );
      expect(view.getByText("Anan S.")).toBeTruthy();
      expect(view.queryByText("0899999999")).toBeNull();
    });
  });

  it("successfully requests payout and displays confirmation", async () => {
    (walletApi.listPayoutDestinations as jest.Mock).mockResolvedValue([
      {
        id: "dest-1",
        type: "PROMPTPAY",
        accountHolderName: "Somchai Jaidee",
        maskedAccount: "xxx-xxx-1234",
        isDefault: true,
        createdAt: "2026-09-17T10:00:00Z",
      },
    ]);
    (walletApi.requestPayout as jest.Mock).mockResolvedValue({
      id: "payout-99",
      amountSatang: 10000,
      feeSatang: 0,
      status: "PENDING_ADMIN_APPROVAL",
      destination: {
        type: "PROMPTPAY",
        maskedAccount: "xxx-xxx-1234",
      },
      createdAt: "2026-09-17T10:00:00Z",
    });

    const view = await renderWithQueryClient(
      <PayoutModal
        earningsSatang={50000}
        locale="en"
        onClose={mockOnClose}
        onPayoutSuccess={mockOnPayoutSuccess}
        visible={true}
      />
    );

    await waitFor(() => {
      expect(view.getByText("Somchai Jaidee")).toBeTruthy();
    });

    fireEvent.changeText(view.getByTestId("payout-amount-input"), "100");

    await waitFor(() => {
      expect(view.getByTestId("payout-amount-input").props.value).toBe("100");
    });

    fireEvent.press(view.getByTestId("payout-submit-button"));

    await waitFor(() => {
      expect(walletApi.requestPayout).toHaveBeenCalledWith(10000, "dest-1");
      expect(mockOnPayoutSuccess).toHaveBeenCalled();
      expect(view.getByTestId("payout-success-view")).toBeTruthy();
      expect(view.getByText("PENDING_ADMIN_APPROVAL")).toBeTruthy();
    });

    fireEvent.press(view.getByTestId("payout-done-button"));
    expect(mockOnClose).toHaveBeenCalled();
  });
});
