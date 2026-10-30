import React from "react";
import { fireEvent, waitFor } from "@testing-library/react-native";
import { renderWithQueryClient } from "@/testing/queryTestUtils";
import { walletApi, type WalletBalances } from "@/api/WalletApi";
import { SweetAlertHost } from "@/components/ui/SweetAlert";
import { walletMessages } from "@/locales/walletMessages";
import { PayoutSheet } from "../PayoutSheet";

jest.mock("@/features/preferences/localeStore", () => ({
  useLocale: () => ({ locale: "th" }),
}));
jest.mock("@/api/WalletApi", () => {
  const original = jest.requireActual("@/api/WalletApi");
  return {
    ...original,
    walletApi: {
      getActivePayoutDestination: jest.fn(),
      createPayoutDestination: jest.fn(),
      retireActivePayoutDestination: jest.fn(),
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

async function renderSheet(props: { earningsSatang?: number } = {}) {
  const onClose = jest.fn();
  const onSuccess = jest.fn();
  const view = await renderWithQueryClient(
    <>
      <PayoutSheet
        balances={{
          ...balances,
          earningsBalanceSatang: props.earningsSatang ?? 50_000,
        }}
        messages={m}
        onClose={onClose}
        onSuccess={onSuccess}
        visible
      />
      <SweetAlertHost />
    </>
  );
  return { view, onClose, onSuccess };
}

type SheetView = Awaited<ReturnType<typeof renderSheet>>["view"];

async function waitForDestinationRow(view: SheetView) {
  await waitFor(() =>
    expect(view.getByTestId("payout-request-destination")).toBeTruthy()
  );
}

async function waitForAddDestination(view: SheetView) {
  await waitFor(() =>
    expect(view.getByTestId("payout-request-add-destination-btn")).toBeTruthy()
  );
}

async function reachReview(view: SheetView, amount = "100") {
  await waitForDestinationRow(view);
  await fireEvent.changeText(view.getByTestId("payout-amount-input"), amount);
  await fireEvent.press(view.getByTestId("payout-quote-btn"));
  await waitFor(() =>
    expect(view.getByTestId("payout-quote-summary")).toBeTruthy()
  );
}

async function fillForm(view: SheetView) {
  await fireEvent.changeText(
    view.getByTestId("payout-destination-given-name"),
    " Somchai "
  );
  await fireEvent.changeText(
    view.getByTestId("payout-destination-surname"),
    "Jaidee"
  );
  await fireEvent.changeText(
    view.getByTestId("payout-destination-holder-name"),
    "Somchai Jaidee"
  );
  await fireEvent.press(view.getByTestId("select-trigger"));
  await fireEvent.press(
    view.getByLabelText(`${m.destinationBankLabel}: ธนาคารกสิกรไทย (KBANK)`)
  );
  await fireEvent.changeText(
    view.getByTestId("payout-destination-account-number"),
    "123-4-56789-0"
  );
}

function reviewDisabled(view: SheetView) {
  return view.getByTestId("payout-quote-btn").props.accessibilityState.disabled;
}

describe("PayoutSheet", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (walletApi.getActivePayoutDestination as jest.Mock).mockResolvedValue(
      destination
    );
  });

  describe("amount step", () => {
    it("asks for a payout account before any Payout can be reviewed", async () => {
      (walletApi.getActivePayoutDestination as jest.Mock).mockResolvedValue(
        null
      );
      const { view } = await renderSheet();
      await waitForAddDestination(view);

      await fireEvent.changeText(
        view.getByTestId("payout-amount-input"),
        "100"
      );
      expect(reviewDisabled(view)).toBe(true);

      await fireEvent.press(
        view.getByTestId("payout-request-add-destination-btn")
      );
      expect(view.getByTestId("payout-destination-save-btn")).toBeTruthy();
      expect(view.getByText(m.destinationFormTitle)).toBeTruthy();
    });

    it("offers a retry when the payout account fails to load", async () => {
      (walletApi.getActivePayoutDestination as jest.Mock)
        .mockRejectedValueOnce(new Error("boom"))
        .mockResolvedValueOnce(destination);
      const { view } = await renderSheet();

      await waitFor(() =>
        expect(
          view.getByTestId("payout-request-destination-error")
        ).toBeTruthy()
      );
      await fireEvent.press(
        view.getByTestId("payout-request-destination-retry")
      );
      await waitForDestinationRow(view);
    });

    it("names the bank and masked account on the destination row", async () => {
      const { view } = await renderSheet();
      await waitForDestinationRow(view);

      expect(
        view.getByTestId("payout-request-destination").props.accessibilityLabel
      ).toContain("•••• 1234");
      expect(
        view.getByTestId("bank-logo-KBANK", { hidden: true })
      ).toBeTruthy();
    });

    it("blocks the review when the amount exceeds Earnings", async () => {
      const { view } = await renderSheet();
      await waitForDestinationRow(view);

      await fireEvent.changeText(
        view.getByTestId("payout-amount-input"),
        "600"
      );

      expect(view.getByText(m.payoutInsufficientEarnings)).toBeTruthy();
      expect(reviewDisabled(view)).toBe(true);
      expect(walletApi.quotePayout).not.toHaveBeenCalled();
    });

    it("fills the full Earnings balance from the Max chip", async () => {
      const { view } = await renderSheet({ earningsSatang: 123_456 });
      await waitForDestinationRow(view);

      await fireEvent.press(view.getByTestId("payout-max-btn"));

      expect(view.getByTestId("payout-amount-input").props.value).toBe(
        "1234.56"
      );
      expect(reviewDisabled(view)).toBe(false);
      expect(view.queryByTestId("payout-amount-hint")).toBeNull();
    });

    it("explains when there are no Earnings to pay out", async () => {
      const { view } = await renderSheet({ earningsSatang: 0 });
      expect(view.getByTestId("payout-no-earnings-hint")).toBeTruthy();
      expect(
        view.getByTestId("payout-max-btn").props.accessibilityState.disabled
      ).toBe(true);
    });

    it("shows an error and stays on the amount step when the quote fails", async () => {
      (walletApi.quotePayout as jest.Mock).mockRejectedValue(new Error("boom"));
      const { view } = await renderSheet();
      await waitForDestinationRow(view);

      await fireEvent.changeText(
        view.getByTestId("payout-amount-input"),
        "100"
      );
      await fireEvent.press(view.getByTestId("payout-quote-btn"));

      await waitFor(() =>
        expect(view.getByTestId("payout-error")).toBeTruthy()
      );
      expect(view.queryByTestId("payout-quote-summary")).toBeNull();
    });
  });

  describe("review step", () => {
    it("quotes the receipt amount, shows fee, tax and debit, then creates the Payout with the quote and an idempotency key", async () => {
      (walletApi.quotePayout as jest.Mock).mockResolvedValue(makeQuote());
      (walletApi.createPayout as jest.Mock).mockResolvedValue({
        id: "payout-1",
      });
      const { view, onSuccess } = await renderSheet();

      await reachReview(view);

      expect(walletApi.quotePayout).toHaveBeenCalledWith(10_000);
      expect(view.getByTestId("payout-quote-receipt")).toHaveTextContent(
        "฿100.00"
      );
      expect(view.getByTestId("payout-quote-fee")).toHaveTextContent("฿15.00");
      expect(view.getByTestId("payout-quote-tax")).toHaveTextContent("฿0.45");
      expect(view.getByTestId("payout-quote-debit")).toHaveTextContent(
        "฿115.45"
      );
      expect(view.getByTestId("payout-review-destination")).toBeTruthy();

      await fireEvent.press(view.getByTestId("payout-confirm-btn"));

      await waitFor(() => expect(walletApi.createPayout).toHaveBeenCalled());
      const [quoteId, key] = (walletApi.createPayout as jest.Mock).mock
        .calls[0];
      expect(quoteId).toBe("quote-1");
      expect(typeof key).toBe("string");
      expect(key.length).toBeGreaterThan(0);
      await waitFor(() => expect(onSuccess).toHaveBeenCalled());
    });

    it("reuses the same idempotency key when a failed confirm is retried", async () => {
      (walletApi.quotePayout as jest.Mock).mockResolvedValue(makeQuote());
      (walletApi.createPayout as jest.Mock)
        .mockRejectedValueOnce(new Error("network"))
        .mockResolvedValueOnce({ id: "payout-1" });
      const { view } = await renderSheet();
      await reachReview(view);

      await fireEvent.press(view.getByTestId("payout-confirm-btn"));
      await waitFor(() =>
        expect(view.getByTestId("payout-error")).toBeTruthy()
      );
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
      const { view } = await renderSheet();
      await reachReview(view, "490");

      expect(view.getByTestId("payout-quote-insufficient")).toBeTruthy();
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
      const { view } = await renderSheet();
      await reachReview(view);

      await fireEvent.press(view.getByTestId("payout-confirm-btn"));

      await waitFor(() =>
        expect(view.getByText(m.payoutQuoteExpired)).toBeTruthy()
      );
      expect(view.getByTestId("payout-quote-btn")).toBeTruthy();
      expect(walletApi.createPayout).not.toHaveBeenCalled();
    });

    it("keeps the typed amount when going back to edit it", async () => {
      (walletApi.quotePayout as jest.Mock).mockResolvedValue(makeQuote());
      const { view } = await renderSheet();
      await reachReview(view);

      await fireEvent.press(view.getByTestId("payout-edit-amount-btn"));

      expect(view.getByTestId("payout-amount-input").props.value).toBe("100");
      expect(view.queryByTestId("payout-quote-summary")).toBeNull();
    });
  });

  describe("done step", () => {
    it("shows the receipt after confirming and closes from Done", async () => {
      (walletApi.quotePayout as jest.Mock).mockResolvedValue(makeQuote());
      (walletApi.createPayout as jest.Mock).mockResolvedValue({
        id: "payout-1",
      });
      const { view, onClose, onSuccess } = await renderSheet();
      await reachReview(view);

      await fireEvent.press(view.getByTestId("payout-confirm-btn"));

      await waitFor(() => expect(view.getByTestId("payout-done")).toBeTruthy());
      expect(view.getByTestId("payout-done-amount")).toHaveTextContent(
        "฿100.00"
      );
      expect(view.getByTestId("payout-sheet-title")).toHaveTextContent(
        m.payoutSuccessTitle
      );
      expect(view.getByText(m.payoutDoneNote)).toBeTruthy();
      expect(onSuccess).toHaveBeenCalledTimes(1);
      expect(onClose).not.toHaveBeenCalled();

      await fireEvent.press(view.getByTestId("payout-done-btn"));
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe("destination steps", () => {
    it("shows only the masked account of the active destination", async () => {
      const { view } = await renderSheet();
      await waitForDestinationRow(view);

      await fireEvent.press(view.getByTestId("payout-request-destination"));

      expect(view.getByTestId("payout-destination-active")).toBeTruthy();
      expect(view.getByTestId("payout-destination-masked")).toHaveTextContent(
        "•••• 1234"
      );
      expect(view.getByText("ธนาคารกสิกรไทย (KBANK)")).toBeTruthy();
      expect(
        view.getByTestId("bank-logo-KBANK", { hidden: true })
      ).toBeTruthy();
    });

    it("goes back to the amount step with the typed amount intact", async () => {
      const { view } = await renderSheet();
      await waitForDestinationRow(view);
      await fireEvent.changeText(
        view.getByTestId("payout-amount-input"),
        "250"
      );
      await fireEvent.press(view.getByTestId("payout-request-destination"));

      await fireEvent.press(view.getByTestId("payout-back-btn"));

      expect(view.getByTestId("payout-amount-input").props.value).toBe("250");
    });

    it("saves a destination added from the amount step and returns to the amount step", async () => {
      (walletApi.getActivePayoutDestination as jest.Mock).mockResolvedValue(
        null
      );
      (walletApi.createPayoutDestination as jest.Mock).mockResolvedValue(
        destination
      );
      const { view } = await renderSheet();
      await waitForAddDestination(view);
      await fireEvent.changeText(
        view.getByTestId("payout-amount-input"),
        "100"
      );
      await fireEvent.press(
        view.getByTestId("payout-request-add-destination-btn")
      );
      await fillForm(view);

      await fireEvent.press(view.getByTestId("payout-destination-save-btn"));

      await waitFor(() =>
        expect(walletApi.createPayoutDestination).toHaveBeenCalled()
      );
      expect(
        (walletApi.createPayoutDestination as jest.Mock).mock.calls[0][0]
      ).toMatchObject({
        givenName: "Somchai",
        surname: "Jaidee",
        accountHolderName: "Somchai Jaidee",
        bankCode: "KBANK",
        accountNumber: "1234567890",
        recipientType: "SELF",
      });
      await waitFor(() =>
        expect(view.getByTestId("payout-amount-input")).toBeTruthy()
      );
      expect(view.getByTestId("payout-amount-input").props.value).toBe("100");
      expect(view.getByTestId("payout-request-destination")).toBeTruthy();
      expect(reviewDisabled(view)).toBe(false);
    });

    it("requires every field before saving", async () => {
      (walletApi.getActivePayoutDestination as jest.Mock).mockResolvedValue(
        null
      );
      const { view } = await renderSheet();
      await waitForAddDestination(view);
      await fireEvent.press(
        view.getByTestId("payout-request-add-destination-btn")
      );

      await fireEvent.press(view.getByTestId("payout-destination-save-btn"));

      expect(view.getAllByText(m.destinationFieldRequired)).toHaveLength(5);
      expect(walletApi.createPayoutDestination).not.toHaveBeenCalled();
    });

    it("keeps the form open and shows an error when saving fails", async () => {
      (walletApi.getActivePayoutDestination as jest.Mock).mockResolvedValue(
        null
      );
      (walletApi.createPayoutDestination as jest.Mock).mockRejectedValue(
        new Error("boom")
      );
      const { view } = await renderSheet();
      await waitForAddDestination(view);
      await fireEvent.press(
        view.getByTestId("payout-request-add-destination-btn")
      );
      await fillForm(view);

      await fireEvent.press(view.getByTestId("payout-destination-save-btn"));

      await waitFor(() =>
        expect(view.getByTestId("payout-destination-action-error")).toBeTruthy()
      );
      expect(view.getByTestId("payout-destination-save-btn")).toBeTruthy();
    });

    it("replaces the destination through the form and returns to the amount step", async () => {
      (walletApi.createPayoutDestination as jest.Mock).mockResolvedValue({
        ...destination,
        maskedAccount: "•••• 9999",
      });
      const { view } = await renderSheet();
      await waitForDestinationRow(view);
      await fireEvent.press(view.getByTestId("payout-request-destination"));
      await fireEvent.press(view.getByTestId("payout-destination-replace-btn"));
      await fillForm(view);

      await fireEvent.press(view.getByTestId("payout-destination-save-btn"));

      await waitFor(() =>
        expect(view.getByTestId("payout-amount-input")).toBeTruthy()
      );
      expect(
        view.getByTestId("payout-request-destination").props.accessibilityLabel
      ).toContain("•••• 9999");
    });

    it("retires the active destination only after confirmation", async () => {
      (walletApi.retireActivePayoutDestination as jest.Mock).mockResolvedValue(
        true
      );
      const { view } = await renderSheet();
      await waitForDestinationRow(view);
      await fireEvent.press(view.getByTestId("payout-request-destination"));

      await fireEvent.press(view.getByTestId("payout-destination-retire-btn"));
      expect(walletApi.retireActivePayoutDestination).not.toHaveBeenCalled();

      const confirmButtons = await view.findAllByLabelText(m.destinationRetire);
      await fireEvent.press(confirmButtons[confirmButtons.length - 1]);

      await waitFor(() =>
        expect(walletApi.retireActivePayoutDestination).toHaveBeenCalled()
      );
      await waitFor(() =>
        expect(view.getByTestId("payout-destination-empty")).toBeTruthy()
      );
    });
  });
});
