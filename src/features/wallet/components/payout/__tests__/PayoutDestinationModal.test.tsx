import React from "react";
import { fireEvent, waitFor } from "@testing-library/react-native";
import { renderWithQueryClient } from "@/testing/queryTestUtils";
import { walletApi } from "@/api/WalletApi";
import { SweetAlertHost } from "@/components/ui/SweetAlert";
import { walletMessages } from "@/locales/walletMessages";
import { PayoutDestinationModal } from "../PayoutDestinationModal";

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
const destination = {
  id: "dest-1",
  accountHolderName: "Somchai Jaidee",
  bankCode: "KBANK",
  maskedAccount: "•••• 1234",
  createdAt: "2026-01-01T00:00:00Z",
};

async function renderModal() {
  return renderWithQueryClient(
    <>
      <PayoutDestinationModal messages={m} onClose={jest.fn()} visible />
      <SweetAlertHost />
    </>
  );
}

async function fillForm(view: Awaited<ReturnType<typeof renderModal>>) {
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

describe("PayoutDestinationModal", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows only the masked account of the active destination", async () => {
    (walletApi.getActivePayoutDestination as jest.Mock).mockResolvedValue(
      destination
    );
    const view = await renderModal();

    await waitFor(() =>
      expect(view.getByTestId("payout-destination-active")).toBeTruthy()
    );
    expect(view.getByTestId("payout-destination-masked")).toHaveTextContent(
      "•••• 1234"
    );
    expect(view.getByText("ธนาคารกสิกรไทย (KBANK)")).toBeTruthy();
    expect(view.getByTestId("bank-logo-KBANK", { hidden: true })).toBeTruthy();
  });

  it("shows an empty state and opens the form from Add account", async () => {
    (walletApi.getActivePayoutDestination as jest.Mock).mockResolvedValue(null);
    const view = await renderModal();

    await waitFor(() =>
      expect(view.getByTestId("payout-destination-empty")).toBeTruthy()
    );
    await fireEvent.press(view.getByTestId("payout-destination-add-btn"));
    expect(view.getByTestId("payout-destination-form")).toBeTruthy();
  });

  it("shows an error with retry when the destination cannot be loaded", async () => {
    (walletApi.getActivePayoutDestination as jest.Mock).mockRejectedValue(
      new Error("boom")
    );
    const view = await renderModal();

    await waitFor(() =>
      expect(view.getByTestId("payout-destination-error")).toBeTruthy()
    );
    expect(view.getByTestId("payout-destination-retry")).toBeTruthy();
  });

  it("requires every field before saving", async () => {
    (walletApi.getActivePayoutDestination as jest.Mock).mockResolvedValue(null);
    const view = await renderModal();
    await waitFor(() =>
      expect(view.getByTestId("payout-destination-add-btn")).toBeTruthy()
    );
    await fireEvent.press(view.getByTestId("payout-destination-add-btn"));

    await fireEvent.press(view.getByTestId("payout-destination-save-btn"));

    expect(view.getAllByText(m.destinationFieldRequired)).toHaveLength(5);
    expect(walletApi.createPayoutDestination).not.toHaveBeenCalled();
  });

  it("saves the destination with normalized values and then shows it", async () => {
    (walletApi.getActivePayoutDestination as jest.Mock).mockResolvedValue(null);
    (walletApi.createPayoutDestination as jest.Mock).mockResolvedValue(
      destination
    );
    const view = await renderModal();
    await waitFor(() =>
      expect(view.getByTestId("payout-destination-add-btn")).toBeTruthy()
    );
    await fireEvent.press(view.getByTestId("payout-destination-add-btn"));
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
    });
    await waitFor(() =>
      expect(view.getByTestId("payout-destination-active")).toBeTruthy()
    );
  });

  it("keeps the form open and shows an error when saving fails", async () => {
    (walletApi.getActivePayoutDestination as jest.Mock).mockResolvedValue(null);
    (walletApi.createPayoutDestination as jest.Mock).mockRejectedValue(
      new Error("boom")
    );
    const view = await renderModal();
    await waitFor(() =>
      expect(view.getByTestId("payout-destination-add-btn")).toBeTruthy()
    );
    await fireEvent.press(view.getByTestId("payout-destination-add-btn"));
    await fillForm(view);

    await fireEvent.press(view.getByTestId("payout-destination-save-btn"));

    await waitFor(() =>
      expect(view.getByTestId("payout-destination-action-error")).toBeTruthy()
    );
    expect(view.getByTestId("payout-destination-form")).toBeTruthy();
  });

  it("retires the active destination only after confirmation", async () => {
    (walletApi.getActivePayoutDestination as jest.Mock).mockResolvedValue(
      destination
    );
    (walletApi.retireActivePayoutDestination as jest.Mock).mockResolvedValue(
      true
    );
    const view = await renderModal();
    await waitFor(() =>
      expect(view.getByTestId("payout-destination-retire-btn")).toBeTruthy()
    );

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
