import { fireEvent, waitFor } from "@testing-library/react-native";
import { renderWithAppTheme } from "@/testing/queryTestUtils";
import type { QuestV2ProofSubmission } from "@/api/questV2Contracts";
import { DEFAULT_LOCALE } from "@/locales/locale";
import { questBoardMessages } from "@/locales/questBoardMessages";
import { showErrorAlert } from "@/components/ui/SweetAlert";
import { ProofReviewPanel } from "../components/ProofReviewPanel";
const mockShowErrorAlert = jest.mocked(showErrorAlert);
const mockDownloadAndShareProofFile = jest.fn();
const mockGetProofFileLinkForUse = jest.fn();
const mockOpenProofFile = jest.fn();
jest.mock("@/components/ui/SweetAlert", () => ({
  showErrorAlert: jest.fn(),
}));
jest.mock("../../shared/proofFileService", () => ({
  ...jest.requireActual("../../shared/proofFileService"),
  downloadAndShareProofFile: (...args: unknown[]) =>
    mockDownloadAndShareProofFile(...args),
  getProofFileLinkForUse: (...args: unknown[]) =>
    mockGetProofFileLinkForUse(...args),
  openProofFile: (...args: unknown[]) => mockOpenProofFile(...args),
}));

const proof: QuestV2ProofSubmission = {
  id: "proof-1",
  questId: "quest-1",
  workerId: "worker-1",
  teamId: null,
  submittedByUserId: "worker-1",
  description: "Proof description",
  status: "PROOF_PENDING",
  submittedAt: "2026-09-15T10:00:00Z",
  createdAt: "2026-09-15T09:00:00Z",
  updatedAt: "2026-09-15T10:00:00Z",
  visibility: "FULL",
  fileIds: ["image-file"],
  files: [
    {
      fileId: "image-file",
      contentType: "image/png",
      sizeBytes: 100,
      position: 0,
      uploadStatus: "PROOF_FILE_READY",
      url: "https://example.com/proof.png",
      urlExpiresAt: "2099-10-30T00:00:00Z",
      failureCode: null,
    },
  ],
};

async function renderPanel(panelProof = proof) {
  return renderWithAppTheme(
    <ProofReviewPanel
      dueAt="2026-09-15T12:00:00Z"
      onDone={jest.fn()}
      onReview={jest.fn()}
      proof={panelProof}
    />
  );
}

describe("ProofReviewPanel downloads", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDownloadAndShareProofFile.mockResolvedValue(undefined);
    mockGetProofFileLinkForUse.mockResolvedValue({
      url: "https://example.com/proof.pdf?token=fresh",
      urlExpiresAt: "2099-10-31T00:00:00Z",
    });
    mockOpenProofFile.mockResolvedValue({
      url: "https://example.com/proof.pdf?token=fresh",
      urlExpiresAt: "2099-10-31T00:00:00Z",
    });
  });

  it("delegates authorized proof file downloads to the shared service", async () => {
    const view = await renderPanel();

    await fireEvent.press(view.getByTestId("proof-review-download-0"));

    await waitFor(() =>
      expect(mockDownloadAndShareProofFile).toHaveBeenCalledWith(
        {
          questId: "quest-1",
          proofSubmissionId: "proof-1",
          file: proof.files[0],
        },
        proof.files[0]
      )
    );
  });

  it("shows localized error alert when downloading fails", async () => {
    mockDownloadAndShareProofFile.mockRejectedValue(new Error("network error"));
    const view = await renderPanel();

    await fireEvent.press(view.getByTestId("proof-review-download-0"));

    await waitFor(() =>
      expect(mockShowErrorAlert).toHaveBeenCalledWith(
        questBoardMessages[DEFAULT_LOCALE].proofReviewDownloadErrorTitle,
        questBoardMessages[DEFAULT_LOCALE].proofReviewDownloadError
      )
    );
    expect(mockDownloadAndShareProofFile).toHaveBeenCalledTimes(1);
  });

  it("delegates non-image evidence opening to the shared file service", async () => {
    const pdfProof: QuestV2ProofSubmission = {
      ...proof,
      files: [
        {
          ...proof.files[0],
          contentType: "application/pdf",
          urlExpiresAt: null,
        },
      ],
    };
    const view = await renderPanel(pdfProof);

    await fireEvent.press(
      view.getByRole("button", {
        name: new RegExp(questBoardMessages[DEFAULT_LOCALE].proofReviewPreview),
      })
    );

    await waitFor(() =>
      expect(mockOpenProofFile).toHaveBeenCalledWith(
        {
          questId: "quest-1",
          proofSubmissionId: "proof-1",
          file: pdfProof.files[0],
        },
        pdfProof.files[0]
      )
    );
    expect(view.getByTestId("proof-review-preview-0")).toBeTruthy();
  });

  it("refreshes an expiry-less image link before opening its viewer", async () => {
    const imageProof: QuestV2ProofSubmission = {
      ...proof,
      files: [{ ...proof.files[0], urlExpiresAt: null }],
    };
    const view = await renderPanel(imageProof);

    await fireEvent.press(view.getByTestId("proof-review-refresh-file-0"));

    await waitFor(() => {
      expect(mockGetProofFileLinkForUse).toHaveBeenCalledWith(
        {
          questId: "quest-1",
          proofSubmissionId: "proof-1",
          file: imageProof.files[0],
        },
        imageProof.files[0]
      );
      expect(view.getByTestId("image-viewer-image")).toBeTruthy();
    });
  });

  it("announces busy and disables an image control while resolving it", async () => {
    let resolveLink!: (link: { url: string; urlExpiresAt: string }) => void;
    mockGetProofFileLinkForUse.mockImplementationOnce(
      () => new Promise((resolve) => (resolveLink = resolve))
    );
    const view = await renderPanel();
    const imageControl = view.getByTestId("proof-review-preview-0");

    await fireEvent.press(imageControl);
    expect(
      view.getByTestId("proof-review-preview-0").props.accessibilityState
    ).toEqual({
      busy: true,
      disabled: true,
    });
    await fireEvent.press(view.getByTestId("proof-review-preview-0"));
    expect(mockGetProofFileLinkForUse).toHaveBeenCalledTimes(1);
    resolveLink({
      url: "https://example.com/proof.png?token=fresh",
      urlExpiresAt: "2099-10-31T00:00:00Z",
    });

    await waitFor(() =>
      expect(
        view.getByTestId("proof-review-preview-0").props.accessibilityState
      ).toEqual({ busy: false, disabled: false })
    );
  });
});
