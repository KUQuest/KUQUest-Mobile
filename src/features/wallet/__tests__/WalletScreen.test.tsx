import { act, fireEvent, waitFor } from "@testing-library/react-native";
import React from "react";
import { WalletTransactionTitleKey, walletApi } from "@/api/WalletApi";
import { renderWithQueryClient } from "@/testing/queryTestUtils";
import WalletScreen from "../WalletScreen";
import {
  resetNavigationVisibility,
  useNavigationUiStore,
} from "@/features/navigation/navigationUiStore";
import { useRoleWorkspaceStore } from "@/features/workspace/roleWorkspaceStore";

const mockPush = jest.fn();
let mockFocusCallback: (() => void) | null = null;
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush }),
  useFocusEffect: (callback: () => void) => {
    const React = jest.requireActual("react");
    React.useEffect(() => {
      mockFocusCallback = callback;
      callback();
    }, [callback]);
  },
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
      getActivePayoutDestination: jest.fn(),
      getPayout: jest.fn(),
      listPayoutStatusHistory: jest.fn(),
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
    titleKey: WalletTransactionTitleKey.QUEST_ESCROW_RESERVED,
    amountSatang: 50_000,
    direction: "OUTFLOW" as const,
    status: "COMPLETED",
    createdAt: "2024-04-12T10:00:00Z",
    reference: "กวาดขยะรอบมหาลัย",
  },
  {
    id: "tx-2",
    type: "TOP_UP" as const,
    titleKey: WalletTransactionTitleKey.PROMPT_PAY_TOP_UP,
    amountSatang: 100_000,
    direction: "INFLOW" as const,
    status: "COMPLETED",
    createdAt: "2024-04-10T10:00:00Z",
  },
  {
    id: "tx-3",
    type: "SPEND" as const,
    titleKey: WalletTransactionTitleKey.SYSTEM_FEE,
    amountSatang: 1_000,
    direction: "OUTFLOW" as const,
    status: "COMPLETED",
    createdAt: "2024-04-03T10:00:00Z",
    resourceType: "platform_fee",
  },
];

describe("WalletScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFocusCallback = null;
    resetNavigationVisibility();
    useRoleWorkspaceStore.setState({ workspace: "hirer" });
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

  it("renders header, top-up action, balances, and transaction history", async () => {
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
    // Top-up action
    expect(view.getByTestId("hirer-wallet-top-up")).toBeTruthy();
    // Balance cards
    expect(view.getByTestId("hirer-balance-cards")).toBeTruthy();
    expect(view.getByTestId("hirer-spending-balance")).toBeTruthy();
    await waitFor(() => {
      expect(view.getByText("฿2,450.00")).toBeTruthy();
      expect(view.getByText("฿1,200.00")).toBeTruthy();
    });
    expect(view.getByText("฿2,450.00")).toBeTruthy();
    expect(view.getByText("เงินที่พร้อมใช้")).toBeTruthy();
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
    expect(view.getByText("เงินที่พร้อมใช้")).toBeTruthy();
    expect(view.getByText("฿2,450.00")).toBeTruthy();
    expect(view.getByText("ใช้จ้างงานได้ทันที")).toBeTruthy();
    expect(view.getByText("เงินที่พักไว้")).toBeTruthy();
    expect(view.getByText("฿1,200.00")).toBeTruthy();
    expect(view.getByText("รอจ่ายเมื่องานเสร็จ")).toBeTruthy();

    // 1. Tap Card 1 only -> ONLY Card 1 swaps to Earnings
    fireEvent.press(view.getByTestId("hirer-card-1"));

    await waitFor(() => {
      expect(view.getByText("รายได้")).toBeTruthy();
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
    expect(view.getByText("รายได้")).toBeTruthy();
    expect(view.getByText("฿4,000.00")).toBeTruthy();

    // 3. Tap Card 1 again -> Card 1 swaps back to Spending balance while Card 2 stays in Payout
    fireEvent.press(view.getByTestId("hirer-card-1"));

    await waitFor(() => {
      expect(view.getByText("เงินที่พร้อมใช้")).toBeTruthy();
    });
    expect(view.getByText("฿2,450.00")).toBeTruthy();
    expect(view.getByText("กำลังถอนเงิน")).toBeTruthy();
    expect(view.getByText("฿1,000.00")).toBeTruthy();

    // 4. Tap Swap All button -> both cards toggle
    fireEvent.press(view.getByTestId("hirer-balance-swap-all-btn"));

    await waitFor(() => {
      expect(view.getByText("รายได้")).toBeTruthy();
    });
    expect(view.getByText("เงินที่พักไว้")).toBeTruthy();
  });
  it("shows worker earnings and pending payout by default", async () => {
    useRoleWorkspaceStore.setState({ workspace: "worker" });
    const view = await renderWithQueryClient(<WalletScreen />);

    await waitFor(() => {
      expect(view.getByText("รายได้")).toBeTruthy();
      expect(view.getByText("กำลังถอนเงิน")).toBeTruthy();
      expect(view.getByText("฿4,000.00")).toBeTruthy();
      expect(view.getByText("฿1,000.00")).toBeTruthy();
    });
    expect(view.getByText("฿4,000.00")).toBeTruthy();
    expect(view.getByText("รายได้จากการทำเควสต์")).toBeTruthy();
    expect(view.getByText("฿1,000.00")).toBeTruthy();
    expect(view.getByText("รอโอนเข้าบัญชีธนาคาร")).toBeTruthy();
    expect(view.queryByText("เงินที่พร้อมใช้")).toBeNull();
    expect(view.queryByText("เงินที่พักไว้")).toBeNull();
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

  it("navigates to /top-up when the Top Up action is pressed", async () => {
    const view = await renderWithQueryClient(<WalletScreen />);

    await waitFor(() => {
      expect(view.getByTestId("hirer-wallet-top-up")).toBeTruthy();
    });

    await fireEvent.press(view.getByRole("button", { name: "เติมเงิน" }));

    expect(mockPush).toHaveBeenCalledWith("/top-up");
  });

  it("opens the transfer earnings modal from the balance card", async () => {
    const view = await renderWithQueryClient(<WalletScreen />);

    await waitFor(() => {
      expect(view.getByTestId("hirer-balance-transfer-btn")).toBeTruthy();
    });

    await fireEvent.press(view.getByRole("button", { name: "โอนรายได้" }));

    await waitFor(() => {
      expect(view.getByTestId("transfer-earnings-modal")).toBeTruthy();
      expect(view.getByTestId("transfer-current-earnings")).toHaveTextContent(
        "฿4,000.00"
      );
    });
  });

  it("opens the Request Payout flow from the wallet balance actions", async () => {
    (walletApi.getActivePayoutDestination as jest.Mock).mockResolvedValue(null);
    const view = await renderWithQueryClient(<WalletScreen />);
    await waitFor(() => {
      expect(view.getByTestId("hirer-balance-payout-btn")).toBeTruthy();
    });

    await fireEvent.press(view.getByTestId("hirer-balance-payout-btn"));

    expect(view.getByTestId("payout-request-modal")).toBeTruthy();
    await waitFor(() => {
      expect(view.getByTestId("payout-request-no-destination")).toBeTruthy();
    });

    await fireEvent.press(
      view.getByTestId("payout-request-add-destination-btn")
    );

    expect(view.getByTestId("payout-request-modal")).toBeTruthy();
    expect(view.getByTestId("payout-destination-save-btn")).toBeTruthy();
    expect(view.queryByTestId("payout-amount-input")).toBeNull();
  });

  it("shows Payout status and history when a Payout row is opened", async () => {
    (walletApi.getTransactionHistory as jest.Mock).mockResolvedValue({
      items: [
        {
          id: "payout-1",
          type: "PAYOUT" as const,
          titleKey: WalletTransactionTitleKey.BANK_PAYOUT,
          amountSatang: 11_545,
          direction: "OUTFLOW" as const,
          status: "PENDING_ADMIN_APPROVAL",
          createdAt: "2024-04-12T10:00:00Z",
          sourceApi: "PAYOUTS" as const,
          payoutId: "payout-1",
        },
      ],
    });
    (walletApi.getPayout as jest.Mock).mockResolvedValue({
      id: "payout-1",
      status: "PENDING_ADMIN_APPROVAL",
      receiptSatang: 10_000,
      maximumFeeSatang: 1_500,
      maximumTaxSatang: 45,
      maximumDebitSatang: 11_545,
      actualDebitSatang: null,
      createdAt: "2024-04-12T10:00:00Z",
    });
    (walletApi.listPayoutStatusHistory as jest.Mock).mockResolvedValue([
      {
        id: "h-1",
        fromStatus: null,
        toStatus: "PENDING_ADMIN_APPROVAL",
        reason: null,
        occurredAt: "2024-04-12T10:00:00Z",
      },
    ]);
    const view = await renderWithQueryClient(<WalletScreen />);
    await waitFor(() => {
      expect(view.getByTestId("hirer-tx-payout-1")).toBeTruthy();
    });

    await fireEvent.press(view.getByTestId("hirer-tx-payout-1"));

    await waitFor(() => {
      expect(view.getByTestId("payout-status-label")).toBeTruthy();
    });
    expect(walletApi.getPayout).toHaveBeenCalledWith(
      "payout-1",
      expect.anything()
    );
    await waitFor(() => {
      expect(view.getByTestId("payout-history-h-1")).toBeTruthy();
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
    expect(
      view.getByText("เกิดข้อผิดพลาดในการโหลดข้อมูลกระเป๋าเงิน")
    ).toBeTruthy();
    expect(view.queryByText("Network connection failed")).toBeNull();

    await fireEvent.press(view.getByRole("button", { name: "ลองอีกครั้ง" }));

    await waitFor(() => expect(walletApi.getWallet).toHaveBeenCalledTimes(2));
  });
  it("shows the retry error card instead of an empty history when history fails", async () => {
    (walletApi.getTransactionHistory as jest.Mock).mockRejectedValue(
      new Error("Ledger unavailable")
    );

    const view = await renderWithQueryClient(<WalletScreen />);

    await waitFor(() => {
      expect(view.getByTestId("hirer-wallet-error")).toBeTruthy();
    });
    expect(view.queryByTestId("hirer-wallet-empty")).toBeNull();

    await fireEvent.press(view.getByRole("button", { name: "ลองอีกครั้ง" }));

    await waitFor(() =>
      expect(walletApi.getTransactionHistory).toHaveBeenCalledTimes(2)
    );
  });
  it("does not refetch on mount or within 30s, then refetches after 30s", async () => {
    const view = await renderWithQueryClient(<WalletScreen />);
    await waitFor(() => expect(walletApi.getWallet).toHaveBeenCalledTimes(1));
    await waitFor(() =>
      expect(view.getByTestId("hirer-wallet-header")).toBeTruthy()
    );

    const realNow = Date.now;
    const nowSpy = jest
      .spyOn(Date, "now")
      .mockImplementation(() => realNow() + 29_000);
    try {
      act(() => mockFocusCallback?.());
    } finally {
      nowSpy.mockRestore();
    }
    expect(walletApi.getWallet).toHaveBeenCalledTimes(1);

    const staleNowSpy = jest
      .spyOn(Date, "now")
      .mockImplementation(() => realNow() + 30_001);
    try {
      act(() => mockFocusCallback?.());
    } finally {
      staleNowSpy.mockRestore();
    }
    await waitFor(() => expect(walletApi.getWallet).toHaveBeenCalledTimes(2));
    view.unmount();
  });
});
