import React from "react";
import { fireEvent, waitFor } from "@testing-library/react-native";
import { renderWithAppTheme } from "@/testing/queryTestUtils";

import { DEFAULT_LOCALE } from "@/locales/locale";
import { questBoardMessages } from "@/locales/questBoardMessages";

import HirerProofReviewScreen from "../HirerProofReviewScreen";

const messages = questBoardMessages[DEFAULT_LOCALE];
const mockBack = jest.fn();
const mockMutateAsync = jest.fn();
const mockRefetch = jest.fn();
let mockSnapshot: unknown;
let mockProofFileLinksQuery: {
  data: { fileId: string; url: string }[];
  isPending: boolean;
  isError: boolean;
  isSuccess: boolean;
  refetch: jest.Mock;
};

jest.mock("expo-router", () => ({
  useRouter: () => ({ back: mockBack, push: jest.fn() }),
}));
jest.mock("@/features/auth/sessionQueries", () => ({
  useSessionQuery: () => ({ data: { user: { id: "hirer-1" } } }),
}));
jest.mock("@/features/questBoard/api/questBoardQueries", () => ({
  useProofFileLinksQuery: () => mockProofFileLinksQuery,
  useLiveQuestSnapshotQuery: () => ({
    data: mockSnapshot,
    isPending: false,
    isError: false,
    refetch: mockRefetch,
  }),
  useReviewProofMutation: () => ({ mutateAsync: mockMutateAsync }),
}));

function proof(id: string, workerId: string) {
  return {
    id,
    questId: "quest-1",
    workerId,
    teamId: null,
    submittedByUserId: workerId,
    fileIds: ["proof-file-1"],
    files: [
      {
        fileId: "proof-file-1",
        contentType: "image/png",
        sizeBytes: 100,
        position: 0,
        uploadStatus: "PROOF_FILE_READY",
        failureCode: null,
      },
    ],
    description: "Done",
    status: "PROOF_PENDING",
    submittedAt: "2026-09-23T10:00:00Z",
    createdAt: "2026-09-23T09:00:00Z",
    updatedAt: "2026-09-23T10:00:00Z",
    visibility: "FULL",
  };
}

function assignment(workerId: string) {
  return { workerId, state: "ASSIGNMENT_ACTIVE" };
}

function singleSnapshot(canReviewProof: boolean) {
  return {
    quest: { title: "Poster Design" },
    mode: "FIRST_COME_FIRST_SERVED",
    participation: "SINGLE",
    dueAt: "2026-09-30T10:00:00Z",
    assignments: [assignment("worker-1")],
    participants: [],
    teams: [],
    proofs: [proof("proof-1", "worker-1")],
    capabilities: { canReviewProof },
  };
}

describe("HirerProofReviewScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockProofFileLinksQuery = {
      data: [
        {
          fileId: "proof-file-1",
          url: "https://files.example.test/proof.png?token=temporary",
        },
      ],
      isPending: false,
      isError: false,
      isSuccess: true,
      refetch: mockRefetch,
    };
  });

  it("opens a pending Proof in the review Popup and closes it after approval", async () => {
    mockSnapshot = singleSnapshot(true);
    mockMutateAsync.mockResolvedValue({});
    const { getByTestId, queryByTestId } = await renderWithAppTheme(
      <HirerProofReviewScreen questId="quest-1" />
    );
    expect(queryByTestId("proof-review-modal")).toBeNull();

    await fireEvent.press(getByTestId("proof-review-open-proof-1"));
    expect(getByTestId("proof-review-image-0")).toBeTruthy();
    await fireEvent.press(getByTestId("proof-review-approve"));

    await waitFor(() => expect(queryByTestId("proof-review-modal")).toBeNull());
    expect(mockMutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        questId: "quest-1",
        proofSubmissionId: "proof-1",
        payload: { decision: "PROOF_APPROVED" },
        idempotencyKey: expect.any(String),
      })
    );
    expect(mockBack).not.toHaveBeenCalled();
  });

  it("keeps the Popup open and reloads when the review fails", async () => {
    mockSnapshot = singleSnapshot(true);
    mockMutateAsync.mockRejectedValue(new Error("PROOF_REVIEW_NOT_PENDING"));
    const { getByTestId } = await renderWithAppTheme(
      <HirerProofReviewScreen questId="quest-1" />
    );

    await fireEvent.press(getByTestId("proof-review-open-proof-1"));
    await fireEvent.press(getByTestId("proof-review-approve"));

    await waitFor(() => expect(getByTestId("proof-review-error")).toBeTruthy());
    expect(mockRefetch).toHaveBeenCalled();
    expect(getByTestId("proof-review-modal")).toBeTruthy();
  });

  it("shows submission status without a review action when the viewer cannot review", async () => {
    mockSnapshot = singleSnapshot(false);
    const { getByTestId, queryByTestId } = await renderWithAppTheme(
      <HirerProofReviewScreen questId="quest-1" />
    );

    expect(getByTestId("proof-review-status-worker-1")).toHaveTextContent(
      messages.proofReviewStatus("PROOF_PENDING")
    );
    expect(queryByTestId("proof-review-open-proof-1")).toBeNull();
  });

  it("lists each GROUP + FCFS Worker and reviews the chosen submission", async () => {
    mockSnapshot = {
      ...singleSnapshot(true),
      participation: "GROUP",
      assignments: ["worker-1", "worker-2", "worker-3"].map(assignment),
      participants: [
        { id: "worker-1", displayName: "Jane Worker" },
        { id: "worker-2", displayName: "Kai Worker" },
        { id: "worker-3", displayName: "Mali Worker" },
      ],
      proofs: [proof("proof-1", "worker-1"), proof("proof-2", "worker-2")],
    };
    mockMutateAsync.mockResolvedValue({});
    const { getByTestId, getByText } = await renderWithAppTheme(
      <HirerProofReviewScreen questId="quest-1" />
    );

    expect(getByTestId("proof-review-pending-count")).toHaveTextContent(
      messages.proofReviewPendingCount(2)
    );
    expect(getByText("Mali Worker")).toBeTruthy();
    expect(getByTestId("proof-review-status-worker-3")).toHaveTextContent(
      messages.proofReviewStatus(null)
    );

    await fireEvent.press(getByTestId("proof-review-open-proof-2"));
    await fireEvent.press(getByTestId("proof-review-approve"));

    await waitFor(() =>
      expect(mockMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({ proofSubmissionId: "proof-2" })
      )
    );
  });
});
