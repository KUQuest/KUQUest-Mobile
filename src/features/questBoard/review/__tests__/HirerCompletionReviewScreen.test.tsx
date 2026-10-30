import React from "react";
import { fireEvent, waitFor } from "@testing-library/react-native";

import { renderWithAppTheme } from "@/testing/queryTestUtils";
import { questBoardMessages } from "@/locales/questBoardMessages";
import { DEFAULT_LOCALE } from "@/locales/locale";
import HirerCompletionReviewScreen from "../HirerCompletionReviewScreen";

const mockMutateAsync = jest.fn();
const mockRefetch = jest.fn();
let mockSnapshot: unknown;

jest.mock("expo-router", () => ({
  useRouter: () => ({
    back: jest.fn(),
    push: jest.fn(),
    replace: jest.fn(),
    canGoBack: () => true,
  }),
}));
jest.mock("@/features/auth/sessionQueries", () => ({
  useSessionQuery: () => ({ data: { user: { id: "hirer-1" } } }),
}));
jest.mock("@/features/questBoard/api/questBoardQueries", () => ({
  useLiveQuestSnapshotQuery: () => ({
    data: mockSnapshot,
    isPending: false,
    isError: false,
    refetch: mockRefetch,
  }),
  useReviewCompletionConfirmationMutation: () => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
  }),
}));

function confirmation(reviewStatus = "COMPLETION_CONFIRMATION_PENDING") {
  return {
    id: "confirmation-1",
    questId: "quest-1",
    workerId: "worker-1",
    teamId: null,
    confirmedByUserId: "worker-1",
    confirmedAt: "2026-10-01T10:00:00Z",
    reviewStatus,
    reviewDeadlineAt: "2026-10-02T10:00:00Z",
    reviewReason: null,
    reviewedAt: null,
    reviewedBy: null,
  };
}

function snapshot() {
  return {
    viewerId: "hirer-1",
    actor: "HIRER",
    proofRequired: false,
    state: "QUEST_IN_PROGRESS",
    quest: { id: "quest-1", title: "Proof-free Quest" },
    completionConfirmations: [confirmation()],
    participants: [{ id: "worker-1", displayName: "Mali Worker" }],
    teams: [],
  };
}

describe("HirerCompletionReviewScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSnapshot = snapshot();
    mockMutateAsync.mockResolvedValue({});
    mockRefetch.mockResolvedValue({ data: mockSnapshot });
  });

  it("shows the pending proof-free confirmation and sends an approval", async () => {
    const view = await renderWithAppTheme(
      <HirerCompletionReviewScreen questId="quest-1" />
    );
    const messages = questBoardMessages[DEFAULT_LOCALE];

    expect(
      view.getByTestId("completion-review-pending-count")
    ).toHaveTextContent(messages.completionReviewPendingCount(1));
    expect(
      view.getByTestId("completion-review-quest-status")
    ).toHaveTextContent(
      `${messages.completionReviewQuestStatus}: ${messages.statusLabel("QUEST_IN_PROGRESS")}`
    );
    expect(view.getByText("Mali Worker")).toBeTruthy();
    expect(
      view.getByLabelText(messages.proofReviewOpenLabel("Mali Worker"))
    ).toBeTruthy();

    await fireEvent.press(
      view.getByTestId("completion-confirmation-review-open-confirmation-1")
    );
    await fireEvent.press(
      view.getByTestId("completion-confirmation-review-approve")
    );

    await waitFor(() =>
      expect(mockMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          questId: "quest-1",
          completionConfirmationId: "confirmation-1",
          payload: { decision: "COMPLETION_CONFIRMATION_APPROVED" },
          viewerId: "hirer-1",
          idempotencyKey: expect.any(String),
        })
      )
    );
    expect(mockSnapshot).toMatchObject({ state: "QUEST_IN_PROGRESS" });
  });

  it("requires a reason before sending non-approval", async () => {
    const view = await renderWithAppTheme(
      <HirerCompletionReviewScreen questId="quest-1" />
    );

    await fireEvent.press(
      view.getByTestId("completion-confirmation-review-open-confirmation-1")
    );
    await fireEvent.press(
      view.getByTestId("completion-confirmation-review-not-approved")
    );
    await fireEvent.press(
      view.getByTestId("completion-confirmation-review-confirm-not-approved")
    );

    expect(
      view.getByTestId("completion-confirmation-review-error")
    ).toBeTruthy();
    expect(mockMutateAsync).not.toHaveBeenCalled();

    await fireEvent.changeText(
      view.getByTestId("completion-confirmation-review-reason"),
      "The agreed work is incomplete."
    );
    await fireEvent.press(
      view.getByTestId("completion-confirmation-review-confirm-not-approved")
    );

    await waitFor(() =>
      expect(mockMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: {
            decision: "COMPLETION_CONFIRMATION_NOT_APPROVED",
            reason: "The agreed work is incomplete.",
          },
        })
      )
    );
  });
});
