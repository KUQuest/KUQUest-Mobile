import { planProofSend, type ProofDraftRef } from "../proofDraftPlan";

const draft: ProofDraftRef = {
  id: "draft-1",
  files: [
    { position: 0, fileId: "file-a", uploadStatus: "PROOF_FILE_READY" },
    { position: 1, fileId: null, uploadStatus: "PROOF_FILE_FAILED" },
  ],
  fileKeys: ["a", "b"],
};
const a = { key: "a" };
const c = { key: "c" };

describe("planProofSend", () => {
  it("creates a draft when none exists", () => {
    expect(planProofSend(null, [a])).toEqual({
      kind: "create",
      replaceDraftId: null,
      files: [a],
    });
  });

  it("retries only the failed position with the file that replaced it", () => {
    expect(planProofSend(draft, [a, c])).toEqual({
      kind: "retry",
      draftId: "draft-1",
      retries: [{ position: 1, file: c }],
    });
  });

  it("replaces the draft when a ready file was removed", () => {
    expect(planProofSend(draft, [c])).toEqual({
      kind: "create",
      replaceDraftId: "draft-1",
      files: [c],
    });
  });

  it("replaces the draft when more files were added than positions failed", () => {
    const d = { key: "d" };
    expect(planProofSend(draft, [a, c, d])).toMatchObject({
      kind: "create",
      replaceDraftId: "draft-1",
    });
  });

  it("retries a failed file the Worker kept selected", () => {
    expect(planProofSend(draft, [a, { key: "b" }])).toEqual({
      kind: "retry",
      draftId: "draft-1",
      retries: [{ position: 1, file: { key: "b" } }],
    });
  });
});
