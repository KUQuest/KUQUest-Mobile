import type { QuestV2ProofSubmission } from "@/api/questV2Contracts";
import { QuestProofFileStatus } from "../../domain/types";
import type { ProofDraftAsset } from "../components/ProofSubmissionSheet";
import { retryAssetsForSubmission } from "../useQuestProofFeature";

const submission: QuestV2ProofSubmission = {
  id: "proof-1",
  questId: "quest-1",
  workerId: "worker-1",
  teamId: null,
  submittedByUserId: "worker-1",
  description: null,
  status: null,
  submittedAt: null,
  createdAt: "2026-09-15T03:30:00.000Z",
  updatedAt: "2026-09-15T03:30:00.000Z",
  visibility: "FULL",
  fileIds: ["server-file-1", "server-file-2", "server-file-3"],
  files: [
    {
      fileId: "server-file-1",
      contentType: "image/jpeg",
      sizeBytes: 1024,
      position: 0,
      uploadStatus: "PROOF_FILE_READY",
      failureCode: null,
    },
    {
      fileId: "server-file-2",
      contentType: "image/jpeg",
      sizeBytes: 1024,
      position: 1,
      uploadStatus: "PROOF_FILE_READY",
      failureCode: null,
    },
    {
      fileId: null,
      contentType: "image/jpeg",
      sizeBytes: null,
      position: 2,
      uploadStatus: QuestProofFileStatus.PROOF_FILE_FAILED,
      failureCode: "PROOF_FILE_UPLOAD_FAILED",
    },
  ],
};

const asset: ProofDraftAsset = {
  uri: "file:///new-proof.jpg",
  name: "new-proof.jpg",
  type: "image/jpeg",
};

test("maps appended local retry asset to its server position", () => {
  expect(retryAssetsForSubmission(submission, [asset], 2)).toEqual({
    2: asset,
  });
});
