import { formatTimestampDate, formatTimeInBangkok } from "@/domain/datetime";
import { groupQuestMessages } from "@/locales/groupQuestMessages";
import { act, fireEvent } from "@testing-library/react-native";

import { resetServerClock } from "@/api/serverClock";
import { renderWithAppTheme } from "@/testing/queryTestUtils";
import { QuestUnderfilledConsentDecision } from "../../domain/types";
import { useQuestDetailFeature } from "../../detail/useQuestDetailFeature";
import PartialGroupStartConsentScreen from "../PartialGroupStartConsentScreen";

const mockPush = jest.fn();
const mockReplace = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
}));
jest.mock("../../detail/useQuestDetailFeature");
jest.mock("@/features/preferences/localeStore", () => ({
  useLocale: () => ({ locale: "en" }),
}));

const mockUseQuestDetailFeature = jest.mocked(useQuestDetailFeature);

const messages = {
  back: "Back",
  errorDescription: "Could not load Quest.",
  errorTitle: "Quest unavailable",
  loading: "Loading Quest",
  questNotFound: "Quest not found",
  questNotFoundDescription: "This Quest is unavailable.",
  retry: "Retry",
};

function makeView(overrides: Record<string, unknown> = {}) {
  return {
    handleBack: jest.fn(),
    messages,
    onRetry: jest.fn(),
    partialStartConsent: { surfaceState: "empty" },
    quest: null,
    state: "loading",
    ...overrides,
  };
}
function makeUnderfilled(overrides: Record<string, any> = {}) {
  return {
    id: "underfilled-1",
    questId: "quest-1",
    questState: "QUEST_OPEN",
    state: "UNDERFILLED_CONSENT_PENDING",
    activeWorkerCount: 1,
    headcount: 2,
    workerRewardPool: 150,
    questReward: 150,
    cancelledAt: "2026-08-12T09:00:00.000Z",
    dueAt: "2030-10-02T12:00:00.000Z",
    decision: {
      status: "UNDERFILLED_DECISION_PROCEEDED",
      value: "PROCEED",
      expiresAt: null,
    },
    consent: {
      status: "UNDERFILLED_CONSENT_PENDING",
      expiresAt: "2030-10-02T12:10:00.000Z",
      totalCount: 1,
      acceptedCount: 0,
      declinedCount: 0,
      pendingCount: 1,
    },
    responses: [
      {
        workerId: "worker-1",
        assignmentId: "assignment-1",
        decision: null,
        questReward: 150,
        respondedAt: null,
      },
    ],
    ownResponse: null,
    ...overrides,
  };
}

describe("PartialGroupStartConsentScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
    resetServerClock();
  });

  it("shows Quest loading state and keeps Back available", async () => {
    const model = makeView();
    mockUseQuestDetailFeature.mockReturnValue(model as never);

    const screen = await renderWithAppTheme(
      <PartialGroupStartConsentScreen questId="quest-1" />
    );

    expect(
      screen.getByTestId("quest-detail-loading-skeleton").props
        .accessibilityLabel
    ).toBe("Loading Quest");
    await fireEvent.press(screen.getByTestId("header-back-button"));
    expect(model.handleBack).toHaveBeenCalledTimes(1);
  });

  it("offers retry after a Quest read error", async () => {
    const model = makeView({ state: "error" });
    mockUseQuestDetailFeature.mockReturnValue(model as never);

    const screen = await renderWithAppTheme(
      <PartialGroupStartConsentScreen questId="quest-1" />
    );

    expect(screen.getByText("Could not load Quest.")).toBeTruthy();
    await fireEvent.press(screen.getByText("Retry"));
    expect(model.onRetry).toHaveBeenCalledTimes(1);
  });

  it("shows missing-Quest and stale-consent states with Back", async () => {
    const missingModel = makeView({ state: "missing" });
    mockUseQuestDetailFeature.mockReturnValue(missingModel as never);

    const missingScreen = await renderWithAppTheme(
      <PartialGroupStartConsentScreen questId="quest-1" />
    );
    expect(missingScreen.getByTestId("quest-detail-not-found")).toBeTruthy();
    await fireEvent.press(missingScreen.getByTestId("header-back-button"));
    expect(missingModel.handleBack).toHaveBeenCalledTimes(1);

    const staleModel = makeView({
      quest: { id: "quest-1" },
      state: "ready",
    });
    mockUseQuestDetailFeature.mockReturnValue(staleModel as never);

    const staleScreen = await renderWithAppTheme(
      <PartialGroupStartConsentScreen questId="quest-1" />
    );
    expect(staleScreen.getByTestId("partial-group-start-empty")).toBeTruthy();
    expect(staleScreen.queryByTestId("partial-group-start-approve")).toBeNull();
    await fireEvent.press(staleScreen.getByTestId("header-back-button"));
    expect(staleModel.handleBack).toHaveBeenCalledTimes(1);
  });

  it("formats due date and forwards pending Worker consent", async () => {
    const onWorkerConsent = jest.fn();
    const dueAt = "2030-10-02T12:00:00.000Z";
    const model = makeView({
      partialStartConsent: {
        canConsent: true,
        locale: "en",
        onWorkerConsent,
        questTitle: "Group survey",
        underfilled: {
          id: "underfilled-1",
          questId: "quest-1",
          questState: "QUEST_ASSIGNED",
          state: "UNDERFILLED_CONSENT_PENDING",
          activeWorkerCount: 1,
          headcount: 2,
          workerRewardPool: 150,
          questReward: 150,
          dueAt,
          decision: {
            status: "UNDERFILLED_DECISION_PROCEEDED",
            value: "PROCEED",
            expiresAt: null,
          },
          consent: {
            status: "UNDERFILLED_CONSENT_PENDING",
            expiresAt: "2030-10-02T12:10:00.000Z",
            totalCount: 1,
            acceptedCount: 0,
            declinedCount: 0,
            pendingCount: 1,
          },
          responses: [
            {
              workerId: "worker-1",
              assignmentId: "assignment-1",
              decision: null,
              questReward: 150,
              respondedAt: null,
            },
          ],
          ownResponse: null,
        },
        viewerId: "worker-1",
      },
      quest: {
        id: "quest-1",
        rewardPerPerson: 200,
        deadline: "2030-10-01T12:00:00.000Z",
      },
      state: "ready",
    });
    mockUseQuestDetailFeature.mockReturnValue(model as never);

    const screen = await renderWithAppTheme(
      <PartialGroupStartConsentScreen questId="quest-1" />
    );

    expect(
      screen.getByText("1 Oct 2030 19:00 → 2 Oct 2030 19:00")
    ).toBeTruthy();
    expect(screen.getByText("The quest details changed")).toBeTruthy();
    expect(screen.getByText("You need to respond")).toBeTruthy();
    expect(screen.getByText(/฿200 → ฿150/)).toBeTruthy();
    expect(
      screen.getByText(/Accepting does not start the quest by itself/)
    ).toBeTruthy();
    expect(screen.getByText("Accept")).toBeTruthy();
    expect(screen.getByText("Decline")).toBeTruthy();
    await fireEvent.press(screen.getByTestId("partial-group-start-approve"));
    expect(onWorkerConsent).toHaveBeenCalledWith(
      QuestUnderfilledConsentDecision.ACCEPT
    );
  });
  it("separates hirer decision from Worker response", async () => {
    const model = makeView({
      quest: { id: "quest-1" },
      state: "ready",
      partialStartConsent: {
        underfilled: makeUnderfilled({
          state: "UNDERFILLED_DECISION_PENDING",
          decision: {
            status: "UNDERFILLED_DECISION_PENDING",
            value: null,
            expiresAt: "2030-10-02T12:10:00.000Z",
          },
        }),
        onHirerDecision: jest.fn(),
        canDecide: true,
        canConsent: false,
        viewerId: "worker-1",
      },
    });
    mockUseQuestDetailFeature.mockReturnValue(model as never);
    const screen = await renderWithAppTheme(
      <PartialGroupStartConsentScreen questId="quest-1" />
    );
    expect(screen.getByText("Waiting for the hirer's decision")).toBeTruthy();
    expect(
      screen.getByText(/Proceeding gives joined workers 10 minutes/)
    ).toBeTruthy();
    expect(screen.getByTestId("partial-group-start-proceed")).toBeTruthy();
    expect(screen.queryByTestId("partial-group-start-approve")).toBeNull();
  });

  it("shows accepted waiting state without claiming quest has started", async () => {
    const underfilled = makeUnderfilled({
      consent: {
        status: "UNDERFILLED_CONSENT_PENDING",
        expiresAt: "2030-10-02T12:10:00.000Z",
        totalCount: 2,
        acceptedCount: 1,
        declinedCount: 0,
        pendingCount: 1,
      },
      responses: [
        {
          workerId: "worker-1",
          assignmentId: "assignment-1",
          decision: "ACCEPT",
          questReward: 150,
          respondedAt: "2030-10-02T12:01:00.000Z",
        },
      ],
      ownResponse: {
        workerId: "worker-1",
        decision: "ACCEPT",
        questReward: 150,
        respondedAt: "2030-10-02T12:01:00.000Z",
      },
    });
    const model = makeView({
      quest: { id: "quest-1" },
      state: "ready",
      partialStartConsent: {
        underfilled,
        canConsent: false,
        viewerId: "worker-1",
      },
    });
    mockUseQuestDetailFeature.mockReturnValue(model as never);
    const screen = await renderWithAppTheme(
      <PartialGroupStartConsentScreen questId="quest-1" />
    );
    expect(
      screen.getByText("You accepted — waiting for 1 other worker.")
    ).toBeTruthy();
    expect(
      screen.getByText(/Accepting does not start the quest by itself/)
    ).toBeTruthy();
    expect(screen.queryByTestId("partial-group-start-approve")).toBeNull();
  });

  it("refetches once when deadline expires and announces countdown only at minute boundaries", async () => {
    jest.useFakeTimers();
    const expiresAt = new Date(Date.now() + 62_000).toISOString();
    const onRetry = jest.fn();
    const model = makeView({
      onRetry,
      quest: { id: "quest-1" },
      state: "ready",
      partialStartConsent: {
        underfilled: makeUnderfilled({
          consent: {
            status: "UNDERFILLED_CONSENT_PENDING",
            expiresAt,
            totalCount: 1,
            acceptedCount: 0,
            declinedCount: 0,
            pendingCount: 1,
          },
        }),
        canConsent: true,
        viewerId: "worker-1",
      },
    });
    mockUseQuestDetailFeature.mockReturnValue(model as never);
    const screen = await renderWithAppTheme(
      <PartialGroupStartConsentScreen questId="quest-1" />
    );
    expect(screen.getByText("01:02").props.accessibilityLiveRegion).toBe(
      "none"
    );
    await act(async () => {
      jest.advanceTimersByTime(1_000);
    });
    expect(screen.getByText("01:01").props.accessibilityLiveRegion).toBe(
      "none"
    );
    await act(async () => {
      jest.advanceTimersByTime(2_000);
    });
    expect(screen.getByText("00:59").props.accessibilityLiveRegion).toBe(
      "polite"
    );
    await act(async () => {
      jest.advanceTimersByTime(59_000);
    });
    expect(screen.getByText("Time is up — checking the result…")).toBeTruthy();
    expect(onRetry).toHaveBeenCalledTimes(1);
    await act(async () => {
      jest.advanceTimersByTime(3_000);
    });
    expect(onRetry).toHaveBeenCalledTimes(1);
    const outcome = makeView({
      quest: { id: "quest-1" },
      state: "ready",
      partialStartConsent: {
        underfilled: makeUnderfilled({
          state: "UNDERFILLED_CANCELLED",
          decision: {
            status: "UNDERFILLED_DECISION_CANCELLED",
            value: "CANCEL",
            expiresAt: null,
          },
        }),
        viewerId: "worker-1",
      },
    });
    mockUseQuestDetailFeature.mockReturnValue(outcome as never);
    await act(async () => {
      screen.rerender(<PartialGroupStartConsentScreen questId="quest-1" />);
    });
    expect(screen.getByTestId("partial-group-start-cancelled")).toBeTruthy();
    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId("partial-group-start-approve")).toBeNull();
    expect(screen.queryByTestId("partial-group-start-reject")).toBeNull();
  });
  it("explains Hirer cancellation and offers Browse other quests", async () => {
    const model = makeView({
      quest: { id: "quest-1" },
      state: "ready",
      partialStartConsent: {
        underfilled: makeUnderfilled({
          state: "UNDERFILLED_CANCELLED",
          cancellationReason: "HIRER_CANCELLED",
          decision: {
            status: "UNDERFILLED_DECISION_CANCELLED",
            value: "CANCEL",
            expiresAt: null,
          },
        }),
        viewerId: "worker-1",
      },
    });
    mockUseQuestDetailFeature.mockReturnValue(model as never);
    const screen = await renderWithAppTheme(
      <PartialGroupStartConsentScreen questId="quest-1" />
    );
    expect(screen.getByText(groupQuestMessages.en.hirerCancelled)).toBeTruthy();
    await fireEvent.press(screen.getByText("Browse other quests"));
    expect(mockReplace).toHaveBeenCalledWith("/(tabs)");
  });

  it("opens Work Hub after unanimous consent completes", async () => {
    const model = makeView({
      quest: { id: "quest-1" },
      state: "ready",
      partialStartConsent: {
        underfilled: makeUnderfilled({
          state: "UNDERFILLED_COMPLETED",
          questState: "QUEST_ASSIGNED",
          consent: {
            status: "UNDERFILLED_CONSENT_COMPLETED",
            expiresAt: null,
            totalCount: 1,
            acceptedCount: 1,
            declinedCount: 0,
            pendingCount: 0,
          },
        }),
        viewerId: "worker-1",
      },
    });
    mockUseQuestDetailFeature.mockReturnValue(model as never);
    const screen = await renderWithAppTheme(
      <PartialGroupStartConsentScreen questId="quest-1" />
    );
    expect(screen.getByText("All set — quest assigned")).toBeTruthy();
    await fireEvent.press(screen.getByText("Open Work Hub"));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/quest/[id]/work",
      params: { id: "quest-1", viewerId: "worker-1" },
    });
  });
  it("returns to Quest when link has no underfilled response", async () => {
    const model = makeView({
      quest: { id: "quest-1" },
      state: "ready",
      partialStartConsent: { surfaceState: "empty" },
    });
    mockUseQuestDetailFeature.mockReturnValue(model as never);
    const screen = await renderWithAppTheme(
      <PartialGroupStartConsentScreen questId="quest-1" />
    );
    expect(
      screen.getByText(
        "Nothing to respond to. This quest is no longer underfilled or awaiting your response."
      )
    ).toBeTruthy();
    await fireEvent.press(screen.getByText("Back to quest"));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/quest/[id]",
      params: { id: "quest-1" },
    });
  });
  it("uses server cancellation reason and own decline only for worker distinction", async () => {
    const messages = groupQuestMessages.en;
    const cancelledAt = "2026-08-12T09:00:00.000Z";
    const cancelledAtDate = formatTimestampDate(cancelledAt, "en");
    if (!cancelledAtDate)
      throw new Error("Expected cancellation date formatting");
    const cancellationTimestamp = messages.cancelledAt(
      cancelledAtDate,
      formatTimeInBangkok(cancelledAt)
    );
    const cases = [
      {
        reason: "HIRER_CANCELLED",
        ownResponse: null,
        expected: messages.hirerCancelled,
      },
      {
        reason: "HIRER_NO_DECISION",
        ownResponse: null,
        expected: messages.hirerNoDecision,
      },
      {
        reason: "WORKER_DECLINED",
        ownResponse: null,
        expected: messages.declinedByWorker,
      },
      {
        reason: "WORKER_DECLINED",
        ownResponse: {
          workerId: "worker-1",
          decision: "DECLINE",
          questReward: 150,
          respondedAt: "2026-08-12T08:59:00.000Z",
        },
        expected: messages.declinedByYou,
      },
      {
        reason: "CONSENT_TIMEOUT",
        ownResponse: null,
        expected: messages.timedOutCancellation,
      },
      {
        reason: null,
        ownResponse: null,
        expected: messages.genericCancellation,
      },
    ];
    for (const outcome of cases) {
      const model = makeView({
        quest: { id: "quest-1" },
        state: "ready",
        partialStartConsent: {
          underfilled: makeUnderfilled({
            state: "UNDERFILLED_CANCELLED",
            cancellationReason: outcome.reason,
            ownResponse: outcome.ownResponse,
          }),
          viewerId: "worker-1",
        },
      });
      mockUseQuestDetailFeature.mockReturnValue(model as never);
      const screen = await renderWithAppTheme(
        <PartialGroupStartConsentScreen questId="quest-1" />
      );
      expect(screen.getByText(outcome.expected)).toBeTruthy();
      expect(screen.getByText(cancellationTimestamp)).toBeTruthy();
      await act(async () => {
        screen.unmount();
      });
    }
  });
});
