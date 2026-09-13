import { fireEvent, render } from "@testing-library/react-native";

import ReportScreen from "../ReportScreen";

const mockBack = jest.fn();
const mockRouteParams: {
  source?: string;
  questId?: string;
  questTitle?: string;
  viewerId?: string;
  reportedMemberId?: string;
} = {};

jest.mock("expo-router", () => ({
  useRouter: () => ({ back: mockBack }),
  useLocalSearchParams: () => mockRouteParams,
}));

jest.mock("../../../locales/LocaleProvider", () => ({
  useLocale: () => ({ locale: "th" }),
}));

describe("Report screen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRouteParams.source = "chat";
    mockRouteParams.questId = "buy-lunch";
    mockRouteParams.questTitle = "ซื้อข้าวจากโรงอาหาร";
    mockRouteParams.viewerId = "student-demo";
    mockRouteParams.reportedMemberId = "student-creator-4";
  });

  it("shows the topic and details fields", async () => {
    const view = await render(<ReportScreen />);

    expect(view.getByRole("header", { name: "ตรวจสอบรายงาน" })).toBeTruthy();
    expect(view.getByTestId("report-context")).toBeTruthy();
    expect(view.getByText("แชตการทำงาน")).toBeTruthy();
    expect(view.getByText("หัวข้อการรายงาน")).toBeTruthy();
    expect(view.getByText("รายละเอียดการรายงาน")).toBeTruthy();
    expect(view.getByTestId("report-topic-trigger")).toBeTruthy();
    expect(view.getByTestId("report-submit")).toBeTruthy();
  });

  it("opens a full-screen picker with six report topic tags", async () => {
    const view = await render(<ReportScreen />);

    await fireEvent.press(view.getByTestId("report-topic-trigger"));

    expect(view.getByTestId("report-topic-picker")).toBeTruthy();
    expect(view.getAllByRole("checkbox")).toHaveLength(6);
  });

  it("validates the required report fields", async () => {
    const view = await render(<ReportScreen />);

    await fireEvent.press(view.getByTestId("report-submit"));

    expect(
      view.getByText("กรุณาเลือกหัวข้อการรายงานอย่างน้อย 1 หัวข้อ")
    ).toBeTruthy();
    expect(view.getByText("กรุณากรอกรายละเอียดการรายงาน")).toBeTruthy();
    expect(view.queryByTestId("report-success")).toBeNull();
  });

  it("selects multiple topics and submits the report details", async () => {
    const view = await render(<ReportScreen />);
    const abusiveTopic = "ข้อความไม่เหมาะสมหรือการคุกคาม";
    const outOfScopeTopic = "งานนอกขอบเขตของเควสต์";

    await fireEvent.press(view.getByTestId("report-topic-trigger"));
    await fireEvent.press(
      view.getByTestId("report-topic-REPORT_ABUSIVE_OR_HARASSMENT")
    );
    await fireEvent.press(
      view.getByTestId("report-topic-CONDUCT_OUT_OF_SCOPE")
    );
    await fireEvent.press(view.getByTestId("report-topic-picker-done"));

    expect(view.getByText("เลือกแล้ว 2 หัวข้อ")).toBeTruthy();
    expect(view.getByText(abusiveTopic)).toBeTruthy();
    expect(view.getByText(outOfScopeTopic)).toBeTruthy();

    await fireEvent.changeText(
      view.getByPlaceholderText(
        "อธิบายเหตุการณ์และบริบทที่เกี่ยวข้องโดยละเอียด"
      ),
      "มีข้อความคุกคามและขอบเขตงานไม่ตรงกับเควสต์"
    );
    await fireEvent.press(view.getByTestId("report-submit"));
    expect(view.getByTestId("report-review")).toBeTruthy();
    expect(view.getByTestId("report-review-topics")).toBeTruthy();
    expect(
      view.getByText("ตรวจสอบข้อมูลก่อนส่งให้ทีมแอดมิน KUQuest")
    ).toBeTruthy();
    await fireEvent.press(view.getByTestId("report-submit-confirm"));
    expect(view.getByTestId("report-success")).toBeTruthy();
    expect(view.getByText("ส่งรายงานให้แอดมินแล้ว")).toBeTruthy();
  });

  it("returns to the previous screen after submission", async () => {
    const view = await render(<ReportScreen />);

    await fireEvent.press(view.getByTestId("report-topic-trigger"));
    await fireEvent.press(
      view.getByTestId("report-topic-REPORT_ABUSIVE_OR_HARASSMENT")
    );
    await fireEvent.press(view.getByTestId("report-topic-picker-done"));
    await fireEvent.changeText(
      view.getByPlaceholderText(
        "อธิบายเหตุการณ์และบริบทที่เกี่ยวข้องโดยละเอียด"
      ),
      "มีข้อความคุกคามในบทสนทนา"
    );
    await fireEvent.press(view.getByTestId("report-submit"));
    await fireEvent.press(view.getByTestId("report-submit-confirm"));
    await fireEvent.press(view.getByTestId("report-success-back"));
    expect(mockBack).toHaveBeenCalledTimes(1);
  });
});
