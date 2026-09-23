import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react-native";

import type { QuestV2ProofSubmission } from "@/api/questV2Contracts";

import { ProofReviewModal } from "../ProofReviewModal";

const proof: QuestV2ProofSubmission = {
  id: "proof-1",
  questId: "quest-1",
  workerId: "worker-1",
  teamId: null,
  submittedByUserId: "worker-1",
  description: "The landing page is complete.",
  status: "PROOF_PENDING",
  submittedAt: "2026-09-15T10:00:00Z",
  createdAt: "2026-09-15T09:00:00Z",
  updatedAt: "2026-09-15T10:00:00Z",
  visibility: "FULL",
  fileIds: ["file-1", "file-2"],
  files: [
    {
      fileId: "file-1",
      contentType: "image/png",
      sizeBytes: 100,
      position: 0,
      uploadStatus: "PROOF_FILE_READY",
      failureCode: null,
    },
    {
      fileId: "file-2",
      contentType: "application/pdf",
      sizeBytes: 2_000,
      position: 1,
      uploadStatus: "PROOF_FILE_READY",
      failureCode: null,
    },
  ],
};

async function renderModal(onReview: jest.Mock, onClose = jest.fn()) {
  return await render(
    <ProofReviewModal
      dueAt="2026-09-15T12:00:00Z"
      onClose={onClose}
      onReview={onReview}
      proof={proof}
      visible
    />
  );
}

describe("ProofReviewModal", () => {
  it("shows submitted notes, timestamps, and evidence metadata", async () => {
    const onReview = jest.fn();
    const view = await renderModal(onReview);

    expect(view.getByText("The landing page is complete.")).toBeTruthy();
    expect(view.getByText(/image\/png/)).toBeTruthy();
    expect(view.getByText(/application\/pdf/)).toBeTruthy();
    expect(view.getByTestId("proof-review-file-0")).toBeTruthy();
    expect(view.getByTestId("proof-review-file-1")).toBeTruthy();
  });

  it("submits an approval decision and closes after success", async () => {
    const onReview = jest.fn().mockResolvedValue(undefined);
    const onClose = jest.fn();
    const view = await renderModal(onReview, onClose);

    fireEvent.press(view.getByTestId("proof-review-approve"));

    await waitFor(() => {
      expect(onReview).toHaveBeenCalledWith({ decision: "PROOF_APPROVED" });
      expect(onClose).toHaveBeenCalled();
    });
  });

  it("requires a non-empty reason before submitting non-approval", async () => {
    const onReview = jest.fn().mockResolvedValue(undefined);
    const onClose = jest.fn();
    const view = await renderModal(onReview, onClose);

    fireEvent.press(view.getByTestId("proof-review-not-approve"));
    const confirmButton = await view.findByTestId(
      "proof-review-confirm-not-approve"
    );
    fireEvent.press(confirmButton);

    expect(await view.findByTestId("proof-review-error")).toBeTruthy();
    expect(onReview).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.changeText(
      await view.findByTestId("proof-review-reason-input"),
      "The submitted result does not match the completion conditions."
    );
    fireEvent.press(
      await view.findByTestId("proof-review-confirm-not-approve")
    );

    await waitFor(() => {
      expect(onReview).toHaveBeenCalledWith({
        decision: "PROOF_NOT_APPROVED",
        reason:
          "The submitted result does not match the completion conditions.",
      });
      expect(onClose).toHaveBeenCalled();
    });
  });
});
