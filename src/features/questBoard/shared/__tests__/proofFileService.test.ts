import { File } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { Linking } from "react-native";

import { questApi } from "@/api/QuestApi";
import type { QuestV2ProofSubmission } from "@/api/questV2Contracts";

import {
  downloadAndShareProofFile,
  getProofFileLinkForUse,
  isUsableProofFileLink,
  openProofFile,
  ProofFileAccessError,
} from "../proofFileService";

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

const mockedGetProofFileLink = jest.mocked(questApi.getProofFileLink);
const mockDownloadFileAsync = jest.mocked(File.downloadFileAsync);
const mockShareAsync = jest.mocked(Sharing.shareAsync);
const mockIsAvailableAsync = jest.mocked(Sharing.isAvailableAsync);
const mockOpenURL = jest.spyOn(Linking, "openURL");

const file: QuestV2ProofSubmission["files"][number] = {
  fileId: "file-1",
  contentType: "application/pdf",
  sizeBytes: 2048,
  position: 0,
  uploadStatus: "PROOF_FILE_READY",
  failureCode: null,
  url: "https://files.example.test/proof.pdf?token=old",
  urlExpiresAt: "2026-10-29T00:00:00.000Z",
};
const target = { questId: "quest-1", proofSubmissionId: "proof-1", file };

function freshLink(url = "https://files.example.test/proof.pdf?token=fresh") {
  return {
    fileId: "file-1",
    contentType: "application/pdf",
    sizeBytes: 2048,
    position: 0,
    url,
    urlExpiresAt: "2026-10-31T00:00:00.000Z",
  };
}

describe("proof file access service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsAvailableAsync.mockResolvedValue(true);
    mockOpenURL.mockResolvedValue(undefined);
    mockDownloadFileAsync.mockResolvedValue({
      uri: "file://cache/proof-file-1.pdf",
    } as File);
  });

  it("refreshes an expiry-less URL before it can be used", async () => {
    mockedGetProofFileLink.mockResolvedValueOnce(freshLink());

    await expect(
      getProofFileLinkForUse(target, {
        url: "https://files.example.test/proof.pdf?token=unknown-ttl",
        urlExpiresAt: null,
      })
    ).resolves.toEqual({
      url: "https://files.example.test/proof.pdf?token=fresh",
      urlExpiresAt: "2026-10-31T00:00:00.000Z",
    });
    expect(mockedGetProofFileLink).toHaveBeenCalledWith(
      "quest-1",
      "proof-1",
      "file-1",
      undefined
    );
  });

  it("refreshes a stale URL and opens it through the native handler", async () => {
    mockedGetProofFileLink.mockResolvedValueOnce(freshLink());

    await expect(openProofFile(target, file)).resolves.toEqual({
      url: "https://files.example.test/proof.pdf?token=fresh",
      urlExpiresAt: "2026-10-31T00:00:00.000Z",
    });

    expect(mockedGetProofFileLink).toHaveBeenCalledWith(
      "quest-1",
      "proof-1",
      "file-1",
      undefined
    );
    expect(mockOpenURL).toHaveBeenCalledWith(
      "https://files.example.test/proof.pdf?token=fresh"
    );
  });

  it("refreshes an expired download link once, then shares the local file", async () => {
    mockDownloadFileAsync
      .mockRejectedValueOnce(
        Object.assign(new Error("HTTP 403"), { status: 403 })
      )
      .mockResolvedValueOnce({ uri: "file://cache/proof-file-1.pdf" } as File);
    mockedGetProofFileLink.mockResolvedValueOnce(freshLink());

    await downloadAndShareProofFile(target, {
      url: "https://files.example.test/proof.pdf?token=old",
      urlExpiresAt: "2026-10-31T00:00:00.000Z",
    });

    expect(mockDownloadFileAsync).toHaveBeenNthCalledWith(
      1,
      "https://files.example.test/proof.pdf?token=old",
      expect.anything(),
      { idempotent: true }
    );
    expect(mockDownloadFileAsync).toHaveBeenNthCalledWith(
      2,
      "https://files.example.test/proof.pdf?token=fresh",
      expect.anything(),
      { idempotent: true }
    );
    expect(mockShareAsync).toHaveBeenCalledWith(
      "file://cache/proof-file-1.pdf",
      { mimeType: "application/pdf", UTI: "com.adobe.pdf" }
    );
  });

  it("does not treat a link without a usable expiry as ready for use", async () => {
    mockedGetProofFileLink.mockResolvedValueOnce({
      ...freshLink(),
      urlExpiresAt: "not-a-date",
    } as never);

    await expect(
      getProofFileLinkForUse(target, {
        url: "https://files.example.test/proof.pdf?token=unknown-ttl",
        urlExpiresAt: null,
      })
    ).rejects.toMatchObject<Partial<ProofFileAccessError>>({
      reason: "unavailable",
    });
  });

  it("recognizes only non-expired links as usable", () => {
    expect(
      isUsableProofFileLink({
        url: "https://files.example.test/proof.pdf",
        urlExpiresAt: "2026-10-31T00:00:00.000Z",
      })
    ).toBe(true);
    expect(
      isUsableProofFileLink({
        url: "https://files.example.test/proof.pdf",
        urlExpiresAt: null,
      })
    ).toBe(false);
  });
});
