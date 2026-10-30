import { ScrollView as NativeScrollView } from "react-native";
import { fireEvent, waitFor } from "@testing-library/react-native";
import { renderWithAppTheme } from "@/testing/queryTestUtils";

import type { QuestV2ProofSubmission } from "@/api/questV2Contracts";

import { ProofReviewModal } from "../ProofReviewModal";
jest.mock("@/features/auth/sessionQueries", () => ({
  useSessionQuery: () => ({ data: { user: { id: "hirer-1" } } }),
}));
jest.mock("@/features/questBoard/api/questBoardQueries", () => ({
  useProofFileLinksQuery: () => ({ refetch: jest.fn() }),
}));

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
      url: "https://example.com/proof-image.png",
      urlExpiresAt: "2099-10-30T00:00:00Z",
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
  return await renderWithAppTheme(
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
  it("opens image evidence in the fullscreen viewer and closes it", async () => {
    const view = await renderModal(jest.fn());

    expect(view.getByTestId("proof-review-preview-0")).toBeTruthy();
    await fireEvent.press(view.getByTestId("proof-review-preview-0"));

    const image = await view.findByTestId("image-viewer-image");
    expect(image.props.source).toEqual({
      uri: "https://example.com/proof-image.png",
    });
    await fireEvent.press(view.getByTestId("image-viewer-close-button"));
    expect(view.queryByTestId("image-viewer-image")).toBeNull();
  });

  it("submits an approval decision and closes after success", async () => {
    const onReview = jest.fn().mockResolvedValue(undefined);
    const onClose = jest.fn();
    const view = await renderModal(onReview, onClose);

    await fireEvent.press(view.getByTestId("proof-review-approve"));

    await waitFor(() => {
      expect(onReview).toHaveBeenCalledWith({ decision: "PROOF_APPROVED" });
      expect(onClose).toHaveBeenCalled();
    });
  });

  it("shows the non-approval reason dialog only after tapping do not approve", async () => {
    const view = await renderModal(jest.fn());

    expect(view.queryByTestId("proof-review-reason-input")).toBeNull();
    await fireEvent.press(view.getByTestId("proof-review-not-approve"));

    expect(await view.findByTestId("proof-review-reason-dialog")).toBeTruthy();
    expect(view.getByTestId("proof-review-reason-input")).toBeTruthy();
  });

  it("scrolls the reason field into view when it receives focus", async () => {
    const scrollToEnd = jest
      .spyOn(NativeScrollView.prototype, "scrollToEnd")
      .mockImplementation(() => undefined);
    const view = await renderModal(jest.fn());

    await fireEvent.press(view.getByTestId("proof-review-not-approve"));
    await fireEvent(
      await view.findByTestId("proof-review-reason-input"),
      "focus"
    );

    expect(scrollToEnd).toHaveBeenCalledWith({ animated: true });
    scrollToEnd.mockRestore();
  });

  it("closes the non-approval reason dialog without submitting", async () => {
    const onReview = jest.fn();
    const view = await renderModal(onReview);

    await fireEvent.press(view.getByTestId("proof-review-not-approve"));
    await fireEvent.press(
      await view.findByTestId("proof-review-cancel-not-approved")
    );

    await waitFor(() => {
      expect(view.queryByTestId("proof-review-reason-dialog")).toBeNull();
    });
    expect(onReview).not.toHaveBeenCalled();
  });

  it("requires a non-empty reason before submitting non-approval", async () => {
    const onReview = jest.fn().mockResolvedValue(undefined);
    const onClose = jest.fn();
    const view = await renderModal(onReview, onClose);

    await fireEvent.press(view.getByTestId("proof-review-not-approve"));
    await view.findByTestId("proof-review-reason-dialog");
    await fireEvent.press(
      view.getByTestId("proof-review-confirm-not-approved")
    );

    expect(await view.findByTestId("proof-review-error")).toBeTruthy();
    expect(onReview).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();

    await fireEvent.changeText(
      await view.findByTestId("proof-review-reason-input"),
      "The submitted result does not match the completion conditions."
    );
    await fireEvent.press(
      view.getByTestId("proof-review-confirm-not-approved")
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

  it("keeps the reason dialog open and preserves the reason after a failed decision", async () => {
    const onReview = jest
      .fn()
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(true);
    const onClose = jest.fn();
    const view = await renderModal(onReview, onClose);

    await fireEvent.press(view.getByTestId("proof-review-not-approve"));
    const reasonInput = await view.findByTestId("proof-review-reason-input");
    await fireEvent.changeText(reasonInput, "The evidence is incomplete.");
    await fireEvent.press(
      view.getByTestId("proof-review-confirm-not-approved")
    );

    expect(await view.findByTestId("proof-review-error")).toBeTruthy();
    expect(view.getByTestId("proof-review-reason-input").props.value).toBe(
      "The evidence is incomplete."
    );
    expect(onClose).not.toHaveBeenCalled();

    await fireEvent.press(
      view.getByTestId("proof-review-confirm-not-approved")
    );
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });
});
