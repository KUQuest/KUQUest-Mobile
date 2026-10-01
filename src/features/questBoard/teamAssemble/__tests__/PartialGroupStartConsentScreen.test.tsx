import { fireEvent } from "@testing-library/react-native";

import { renderWithAppTheme } from "@/testing/queryTestUtils";
import { QuestUnderfilledConsentDecision } from "../../domain/types";
import { useQuestDetailFeature } from "../../detail/useQuestDetailFeature";
import PartialGroupStartConsentScreen from "../PartialGroupStartConsentScreen";

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

describe("PartialGroupStartConsentScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
      quest: { id: "quest-1" },
      state: "ready",
    });
    mockUseQuestDetailFeature.mockReturnValue(model as never);

    const screen = await renderWithAppTheme(
      <PartialGroupStartConsentScreen questId="quest-1" />
    );

    expect(
      screen.getByTestId("partial-group-start-summary").props.accessibilityLabel
    ).toBe("Requested headcount: 2. Actual headcount: 1");
    expect(screen.getByText("฿150")).toBeTruthy();
    expect(screen.getByText("2 Oct 2030, 19:00")).toBeTruthy();
    expect(screen.getByTestId("partial-group-start-countdown")).toBeTruthy();
    await fireEvent.press(screen.getByTestId("partial-group-start-approve"));
    expect(onWorkerConsent).toHaveBeenCalledWith(
      QuestUnderfilledConsentDecision.ACCEPT
    );
  });
});
