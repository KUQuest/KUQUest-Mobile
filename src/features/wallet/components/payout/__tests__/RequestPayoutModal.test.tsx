import React from "react";
import { fireEvent, waitFor } from "@testing-library/react-native";
import { renderWithQueryClient } from "@/testing/queryTestUtils";
import { walletApi, type WalletBalances } from "@/api/WalletApi";
import { SweetAlertHost } from "@/components/ui/SweetAlert";
import { walletMessages } from "@/locales/walletMessages";
import { RequestPayoutModal } from "../RequestPayoutModal";

jest.mock("@/features/preferences/localeStore", () => ({
  useLocale: () => ({ locale: "th" }),
}));
jest.mock("@/api/WalletApi", () => {
  const original = jest.requireActual("@/api/WalletApi");
  return {
    ...original,
    walletApi: {
      getActivePayoutDestination: jest.fn(),
      quotePayout: jest.fn(),
      createPayout: jest.fn(),
    },
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

const m = walletMessages.th;
const balances: WalletBalances = {
  spendingBalanceSatang: 0,
  earningsBalanceSatang: 50_000,
  fundingReservedSatang: 0,
  reservedForPayoutsSatang: 0,
};
const destination = {
  id: "dest-1",
  accountHolderName: "Somchai Jaidee",
  bankCode: "KBANK",
  maskedAccount: "•••• 1234",
  createdAt: "2026-01-01T00:00:00Z",
};

function makeQuote(overrides: Record<string, unknown> = {}) {
  return {
    id: "quote-1",
    receiptSatang: 10_000,
    maximumFeeSatang: 1_500,
    maximumTaxSatang: 45,
    maximumDebitSatang: 11_545,
    expiresAt: new Date(Date.now() + 5 * 60_000).toISOString(),
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

async function renderModal(props: { onManage?: jest.Mock } = {}) {
  const onClose = jest.fn();
  const onSuccess = jest.fn();
  const onManageDestination = props.onManage ?? jest.fn();
  const view = await renderWithQueryClient(
    <>
      <RequestPayoutModal
        balances={balances}
        messages={m}
        onClose={onClose}
        onManageDestination={onManageDestination}
        onSuccess={onSuccess}
        visible
      />
      <SweetAlertHost />
    </>
  );
  return { view, onClose, onSuccess, onManageDestination };
}

describe("RequestPayoutModal", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (walletApi.getActivePayoutDestination as jest.Mock).mockResolvedValue(
      destination
    );
  });

  it("asks for a payout account before any Payout can be quoted", async () => {
    (walletApi.getActivePayoutDestination as jest.Mock).mockResolvedValue(null);
    const { view, onManageDestination } = await renderModal();

    await waitFor(() =>
      expect(view.getByTestId("payout-request-no-destination")).toBeTruthy()
    );
    await fireEvent.press(
      view.getByTestId("payout-request-add-destination-btn")
    );
    expect(onManageDestination).toHaveBeenCalled();
    expect(
      view.getByTestId("payout-quote-btn").props.accessibilityState.disabled
    ).toBe(true);
  });

  it("offers a retry when the payout account fails to load", async () => {
    (walletApi.getActivePayoutDestination as jest.Mock)
      .mockRejectedValueOnce(new Error("boom"))
      .mockResolvedValueOnce(destination);
    const { view } = await renderModal();

    await waitFor(() =>
      expect(view.getByTestId("payout-request-destination-error")).toBeTruthy()
    );
    await fireEvent.press(view.getByTestId("payout-request-destination-retry"));
    await waitFor(() =>
      expect(view.getByTestId("payout-request-destination")).toBeTruthy()
    );
  });

  it("blocks the quote when the amount exceeds Earnings", async () => {
    const { view } = await renderModal();
    await waitFor(() =>
      expect(view.getByTestId("payout-request-destination")).toBeTruthy()
    );

    await fireEvent.changeText(view.getByTestId("payout-amount-input"), "600");

    expect(view.getByText(m.payoutInsufficientEarnings)).toBeTruthy();
    expect(
      view.getByTestId("payout-quote-btn").props.accessibilityState.disabled
    ).toBe(true);
    expect(walletApi.quotePayout).not.toHaveBeenCalled();
  });

  it("quotes the receipt amount, shows fee, tax and debit, then creates the Payout with the quote and an idempotency key", async () => {
    (walletApi.quotePayout as jest.Mock).mockResolvedValue(makeQuote());
    (walletApi.createPayout as jest.Mock).mockResolvedValue({
      id: "payout-1",
    });
    const { view, onClose, onSuccess } = await renderModal();
    await waitFor(() =>
      expect(view.getByTestId("payout-request-destination")).toBeTruthy()
    );

    await fireEvent.changeText(view.getByTestId("payout-amount-input"), "100");
    await fireEvent.press(view.getByTestId("payout-quote-btn"));

    await waitFor(() =>
      expect(view.getByTestId("payout-quote-summary")).toBeTruthy()
    );
    expect(walletApi.quotePayout).toHaveBeenCalledWith(10_000);
    expect(view.getByTestId("payout-quote-receipt")).toHaveTextContent(
      "฿100.00"
    );
    expect(view.getByTestId("payout-quote-fee")).toHaveTextContent("฿15.00");
    expect(view.getByTestId("payout-quote-tax")).toHaveTextContent("฿0.45");
    expect(view.getByTestId("payout-quote-debit")).toHaveTextContent("฿115.45");

    await fireEvent.press(view.getByTestId("payout-confirm-btn"));

    await waitFor(() => expect(walletApi.createPayout).toHaveBeenCalled());
    const [quoteId, key] = (walletApi.createPayout as jest.Mock).mock.calls[0];
    expect(quoteId).toBe("quote-1");
    expect(typeof key).toBe("string");
    expect(key.length).toBeGreaterThan(0);
    await waitFor(() => expect(onSuccess).toHaveBeenCalled());
    expect(onClose).toHaveBeenCalled();
  });

  it("reuses the same idempotency key when a failed confirm is retried", async () => {
    (walletApi.quotePayout as jest.Mock).mockResolvedValue(makeQuote());
    (walletApi.createPayout as jest.Mock)
      .mockRejectedValueOnce(new Error("network"))
      .mockResolvedValueOnce({ id: "payout-1" });
    const { view } = await renderModal();
    await waitFor(() =>
      expect(view.getByTestId("payout-request-destination")).toBeTruthy()
    );

    await fireEvent.changeText(view.getByTestId("payout-amount-input"), "100");
    await fireEvent.press(view.getByTestId("payout-quote-btn"));
    await waitFor(() =>
      expect(view.getByTestId("payout-confirm-btn")).toBeTruthy()
    );

    await fireEvent.press(view.getByTestId("payout-confirm-btn"));
    await waitFor(() => expect(view.getByTestId("payout-error")).toBeTruthy());
    await fireEvent.press(view.getByTestId("payout-confirm-btn"));
    await waitFor(() =>
      expect(walletApi.createPayout).toHaveBeenCalledTimes(2)
    );

    const calls = (walletApi.createPayout as jest.Mock).mock.calls;
    expect(calls[0][1]).toBe(calls[1][1]);
  });

  it("disables confirmation when the quoted debit is more than Earnings", async () => {
    (walletApi.quotePayout as jest.Mock).mockResolvedValue(
      makeQuote({ receiptSatang: 49_000, maximumDebitSatang: 50_500 })
    );
    const { view } = await renderModal();
    await waitFor(() =>
      expect(view.getByTestId("payout-request-destination")).toBeTruthy()
    );

    await fireEvent.changeText(view.getByTestId("payout-amount-input"), "490");
    await fireEvent.press(view.getByTestId("payout-quote-btn"));

    await waitFor(() =>
      expect(view.getByTestId("payout-quote-insufficient")).toBeTruthy()
    );
    expect(
      view.getByTestId("payout-confirm-btn").props.accessibilityState.disabled
    ).toBe(true);
    await fireEvent.press(view.getByTestId("payout-confirm-btn"));
    expect(walletApi.createPayout).not.toHaveBeenCalled();
  });

  it("returns to the amount step when the quote has expired", async () => {
    (walletApi.quotePayout as jest.Mock).mockResolvedValue(
      makeQuote({ expiresAt: new Date(Date.now() - 1000).toISOString() })
    );
    const { view } = await renderModal();
    await waitFor(() =>
      expect(view.getByTestId("payout-request-destination")).toBeTruthy()
    );

    await fireEvent.changeText(view.getByTestId("payout-amount-input"), "100");
    await fireEvent.press(view.getByTestId("payout-quote-btn"));
    await waitFor(() =>
      expect(view.getByTestId("payout-confirm-btn")).toBeTruthy()
    );
    await fireEvent.press(view.getByTestId("payout-confirm-btn"));

    await waitFor(() =>
      expect(view.getByText(m.payoutQuoteExpired)).toBeTruthy()
    );
    expect(view.getByTestId("payout-quote-btn")).toBeTruthy();
    expect(walletApi.createPayout).not.toHaveBeenCalled();
  });

  it("shows an error and stays on the amount step when the quote fails", async () => {
    (walletApi.quotePayout as jest.Mock).mockRejectedValue(new Error("boom"));
    const { view } = await renderModal();
    await waitFor(() =>
      expect(view.getByTestId("payout-request-destination")).toBeTruthy()
    );

    await fireEvent.changeText(view.getByTestId("payout-amount-input"), "100");
    await fireEvent.press(view.getByTestId("payout-quote-btn"));

    await waitFor(() => expect(view.getByTestId("payout-error")).toBeTruthy());
    expect(view.queryByTestId("payout-quote-summary")).toBeNull();
  });

  it("explains when there are no Earnings to pay out", async () => {
    const view = await renderWithQueryClient(
      <RequestPayoutModal
        balances={{ ...balances, earningsBalanceSatang: 0 }}
        messages={m}
        onClose={jest.fn()}
        onManageDestination={jest.fn()}
        onSuccess={jest.fn()}
        visible
      />
    );
    expect(view.getByTestId("payout-no-earnings-hint")).toBeTruthy();
  });
});
