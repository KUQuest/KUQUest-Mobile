import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import mockReact, { type ReactNode } from "react";
import { Alert, StyleSheet } from "react-native";

import MyQuestsScreen from "../MyQuestsScreen";
import { setActivePrototypePersona } from "../../auth/authEnvironment";
import { questFixtureAdapter } from "../../questBoard/questFixtureAdapter";

const mockRouter = { push: jest.fn() };
let mockLocale: "en" | "th" = "th";
let mockModalOnRequestClose: (() => void) | undefined;
let mockModalProps:
  | {
      animationType?: "none" | "slide" | "fade";
      statusBarTranslucent?: boolean;
      transparent?: boolean;
    }
  | undefined;

type MockModalProps = {
  animationType?: "none" | "slide" | "fade";
  children: ReactNode;
  onRequestClose?: () => void;
  statusBarTranslucent?: boolean;
  transparent?: boolean;
  visible: boolean;
};

jest.mock("expo-router", () => ({
  useRouter: () => mockRouter,
}));

jest.mock("../../../locales/LocaleProvider", () => ({
  useLocale: () => ({ locale: mockLocale }),
}));

jest.mock("react-native/Libraries/Modal/Modal", () => {
  return {
    __esModule: true,
    default: ({
      children,
      visible,
      onRequestClose,
      animationType,
      statusBarTranslucent,
      transparent,
    }: MockModalProps) => {
      mockModalOnRequestClose = onRequestClose;
      mockModalProps = { animationType, statusBarTranslucent, transparent };
      return visible
        ? mockReact.createElement(mockReact.Fragment, null, children)
        : null;
    },
  };
});

describe("MyQuestsScreen", () => {
  beforeEach(() => {
    mockRouter.push.mockClear();
    mockLocale = "th";
    mockModalOnRequestClose = undefined;
    mockModalProps = undefined;
    questFixtureAdapter.reset();
  });

  it("keeps Worker and Hirer work in one screen with separate role and status views", async () => {
    const view = await render(<MyQuestsScreen />);

    expect(view.getByText("MyQuest")).toBeTruthy();
    expect(view.queryByTestId("my-quests-help-button")).toBeNull();
    expect(view.getByText("เลือกสถานะเควสต์")).toBeTruthy();
    expect(view.getByTestId("my-quests-status-carousel")).toBeTruthy();
    expect(view.getByTestId("my-quests-status-previous")).toBeTruthy();
    expect(view.getByTestId("my-quests-status-next")).toBeTruthy();
    expect(view.getByText("Join a campus event team")).toBeTruthy();
    expect(view.queryByText("ช่วยยกกล่องไปหอพัก")).toBeNull();

    await fireEvent.press(view.getByTestId("my-quests-status-next"));
    await fireEvent.press(view.getByTestId("my-quests-status-next"));
    expect(view.getByText("Review a completed project")).toBeTruthy();

    await fireEvent.press(view.getByTestId("my-quests-role-trigger"));
    expect(view.getByText("เลือกมุมมองเควสต์")).toBeTruthy();
    expect(view.getByText("เข้าร่วมเควสต์")).toBeTruthy();
    expect(view.getByText("โพสต์เควสต์")).toBeTruthy();
    await fireEvent.press(view.getByTestId("my-quests-role-hirer"));

    expect(view.queryByText("โพสต์เควสต์")).toBeNull();
    expect(view.getByText("รวมทีมกิจกรรมในมหาวิทยาลัย")).toBeTruthy();
    expect(view.queryByText("ช่วยยกกล่องไปหอพัก")).toBeNull();

    await fireEvent.press(view.getByTestId("my-quests-status-next"));
    expect(view.getByText("ยังไม่มีเควสต์ฉบับร่าง")).toBeTruthy();
    await fireEvent.press(view.getByTestId("my-quests-status-next"));
    expect(view.getByText("Review a completed project")).toBeTruthy();
  });

  it("opens and closes the Thai Quest Funding modal, then walks through the UI-only Top up flow", async () => {
    setActivePrototypePersona("student-demo");
    const view = await render(<MyQuestsScreen />);

    expect(view.queryByTestId("quest-funding-summary")).toBeNull();
    await fireEvent.press(view.getByTestId("my-quests-role-trigger"));
    await fireEvent.press(view.getByTestId("my-quests-role-hirer"));

    expect(view.getByTestId("quest-funding-summary")).toBeTruthy();
    const toggle = view.getByTestId("quest-funding-summary-toggle");
    expect(toggle.props.accessibilityState).toEqual({ expanded: false });
    expect(view.getByText("เงินของฉัน")).toBeTruthy();
    expect(
      view.getByTestId("quest-funding-collapsed-status")
    ).toHaveTextContent("ระบบชำระเงินยังไม่พร้อมใช้งาน");
    expect(view.queryByText("฿0")).toBeNull();
    expect(view.queryByTestId("quest-funding-summary-details")).toBeNull();
    expect(
      view.queryByText(
        "ต้นแบบนี้ยังไม่เชื่อมต่อระบบชำระเงิน จึงยังไม่มีข้อมูลยอดเงินที่ใช้งานได้"
      )
    ).toBeNull();
    expect(toggle.props.accessibilityLabel).toBe(
      "เงินของฉัน: ระบบชำระเงินยังไม่พร้อมใช้งาน"
    );

    await fireEvent.press(toggle);
    expect(toggle.props.accessibilityState).toEqual({ expanded: true });
    expect(mockModalProps).toEqual(
      expect.objectContaining({
        animationType: "fade",
        statusBarTranslucent: true,
        transparent: true,
      })
    );
    expect(
      view.getByTestId("quest-funding-summary-modal").props
        .accessibilityViewIsModal
    ).toBe(true);
    expect(
      view.getByTestId("quest-funding-summary-centered-modal")
    ).toBeTruthy();
    expect(
      StyleSheet.flatten(
        view.getByTestId("quest-funding-summary-modal").props.style
      )
    ).toEqual(expect.objectContaining({ maxHeight: "82%", maxWidth: 560 }));
    expect(view.getByTestId("quest-funding-summary-details")).toBeTruthy();
    expect(
      view.getByTestId("quest-funding-summary-close").props.accessibilityLabel
    ).toBe("ปิด");
    const statusCard = view.getByTestId("quest-funding-status-card");
    expect(statusCard.props.children[0].props.testID).toBe(
      "quest-funding-status"
    );
    const status = view.getByTestId("quest-funding-status");
    expect(status.props.accessibilityLabel).toBe(
      "สถานะต้นแบบ: ระบบชำระเงินยังไม่พร้อมใช้งาน. ต้นแบบนี้ยังไม่เชื่อมต่อระบบชำระเงิน จึงยังไม่มีข้อมูลยอดเงินที่ใช้งานได้"
    );
    expect(view.getByTestId("quest-funding-status-value")).toHaveTextContent(
      "ระบบชำระเงินยังไม่พร้อมใช้งาน"
    );
    expect(
      StyleSheet.flatten(
        view.getByTestId("quest-funding-status-value").props.style
      )
    ).toEqual(expect.objectContaining({ fontSize: 24, lineHeight: 30 }));
    expect(
      view.getByTestId("quest-funding-status-description")
    ).toHaveTextContent(
      "ต้นแบบนี้ยังไม่เชื่อมต่อระบบชำระเงิน จึงยังไม่มีข้อมูลยอดเงินที่ใช้งานได้"
    );
    expect(view.getByText("กันเงินไว้สำหรับที่ของ Worker")).toBeTruthy();
    expect(
      view.getByText(
        "Quest Funding กันค่าตอบแทนไว้สำหรับ Worker แต่ละที่ที่ร้องขอ"
      )
    ).toBeTruthy();
    expect(view.getByText("การชำระเงิน")).toBeTruthy();
    expect(
      view.getByText(
        "การชำระเงินจ่ายค่าตอบแทนตามจำนวน Worker จริง (Actual Headcount)"
      )
    ).toBeTruthy();
    expect(view.getByText("การคืนเงิน")).toBeTruthy();
    expect(
      view.getByText("คืนเงินสำหรับที่ของ Worker ที่กันไว้แต่ไม่ได้ใช้")
    ).toBeTruthy();
    expect(view.queryByText("ดูรายการ")).toBeNull();
    expect(view.queryByText("นโยบาย")).toBeNull();
    const fundingInformation = view.getByTestId("quest-funding-information");
    expect(fundingInformation.props.accessibilityRole).toBe("text");
    expect(fundingInformation.props.onPress).toBeUndefined();
    expect(
      view.getByTestId("quest-funding-settlement-info").props.onPress
    ).toBeUndefined();
    expect(
      view.getByTestId("quest-funding-refund-info").props.onPress
    ).toBeUndefined();
    const topUp = view.getByTestId("quest-funding-top-up");
    const transfer = view.getByTestId("quest-funding-transfer");
    expect(topUp).toBeTruthy();
    expect(transfer).toBeTruthy();
    expect(view.getByText("เติมเงิน")).toBeTruthy();
    expect(view.getByText("โอนเงิน")).toBeTruthy();
    expect(
      view.getByTestId("quest-funding-actions-unavailable")
    ).toHaveTextContent(
      "การโอนเงินยังไม่พร้อมใช้งานจนกว่าจะเชื่อมต่อระบบชำระเงิน ส่วนการเติมเงินเป็นเพียงขั้นตอนต้นแบบเท่านั้น"
    );
    expect(
      view.getByTestId("quest-funding-actions-unavailable").props.accessible
    ).toBe(true);
    expect(topUp.props.accessibilityLabel).toBe("เติมเงิน");
    expect(transfer.props.accessibilityLabel).toBe("โอนเงิน");
    expect(topUp.props.disabled).not.toBe(true);
    expect(transfer.props.accessibilityState).toEqual(
      expect.objectContaining({ disabled: true })
    );
    expect(StyleSheet.flatten(topUp.props.style)).toEqual(
      expect.objectContaining({ minHeight: 48 })
    );
    expect(StyleSheet.flatten(transfer.props.style)).toEqual(
      expect.objectContaining({ minHeight: 48 })
    );

    await fireEvent.press(view.getByTestId("quest-funding-summary-close"));
    expect(view.queryByTestId("quest-funding-summary-details")).toBeNull();
    expect(toggle.props.accessibilityState).toEqual({ expanded: false });

    await fireEvent.press(toggle);
    expect(mockModalOnRequestClose).toEqual(expect.any(Function));
    await act(async () => {
      mockModalOnRequestClose?.();
    });
    expect(view.queryByTestId("quest-funding-summary-details")).toBeNull();

    await fireEvent.press(toggle);
    await fireEvent.press(view.getByTestId("quest-funding-top-up"));
    expect(mockModalProps).toEqual(
      expect.objectContaining({
        animationType: "slide",
        statusBarTranslucent: true,
        transparent: false,
      })
    );
    expect(view.queryByTestId("quest-funding-summary-details")).toBeNull();
    expect(view.queryByTestId("quest-funding-summary-backdrop")).toBeNull();
    expect(
      view.getByTestId("quest-funding-top-up-flow-modal").props
        .accessibilityViewIsModal
    ).toBe(true);
    expect(
      view.getByTestId("quest-funding-top-up-full-screen-modal").props
        .accessibilityViewIsModal
    ).toBe(true);
    expect(
      StyleSheet.flatten(
        view.getByTestId("quest-funding-top-up-full-screen-modal").props.style
      )
    ).toEqual(
      expect.objectContaining({ flex: 1, paddingTop: expect.any(Number) })
    );
    expect(view.getByTestId("quest-funding-top-up-flow")).toBeTruthy();
    expect(view.getByText("ระบุจำนวนเงิน")).toBeTruthy();
    expect(
      view.getByTestId("quest-funding-top-up-continue").props.accessibilityState
    ).toEqual({ disabled: true });
    expect(
      view.getByTestId("quest-funding-top-up-quick-500").props
        .accessibilityState
    ).toEqual({ selected: false });

    await fireEvent.press(view.getByTestId("quest-funding-top-up-quick-500"));
    expect(view.getByTestId("quest-funding-top-up-amount").props.value).toBe(
      "500"
    );
    expect(
      view.getByTestId("quest-funding-top-up-continue").props.accessibilityState
    ).toEqual({ disabled: false });
    await fireEvent.press(view.getByTestId("quest-funding-top-up-continue"));

    expect(view.getByText("QR พร้อมเพย์")).toBeTruthy();
    expect(view.getByTestId("quest-funding-top-up-promptpay")).toBeTruthy();
    expect(
      view.getByTestId("quest-funding-top-up-promptpay-qr").props
        .accessibilityRole
    ).toBe("image");
    expect(
      view.getByTestId("quest-funding-top-up-promptpay-qr").props
        .accessibilityLabel
    ).toBe("QR พร้อมเพย์. QR ต้นแบบ · สแกนไม่ได้. จำนวนเงิน (บาท): ฿500");
    expect(view.getByText("QR ต้นแบบ · สแกนไม่ได้")).toBeTruthy();
    expect(view.getByText("฿500")).toBeTruthy();
    expect(
      view.getByTestId("quest-funding-top-up-promptpay-unavailable")
    ).toHaveTextContent(
      "การเติมเงินผ่านพร้อมเพย์ยังไม่พร้อมใช้งาน ไม่มีการชำระเงินจริงและยอดเงินของคุณจะไม่เปลี่ยนแปลง"
    );
    expect(view.queryByText("PayPal")).toBeNull();
    expect(view.queryByText("ยืนยันด้วย PIN")).toBeNull();

    await act(async () => {
      mockModalOnRequestClose?.();
    });
    expect(view.getByTestId("quest-funding-top-up-amount")).toBeTruthy();
    expect(view.queryByTestId("quest-funding-top-up-promptpay")).toBeNull();
    await fireEvent.press(view.getByTestId("quest-funding-top-up-continue"));
    expect(view.getByTestId("quest-funding-top-up-promptpay")).toBeTruthy();
    await fireEvent.press(
      view.getByTestId("quest-funding-top-up-promptpay-close")
    );
    expect(view.queryByTestId("quest-funding-top-up-flow")).toBeNull();
  });

  it("localizes the unavailable Quest Funding state and static details for the Hirer in English", async () => {
    mockLocale = "en";
    setActivePrototypePersona("student-demo");
    const view = await render(<MyQuestsScreen />);

    await fireEvent.press(view.getByTestId("my-quests-role-trigger"));
    await fireEvent.press(view.getByTestId("my-quests-role-hirer"));

    expect(view.getByTestId("quest-funding-summary")).toBeTruthy();
    expect(view.getByText("My funding")).toBeTruthy();
    expect(
      view.getByTestId("quest-funding-collapsed-status")
    ).toHaveTextContent("Payment service unavailable");
    expect(view.queryByText("฿0")).toBeNull();
    expect(view.queryByText("No active Quest Funding yet")).toBeNull();

    await fireEvent.press(view.getByTestId("quest-funding-summary-toggle"));
    const status = view.getByTestId("quest-funding-status");
    expect(
      view.getByTestId("quest-funding-status-card").props.children[0].props
        .testID
    ).toBe("quest-funding-status");
    expect(status.props.accessibilityLabel).toBe(
      "PROTOTYPE STATUS: Payment service unavailable. This prototype does not connect to a payment service, so a live balance is not available."
    );
    expect(view.getByText("PROTOTYPE STATUS")).toBeTruthy();
    expect(
      view.getAllByText("Payment service unavailable").length
    ).toBeGreaterThanOrEqual(2);
    expect(
      view.getByText(
        "This prototype does not connect to a payment service, so a live balance is not available."
      )
    ).toBeTruthy();
    expect(
      StyleSheet.flatten(
        view.getByTestId("quest-funding-status-value").props.style
      )
    ).toEqual(expect.objectContaining({ fontSize: 24, lineHeight: 30 }));
    expect(view.getByText("RESERVED PER WORKER PLACE")).toBeTruthy();
    expect(
      view.getByText(
        "Quest Funding reserves the reward for each requested Worker place."
      )
    ).toBeTruthy();
    expect(view.getByText("Settlement")).toBeTruthy();
    expect(
      view.getByText("Settlement pays rewards for the Actual Headcount.")
    ).toBeTruthy();
    expect(view.getByText("Refunds")).toBeTruthy();
    expect(
      view.getByText("Unused reserved Worker places are refunded.")
    ).toBeTruthy();
    expect(view.queryByText("View history")).toBeNull();
    expect(view.queryByText("Policy")).toBeNull();
    expect(view.queryByRole("button", { name: "View history" })).toBeNull();
    expect(view.queryByRole("button", { name: "Policy" })).toBeNull();
    const topUp = view.getByTestId("quest-funding-top-up");
    const transfer = view.getByTestId("quest-funding-transfer");
    expect(topUp).toBeTruthy();
    expect(transfer).toBeTruthy();
    expect(view.getByText("Top up")).toBeTruthy();
    expect(view.getByText("Transfer")).toBeTruthy();
    expect(
      view.getByTestId("quest-funding-actions-unavailable")
    ).toHaveTextContent(
      "Transfer is unavailable until the payment service is connected. Top up is a prototype flow only."
    );
    expect(
      view.getByTestId("quest-funding-actions-unavailable").props.accessible
    ).toBe(true);
    expect(topUp.props.accessibilityLabel).toBe("Top up");
    expect(transfer.props.accessibilityLabel).toBe("Transfer");
    expect(topUp.props.accessibilityHint).toBeUndefined();
    expect(transfer.props.accessibilityHint).toBeUndefined();
    expect(topUp.props.disabled).not.toBe(true);
    expect(transfer.props.accessibilityState).toEqual(
      expect.objectContaining({ disabled: true })
    );

    await fireEvent.press(topUp);
    expect(view.getByText("Enter amount")).toBeTruthy();
    await fireEvent.press(view.getByTestId("quest-funding-top-up-quick-100"));
    await fireEvent.press(view.getByTestId("quest-funding-top-up-continue"));
    expect(view.getByText("PromptPay QR")).toBeTruthy();
    expect(view.getByText("Prototype QR · not scannable")).toBeTruthy();
    expect(
      view.getByTestId("quest-funding-top-up-promptpay-unavailable")
    ).toHaveTextContent(
      "PromptPay top up is unavailable. No payment was made and your funding balance was not changed."
    );
    await fireEvent.press(view.getByTestId("quest-funding-top-up-close"));
    expect(view.queryByTestId("quest-funding-top-up-flow")).toBeNull();
  });

  it("cycles Quest status with arrows and wraps around the available statuses", async () => {
    const view = await render(<MyQuestsScreen />);

    await fireEvent.press(view.getByTestId("my-quests-status-next"));
    expect(view.getByText("ซื้อข้าวจากโรงอาหาร")).toBeTruthy();

    await fireEvent.press(view.getByTestId("my-quests-status-next"));
    expect(view.getByText("Review a completed project")).toBeTruthy();

    await fireEvent.press(view.getByTestId("my-quests-status-next"));
    expect(view.getByText("Join a campus event team")).toBeTruthy();

    await fireEvent.press(view.getByTestId("my-quests-status-previous"));
    expect(view.getByText("Review a completed project")).toBeTruthy();
  });

  it("opens an adapter-backed pending Quest Detail from the card", async () => {
    const view = await render(<MyQuestsScreen />);

    expect(view.getByTestId("my-quest-card-worker-pending-demo")).toBeTruthy();
    await fireEvent.press(
      view.getByTestId("my-quest-card-worker-pending-demo")
    );

    expect(mockRouter.push).toHaveBeenCalledWith({
      pathname: "/quest/[id]",
      params: {
        id: "worker-pending-demo",
        mode: "join",
        joinStatus: "pending",
      },
    });
  });

  it("opens stable route identity for a joined Quest chat", async () => {
    const view = await render(<MyQuestsScreen />);

    await fireEvent.press(view.getByTestId("my-quests-status-next"));
    await fireEvent.press(view.getByTestId("my-quest-message-buy-lunch"));

    expect(mockRouter.push).toHaveBeenCalledWith({
      pathname: "/chat/[id]",
      params: {
        id: "conversation-fixture-buy-lunch",
        conversationId: "conversation-fixture-buy-lunch",
        questId: "buy-lunch",
        viewerId: "student-demo",
      },
    });
  });

  it("keeps the Message action separate from card detail for an accepted Quest", async () => {
    const view = await render(<MyQuestsScreen />);

    await fireEvent.press(view.getByTestId("my-quests-status-next"));

    expect(view.getAllByText("ข้อความ").length).toBeGreaterThan(0);
    expect(view.queryByText("แชตกับผู้โพสต์")).toBeNull();
    expect(view.queryByText("ดูรายละเอียด")).toBeNull();

    await fireEvent.press(view.getByTestId("my-quest-message-buy-lunch"));
    expect(mockRouter.push).toHaveBeenCalledWith(
      expect.objectContaining({ pathname: "/chat/[id]" })
    );

    mockRouter.push.mockClear();
    await fireEvent.press(view.getByTestId("my-quest-card-buy-lunch"));
    expect(mockRouter.push).toHaveBeenCalledWith({
      pathname: "/quest/[id]",
      params: { id: "buy-lunch", mode: "join", joinStatus: "accepted" },
    });
  });

  it("opens posted Quest Detail from the adapter-backed Edit action", async () => {
    const view = await render(<MyQuestsScreen />);

    await fireEvent.press(view.getByTestId("my-quests-role-trigger"));
    await fireEvent.press(view.getByTestId("my-quests-role-hirer"));
    await fireEvent.press(
      view.getByTestId("my-quest-action-team-forming-demo-secondary")
    );

    expect(mockRouter.push).toHaveBeenCalledWith({
      pathname: "/quest/[id]",
      params: { id: "team-forming-demo", mode: "post" },
    });
  });

  it("uses the shared Candidate review sheet for submitted team proposals and updates selection statuses", async () => {
    const view = await render(<MyQuestsScreen />);

    await fireEvent.press(view.getByTestId("my-quests-role-trigger"));
    await fireEvent.press(view.getByTestId("my-quests-role-hirer"));
    await fireEvent.press(
      view.getByTestId("my-quest-action-team-selection-demo")
    );

    expect(view.getByTestId("candidate-review-sheet")).toBeTruthy();
    expect(view.getByText("ข้อเสนอจากทีม")).toBeTruthy();
    expect(view.getByText("Team Leader A")).toBeTruthy();
    expect(view.getByText("Team Leader B")).toBeTruthy();

    const alertSpy = jest
      .spyOn(Alert, "alert")
      .mockImplementation(() => undefined);
    await fireEvent.press(
      view.getByTestId(
        "candidate-review-accept-fixture-application-team-selection-demo-team-a"
      )
    );
    expect(alertSpy).toHaveBeenCalledWith(
      "รับข้อเสนอ",
      expect.stringContaining("Choose a campus event team"),
      expect.any(Array)
    );
    const confirmationButtons = alertSpy.mock.calls[0]?.[2];
    await act(async () => {
      confirmationButtons?.[1]?.onPress?.();
    });

    expect(
      questFixtureAdapter
        .getState("team-selection-demo", "demo-hirer")
        ?.teams.find((team) => team.id.endsWith("-a"))?.status
    ).toBe("TEAM_SELECTED");
    expect(view.getByText("ได้รับเลือก")).toBeTruthy();
    expect(view.getByText("ไม่ผ่านการเลือก")).toBeTruthy();
    alertSpy.mockRestore();
  });

  it("uses individual Candidate applications for SINGLE review and keeps competitors visible after selection", async () => {
    const view = await render(<MyQuestsScreen />);

    await fireEvent.press(view.getByTestId("my-quests-role-trigger"));
    await fireEvent.press(view.getByTestId("my-quests-role-hirer"));
    await fireEvent.press(
      view.getByTestId("my-quest-action-single-candidate-demo")
    );

    expect(view.getByTestId("candidate-review-sheet")).toBeTruthy();
    expect(view.getByText("single-applicant-a")).toBeTruthy();
    expect(view.getByText("single-applicant-b")).toBeTruthy();
    expect(view.queryByText("ข้อเสนอจากทีม")).toBeNull();

    const alertSpy = jest
      .spyOn(Alert, "alert")
      .mockImplementation(() => undefined);
    await fireEvent.press(
      view.getByTestId(
        "candidate-review-accept-fixture-application-single-candidate-demo-single-applicant-a"
      )
    );
    const confirmationButtons = alertSpy.mock.calls[0]?.[2];
    await act(async () => {
      confirmationButtons?.[1]?.onPress?.();
    });

    expect(
      questFixtureAdapter.getState("single-candidate-demo", "demo-hirer")
        ?.applications
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          applicantId: "single-applicant-a",
          status: "APPLICATION_SELECTED",
        }),
        expect.objectContaining({
          applicantId: "single-applicant-b",
          status: "APPLICATION_REJECTED",
        }),
      ])
    );
    expect(view.getByText("ได้รับเลือก")).toBeTruthy();
    expect(view.getAllByText("ไม่ผ่านการเลือก").length).toBeGreaterThan(0);
    alertSpy.mockRestore();
  });

  it("shows only submitted team proposals in the shared Candidate sheet", async () => {
    const view = await render(<MyQuestsScreen />);

    await fireEvent.press(view.getByTestId("my-quests-role-trigger"));
    await fireEvent.press(view.getByTestId("my-quests-role-hirer"));
    await fireEvent.press(
      view.getByTestId("my-quest-action-team-forming-demo")
    );

    expect(view.getByTestId("candidate-review-sheet")).toBeTruthy();
    expect(view.getByTestId("candidate-review-empty")).toBeTruthy();
    expect(view.queryByText("Demo Team Leader")).toBeNull();
  });

  it("does not show role-level bottom actions on My Apply Quest or My Quest", async () => {
    const view = await render(<MyQuestsScreen />);

    expect(view.queryByTestId("my-quests-primary-cta")).toBeNull();
    expect(view.queryByText("ค้นหาเควสต์เพิ่ม")).toBeNull();

    await fireEvent.press(view.getByTestId("my-quests-role-trigger"));
    await fireEvent.press(view.getByTestId("my-quests-role-hirer"));
    expect(view.queryByTestId("my-quests-primary-cta")).toBeNull();
    expect(view.queryByTestId("my-quests-secondary-cta")).toBeNull();
    expect(view.queryByText("สร้างเควสต์ใหม่")).toBeNull();
    expect(view.queryByText("ส่งข้อความทั้งหมด")).toBeNull();
  });

  it("switches the adapter-backed My Quests view with the active Prototype persona", async () => {
    setActivePrototypePersona("student-demo");
    const view = await render(<MyQuestsScreen />);

    expect(view.getByTestId("my-quests-prototype-menu-trigger")).toBeTruthy();
    await fireEvent.press(view.getByTestId("my-quests-prototype-menu-trigger"));
    await fireEvent.press(
      view.getByTestId("my-quests-prototype-menu-persona-demo-hirer")
    );

    expect(view.getByText("จัดการเควสต์ที่คุณสร้างและเข้าร่วม")).toBeTruthy();
    expect(view.getByText("รวมทีมกิจกรรมในมหาวิทยาลัย")).toBeTruthy();
  });

  it("confirms a submitted Team Proposal rejection and leaves other teams eligible", async () => {
    setActivePrototypePersona("demo-hirer");
    const view = await render(<MyQuestsScreen />);
    const alertSpy = jest
      .spyOn(Alert, "alert")
      .mockImplementation(() => undefined);

    await fireEvent.press(
      view.getByTestId("my-quest-action-team-selection-demo")
    );
    await fireEvent.press(
      view.getByTestId(
        "candidate-review-reject-fixture-application-team-selection-demo-team-a"
      )
    );

    expect(alertSpy).toHaveBeenCalledWith(
      "ปฏิเสธ",
      expect.stringContaining("Choose a campus event team"),
      expect.any(Array)
    );
    const confirmationButtons = alertSpy.mock.calls[0]?.[2];
    const rejectButton = confirmationButtons?.find(
      (button) => button.text === "ปฏิเสธ"
    );
    await act(async () => {
      rejectButton?.onPress?.();
    });

    await waitFor(() =>
      expect(
        questFixtureAdapter
          .getState("team-selection-demo", "demo-hirer")
          ?.teams.find((team) => team.id.endsWith("-a"))?.status
      ).toBe("TEAM_REJECTED")
    );
    expect(
      questFixtureAdapter.getState("team-selection-demo", "demo-hirer")?.quest
        .status
    ).toBe("QUEST_OPEN");
    expect(
      questFixtureAdapter
        .getState("team-selection-demo", "demo-hirer")
        ?.teams.find((team) => team.id.endsWith("-b"))?.status
    ).toBe("TEAM_SUBMITTED");
    expect(view.getByText("ไม่ผ่านการเลือก")).toBeTruthy();
    alertSpy.mockRestore();
  });
});
