import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react-native";

import HirerProofReviewScreen from "../HirerProofReviewScreen";

const mockBack = jest.fn();
const mockMutateAsync = jest.fn();
const mockRefetch = jest.fn();
let mockSnapshot: unknown;

jest.mock("expo-router", () => ({
  useRouter: () => ({ back: mockBack, push: jest.fn() }),
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
  useReviewProofMutation: () => ({ mutateAsync: mockMutateAsync }),
}));

const pendingProof = {
  id: "proof-1",
  questId: "quest-1",
  workerId: "worker-1",
  teamId: null,
  submittedByUserId: "worker-1",
  description: "Done",
  status: "PROOF_PENDING",
  submittedAt: "2026-09-23T10:00:00Z",
  createdAt: "2026-09-23T09:00:00Z",
  updatedAt: "2026-09-23T10:00:00Z",
  visibility: "FULL",
  fileIds: [],
  files: [],
};

function snapshotWith(canReviewProof: boolean) {
  return {
    quest: { title: "Poster Design" },
    dueAt: "2026-09-30T10:00:00Z",
    proofs: [pendingProof],
    capabilities: { canReviewProof },
  };
}

describe("HirerProofReviewScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("approves the pending Proof and returns to the previous screen", async () => {
    mockSnapshot = snapshotWith(true);
    mockMutateAsync.mockResolvedValue({});
    const { getByTestId } = await render(
      <HirerProofReviewScreen questId="quest-1" />
    );

    fireEvent.press(getByTestId("proof-review-approve"));

    await waitFor(() => expect(mockBack).toHaveBeenCalled());
    expect(mockMutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        questId: "quest-1",
        proofSubmissionId: "proof-1",
        payload: { decision: "PROOF_APPROVED" },
        idempotencyKey: expect.any(String),
      })
    );
  });

  it("keeps the Hirer on the page and reloads when the review fails", async () => {
    mockSnapshot = snapshotWith(true);
    mockMutateAsync.mockRejectedValue(new Error("PROOF_REVIEW_NOT_PENDING"));
    const { getByTestId } = await render(
      <HirerProofReviewScreen questId="quest-1" />
    );

    fireEvent.press(getByTestId("proof-review-approve"));

    await waitFor(() => expect(getByTestId("proof-review-error")).toBeTruthy());
    expect(mockRefetch).toHaveBeenCalled();
    expect(mockBack).not.toHaveBeenCalled();
  });

  it("hides the decision form when the viewer cannot review", async () => {
    mockSnapshot = snapshotWith(false);
    const { queryByTestId } = await render(
      <HirerProofReviewScreen questId="quest-1" />
    );

    expect(queryByTestId("proof-review-approve")).toBeNull();
  });
});
