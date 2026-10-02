import { fireEvent, waitFor } from "@testing-library/react-native";
import { renderWithAppTheme } from "@/testing/queryTestUtils";
import type { QuestV2ProofSubmission } from "@/api/questV2Contracts";
import { DEFAULT_LOCALE } from "@/locales/locale";
import { questBoardMessages } from "@/locales/questBoardMessages";
import { File } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { showErrorAlert } from "@/components/ui/SweetAlert";
import { ProofReviewPanel } from "../components/ProofReviewPanel";

jest.mock("expo-file-system", () => {
  class MockFile {
    uri: string;
    static downloadFileAsync = jest.fn();

    constructor(_directory: string, name: string) {
      this.uri = `file://cache/${name}`;
    }
  }

  return { File: MockFile, Paths: { cache: "cache" } };
});
const mockDownloadFileAsync = jest.mocked(File.downloadFileAsync);
const mockShareAsync = jest.mocked(Sharing.shareAsync);
const mockIsAvailableAsync = jest.mocked(Sharing.isAvailableAsync);
const mockShowErrorAlert = jest.mocked(showErrorAlert);

jest.mock("expo-sharing", () => ({
  isAvailableAsync: jest.fn(),
  shareAsync: jest.fn(),
}));
jest.mock("@/components/ui/SweetAlert", () => ({
  showErrorAlert: jest.fn(),
}));
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
      failureCode: null,
    },
  ],
};

async function renderPanel() {
  return renderWithAppTheme(
    <ProofReviewPanel
      dueAt="2026-09-15T12:00:00Z"
      onDone={jest.fn()}
      onReview={jest.fn()}
      proof={proof}
    />
  );
}

describe("ProofReviewPanel downloads", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsAvailableAsync.mockResolvedValue(true);
    mockDownloadFileAsync.mockResolvedValue(
      new File("cache", "proof-image-file.png")
    );
  });

  it("shares each downloaded proof file from its cached local URI", async () => {
    const view = await renderPanel();

    await fireEvent.press(view.getByTestId("proof-review-download-0"));

    await waitFor(() =>
      expect(mockShareAsync).toHaveBeenCalledWith(
        "file://cache/proof-image-file.png",
        { mimeType: "image/png", UTI: "public.png" }
      )
    );
    expect(mockDownloadFileAsync).toHaveBeenCalledWith(
      "https://example.com/proof.png",
      expect.objectContaining({ uri: "file://cache/proof-image-file.png" }),
      { idempotent: true }
    );
    expect(mockDownloadFileAsync.mock.invocationCallOrder[0]).toBeLessThan(
      mockShareAsync.mock.invocationCallOrder[0]
    );
  });

  it("shows localized error alert when downloading fails", async () => {
    mockDownloadFileAsync.mockRejectedValue(new Error("network error"));
    const view = await renderPanel();

    await fireEvent.press(view.getByTestId("proof-review-download-0"));

    await waitFor(() =>
      expect(mockShowErrorAlert).toHaveBeenCalledWith(
        questBoardMessages[DEFAULT_LOCALE].proofReviewDownloadErrorTitle,
        questBoardMessages[DEFAULT_LOCALE].proofReviewDownloadError
      )
    );
    expect(mockShareAsync).not.toHaveBeenCalled();
  });
});
