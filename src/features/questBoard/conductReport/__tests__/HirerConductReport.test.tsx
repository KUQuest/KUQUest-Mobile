import { fireEvent, waitFor } from "@testing-library/react-native";

import { ApiError } from "@/api/ApiClient";
import type { ConductReportView } from "@/api/ConductReportApi";
import { Button } from "@/components/ui/Button";
import { SweetAlertHost } from "@/components/ui/SweetAlert";
import type { LiveQuestAssignment } from "@/features/questBoard/live/liveQuestService";
import { conductReportMessages } from "@/locales/conductReportMessages";
import {
  renderWithAppTheme,
  renderWithQueryClient,
} from "@/testing/queryTestUtils";

import { ConductReportSheet } from "../ConductReportSheet";
import { FiledConductReports } from "../FiledConductReports";
import { useHirerConductReport } from "../useHirerConductReport";

const messages = conductReportMessages.en;
const mockMutateAsync = jest.fn();
const mockRefetch = jest.fn();
let mockView: ConductReportView | undefined;

jest.mock("@/features/preferences/localeStore", () => ({
  useLocale: () => ({ locale: "en" }),
}));

jest.mock("@/features/questBoard/api/questBoardQueries", () => ({
  useConductReportsQuery: () => ({ data: mockView, refetch: mockRefetch }),
  useFileConductReportMutation: () => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
  }),
}));

const assignment = (workerId: string, displayName?: string) =>
  ({
    questId: "quest-1",
    workerId,
    state: "ASSIGNMENT_INCOMPLETE",
    questState: "QUEST_FAILED",
    startedAt: null,
    ...(displayName ? { member: { id: workerId, displayName } } : {}),
  }) as unknown as LiveQuestAssignment;

const ASSIGNMENTS = [
  assignment("worker-1", "Somchai"),
  assignment("worker-2", "Malee"),
];

function Harness({ questState }: { questState?: string }) {
  const report = useHirerConductReport({
    questId: "quest-1",
    viewerId: "hirer-1",
    assignments: ASSIGNMENTS,
    questState,
  });
  return (
    <>
      {report.canReport ? (
        <Button onPress={report.openReport} testID="open-report">
          {messages.reportWorker}
        </Button>
      ) : null}
      <FiledConductReports
        messages={report.messages}
        reports={report.filedReports}
      />
      <ConductReportSheet {...report} />
      <SweetAlertHost />
    </>
  );
}

const pendingReport = {
  id: "report-1",
  displayId: "CND-000042",
  questId: "quest-1",
  reportedMemberId: "worker-2",
  reason: "CONDUCT_ABANDONED" as const,
  detail: null,
  status: "CONDUCT_REPORT_PENDING" as const,
  createdAt: "2026-10-08T05:00:00.000Z",
};

describe("Hirer Conduct Report", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockView = undefined;
  });

  it("offers no report action when the Server lists nothing reportable", async () => {
    mockView = {
      windowEndsAt: null,
      reportable: [],
      items: [],
    };
    const screen = await renderWithQueryClient(<Harness />);

    expect(screen.queryByTestId("open-report")).toBeNull();
    expect(screen.queryByTestId("conduct-report-filed")).toBeNull();
  });

  it("lists only the Workers the Server returns for CONDUCT_ABANDONED", async () => {
    mockView = {
      windowEndsAt: "2026-10-09T05:00:00.000Z",
      reportable: [
        { memberId: "worker-2", reason: "CONDUCT_ABANDONED" },
        { memberId: "worker-1", reason: "CONDUCT_NO_SHOW" },
      ],
      items: [],
    };
    const screen = await renderWithQueryClient(<Harness />);

    await fireEvent.press(screen.getByTestId("open-report"));
    expect(screen.getByTestId("conduct-report-worker-worker-2")).toBeTruthy();
    expect(screen.getByText("Malee")).toBeTruthy();
    expect(screen.queryByTestId("conduct-report-worker-worker-1")).toBeNull();
  });

  it("files the selected Worker with trimmed details and shows the report number", async () => {
    mockView = {
      windowEndsAt: "2026-10-09T05:00:00.000Z",
      reportable: [
        { memberId: "worker-1", reason: "CONDUCT_ABANDONED" },
        { memberId: "worker-2", reason: "CONDUCT_ABANDONED" },
      ],
      items: [],
    };
    mockMutateAsync.mockResolvedValue(pendingReport);
    const screen = await renderWithQueryClient(<Harness />);

    await fireEvent.press(screen.getByTestId("open-report"));
    await fireEvent.press(screen.getByTestId("conduct-report-worker-worker-2"));
    await fireEvent.changeText(
      screen.getByTestId("conduct-report-detail"),
      "  Nothing arrived  "
    );
    await fireEvent.press(screen.getByTestId("conduct-report-submit"));

    expect(mockMutateAsync).toHaveBeenCalledWith({
      questId: "quest-1",
      viewerId: "hirer-1",
      input: {
        reportedMemberId: "worker-2",
        reason: "CONDUCT_ABANDONED",
        detail: "Nothing arrived",
      },
      idempotencyKey: expect.any(String),
    });
    await waitFor(() =>
      expect(
        screen.getByText(messages.successDescription("CND-000042"))
      ).toBeTruthy()
    );
  });

  it("shows the rule-specific message when the Worker was already reported", async () => {
    mockView = {
      windowEndsAt: "2026-10-09T05:00:00.000Z",
      reportable: [{ memberId: "worker-1", reason: "CONDUCT_ABANDONED" }],
      items: [],
    };
    mockMutateAsync.mockRejectedValue(
      new ApiError(409, "CONDUCT_REPORT_ALREADY_EXISTS", "exists")
    );
    const screen = await renderWithQueryClient(<Harness />);

    await fireEvent.press(screen.getByTestId("open-report"));
    await fireEvent.press(screen.getByTestId("conduct-report-submit"));

    await waitFor(() =>
      expect(screen.getByTestId("conduct-report-error")).toHaveTextContent(
        messages.alreadyReported
      )
    );
  });

  it("hides the report action once windowEndsAt has passed", async () => {
    mockView = {
      windowEndsAt: "2026-01-01T00:00:00.000Z",
      reportable: [{ memberId: "worker-1", reason: "CONDUCT_ABANDONED" }],
      items: [pendingReport],
    };
    const screen = await renderWithQueryClient(<Harness />);

    expect(screen.queryByTestId("open-report")).toBeNull();
    expect(screen.getByTestId("conduct-report-filed")).toBeTruthy();
  });

  it("re-reads reportable when the Quest State changes", async () => {
    mockView = { windowEndsAt: null, reportable: [], items: [] };
    const screen = await renderWithAppTheme(
      <Harness questState="QUEST_ASSIGNED" />
    );
    expect(mockRefetch).not.toHaveBeenCalled();

    await screen.rerender(<Harness questState="QUEST_FAILED" />);
    expect(mockRefetch).toHaveBeenCalledTimes(1);
  });

  it("shows the filed report with the Worker name and Admin status", async () => {
    mockView = {
      windowEndsAt: "2026-10-09T05:00:00.000Z",
      reportable: [],
      items: [pendingReport],
    };
    const screen = await renderWithQueryClient(<Harness />);

    expect(
      screen.getByText(messages.filedItem("CND-000042", "Malee"))
    ).toBeTruthy();
    expect(
      screen.getByText(messages.status.CONDUCT_REPORT_PENDING)
    ).toBeTruthy();
  });
});
