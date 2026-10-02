import { render } from "@testing-library/react-native";

import type { QuestV2ProofSubmission } from "@/api/questV2Contracts";

import { ProofReviewNotes } from "../ProofReviewNotes";

const baseProof: QuestV2ProofSubmission = {
  id: "11111111-1111-4111-8111-111111111111",
  questId: "22222222-2222-4222-8222-222222222222",
  workerId: "33333333-3333-4333-8333-333333333333",
  teamId: null,
  submittedByUserId: "33333333-3333-4333-8333-333333333333",
  description: null,
  status: "PROOF_PENDING",
  submittedAt: "2026-10-01T00:00:00.000Z",
  createdAt: "2026-10-01T00:00:00.000Z",
  updatedAt: "2026-10-01T00:00:00.000Z",
  visibility: "FULL",
  fileIds: [],
  files: [],
};

describe("ProofReviewNotes", () => {
  it("shows the server auto-approve countdown only while a deadline is live", async () => {
    const live = await render(
      <ProofReviewNotes
        proof={{
          ...baseProof,
          reviewDeadlineAt: new Date(Date.now() + 90 * 60_000).toISOString(),
        }}
        testIDPrefix="p"
      />
    );
    expect(live.getByTestId("p-deadline").props.children).toMatch(/1 (ชม\.|h)/);

    const none = await render(
      <ProofReviewNotes proof={baseProof} testIDPrefix="q" />
    );
    expect(none.queryByTestId("q-notes")).toBeNull();
  });

  it("shows the Hirer's reason and the automatic approval note", async () => {
    const rejected = await render(
      <ProofReviewNotes
        proof={{
          ...baseProof,
          status: "PROOF_NOT_APPROVED",
          reviewedBy: "HIRER",
          reviewReason: "Photo is blurry",
        }}
        testIDPrefix="r"
      />
    );
    expect(rejected.getByTestId("r-reason").props.children).toMatch(
      /Photo is blurry/
    );

    const auto = await render(
      <ProofReviewNotes
        proof={{
          ...baseProof,
          status: "PROOF_APPROVED",
          reviewedBy: "AUTO_APPROVE",
        }}
        testIDPrefix="a"
      />
    );
    expect(auto.getByTestId("a-auto")).toBeTruthy();
  });
});
