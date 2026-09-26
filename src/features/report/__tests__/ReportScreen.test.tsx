import { fireEvent, waitFor } from "@testing-library/react-native";
import { renderWithAppTheme } from "@/testing/queryTestUtils";
import { chatApi } from "@/api/ChatApi";
import { reportMessages } from "@/locales/reportMessages";
import ReportScreen from "../ReportScreen";

const mockBack = jest.fn();
const mockRouteParams: {
  messageId?: string;
  conversationTitle?: string;
  senderName?: string;
} = {};

jest.mock("expo-router", () => ({
  useRouter: () => ({ back: mockBack }),
  useLocalSearchParams: () => mockRouteParams,
}));

jest.mock("../../../features/preferences/localeStore", () => ({
  useLocale: () => ({ locale: "en" }),
}));

jest.mock("@/api/ChatApi", () => {
  const actual = jest.requireActual("@/api/ChatApi");
  return {
    ...actual,
    chatApi: {
      submitMessageReport: jest.fn(),
    },
  };
});

describe("ReportScreen", () => {
  const validMessageId = "a1b2c3d4-e5f6-4789-a012-3456789abcde";
  const messages = reportMessages.en;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRouteParams.messageId = validMessageId;
    mockRouteParams.conversationTitle = "Campus Cleanup Work Chat";
    mockRouteParams.senderName = "Alex";
  });

  it("shows unavailable state when messageId is missing", async () => {
    mockRouteParams.messageId = undefined;
    const view = await renderWithAppTheme(<ReportScreen />);

    expect(view.getByTestId("report-unavailable")).toBeTruthy();
    expect(view.getByText(messages.unavailableTitle)).toBeTruthy();
    expect(view.getByText(messages.unavailableDescription)).toBeTruthy();
    expect(view.queryByTestId("report-submit")).toBeNull();

    await fireEvent.press(view.getByTestId("report-unavailable-back"));
    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  it("shows unavailable state when messageId is invalid", async () => {
    mockRouteParams.messageId = "not-a-valid-uuid";
    const view = await renderWithAppTheme(<ReportScreen />);

    expect(view.getByTestId("report-unavailable")).toBeTruthy();
    expect(view.getByText(messages.unavailableTitle)).toBeTruthy();
    expect(view.queryByTestId("report-submit")).toBeNull();
  });

  it("renders the 5 report reasons and context card for a valid messageId", async () => {
    const view = await renderWithAppTheme(<ReportScreen />);

    expect(view.getByRole("header", { name: messages.title })).toBeTruthy();
    expect(view.getByTestId("report-context")).toBeTruthy();
    expect(
      view.getByText(messages.contextConversation("Campus Cleanup Work Chat"))
    ).toBeTruthy();
    expect(view.getByText(messages.contextSender("Alex"))).toBeTruthy();

    expect(
      view.getByText(messages.reasonOptions.REPORT_ABUSIVE_OR_HARASSMENT)
    ).toBeTruthy();
    expect(view.getByText(messages.reasonOptions.REPORT_SPAM)).toBeTruthy();
    expect(
      view.getByText(messages.reasonOptions.REPORT_INAPPROPRIATE_CONTENT)
    ).toBeTruthy();
    expect(
      view.getByText(messages.reasonOptions.REPORT_DANGER_OR_THREAT)
    ).toBeTruthy();
    expect(view.getByText(messages.reasonOptions.REPORT_OTHER)).toBeTruthy();

    expect(view.getByTestId("report-details-input")).toBeTruthy();
    expect(view.getByTestId("report-submit")).toBeTruthy();
  });

  it("validates that a reason must be selected before proceeding to review", async () => {
    const view = await renderWithAppTheme(<ReportScreen />);

    await fireEvent.press(view.getByTestId("report-submit"));

    expect(view.getByText(messages.reasonRequired)).toBeTruthy();
    expect(view.queryByTestId("report-review")).toBeNull();
  });

  it("allows selecting a reason, entering details, reviewing, and editing back with preserved data", async () => {
    const view = await renderWithAppTheme(<ReportScreen />);

    await fireEvent.press(
      view.getByTestId("report-reason-REPORT_ABUSIVE_OR_HARASSMENT")
    );
    await fireEvent.changeText(
      view.getByTestId("report-details-input"),
      "Inappropriate language directed at participants"
    );

    await fireEvent.press(view.getByTestId("report-submit"));

    expect(view.getByTestId("report-review")).toBeTruthy();
    expect(view.getByTestId("report-review-reason").props.children).toBe(
      messages.reasonOptions.REPORT_ABUSIVE_OR_HARASSMENT
    );
    expect(view.getByTestId("report-review-details").props.children).toBe(
      "Inappropriate language directed at participants"
    );

    await fireEvent.press(view.getByTestId("report-edit"));

    expect(view.getByTestId("report-submit")).toBeTruthy();
    expect(view.getByTestId("report-details-input").props.value).toBe(
      "Inappropriate language directed at participants"
    );
  });

  it("submits the report and only shows submitted state after API resolves", async () => {
    const { promise: submitPromise, resolve: resolveApi } =
      typeof Promise.withResolvers === "function"
        ? Promise.withResolvers<unknown>()
        : (() => {
            let resolve!: (val: unknown) => void;
            const promise = new Promise<unknown>((r) => {
              resolve = r;
            });
            return { promise, resolve };
          })();
    (chatApi.submitMessageReport as jest.Mock).mockReturnValue(submitPromise);

    const view = await renderWithAppTheme(<ReportScreen />);

    await fireEvent.press(view.getByTestId("report-reason-REPORT_SPAM"));
    await fireEvent.changeText(
      view.getByTestId("report-details-input"),
      "Repeated promotional messages"
    );
    await fireEvent.press(view.getByTestId("report-submit"));

    const submitConfirmButton = view.getByTestId("report-submit-confirm");
    const submitPress = fireEvent.press(submitConfirmButton);

    expect(chatApi.submitMessageReport).toHaveBeenCalledWith({
      messageId: validMessageId,
      reason: "REPORT_SPAM",
      detail: "Repeated promotional messages",
    });

    expect(view.queryByTestId("report-success")).toBeNull();
    expect(view.getByTestId("report-review")).toBeTruthy();

    resolveApi({
      id: "entry-1",
      messageId: validMessageId,
      reason: "REPORT_SPAM",
      detail: "Repeated promotional messages",
      caseStatus: "REPORT_CASE_PENDING",
      createdAt: "2026-09-26T10:00:00Z",
      updatedAt: "2026-09-26T10:00:00Z",
    });
    await submitPress;

    await waitFor(() => {
      expect(view.getByTestId("report-success")).toBeTruthy();
    });
    expect(view.getByText(messages.successTitle)).toBeTruthy();
    expect(view.getByText(messages.successDescription)).toBeTruthy();

    await fireEvent.press(view.getByTestId("report-success-back"));
    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  it("keeps review state, preserves entered data, and shows localized error on API failure", async () => {
    (chatApi.submitMessageReport as jest.Mock).mockRejectedValueOnce(
      new Error("Network failed")
    );

    const view = await renderWithAppTheme(<ReportScreen />);

    await fireEvent.press(view.getByTestId("report-reason-REPORT_OTHER"));
    await fireEvent.changeText(
      view.getByTestId("report-details-input"),
      "Something went wrong"
    );
    await fireEvent.press(view.getByTestId("report-submit"));

    await fireEvent.press(view.getByTestId("report-submit-confirm"));

    await waitFor(() => {
      expect(view.getByTestId("report-error-banner")).toBeTruthy();
    });

    expect(view.queryByTestId("report-success")).toBeNull();
    expect(view.getByTestId("report-review")).toBeTruthy();
    expect(view.getByTestId("report-review-reason").props.children).toBe(
      messages.reasonOptions.REPORT_OTHER
    );
    expect(view.getByTestId("report-review-details").props.children).toBe(
      "Something went wrong"
    );

    (chatApi.submitMessageReport as jest.Mock).mockResolvedValueOnce({
      id: "entry-2",
      messageId: validMessageId,
      reason: "REPORT_OTHER",
      detail: "Something went wrong",
      caseStatus: "REPORT_CASE_PENDING",
      createdAt: "2026-09-26T10:00:00Z",
      updatedAt: "2026-09-26T10:00:00Z",
    });

    await fireEvent.press(view.getByTestId("report-submit-confirm"));

    await waitFor(() => {
      expect(view.getByTestId("report-success")).toBeTruthy();
    });
  });
});
