import { fireEvent, waitFor } from "@testing-library/react-native";
import { File } from "expo-file-system";
import { Linking } from "react-native";
import * as Sharing from "expo-sharing";

import { questApi } from "@/api/QuestApi";
import { showErrorAlert } from "@/components/ui/SweetAlert";
import { questBoardMessages } from "@/locales/questBoardMessages";
import { renderWithAppTheme } from "@/testing/queryTestUtils";
import type { QuestV2ProofSubmission } from "@/api/questV2Contracts";

import { ProofSubmissionFiles } from "../ProofSubmissionFiles";

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
jest.mock("expo-sharing", () => ({
  isAvailableAsync: jest.fn(),
  shareAsync: jest.fn(),
}));
jest.mock("@/api/QuestApi", () => ({
  ...jest.requireActual("@/api/QuestApi"),
  questApi: {
    ...jest.requireActual("@/api/QuestApi").questApi,
    getProofFileLink: jest.fn(),
  },
}));
jest.mock("@/api/serverClock", () => ({
  serverNow: () => Date.parse("2026-10-30T00:00:00.000Z"),
}));
jest.mock("@/features/preferences/localeStore", () => ({
  useLocale: () => ({ locale: "en" }),
}));
jest.mock("@/components/ui/SweetAlert", () => ({
  showErrorAlert: jest.fn(),
}));
jest.mock("@/components/ui/ImageViewerModal", () => ({
  ImageViewerModal: () => null,
}));
const mockGetProofFileLinkForUse = jest.fn();
jest.mock("../proofFileService", () => ({
  ...jest.requireActual("../proofFileService"),
  getProofFileLinkForUse: (...args: unknown[]) =>
    mockGetProofFileLinkForUse(...args),
}));

const mockedGetProofFileLink = jest.mocked(questApi.getProofFileLink);
const mockDownloadFileAsync = jest.mocked(File.downloadFileAsync);
const mockShareAsync = jest.mocked(Sharing.shareAsync);
const mockIsAvailableAsync = jest.mocked(Sharing.isAvailableAsync);
const mockShowErrorAlert = jest.mocked(showErrorAlert);
const mockOpenURL = jest.spyOn(Linking, "openURL");

function makeProof(
  file: Partial<QuestV2ProofSubmission["files"][number]> = {}
): QuestV2ProofSubmission {
  return {
    id: "proof-1",
    questId: "quest-1",
    workerId: "worker-1",
    teamId: null,
    submittedByUserId: "worker-1",
    description: "Completed the task",
    status: "PROOF_APPROVED",
    submittedAt: "2026-10-01T10:00:00Z",
    createdAt: "2026-10-01T09:00:00Z",
    updatedAt: "2026-10-01T10:00:00Z",
    visibility: "FULL",
    fileIds: ["file-1"],
    files: [
      {
        fileId: "file-1",
        contentType: "application/pdf",
        sizeBytes: 2048,
        position: 0,
        uploadStatus: "PROOF_FILE_READY",
        failureCode: null,
        url: "https://files.example.test/proof.pdf?token=short-lived",
        urlExpiresAt: "2030-10-30T00:00:00.000Z",
        ...file,
      },
    ],
  };
}

function freshLink(url = "https://files.example.test/proof.pdf?token=fresh") {
  return {
    fileId: "file-1",
    contentType: "application/pdf",
    sizeBytes: 2048,
    position: 0,
    url,
    urlExpiresAt: "2030-10-31T00:00:00.000Z",
  };
}

async function renderFiles(proof = makeProof()) {
  return renderWithAppTheme(<ProofSubmissionFiles proof={proof} />);
}

describe("ProofSubmissionFiles download", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetProofFileLinkForUse.mockImplementation(
      jest.requireActual<typeof import("../proofFileService")>(
        "../proofFileService"
      ).getProofFileLinkForUse
    );
    mockIsAvailableAsync.mockResolvedValue(true);
    mockOpenURL.mockResolvedValue(undefined);
    mockDownloadFileAsync.mockResolvedValue({
      uri: "file://cache/proof-file-1.pdf",
    } as File);
  });

  it("downloads an authorized history file and opens the native share sheet", async () => {
    const screen = await renderFiles();

    await fireEvent.press(
      screen.getByTestId("proof-submission-download-proof-1-0")
    );

    await waitFor(() =>
      expect(mockShareAsync).toHaveBeenCalledWith(
        "file://cache/proof-file-1.pdf",
        { mimeType: "application/pdf", UTI: "com.adobe.pdf" }
      )
    );
    expect(mockDownloadFileAsync).toHaveBeenCalledWith(
      "https://files.example.test/proof.pdf?token=short-lived",
      expect.objectContaining({ uri: "file://cache/proof-file-1.pdf" }),
      { idempotent: true }
    );
    expect(mockedGetProofFileLink).not.toHaveBeenCalled();
  });

  it("refreshes an expired history link before downloading", async () => {
    mockedGetProofFileLink.mockResolvedValueOnce(freshLink());
    const screen = await renderFiles(
      makeProof({
        urlExpiresAt: "2026-10-29T00:00:00.000Z",
      })
    );

    await fireEvent.press(
      screen.getByTestId("proof-submission-download-proof-1-0")
    );
    await waitFor(() => expect(mockShareAsync).toHaveBeenCalled());
    expect(mockedGetProofFileLink).toHaveBeenCalledWith(
      "quest-1",
      "proof-1",
      "file-1",
      undefined
    );
    expect(mockDownloadFileAsync).toHaveBeenCalledWith(
      "https://files.example.test/proof.pdf?token=fresh",
      expect.anything(),
      { idempotent: true }
    );
  });

  it("retries with a new link when an expiring URL fails during download", async () => {
    mockDownloadFileAsync
      .mockRejectedValueOnce(
        Object.assign(new Error("HTTP 403"), { status: 403 })
      )
      .mockResolvedValueOnce({ uri: "file://cache/proof-file-1.pdf" } as File);
    mockedGetProofFileLink.mockResolvedValueOnce(freshLink());
    const screen = await renderFiles();

    await fireEvent.press(
      screen.getByTestId("proof-submission-download-proof-1-0")
    );

    await waitFor(() => expect(mockShareAsync).toHaveBeenCalled());
    expect(mockDownloadFileAsync).toHaveBeenCalledTimes(2);
    expect(mockDownloadFileAsync).toHaveBeenLastCalledWith(
      "https://files.example.test/proof.pdf?token=fresh",
      expect.anything(),
      { idempotent: true }
    );
    expect(mockedGetProofFileLink).toHaveBeenCalledWith(
      "quest-1",
      "proof-1",
      "file-1",
      undefined
    );
  });

  it("keeps unavailable files off the download path when link refresh is denied", async () => {
    mockedGetProofFileLink.mockRejectedValueOnce(
      Object.assign(new Error("Not found"), { status: 404 })
    );
    const screen = await renderFiles(
      makeProof({ url: null, urlExpiresAt: null })
    );

    expect(
      screen.queryByTestId("proof-submission-download-proof-1-0")
    ).toBeNull();
    await fireEvent.press(
      screen.getByTestId("proof-submission-refresh-file-proof-1-0")
    );

    await waitFor(() =>
      expect(screen.getByRole("alert").props.children).toBe(
        questBoardMessages.en.proofReviewPreviewUnavailable
      )
    );
    expect(mockDownloadFileAsync).not.toHaveBeenCalled();
    expect(mockShowErrorAlert).not.toHaveBeenCalled();
  });

  it("rejects a refreshed link for a different file without enabling download", async () => {
    mockedGetProofFileLink.mockResolvedValueOnce({
      ...freshLink(),
      fileId: "different-file",
    });
    const screen = await renderFiles(
      makeProof({ url: null, urlExpiresAt: null })
    );

    await fireEvent.press(
      screen.getByTestId("proof-submission-refresh-file-proof-1-0")
    );

    await waitFor(() =>
      expect(screen.getByRole("alert").props.children).toBe(
        questBoardMessages.en.proofReviewPreviewError
      )
    );
    expect(mockedGetProofFileLink).toHaveBeenCalledWith(
      "quest-1",
      "proof-1",
      "file-1",
      undefined
    );
    expect(
      screen.queryByTestId("proof-submission-download-proof-1-0")
    ).toBeNull();
    expect(mockDownloadFileAsync).not.toHaveBeenCalled();
  });

  it("shows proof history images inline without a Preview button", async () => {
    const screen = await renderFiles(makeProof({ contentType: "image/png" }));

    expect(
      screen.getByTestId("proof-submission-inline-image-proof-1-0").props.source
    ).toEqual([
      {
        uri: "https://files.example.test/proof.pdf?token=short-lived",
      },
    ]);
    expect(
      screen.queryByText(questBoardMessages.en.proofReviewPreview)
    ).toBeNull();
    expect(
      screen.getByTestId("proof-submission-download-proof-1-0")
    ).toBeTruthy();
  });

  it("announces busy and disables the inline image while opening it", async () => {
    let resolveLink!: (link: ReturnType<typeof freshLink>) => void;
    mockGetProofFileLinkForUse.mockImplementationOnce(
      () => new Promise((resolve) => (resolveLink = resolve))
    );
    const screen = await renderFiles(makeProof({ contentType: "image/png" }));
    const imageControl = screen.getByTestId(
      "proof-submission-image-zoom-proof-1-0"
    );

    await fireEvent.press(imageControl);
    expect(
      screen.getByTestId("proof-submission-image-zoom-proof-1-0").props
        .accessibilityState
    ).toEqual({
      busy: true,
      disabled: true,
    });
    await fireEvent.press(
      screen.getByTestId("proof-submission-image-zoom-proof-1-0")
    );
    expect(mockGetProofFileLinkForUse).toHaveBeenCalledTimes(1);
    resolveLink(freshLink("https://files.example.test/image.png?token=fresh"));

    await waitFor(() =>
      expect(
        screen.getByTestId("proof-submission-image-zoom-proof-1-0").props
          .accessibilityState
      ).toEqual({ busy: false, disabled: false })
    );
  });

  it("refreshes an expiry-less image link before showing it inline", async () => {
    mockedGetProofFileLink.mockResolvedValueOnce({
      ...freshLink("https://files.example.test/image.png?token=fresh"),
      contentType: "image/png",
    });
    const screen = await renderFiles(
      makeProof({
        contentType: "image/png",
        urlExpiresAt: null,
      })
    );

    const image = await screen.findByTestId(
      "proof-submission-inline-image-proof-1-0"
    );
    expect(image.props.source).toEqual([
      { uri: "https://files.example.test/image.png?token=fresh" },
    ]);
    expect(mockedGetProofFileLink).toHaveBeenCalledWith(
      "quest-1",
      "proof-1",
      "file-1",
      undefined
    );
    expect(
      screen.queryByText(questBoardMessages.en.proofReviewPreview)
    ).toBeNull();
  });

  it("offers a retry after automatic image-link refresh fails", async () => {
    mockedGetProofFileLink
      .mockRejectedValueOnce(
        Object.assign(new Error("Not found"), { status: 404 })
      )
      .mockResolvedValueOnce({
        ...freshLink("https://files.example.test/image.png?token=refreshed"),
        contentType: "image/png",
      });
    const screen = await renderFiles(
      makeProof({
        contentType: "image/png",
        url: "https://files.example.test/image.png?token=expired",
        urlExpiresAt: "2026-10-29T00:00:00.000Z",
      })
    );

    await waitFor(() =>
      expect(mockedGetProofFileLink).toHaveBeenCalledTimes(1)
    );
    await waitFor(() =>
      expect(screen.getByRole("alert").props.children).toBe(
        questBoardMessages.en.proofReviewPreviewUnavailable
      )
    );
    await fireEvent.press(
      screen.getByTestId("proof-submission-refresh-file-proof-1-0")
    );

    const image = await screen.findByTestId(
      "proof-submission-inline-image-proof-1-0"
    );
    expect(image.props.source).toEqual([
      { uri: "https://files.example.test/image.png?token=refreshed" },
    ]);
    expect(mockedGetProofFileLink).toHaveBeenCalledTimes(2);
  });

  it("refreshes an expiry-less non-image link before opening it", async () => {
    mockedGetProofFileLink.mockResolvedValueOnce(freshLink());
    const screen = await renderFiles(makeProof({ urlExpiresAt: null }));

    await fireEvent.press(
      screen.getByTestId("proof-submission-open-file-proof-1-0")
    );

    await waitFor(() =>
      expect(mockOpenURL).toHaveBeenCalledWith(
        "https://files.example.test/proof.pdf?token=fresh"
      )
    );
    expect(mockedGetProofFileLink).toHaveBeenCalledWith(
      "quest-1",
      "proof-1",
      "file-1",
      undefined
    );
  });
});
