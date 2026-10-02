import {
  questV2ApplicationStateSchema,
  questV2AssignmentStateSchema,
  questV2EditRequestStatusSchema,
  questV2ModeSchema,
  questV2ParticipationSchema,
  questV2ProofReviewPayloadSchema,
  questV2ProofStatusSchema,
  questV2StateSchema,
  questV2TeamStateSchema,
  questV2UnderfilledConsentPayloadSchema,
  questV2UnderfilledDecisionPayloadSchema,
} from "@/api/questV2Contracts";
import {
  QuestApplicationStatus,
  QuestAssignmentStatus,
  QuestEditRequestStatus,
  QuestMode,
  QuestParticipation,
  QuestProofDecision,
  QuestProofStatus,
  QuestStatus,
  QuestTeamStatus,
  QuestUnderfilledConsentDecision,
  QuestUnderfilledDecision,
} from "../../domain/types";

/**
 * The transport source of truth is the zod schemas in `questV2Contracts.ts`;
 * the named-value source of truth is the const contract in `domain/types.ts`.
 * These tests pin the two layers together so a backend value rename cannot
 * silently desynchronize the enums callers compare against.
 */

function namedValues(contract: Record<string, string>): Set<string> {
  return new Set(Object.values(contract));
}

function expectExactMatch(
  contract: Record<string, string>,
  schemaOptions: readonly string[],
  label: string
) {
  it(`${label}: named values match the wire schema exactly`, () => {
    expect(namedValues(contract)).toEqual(new Set(schemaOptions));
  });
}

function expectWireWithinNamed(
  contract: Record<string, string>,
  schemaOptions: readonly string[],
  label: string
) {
  it(`${label}: every wire value has a named value (legacy extras allowed)`, () => {
    const values = namedValues(contract);
    const missing = schemaOptions.filter((option) => !values.has(option));
    expect(missing).toEqual([]);
  });
}

describe("lifecycle enum consistency", () => {
  expectExactMatch(
    QuestParticipation,
    questV2ParticipationSchema.options,
    "QuestParticipation"
  );
  expectExactMatch(QuestMode, questV2ModeSchema.options, "QuestMode");
  expectExactMatch(
    QuestApplicationStatus,
    questV2ApplicationStateSchema.options,
    "QuestApplicationStatus"
  );
  expectExactMatch(
    QuestTeamStatus,
    questV2TeamStateSchema.options,
    "QuestTeamStatus"
  );
  expectExactMatch(
    QuestAssignmentStatus,
    questV2AssignmentStateSchema.options,
    "QuestAssignmentStatus"
  );
  expectExactMatch(
    QuestUnderfilledDecision,
    questV2UnderfilledDecisionPayloadSchema.shape.decision.options,
    "QuestUnderfilledDecision"
  );
  expectExactMatch(
    QuestUnderfilledConsentDecision,
    questV2UnderfilledConsentPayloadSchema.shape.decision.options,
    "QuestUnderfilledConsentDecision"
  );
  expectExactMatch(
    QuestProofDecision,
    questV2ProofReviewPayloadSchema.innerType().shape.decision.options,
    "QuestProofDecision"
  );

  expectWireWithinNamed(QuestStatus, questV2StateSchema.options, "QuestStatus");
  expectWireWithinNamed(
    QuestProofStatus,
    questV2ProofStatusSchema.options,
    "QuestProofStatus"
  );
  expectWireWithinNamed(
    QuestEditRequestStatus,
    questV2EditRequestStatusSchema.options,
    "QuestEditRequestStatus"
  );
});
