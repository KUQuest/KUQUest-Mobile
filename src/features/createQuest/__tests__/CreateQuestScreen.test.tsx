import { fireEvent, waitFor, within } from "@testing-library/react-native";
import { renderWithQueryClient } from "@/testing/queryTestUtils";
import mockReact, { type ReactElement, type ReactNode } from "react";
import { StyleSheet, TextInput as RNTextInput } from "react-native";
import CreateQuestScreen from "../CreateQuestScreen";
import { measureFieldRelativeToScroll } from "../createQuestFocus";
import { initialDraft, toBangkokDateTime } from "../createQuestModel";
jest.mock("react-native/Libraries/Modal/Modal", () => {
  return {
    __esModule: true,
    default: ({
      visible,
      children,
    }: {
      visible: boolean;
      children: ReactNode;
    }) =>
      visible
        ? mockReact.createElement(mockReact.Fragment, null, children)
        : null,
  };
});

jest.mock("react-native/Libraries/Utilities/useWindowDimensions", () => ({
  __esModule: true,
  default: () => ({ width: 390, height: 844, scale: 1, fontScale: 1 }),
}));

const mockRouter = { replace: jest.fn() };
const mockLoadQuestDraft = jest.fn();
const mockPersistQuestDraft = jest.fn();
const mockDeleteQuestDraft = jest.fn();
const mockCreateQuestDraftId = jest.fn(() => "draft-1");
const mockLiveCreateQuest = jest.fn();
const mockLiveGetPublishCheck = jest.fn();
const mockLivePublishQuest = jest.fn();
const mockWalletGetWallet = jest.fn();
const defaultWalletBalances = {
  spendingBalanceSatang: 100_000,
  earningsBalanceSatang: 0,
  fundingReservedSatang: 0,
  reservedForPayoutsSatang: 0,
};
const serverPublishCheckFixture = {
  canPublish: true,
  blockingReasons: [],
  warnings: [],
  questFundingTotalSatang: 25000,
  questRewardSatang: 23750,
  platformFeeSatang: 1250,
  escrowRequirementSatang: 25000,
  headcount: 1,
  platformFeeBps: 500,
  feeRoundingMode: "UP" as const,
  policyRevisionId: "policy-rev-1",
  policyRevision: 1,
  questFundingTotal: 250,
  questReward: 237.5,
  platformFee: 12.5,
  escrowRequirement: 250,
};
const liveDraftSnapshot = {
  draft: {
    ...initialDraft,
    title: "Campus data analysis",
    tag: "design",
    description: "Analyze a campus dataset.",
    conditions: "Submit the completed analysis.",
    startDate: "2099-08-26",
    deadline: "2099-08-27",
    startTime: "09:00",
    endTime: "12:00",
    location: "Student activity building",
    candidateMode: "CANDIDATE" as const,
    participation: "GROUP" as const,
    headcount: "2",
    wage: "250",
  },
  step: 2 as const,
};

jest.mock("../../questBoard/liveQuestService", () => ({
  liveQuestService: {
    createQuest: (...args: unknown[]) => mockLiveCreateQuest(...args),
    uploadImages: (...args: unknown[]) => Promise.resolve([]),
    getPublishCheck: (...args: unknown[]) => mockLiveGetPublishCheck(...args),
    publishQuest: (...args: unknown[]) => mockLivePublishQuest(...args),
  },
}));

jest.mock("@/api/QuestApi", () => {
  const actual = jest.requireActual("@/api/QuestApi");
  return {
    ...actual,
    questApi: {
      ...actual.questApi,
      getPublishCheck: (...args: unknown[]) => mockLiveGetPublishCheck(...args),
    },
  };
});
jest.mock("@/api/WalletApi", () => ({
  walletApi: {
    getWallet: (...args: unknown[]) => mockWalletGetWallet(...args),
  },
}));

jest.mock("../createQuestPersistence", () => ({
  getQuestDraftStorageKey: jest.fn().mockResolvedValue("test-key"),
  createQuestDraftId: () => mockCreateQuestDraftId(),
  loadQuestDraft: (...args: unknown[]) => mockLoadQuestDraft(...args),
  persistQuestDraft: (...args: unknown[]) => mockPersistQuestDraft(...args),
  deleteQuestDraft: (...args: unknown[]) => mockDeleteQuestDraft(...args),
}));
jest.mock("@/features/wallet/api/walletQueries", () => {
  const actual = jest.requireActual("@/features/wallet/api/walletQueries");
  return {
    ...actual,
    useQueryClient: require("@tanstack/react-query").useQueryClient,
  };
});

jest.mock("expo-router", () => ({
  useRouter: () => mockRouter,
}));

jest.mock("expo-status-bar", () => ({
  StatusBar: () => null,
}));

jest.mock("../../../features/preferences/localeStore", () => ({
  useLocale: () => ({ locale: "th" }),
}));
const render = (ui: ReactElement) => renderWithQueryClient(ui);

async function fillQuestDetails(view: Awaited<ReturnType<typeof render>>) {
  await fireEvent.changeText(
    view.getByLabelText("ชื่อเควสต์ *"),
    "ล้างพัดลมหอพัก"
  );
  await fireEvent.press(view.getByLabelText("แท็กเควสต์ *: เลือกแท็กเควสต์"));
  await fireEvent.press(
    view.getByLabelText("แท็กเควสต์ *: การออกแบบและงานสร้างสรรค์")
  );
  await fireEvent.changeText(
    view.getByLabelText("รายละเอียดงาน *"),
    "ล้างพัดลมส่วนกลาง"
  );
  await fireEvent.changeText(
    view.getByLabelText("เกณฑ์การเสร็จงาน *"),
    "พัดลมสะอาดและใช้งานได้"
  );
}

describe("CreateQuestScreen", () => {
  beforeEach(() => {
    mockRouter.replace.mockClear();
    mockLoadQuestDraft.mockReset();
    mockLoadQuestDraft.mockImplementation((...args: unknown[]) =>
      Promise.resolve(args[1] ? liveDraftSnapshot : null)
    );
    mockPersistQuestDraft.mockReset();
    mockPersistQuestDraft.mockResolvedValue(undefined);
    mockDeleteQuestDraft.mockReset();
    mockDeleteQuestDraft.mockResolvedValue(undefined);
    mockLiveCreateQuest.mockReset();
    mockLiveGetPublishCheck.mockReset();
    mockLivePublishQuest.mockReset();
    mockWalletGetWallet.mockReset();
    mockWalletGetWallet.mockResolvedValue(defaultWalletBalances);
  });

  it("keeps the page skeleton visible until draft hydration settles", async () => {
    let resolveDraft!: (value: null) => void;
    mockLoadQuestDraft.mockReturnValueOnce(
      new Promise<null>((resolve) => {
        resolveDraft = resolve;
      })
    );

    const view = await render(<CreateQuestScreen />);

    expect(view.getByTestId("create-quest-loading-skeleton")).toBeTruthy();
    expect(view.getByLabelText("กำลังกู้คืนฉบับร่าง…")).toBeTruthy();
    expect(view.queryByLabelText("ชื่อเควสต์ *")).toBeNull();

    resolveDraft(null);
    await waitFor(() =>
      expect(view.getByLabelText("ชื่อเควสต์ *")).toBeTruthy()
    );
  });

  it("restores the persisted draft and step on mount", async () => {
    mockLoadQuestDraft.mockResolvedValueOnce({
      draft: {
        ...jest.requireActual("../createQuestModel").initialDraft,
        title: "Restored quest",
        tag: "design",
        description: "Restored description",
        conditions: "Restored criteria",
      },
      step: 2,
      state: "DRAFT",
    });

    const view = await render(<CreateQuestScreen />);

    await waitFor(() => expect(view.getByText("ตั้งค่าทีม")).toBeTruthy());
    await fireEvent.press(
      view.getByLabelText("ขั้นตอนที่ 1 จาก 3: ข้อมูลเควสต์")
    );
    expect(view.getByLabelText("ชื่อเควสต์ *").props.value).toBe(
      "Restored quest"
    );
    expect(mockLoadQuestDraft).toHaveBeenCalledWith("test-key", undefined);
  });

  it("opens the mock draft in Team Setup for edit flows and updates the summary", async () => {
    const view = await render(<CreateQuestScreen editQuestId="mock-draft" />);

    expect(view.getByText("ตั้งค่าทีม")).toBeTruthy();
    expect(view.getByLabelText("ขั้นตอนที่ 2 จาก 3: ตั้งค่าทีม")).toBeTruthy();
    expect(view.getAllByLabelText("ย้อนกลับ")).toHaveLength(1);
    expect(view.getByText("1. เลือกรูปแบบการทำงาน")).toBeTruthy();
    expect(view.getByText("2. เลือกรูปแบบการรับผู้สมัคร")).toBeTruthy();
    expect(view.queryByText("ตั้งค่าเควสต์")).toBeNull();
    expect(view.queryByTestId("create-quest-summary-size")).toBeNull();
    expect(view.queryByTestId("create-quest-start-datetime")).toBeNull();

    await fireEvent.press(view.getByTestId("create-quest-choice-single"));
    await fireEvent.press(view.getByText("ตรวจสอบเควสต์"));

    await waitFor(() => expect(view.getByText("ตั้งค่าเควสต์")).toBeTruthy());
    expect(
      within(view.getByTestId("create-quest-summary-size")).getByText("1 คน")
    ).toBeTruthy();
    expect(view.getByTestId("create-quest-summary-type")).toBeTruthy();
    expect(view.getByTestId("create-quest-summary-applicants")).toBeTruthy();
    expect(view.getAllByText("แท็กเควสต์")).toHaveLength(1);
    expect(view.getAllByText("วิธีรับผู้สมัคร")).toHaveLength(1);
    expect(view.queryByText("การเข้าร่วม")).toBeNull();
    expect(view.queryByText("จำนวนผู้เข้าร่วม")).toBeNull();
  });

  it("allows Quest Tags to be searched before selecting one", async () => {
    const view = await render(<CreateQuestScreen />);

    await fireEvent.press(view.getByLabelText("แท็กเควสต์ *: เลือกแท็กเควสต์"));

    const searchInput = view.getByTestId("select-search-input");
    expect(searchInput.props.placeholder).toBe("ค้นหาแท็กเควสต์");

    await fireEvent.changeText(searchInput, "เทคโนโลยี");

    expect(view.getByLabelText("แท็กเควสต์ *: เทคโนโลยี")).toBeTruthy();
    expect(view.queryByText("การสอนพิเศษ")).toBeNull();

    await fireEvent.press(view.getByLabelText("แท็กเควสต์ *: เทคโนโลยี"));
    expect(view.getByLabelText("แท็กเควสต์ *: เทคโนโลยี")).toBeTruthy();
  });

  it("keeps Single headcount fixed at one in the mock draft", async () => {
    const view = await render(<CreateQuestScreen editQuestId="mock-draft" />);

    await fireEvent.press(view.getByTestId("create-quest-choice-single"));
    expect(
      view.getByLabelText("จำนวนผู้เข้าร่วม: 1").props.accessibilityState
    ).toEqual({ disabled: true });
    expect(view.queryByText("จำนวนผู้เข้าร่วม *")).toBeNull();

    await fireEvent.press(view.getByText("ตรวจสอบเควสต์"));

    await waitFor(() => expect(view.getByText("ตั้งค่าเควสต์")).toBeTruthy());
    expect(
      within(view.getByTestId("create-quest-summary-size")).getByText("1 คน")
    ).toBeTruthy();
  });

  it("reveals the logistics fields when the collapsed section is opened", async () => {
    const view = await render(<CreateQuestScreen editQuestId="mock-draft" />);

    await fireEvent.press(view.getByTestId("create-quest-logistics-toggle"));

    expect(view.getByTestId("create-quest-start-datetime")).toBeTruthy();
    expect(view.getByTestId("create-quest-deadline-datetime")).toBeTruthy();
  });

  it("opens custom time picker and updates start time on confirm", async () => {
    const view = await render(<CreateQuestScreen editQuestId="mock-draft" />);

    await fireEvent.press(view.getByTestId("create-quest-logistics-toggle"));
    expect(
      view.getByTestId("create-quest-start-datetime-time-btn")
    ).toBeTruthy();

    await fireEvent.press(
      view.getByTestId("create-quest-start-datetime-time-btn")
    );
    expect(view.getByTestId("custom-time-picker-confirm")).toBeTruthy();

    await fireEvent.press(view.getByTestId("hour-cell-14"));
    await fireEvent.press(view.getByTestId("minute-cell-30"));
    await fireEvent.press(view.getByTestId("custom-time-picker-confirm"));

    await waitFor(() => {
      expect(view.getAllByText("14:30").length).toBeGreaterThan(0);
    });
  });

  it("keeps the custom time picker open when no date is selected", async () => {
    mockLoadQuestDraft.mockResolvedValueOnce({
      draft: {
        ...initialDraft,
        title: "Time picker quest",
        tag: "design",
        description: "Choose a time",
        conditions: "The time is saved",
        location: "Activity building",
        wage: "250",
      },
      step: 2,
      state: "DRAFT",
    });

    const view = await render(
      <CreateQuestScreen editQuestId="draft-without-schedule" />
    );

    await fireEvent.press(view.getByTestId("create-quest-logistics-toggle"));
    await fireEvent.press(
      view.getByTestId("create-quest-start-datetime-time-btn")
    );

    expect(view.getByTestId("custom-time-picker-confirm")).toBeTruthy();
  });

  it("carries minute-step overflow into the next hour", async () => {
    const view = await render(<CreateQuestScreen editQuestId="mock-draft" />);

    await fireEvent.press(view.getByTestId("create-quest-logistics-toggle"));
    await fireEvent.press(
      view.getByTestId("create-quest-start-datetime-time-btn")
    );
    await fireEvent.press(view.getByTestId("hour-cell-23"));
    await fireEvent.press(view.getByTestId("minute-cell-55"));
    await fireEvent.press(view.getByTestId("minute-step-plus5"));

    expect(
      view.getByTestId("custom-time-picker-confirm").props.accessibilityLabel
    ).toContain("00:00");
  });

  it("applies quick date and time presets in the logistics flow", async () => {
    const view = await render(<CreateQuestScreen editQuestId="mock-draft" />);

    await fireEvent.press(view.getByTestId("create-quest-logistics-toggle"));

    const todayChip = view.getByTestId("quick-preset-วันนี้");
    expect(todayChip).toBeTruthy();
    await fireEvent.press(todayChip);

    const sameDayChip = view.getByTestId("quick-preset-วันเดียวกัน");
    expect(sameDayChip).toBeTruthy();
    await fireEvent.press(sameDayChip);

    const plus2hChip = view.getByTestId("quick-preset-+2 ชม.");
    expect(plus2hChip).toBeTruthy();
    await fireEvent.press(plus2hChip);
  });

  it("shows quick-fix button when deadline is earlier than start time", async () => {
    mockLoadQuestDraft.mockResolvedValueOnce({
      draft: {
        ...jest.requireActual("../createQuestModel").initialDraft,
        title: "Test Inverted Quest",
        tag: "design",
        description: "Test desc",
        conditions: "Test criteria",
        startDate: "2099-08-26",
        deadline: "2099-08-26",
        startTime: "15:00",
        endTime: "09:00",
      },
      step: 2,
      state: "DRAFT",
    });

    const view = await render(<CreateQuestScreen />);
    await fireEvent.press(view.getByTestId("create-quest-logistics-toggle"));

    const fixBtn = await waitFor(() =>
      view.getByTestId("create-quest-fix-deadline-btn")
    );
    expect(fixBtn).toBeTruthy();
    await fireEvent.press(fixBtn);

    await waitFor(() => {
      expect(view.queryByTestId("create-quest-fix-deadline-btn")).toBeNull();
    });
  });

  it("aligns the fixed Single headcount value like the other form fields", async () => {
    const view = await render(<CreateQuestScreen editQuestId="mock-draft" />);

    await fireEvent.press(view.getByTestId("create-quest-choice-single"));
    const headcountField = await waitFor(() =>
      view.getByLabelText("จำนวนผู้เข้าร่วม: 1")
    );

    expect(StyleSheet.flatten(headcountField.props.style)).toEqual(
      expect.objectContaining({
        alignItems: "flex-start",
        justifyContent: "center",
      })
    );
  });

  it("uses a checkbox for proof and explains the selected requirement below", async () => {
    const view = await render(<CreateQuestScreen />);

    const proofToggle = await waitFor(() =>
      view.getByTestId("create-quest-proof-toggle")
    );
    expect(proofToggle.props.accessibilityState).toEqual({ checked: true });
    expect(
      view.getByText("ผู้เข้าร่วมต้องส่งหลักฐานการเสร็จงานเมื่อทำเควสต์เสร็จ")
    ).toBeTruthy();

    await fireEvent.press(proofToggle);

    expect(
      view.getByTestId("create-quest-proof-toggle").props.accessibilityState
    ).toEqual({ checked: false });
    expect(view.getByText("ไม่จำเป็นต้องส่งหลักฐานการเสร็จงาน")).toBeTruthy();

    await fireEvent.press(view.getByTestId("create-quest-proof-toggle"));
    expect(
      view.getByTestId("create-quest-proof-toggle").props.accessibilityState
    ).toEqual({ checked: true });
  });

  it("returns to the first invalid logistics field and expands the section", async () => {
    const view = await render(<CreateQuestScreen />);

    await fillQuestDetails(view);
    await fireEvent.press(view.getByLabelText("ถัดไป"));
    await waitFor(() => expect(view.getByText("ตั้งค่าทีม")).toBeTruthy());

    await fireEvent.press(view.getByLabelText("ตรวจสอบเควสต์"));

    await waitFor(() =>
      expect(view.getByTestId("create-quest-start-datetime")).toBeTruthy()
    );
    expect(view.getByText(/วันที่เริ่มต้น:/)).toBeTruthy();
  });

  it("measures an invalid field relative to the native scroll view ref", () => {
    const target = { measureLayout: jest.fn() };
    const scrollView = {} as Parameters<
      React.ComponentRef<typeof RNTextInput>["measureLayout"]
    >[0];
    const onSuccess = jest.fn();
    const onFail = jest.fn();

    expect(
      measureFieldRelativeToScroll(target, scrollView, onSuccess, onFail)
    ).toBe(true);
    expect(target.measureLayout).toHaveBeenCalledWith(
      scrollView,
      onSuccess,
      onFail
    );
  });

  it("keeps both Review actions wide enough to remain visible", async () => {
    const view = await render(<CreateQuestScreen editQuestId="mock-draft" />);

    await fireEvent.press(view.getByText("ตรวจสอบเควสต์"));
    await waitFor(() =>
      expect(view.getByTestId("create-quest-save-draft")).toBeTruthy()
    );

    const draftButtonStyle = StyleSheet.flatten(
      view.getByTestId("create-quest-save-draft").props.style
    );
    const previewButtonStyle = StyleSheet.flatten(
      view.getByTestId("create-quest-save-preview").props.style
    );

    expect(draftButtonStyle).toEqual(
      expect.objectContaining({
        flexBasis: 0,
        flexGrow: 1,
        flexShrink: 1,
        minWidth: 0,
        width: "auto",
      })
    );
    expect(previewButtonStyle).toEqual(
      expect.objectContaining({
        flexBasis: 0,
        flexGrow: 1,
        flexShrink: 1,
        minWidth: 0,
        width: "auto",
      })
    );
    expect(draftButtonStyle).toEqual(previewButtonStyle);
  });

  it("publishes through the live API in normal authenticated mode", async () => {
    mockLiveCreateQuest.mockResolvedValue({ id: "server-quest-1" });
    mockLiveGetPublishCheck.mockResolvedValue({
      canPublish: true,
      blockingReasons: [],
    });
    mockLivePublishQuest.mockResolvedValue({
      id: "server-quest-1",
      state: "QUEST_OPEN",
    });

    const view = await render(<CreateQuestScreen editQuestId="mock-draft" />);

    await fireEvent.press(view.getByText("ตรวจสอบเควสต์"));
    await waitFor(() =>
      expect(view.getByTestId("create-quest-save-preview")).toBeTruthy()
    );
    await fireEvent.press(view.getByLabelText("เผยแพร่เควสต์"));

    await waitFor(() =>
      expect(view.getByText("เผยแพร่เควสต์แล้ว")).toBeTruthy()
    );
    expect(mockLiveCreateQuest).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: "CANDIDATE",
        participation: "GROUP",
        questFundingTotal: 250,
        headcount: 2,
        startTime: toBangkokDateTime("2099-08-26", "09:00"),
        dueAt: toBangkokDateTime("2099-08-27", "12:00"),
      }),
      expect.any(String)
    );
    expect(mockLiveGetPublishCheck).toHaveBeenCalledWith("server-quest-1");
    expect(mockLivePublishQuest).toHaveBeenCalledWith(
      "server-quest-1",
      expect.any(String)
    );
    expect(mockDeleteQuestDraft).toHaveBeenCalledWith("test-key", "mock-draft");
  });

  it("disables publish and shows blocking guidance when the server check blocks", async () => {
    mockLiveGetPublishCheck.mockResolvedValue({
      ...serverPublishCheckFixture,
      canPublish: false,
      blockingReasons: [
        { code: "QUEST_TAG_REQUIRED", message: "Tag is required" },
      ],
    });

    const view = await render(<CreateQuestScreen editQuestId="mock-draft" />);
    await fireEvent.press(view.getByText("ตรวจสอบเควสต์"));

    await waitFor(() =>
      expect(
        view.getByTestId("create-quest-save-preview").props.accessibilityState
      ).toMatchObject({ disabled: true })
    );
    expect(view.getByText("แก้ไขข้อขัดข้องก่อนเผยแพร่เควสต์")).toBeTruthy();
    expect(view.getByText("กรุณาเลือกแท็กหมวดหมู่สำหรับเควสต์")).toBeTruthy();
    expect(view.queryByTestId("create-quest-top-up-button")).toBeNull();

    await fireEvent.press(view.getByTestId("create-quest-save-preview"));
    expect(mockLivePublishQuest).not.toHaveBeenCalled();
  });

  it("shows the missing spending balance and opens the top-up flow", async () => {
    mockWalletGetWallet.mockResolvedValue({
      ...defaultWalletBalances,
      spendingBalanceSatang: 10_000,
    });
    mockLiveGetPublishCheck.mockResolvedValue({
      ...serverPublishCheckFixture,
      canPublish: false,
      blockingReasons: [
        {
          code: "INSUFFICIENT_SPENDING_BALANCE",
          message: "Spending balance too low",
        },
      ],
    });

    const view = await render(<CreateQuestScreen editQuestId="mock-draft" />);
    await fireEvent.press(view.getByText("ตรวจสอบเควสต์"));

    expect(
      await view.findByText("ยอดเงินพร้อมใช้ไม่เพียงพอ ขาดอีก ฿150")
    ).toBeTruthy();

    await fireEvent.press(view.getByTestId("create-quest-top-up-button"));
    await waitFor(() =>
      expect(view.getByTestId("quest-funding-top-up-flow")).toBeTruthy()
    );
  });

  it("maps publish API error codes to localized messages", async () => {
    mockLiveCreateQuest.mockResolvedValue({ id: "server-quest-err" });
    mockLiveGetPublishCheck.mockResolvedValue(serverPublishCheckFixture);
    mockLivePublishQuest.mockRejectedValue(
      Object.assign(new Error("ledger exploded"), {
        status: 503,
        code: "QUEST_ESCROW_UNAVAILABLE",
      })
    );

    const view = await render(<CreateQuestScreen editQuestId="mock-draft" />);
    await fireEvent.press(view.getByText("ตรวจสอบเควสต์"));
    await waitFor(() =>
      expect(view.getByTestId("create-quest-save-preview")).toBeTruthy()
    );
    await fireEvent.press(view.getByTestId("create-quest-save-preview"));

    await waitFor(() =>
      expect(view.getByTestId("create-quest-save-error")).toBeTruthy()
    );
    expect(
      view.getByText("ระบบการเงินไม่พร้อมใช้งานชั่วคราว กรุณาลองอีกครั้ง")
    ).toBeTruthy();
    expect(view.queryByText("ledger exploded")).toBeNull();
  });

  it("retries a failed live publish without creating another Quest", async () => {
    mockLiveCreateQuest.mockResolvedValue({ id: "server-quest-2" });
    mockLiveGetPublishCheck.mockResolvedValue({
      canPublish: true,
      blockingReasons: [],
    });
    mockLivePublishQuest
      .mockRejectedValueOnce(new Error("publish unavailable"))
      .mockResolvedValueOnce({
        id: "server-quest-2",
        state: "QUEST_OPEN",
      });

    const view = await render(<CreateQuestScreen editQuestId="mock-draft" />);

    await fireEvent.press(view.getByText("ตรวจสอบเควสต์"));
    await waitFor(() =>
      expect(view.getByTestId("create-quest-save-preview")).toBeTruthy()
    );
    await fireEvent.press(view.getByLabelText("เผยแพร่เควสต์"));

    await waitFor(() =>
      expect(view.getByTestId("create-quest-save-error")).toBeTruthy()
    );
    expect(mockDeleteQuestDraft).not.toHaveBeenCalled();

    await fireEvent.press(view.getByTestId("create-quest-retry-save"));
    await waitFor(() =>
      expect(view.getByText("เผยแพร่เควสต์แล้ว")).toBeTruthy()
    );

    expect(mockLiveCreateQuest).toHaveBeenCalledTimes(1);
    const firstPublishCall = mockLivePublishQuest.mock.calls[0];
    expect(mockLivePublishQuest).toHaveBeenNthCalledWith(
      2,
      "server-quest-2",
      firstPublishCall[1]
    );
    expect(mockDeleteQuestDraft).toHaveBeenCalledWith("test-key", "mock-draft");
  });

  it("shows a retry action when published Quest draft cleanup fails", async () => {
    mockLiveCreateQuest.mockResolvedValue({ id: "server-quest-3" });
    mockLiveGetPublishCheck.mockResolvedValue({
      canPublish: true,
      blockingReasons: [],
    });
    mockLivePublishQuest.mockResolvedValue({
      id: "server-quest-3",
      state: "QUEST_OPEN",
    });
    const view = await render(<CreateQuestScreen editQuestId="mock-draft" />);

    await fireEvent.press(view.getByText("ตรวจสอบเควสต์"));
    await waitFor(() =>
      expect(view.getByTestId("create-quest-save-preview")).toBeTruthy()
    );

    mockDeleteQuestDraft.mockRejectedValueOnce(
      new Error("storage unavailable")
    );
    await fireEvent.press(view.getByTestId("create-quest-save-preview"));

    await waitFor(() =>
      expect(view.getByTestId("create-quest-save-error")).toBeTruthy()
    );
    expect(view.getByText("ลองอีกครั้ง")).toBeTruthy();

    mockDeleteQuestDraft.mockResolvedValueOnce(undefined);
    await fireEvent.press(view.getByTestId("create-quest-retry-save"));

    await waitFor(() =>
      expect(view.getByText("เผยแพร่เควสต์แล้ว")).toBeTruthy()
    );
    expect(view.getByText("สร้างเควสต์ใหม่")).toBeTruthy();
    expect(view.getByText("กลับหน้าหลัก")).toBeTruthy();

    await fireEvent.press(view.getByText("กลับหน้าหลัก"));
    expect(mockRouter.replace).toHaveBeenCalledWith("/(tabs)");
  });

  it("autosaves edits and exposes a retry when persistence fails", async () => {
    mockLoadQuestDraft.mockResolvedValueOnce(null);
    const view = await render(<CreateQuestScreen />);

    await waitFor(() =>
      expect(view.getByLabelText("ชื่อเควสต์ *")).toBeTruthy()
    );
    mockPersistQuestDraft.mockRejectedValueOnce(
      new Error("storage unavailable")
    );
    await fireEvent.changeText(
      view.getByLabelText("ชื่อเควสต์ *"),
      "บันทึกอัตโนมัติ"
    );

    await waitFor(() =>
      expect(view.getByTestId("create-quest-save-error")).toBeTruthy()
    );
    expect(mockPersistQuestDraft).toHaveBeenCalledWith(
      "test-key",
      expect.any(String),
      expect.objectContaining({ title: "บันทึกอัตโนมัติ" }),
      1,
      "DRAFT"
    );

    mockPersistQuestDraft.mockResolvedValueOnce(undefined);
    await fireEvent.press(view.getByTestId("create-quest-retry-save"));

    await waitFor(() =>
      expect(view.getByText("บันทึกฉบับร่างแล้ว")).toBeTruthy()
    );
  });

  it("starts a fresh blank form after the draft screen is unmounted", async () => {
    mockLoadQuestDraft.mockResolvedValueOnce(null);
    const view = await render(<CreateQuestScreen editQuestId="mock-draft" />);

    await fireEvent.press(
      view.getByLabelText("ขั้นตอนที่ 1 จาก 3: ข้อมูลเควสต์")
    );
    expect(view.getByLabelText("ชื่อเควสต์ *").props.value).toBe("");
    view.unmount();

    const freshView = await render(<CreateQuestScreen />);
    await waitFor(() =>
      expect(freshView.getByLabelText("ชื่อเควสต์ *").props.value).toBe("")
    );
  });
});
