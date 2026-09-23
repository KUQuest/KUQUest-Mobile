import { fireEvent, waitFor, within } from "@testing-library/react-native";
import { renderWithQueryClient } from "@/testing/queryTestUtils";
import mockReact, { type ReactElement, type ReactNode } from "react";
import { Alert, StyleSheet, TextInput as RNTextInput } from "react-native";
import CreateQuestScreen from "../CreateQuestScreen";
import { measureFieldRelativeToScroll } from "../components/createQuestFocus";
import { initialDraft, toBangkokDateTime } from "../domain/createQuestModel";
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
const mockGetQuestDetail = jest.fn();
type BeforeRemoveEvent = {
  preventDefault: () => void;
  data: { action: { type: string } };
};
const mockBeforeRemoveListeners: ((event: BeforeRemoveEvent) => void)[] = [];
const mockNavigation = {
  addListener: jest.fn(
    (event: string, handler: (beforeEvent: BeforeRemoveEvent) => void) => {
      if (event !== "beforeRemove") return jest.fn();
      mockBeforeRemoveListeners.push(handler);
      return () => {
        const index = mockBeforeRemoveListeners.indexOf(handler);
        if (index >= 0) mockBeforeRemoveListeners.splice(index, 1);
      };
    }
  ),
  dispatch: jest.fn(),
};
const mockLoadQuestDraft = jest.fn();
const mockPersistQuestDraft = jest.fn();
const mockDeleteQuestDraft = jest.fn();
const mockCreateQuestDraftId = jest.fn(() => "draft-1");
const mockLiveCreateQuest = jest.fn();
const mockLiveGetPublishCheck = jest.fn();
const mockLivePublishQuest = jest.fn();
const mockLiveEditQuest = jest.fn();
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
const serverQuestDetailFixture = {
  id: "server-quest-1",
  version: 3,
  title: "Clean the dorm fans",
  tag: { id: "design" },
  description: "Clean every fan in the residence hall.",
  condition: { items: [{ position: 1, text: "All fans run quietly." }] },
  proofRequired: false,
  startTime: "2099-08-26T09:00:00",
  dueAt: "2099-08-27T12:00:00",
  locations: [{ label: "Dorm A common room" }],
  images: [],
  mode: "FIRST_COME",
  participation: "SINGLE",
  headcount: 1,
  questFundingTotal: 100,
};

jest.mock("../../questBoard/live/liveQuestService", () => ({
  liveQuestService: {
    createQuest: (...args: unknown[]) => mockLiveCreateQuest(...args),
    uploadImages: (...args: unknown[]) => Promise.resolve([]),
    getPublishCheck: (...args: unknown[]) => mockLiveGetPublishCheck(...args),
    publishQuest: (...args: unknown[]) => mockLivePublishQuest(...args),
    editQuest: (...args: unknown[]) => mockLiveEditQuest(...args),
  },
}));

jest.mock("@/api/QuestApi", () => {
  const actual = jest.requireActual("@/api/QuestApi");
  return {
    ...actual,
    questApi: {
      ...actual.questApi,
      getDetail: (...args: unknown[]) => mockGetQuestDetail(...args),
      getPublishCheck: (...args: unknown[]) => mockLiveGetPublishCheck(...args),
      editQuest: (...args: unknown[]) => mockLiveEditQuest(...args),
    },
  };
});
jest.mock("@/api/WalletApi", () => ({
  walletApi: {
    getWallet: (...args: unknown[]) => mockWalletGetWallet(...args),
  },
}));

jest.mock("../draft/createQuestPersistence", () => ({
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
    useQueryClient: jest.requireActual<typeof import("@tanstack/react-query")>(
      "@tanstack/react-query"
    ).useQueryClient,
  };
});

jest.mock("expo-router", () => ({
  useRouter: () => mockRouter,
  useNavigation: () => mockNavigation,
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
async function renderNewModeAtTeamSetup() {
  mockLoadQuestDraft.mockImplementation(() =>
    Promise.resolve(liveDraftSnapshot)
  );
  const view = await render(<CreateQuestScreen />);
  await waitFor(() =>
    expect(view.getByTestId("create-quest-logistics-toggle")).toBeTruthy()
  );
  return view;
}
async function waitForPublishCheck(view: Awaited<ReturnType<typeof render>>) {
  await waitFor(() =>
    expect(
      view.getByTestId("create-quest-publish-check").props.accessibilityState
    ).toMatchObject({ busy: false })
  );
}

function spyOnAlert() {
  const spy = jest.spyOn(Alert, "alert").mockImplementation(() => {});
  // Alert is not auto-restored between tests in this repo's jest config.
  spy.mockClear();
  return spy;
}

async function renderServerEditQuest() {
  const view = await render(
    <CreateQuestScreen editMode editQuestId="server-quest-1" />
  );
  await waitFor(() =>
    expect(view.getByLabelText("ชื่อเควสต์ *").props.value).toBe(
      "Clean the dorm fans"
    )
  );
  return view;
}

function fireBeforeRemove() {
  const event: BeforeRemoveEvent = {
    preventDefault: jest.fn(),
    data: { action: { type: "GO_BACK" } },
  };
  const listener =
    mockBeforeRemoveListeners[mockBeforeRemoveListeners.length - 1];
  if (!listener) throw new Error("No beforeRemove guard is registered");
  listener(event);
  return event;
}

function lastAlertCall() {
  const calls = jest.mocked(Alert.alert).mock.calls;
  const last = calls[calls.length - 1];
  if (!last) throw new Error("No Alert was shown");
  return last;
}

function lastAlertButtons() {
  const buttons = lastAlertCall()[2];
  if (!buttons) throw new Error("The Alert rendered without buttons");
  return buttons;
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
    mockLiveEditQuest.mockReset();
    mockLiveEditQuest.mockResolvedValue({
      id: "server-quest-edit",
      version: 4,
    });
    mockLiveGetPublishCheck.mockReset();
    mockLivePublishQuest.mockReset();
    mockWalletGetWallet.mockReset();
    mockWalletGetWallet.mockResolvedValue(defaultWalletBalances);
    mockGetQuestDetail.mockReset();
    mockGetQuestDetail.mockResolvedValue(serverQuestDetailFixture);
    mockNavigation.addListener.mockClear();
    mockNavigation.dispatch.mockClear();
    mockBeforeRemoveListeners.length = 0;
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
        ...jest.requireActual("../domain/createQuestModel").initialDraft,
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
    expect(mockPersistQuestDraft).not.toHaveBeenCalled();
    expect(mockLiveCreateQuest).not.toHaveBeenCalled();
  });

  it("opens the mock draft in Team Setup for edit flows and updates the summary", async () => {
    const view = await render(<CreateQuestScreen editQuestId="mock-draft" />);

    expect(view.getByText("ตั้งค่าทีม")).toBeTruthy();
    expect(view.getByLabelText("ขั้นตอนที่ 2 จาก 3: ตั้งค่าทีม")).toBeTruthy();
    expect(mockPersistQuestDraft).not.toHaveBeenCalled();
    expect(mockLiveCreateQuest).not.toHaveBeenCalled();
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
        ...jest.requireActual("../domain/createQuestModel").initialDraft,
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

  it("does not save or sync while typing and saves once on the next CTA", async () => {
    mockLoadQuestDraft.mockResolvedValueOnce(null);
    const view = await render(<CreateQuestScreen />);
    await waitFor(() =>
      expect(view.getByLabelText("ชื่อเควสต์ *")).toBeTruthy()
    );

    const typedTitle = "12345678901234567890";
    for (let index = 1; index <= typedTitle.length; index += 1) {
      await fireEvent.changeText(
        view.getByLabelText("ชื่อเควสต์ *"),
        typedTitle.slice(0, index)
      );
    }
    expect(mockPersistQuestDraft).not.toHaveBeenCalled();
    expect(mockLiveCreateQuest).not.toHaveBeenCalled();
    expect(mockLiveEditQuest).not.toHaveBeenCalled();

    await fillQuestDetails(view);
    await fireEvent.changeText(view.getByLabelText("ชื่อเควสต์ *"), typedTitle);
    await fireEvent.press(view.getByLabelText("ถัดไป"));

    await waitFor(() => expect(mockPersistQuestDraft).toHaveBeenCalledTimes(1));
    expect(mockPersistQuestDraft).toHaveBeenCalledWith(
      "test-key",
      expect.any(String),
      expect.objectContaining({ title: typedTitle }),
      2,
      "DRAFT"
    );
  });

  it("exposes a retry when an explicit draft save fails", async () => {
    mockLoadQuestDraft.mockResolvedValueOnce(null);
    const view = await render(<CreateQuestScreen />);
    await waitFor(() =>
      expect(view.getByLabelText("ชื่อเควสต์ *")).toBeTruthy()
    );
    await fillQuestDetails(view);
    mockPersistQuestDraft.mockRejectedValueOnce(
      new Error("storage unavailable")
    );

    await fireEvent.press(view.getByLabelText("ถัดไป"));
    await waitFor(() =>
      expect(view.getByTestId("create-quest-save-error")).toBeTruthy()
    );
    expect(mockPersistQuestDraft).toHaveBeenCalledTimes(1);

    await fireEvent.press(view.getByTestId("create-quest-retry-save"));
    await waitFor(() =>
      expect(view.getByText("บันทึกฉบับร่างแล้ว")).toBeTruthy()
    );
    expect(mockPersistQuestDraft).toHaveBeenCalledTimes(2);
  });

  it("creates the server Quest once when entering Review", async () => {
    mockLiveCreateQuest.mockResolvedValue({
      id: "server-quest-review",
      version: 3,
    });
    mockLiveGetPublishCheck.mockResolvedValue(serverPublishCheckFixture);
    const view = await renderNewModeAtTeamSetup();

    await fireEvent.press(view.getByTestId("create-quest-logistics-toggle"));
    const location = view.getByTestId("create-quest-location");
    const typedLocation = "location-update-1234";
    for (let index = 1; index <= typedLocation.length; index += 1) {
      await fireEvent.changeText(location, typedLocation.slice(0, index));
    }
    expect(mockPersistQuestDraft).not.toHaveBeenCalled();
    expect(mockLiveCreateQuest).not.toHaveBeenCalled();
    expect(mockLiveEditQuest).not.toHaveBeenCalled();

    await fireEvent.press(view.getByText("ตรวจสอบเควสต์"));
    await waitFor(() =>
      expect(view.getByTestId("create-quest-save-preview")).toBeTruthy()
    );
    await waitForPublishCheck(view);
    expect(mockPersistQuestDraft).toHaveBeenCalledTimes(1);
    expect(mockLiveCreateQuest).toHaveBeenCalledTimes(1);
    expect(mockLiveEditQuest).not.toHaveBeenCalled();
  });

  it("updates and publishes the server Quest once after a Review-step edit", async () => {
    mockLiveCreateQuest.mockResolvedValue({
      id: "server-quest-edit",
      version: 3,
    });
    mockLiveGetPublishCheck.mockResolvedValue(serverPublishCheckFixture);
    mockLivePublishQuest.mockResolvedValue({
      id: "server-quest-edit",
      state: "QUEST_OPEN",
    });
    const view = await renderNewModeAtTeamSetup();

    await fireEvent.press(view.getByText("ตรวจสอบเควสต์"));
    await waitFor(() =>
      expect(view.getByTestId("create-quest-save-preview")).toBeTruthy()
    );
    await waitForPublishCheck(view);
    expect(mockLiveCreateQuest).toHaveBeenCalledTimes(1);

    await fireEvent.press(view.getByTestId("create-quest-header-back"));
    await fireEvent.press(view.getByTestId("create-quest-logistics-toggle"));
    const location = view.getByTestId("create-quest-location");
    const editedLocation = "location-update-1234";
    for (let index = 1; index <= editedLocation.length; index += 1) {
      await fireEvent.changeText(location, editedLocation.slice(0, index));
    }
    expect(mockLiveEditQuest).not.toHaveBeenCalled();

    await fireEvent.press(view.getByText("ตรวจสอบเควสต์"));
    await waitFor(() => expect(mockLiveEditQuest).toHaveBeenCalledTimes(1));
    expect(mockLiveEditQuest.mock.calls[0][3]).toEqual(expect.any(String));
    expect(mockLiveCreateQuest).toHaveBeenCalledTimes(1);
    await waitForPublishCheck(view);
    await fireEvent.press(view.getByTestId("create-quest-save-preview"));
    await waitFor(() =>
      expect(view.getByText("เผยแพร่เควสต์แล้ว")).toBeTruthy()
    );
    expect(mockLiveEditQuest).toHaveBeenCalledTimes(1);
    expect(mockLiveCreateQuest).toHaveBeenCalledTimes(1);
  });

  it("collapses a double-tapped Review press into one create", async () => {
    let resolveCreate!: (value: { id: string; version: number }) => void;
    mockLiveCreateQuest.mockImplementation(
      () =>
        new Promise<{ id: string; version: number }>((resolve) => {
          resolveCreate = resolve;
        })
    );
    mockLiveGetPublishCheck.mockResolvedValue(serverPublishCheckFixture);
    const view = await renderNewModeAtTeamSetup();

    const reviewButton = view.getByRole("button", {
      name: "ตรวจสอบเควสต์",
    });
    await fireEvent.press(reviewButton);
    await fireEvent.press(reviewButton);
    await waitFor(() => expect(mockLiveCreateQuest).toHaveBeenCalledTimes(1));
    resolveCreate({ id: "server-quest-double-tap", version: 3 });

    await waitFor(() =>
      expect(view.getByTestId("create-quest-save-preview")).toBeTruthy()
    );
    await waitForPublishCheck(view);
    expect(mockPersistQuestDraft).toHaveBeenCalledTimes(1);
    expect(mockLiveCreateQuest).toHaveBeenCalledTimes(1);
  });

  it("reuses the idempotency key when a failed create is retried", async () => {
    mockLiveGetPublishCheck.mockResolvedValue(serverPublishCheckFixture);
    const view = await renderNewModeAtTeamSetup();
    mockLiveCreateQuest.mockRejectedValueOnce(new Error("offline"));
    await fireEvent.press(view.getByText("ตรวจสอบเควสต์"));
    await waitFor(() =>
      expect(view.getByTestId("create-quest-save-preview")).toBeTruthy()
    );
    await waitForPublishCheck(view);
    mockLiveCreateQuest.mockResolvedValueOnce({
      id: "server-quest-retry",
      version: 1,
    });
    mockLivePublishQuest.mockResolvedValue({
      id: "server-quest-retry",
      state: "QUEST_OPEN",
    });

    await fireEvent.press(view.getByLabelText("เผยแพร่เควสต์"));
    await waitFor(() =>
      expect(view.getByText("เผยแพร่เควสต์แล้ว")).toBeTruthy()
    );
    expect(mockLiveCreateQuest).toHaveBeenCalledTimes(2);
    expect(mockLiveCreateQuest.mock.calls[1][1]).toBe(
      mockLiveCreateQuest.mock.calls[0][1]
    );
  });

  it("sends one create and one draft write under StrictMode", async () => {
    mockLoadQuestDraft.mockImplementation(() =>
      Promise.resolve(liveDraftSnapshot)
    );
    mockLiveCreateQuest.mockResolvedValue({
      id: "server-quest-strict",
      version: 3,
    });
    mockLiveGetPublishCheck.mockResolvedValue(serverPublishCheckFixture);
    const view = await render(
      <mockReact.StrictMode>
        <CreateQuestScreen />
      </mockReact.StrictMode>
    );
    await waitFor(() =>
      expect(view.getByTestId("create-quest-logistics-toggle")).toBeTruthy()
    );

    await fireEvent.press(view.getByText("ตรวจสอบเควสต์"));
    await waitFor(() =>
      expect(view.getByTestId("create-quest-save-preview")).toBeTruthy()
    );
    await waitForPublishCheck(view);
    expect(mockPersistQuestDraft).toHaveBeenCalledTimes(1);
    expect(mockLiveCreateQuest).toHaveBeenCalledTimes(1);
  });

  it("confirms before system back can abandon an unsaved server edit", async () => {
    spyOnAlert();
    const view = await renderServerEditQuest();
    await fireEvent.changeText(
      view.getByLabelText("ชื่อเควสต์ *"),
      "Clean the dorm fans, second floor"
    );

    const removal = fireBeforeRemove();
    expect(removal.preventDefault).toHaveBeenCalled();
    expect(lastAlertCall()[0]).toBe("ละทิ้งการเปลี่ยนแปลงหรือไม่");
    // A server edit must never claim its changes are saved on the device.
    expect(lastAlertCall()[1]).toBe("การเปลี่ยนแปลงของคุณยังไม่ได้บันทึก");

    lastAlertButtons()[0].onPress?.();
    expect(mockNavigation.dispatch).not.toHaveBeenCalled();
    expect(view.getByLabelText("ชื่อเควสต์ *").props.value).toBe(
      "Clean the dorm fans, second floor"
    );

    const secondRemoval = fireBeforeRemove();
    expect(secondRemoval.preventDefault).toHaveBeenCalled();
    lastAlertButtons()[1].onPress?.();
    expect(mockNavigation.dispatch).toHaveBeenCalledTimes(1);
    expect(mockNavigation.dispatch).toHaveBeenCalledWith({ type: "GO_BACK" });
  });

  it("lets system back leave a clean server edit without prompting", async () => {
    const alertSpy = spyOnAlert();
    await renderServerEditQuest();

    const removal = fireBeforeRemove();
    expect(removal.preventDefault).not.toHaveBeenCalled();
    expect(alertSpy).not.toHaveBeenCalled();
  });

  it("disarms the guard exactly once when the header discard navigates", async () => {
    spyOnAlert();
    const view = await renderServerEditQuest();
    await fireEvent.changeText(
      view.getByLabelText("ชื่อเควสต์ *"),
      "Dirty title"
    );

    await fireEvent.press(view.getByTestId("create-quest-header-back"));
    expect(lastAlertCall()[0]).toBe("ละทิ้งการเปลี่ยนแปลงหรือไม่");
    lastAlertButtons()[1].onPress?.();
    expect(mockRouter.replace).toHaveBeenCalledTimes(1);
    expect(mockRouter.replace).toHaveBeenCalledWith({
      pathname: "/quest/[id]",
      params: { id: "server-quest-1", mode: "post" },
    });

    const passthrough = fireBeforeRemove();
    expect(passthrough.preventDefault).not.toHaveBeenCalled();
    const reblocked = fireBeforeRemove();
    expect(reblocked.preventDefault).toHaveBeenCalled();
  });

  it("guards step 2 of a server edit with the same unsaved confirmation", async () => {
    spyOnAlert();
    const view = await renderServerEditQuest();
    await fireEvent.changeText(
      view.getByLabelText("ชื่อเควสต์ *"),
      "Edited before stepping forward"
    );
    await fireEvent.press(view.getByText("ถัดไป"));

    const removal = fireBeforeRemove();
    expect(removal.preventDefault).toHaveBeenCalled();
    expect(lastAlertCall()[0]).toBe("ละทิ้งการเปลี่ยนแปลงหรือไม่");
    lastAlertButtons()[1].onPress?.();
    expect(mockNavigation.dispatch).toHaveBeenCalledTimes(1);
    expect(mockNavigation.dispatch).toHaveBeenCalledWith({ type: "GO_BACK" });
  });

  it("keeps the local-draft wording when back interrupts a restored draft", async () => {
    spyOnAlert();
    const view = await render(<CreateQuestScreen editQuestId="mock-draft" />);
    await waitFor(() =>
      expect(view.getByTestId("create-quest-logistics-toggle")).toBeTruthy()
    );

    const removal = fireBeforeRemove();
    expect(removal.preventDefault).toHaveBeenCalled();
    expect(lastAlertCall()[0]).toBe("ออกจากการสร้างเควสต์หรือไม่?");
    expect(lastAlertCall()[1]).toBe(
      "ฉบับร่างถูกบันทึกไว้ในอุปกรณ์ ออกจากแบบฟอร์มและทำต่อภายหลังได้"
    );
  });

  it("saves a server edit and leaves without a discard prompt", async () => {
    spyOnAlert();
    const view = await renderServerEditQuest();
    await fireEvent.changeText(
      view.getByLabelText("ชื่อเควสต์ *"),
      "Clean the dorm fans v2"
    );

    await fireEvent.press(view.getByText("ถัดไป"));
    await fireEvent.press(view.getByText("ตรวจสอบเควสต์"));
    await fireEvent.press(view.getByTestId("edit-quest-save"));
    await waitFor(() =>
      expect(view.getByText("อัปเดตเควสต์แล้ว")).toBeTruthy()
    );
    expect(mockLiveEditQuest).toHaveBeenCalledTimes(1);

    const removal = fireBeforeRemove();
    expect(removal.preventDefault).not.toHaveBeenCalled();

    await fireEvent.press(view.getByText("กลับไปที่เควสต์"));
    expect(mockRouter.replace).toHaveBeenCalledTimes(1);
  });

  it("shows a localized action in the help dialog", async () => {
    const alertSpy = spyOnAlert();
    const view = await render(<CreateQuestScreen />);

    await fireEvent.press(view.getByTestId("create-quest-help"));
    expect(alertSpy).toHaveBeenCalledWith("สร้างเควสต์", expect.any(String), [
      { text: "ตกลง" },
    ]);
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
