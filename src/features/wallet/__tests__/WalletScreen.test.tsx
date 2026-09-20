import React from "react";
import { fireEvent, waitFor } from "@testing-library/react-native";
import { walletApi } from "@/api/WalletApi";
import { renderWithQueryClient } from "@/testing/queryTestUtils";
import WalletScreen from "../WalletScreen";
import {
  resetNavigationVisibility,
  useNavigationUiStore,
} from "@/features/navigation/navigationUiStore";

const mockPush = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush }),
  useFocusEffect: (effect: () => (() => void) | void) =>
    jest.requireActual("react").useEffect(effect, []),
}));
jest.mock("@/features/preferences/localeStore", () => ({
  useLocale: () => ({ locale: "th" }),
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
jest.mock("@/api/WalletApi", () => {
  const original = jest.requireActual("@/api/WalletApi");
  return {
    ...original,
    walletApi: {
      getWallet: jest.fn(),
      getTransactionHistory: jest.fn(),
      quoteTopUp: jest.fn(),
      createTopUp: jest.fn(),
      getTopUpStatus: jest.fn(),
      simulateTopUp: jest.fn(),
      convertEarnings: jest.fn(),
    },
  };
});

const mockBalances = {
  spendingBalanceSatang: 245_000,
  earningsBalanceSatang: 400_000,
  fundingReservedSatang: 120_000,
  reservedForPayoutsSatang: 100_000,
};

const mockTransactions = [
  {
    id: "tx-1",
    type: "HOLD" as const,
    title: "Quest Escrow Reserved",
    titleTh: "กันเงินประกันเควสต์",
    amountSatang: 50_000,
    direction: "OUTFLOW" as const,
    status: "COMPLETED",
    createdAt: "2024-04-12T10:00:00Z",
    reference: "กวาดขยะรอบมหาลัย",
  },
  {
    id: "tx-2",
    type: "TOP_UP" as const,
    title: "PromptPay Top-Up",
    titleTh: "เติมเงินผ่านพร้อมเพย์",
    amountSatang: 100_000,
    direction: "INFLOW" as const,
    status: "COMPLETED",
    createdAt: "2024-04-10T10:00:00Z",
  },
  {
    id: "tx-3",
    type: "SPEND" as const,
    title: "Platform Fee",
    titleTh: "ค่าธรรมเนียม",
    amountSatang: 1_000,
    direction: "OUTFLOW" as const,
    status: "COMPLETED",
    createdAt: "2024-04-03T10:00:00Z",
    resourceType: "platform_fee",
  },
];

describe("Hirer WalletScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetNavigationVisibility();
    (walletApi.getWallet as jest.Mock).mockResolvedValue(mockBalances);
    (walletApi.getTransactionHistory as jest.Mock).mockResolvedValue({
      items: mockTransactions,
    });
  });
  it("collapses the navbar when the wallet list scrolls", async () => {
    const view = await renderWithQueryClient(<WalletScreen />);
    const list = view.getByTestId("hirer-wallet-transactions-list");

    await waitFor(() => {
      expect(view.getByText("การเงิน")).toBeTruthy();
    });
    await fireEvent.scroll(list, {
      nativeEvent: { contentOffset: { x: 0, y: 0 } },
    });
    await fireEvent.scroll(list, {
      nativeEvent: { contentOffset: { x: 0, y: 10 } },
    });

    const navigationState = useNavigationUiStore.getState();
    expect(navigationState.navigationVisible).toBe(false);
    expect(navigationState.navigationCompact).toBe(true);
  });

  it("renders header, slogan badge, banner, balances, and transaction history", async () => {
    const view = await renderWithQueryClient(<WalletScreen />);

    // Header
    await waitFor(() => {
      expect(view.getByTestId("hirer-wallet-header")).toBeTruthy();
    });
    expect(view.getByTestId("hirer-wallet-title")).toBeTruthy();
    expect(view.getByText("การเงิน")).toBeTruthy();
    expect(view.getByText("ยอดเงินคงเหลือและระบบชำระเงิน")).toBeTruthy();
    expect(view.queryByText("Ama Wallet")).toBeNull();
    expect(view.queryByTestId("brighter-campus-badge")).toBeNull();
    // Banner
    expect(view.getByTestId("hirer-wallet-banner")).toBeTruthy();
    expect(view.getByText("เติมเงิน")).toBeTruthy();
    expect(view.getByTestId("hirer-wallet-banner-action-btn")).toBeTruthy();
    // Balance cards
    expect(view.getByTestId("hirer-balance-cards")).toBeTruthy();
    expect(view.getByTestId("hirer-spending-balance")).toBeTruthy();
    expect(view.getByText("฿2,450.00")).toBeTruthy();
    expect(view.getByText("เงินพร้อมใช้")).toBeTruthy();
    expect(view.getByText("ใช้จ้างงานได้ทันที")).toBeTruthy();

    expect(view.getByTestId("hirer-escrow-balance")).toBeTruthy();
    expect(view.getByText("฿1,200.00")).toBeTruthy();
    expect(view.getByText("เงินที่พักไว้")).toBeTruthy();
    expect(view.getByText("รอจ่ายเมื่องานเสร็จ")).toBeTruthy();

    // History section
    expect(view.getByText("ประวัติ")).toBeTruthy();
    expect(view.getByTestId("hirer-history-filter-button")).toBeTruthy();

    // Transactions list
    expect(view.getByTestId("hirer-wallet-transactions-list")).toBeTruthy();
    expect(view.getByTestId("hirer-tx-tx-1")).toBeTruthy();
    expect(view.getByText("พักเงินสำหรับเควสต์")).toBeTruthy();
    expect(view.getByText("กวาดขยะรอบมหาลัย")).toBeTruthy();
    expect(view.getByText("-฿500.00")).toBeTruthy();
    expect(view.getByTestId("hirer-tx-tx-2")).toBeTruthy();
    expect(view.getByText("เติมเงินเข้า Wallet")).toBeTruthy();
    expect(view.getByText("+฿1,000.00")).toBeTruthy();

    expect(view.getByTestId("hirer-tx-tx-3")).toBeTruthy();
    expect(view.getByText("ค่าธรรมเนียมระบบ")).toBeTruthy();
    expect(view.getByText("-฿10.00")).toBeTruthy();
  });
  it("swaps balance cards separately on individual card press", async () => {
    const view = await renderWithQueryClient(<WalletScreen />);

    await waitFor(() => {
      expect(view.getByText("฿2,450.00")).toBeTruthy();
    });

    // Initial state: Both in Hirer perspective
    expect(view.getByText("แตะการ์ดเพื่อสลับมุมมอง")).toBeTruthy();
    expect(view.getByText("สลับทั้งหมด")).toBeTruthy();
    expect(view.getByText("เงินพร้อมใช้")).toBeTruthy();
    expect(view.getByText("฿2,450.00")).toBeTruthy();
    expect(view.getByText("ใช้จ้างงานได้ทันที")).toBeTruthy();
    expect(view.getByText("เงินที่พักไว้")).toBeTruthy();
    expect(view.getByText("฿1,200.00")).toBeTruthy();
    expect(view.getByText("รอจ่ายเมื่องานเสร็จ")).toBeTruthy();

    // 1. Tap Card 1 only -> ONLY Card 1 swaps to Earnings
    fireEvent.press(view.getByTestId("hirer-card-1"));

    await waitFor(() => {
      expect(view.getByText("รายได้สะสม")).toBeTruthy();
    });
    expect(view.getByText("฿4,000.00")).toBeTruthy();
    expect(view.getByText("รายได้จากการทำเควสต์")).toBeTruthy();
    // Card 2 remains in Escrow
    expect(view.getByText("เงินที่พักไว้")).toBeTruthy();
    expect(view.getByText("฿1,200.00")).toBeTruthy();

    // 2. Tap Card 2 only -> ONLY Card 2 swaps to Pending Payout
    fireEvent.press(view.getByTestId("hirer-card-2"));

    await waitFor(() => {
      expect(view.getByText("กำลังถอนเงิน")).toBeTruthy();
    });
    expect(view.getByText("฿1,000.00")).toBeTruthy();
    expect(view.getByText("รอโอนเข้าบัญชีธนาคาร")).toBeTruthy();
    // Card 1 remains in Earnings
    expect(view.getByText("รายได้สะสม")).toBeTruthy();
    expect(view.getByText("฿4,000.00")).toBeTruthy();

    // 3. Tap Card 1 again -> Card 1 swaps back to Spending balance while Card 2 stays in Payout
    fireEvent.press(view.getByTestId("hirer-card-1"));

    await waitFor(() => {
      expect(view.getByText("เงินพร้อมใช้")).toBeTruthy();
    });
    expect(view.getByText("฿2,450.00")).toBeTruthy();
    expect(view.getByText("กำลังถอนเงิน")).toBeTruthy();
    expect(view.getByText("฿1,000.00")).toBeTruthy();

    // 4. Tap Swap All button -> both cards toggle
    fireEvent.press(view.getByTestId("hirer-balance-swap-all-btn"));

    await waitFor(() => {
      expect(view.getByText("รายได้สะสม")).toBeTruthy();
    });
    expect(view.getByText("เงินที่พักไว้")).toBeTruthy();
  });

  it("filters transactions when a filter is chosen", async () => {
    const view = await renderWithQueryClient(<WalletScreen />);

    await waitFor(() => {
      expect(view.getByTestId("hirer-wallet-transactions-list")).toBeTruthy();
    });

    // Open filter modal
    fireEvent.press(view.getByTestId("hirer-history-filter-button"));

    await waitFor(() => {
      expect(view.getByTestId("filter-opt-inflow")).toBeTruthy();
    });

    // Select inflow
    fireEvent.press(view.getByTestId("filter-opt-inflow"));

    await waitFor(() => {
      expect(view.getByTestId("hirer-tx-tx-2")).toBeTruthy();
      expect(view.queryByTestId("hirer-tx-tx-1")).toBeNull();
      expect(view.queryByTestId("hirer-tx-tx-3")).toBeNull();
    });
  });
  it("opens transaction detail modal with full endpoint data when a transaction item is tapped", async () => {
    const view = await renderWithQueryClient(<WalletScreen />);

    await waitFor(() => {
      expect(view.getByTestId("hirer-tx-tx-2")).toBeTruthy();
    });

    // Tap transaction item
    fireEvent.press(view.getByTestId("hirer-tx-tx-2"));

    await waitFor(() => {
      expect(view.getByTestId("transaction-detail-modal")).toBeTruthy();
    });

    expect(view.getByTestId("tx-detail-title")).toHaveTextContent(
      "เติมเงินเข้า Wallet"
    );
    expect(view.getByTestId("tx-detail-amount")).toHaveTextContent(
      "+฿1,000.00"
    );
    expect(view.getByTestId("tx-detail-status-badge")).toHaveTextContent(
      "สำเร็จ"
    );
    expect(view.getByTestId("tx-detail-source-tag")).toBeTruthy();
    expect(view.getByTestId("tx-detail-reference")).toHaveTextContent("tx-2");

    // Close modal
    fireEvent.press(view.getByTestId("transaction-detail-close-btn"));

    await waitFor(() => {
      expect(view.queryByTestId("transaction-detail-modal")).toBeNull();
    });
  });

  it("filters transactions by top_up", async () => {
    const view = await renderWithQueryClient(<WalletScreen />);

    await waitFor(() => {
      expect(view.getByTestId("hirer-wallet-transactions-list")).toBeTruthy();
    });

    // Open filter modal
    fireEvent.press(view.getByTestId("hirer-history-filter-button"));

    await waitFor(() => {
      expect(view.getByTestId("filter-opt-top_up")).toBeTruthy();
    });

    // Select top_up
    fireEvent.press(view.getByTestId("filter-opt-top_up"));

    await waitFor(() => {
      expect(view.getByTestId("hirer-tx-tx-2")).toBeTruthy();
      expect(view.queryByTestId("hirer-tx-tx-1")).toBeNull();
      expect(view.queryByTestId("hirer-tx-tx-3")).toBeNull();
    });
  });

  it("navigates to /top-up when banner action button is pressed", async () => {
    const view = await renderWithQueryClient(<WalletScreen />);

    await waitFor(() => {
      expect(view.getByTestId("hirer-wallet-banner-action-btn")).toBeTruthy();
    });

    fireEvent.press(view.getByTestId("hirer-wallet-banner-action-btn"));

    expect(mockPush).toHaveBeenCalledWith("/top-up");
  });
  it("opens transfer earnings modal when switcher bar shortcut button is pressed", async () => {
    const view = await renderWithQueryClient(<WalletScreen />);

    await waitFor(() => {
      expect(
        view.getByTestId("hirer-balance-transfer-shortcut-btn")
      ).toBeTruthy();
    });

    fireEvent.press(view.getByTestId("hirer-balance-transfer-shortcut-btn"));

    await waitFor(() => {
      expect(view.getByTestId("transfer-earnings-modal")).toBeTruthy();
      expect(view.getByText("โอนรายได้เข้าเงินพร้อมใช้")).toBeTruthy();
    });
  });

  it("opens transfer earnings modal from Card 1 when swapped to earnings mode", async () => {
    const view = await renderWithQueryClient(<WalletScreen />);

    await waitFor(() => {
      expect(view.getByTestId("hirer-card-1")).toBeTruthy();
    });

    // Flip Card 1 to earnings
    fireEvent.press(view.getByTestId("hirer-card-1"));

    await waitFor(() => {
      expect(view.getByTestId("hirer-card1-transfer-btn")).toBeTruthy();
    });

    fireEvent.press(view.getByTestId("hirer-card1-transfer-btn"));

    await waitFor(() => {
      expect(view.getByTestId("transfer-earnings-modal")).toBeTruthy();
      expect(view.getByTestId("transfer-current-earnings")).toHaveTextContent(
        "฿4,000.00"
      );
    });
  });

  it("displays empty state when there are no transactions", async () => {
    (walletApi.getTransactionHistory as jest.Mock).mockResolvedValue({
      items: [],
    });

    const view = await renderWithQueryClient(<WalletScreen />);

    await waitFor(() => {
      expect(view.getByTestId("hirer-wallet-empty")).toBeTruthy();
    });
    expect(view.getByText("ยังไม่มีประวัติการทำธุรกรรม")).toBeTruthy();
  });

  it("displays error card with retry button when loading fails", async () => {
    (walletApi.getWallet as jest.Mock).mockRejectedValue(
      new Error("Network connection failed")
    );

    const view = await renderWithQueryClient(<WalletScreen />);

    await waitFor(() => {
      expect(view.getByTestId("hirer-wallet-error")).toBeTruthy();
    });
    expect(view.getByText("Network connection failed")).toBeTruthy();
    expect(view.getByTestId("hirer-wallet-retry-button")).toBeTruthy();
  });
});
