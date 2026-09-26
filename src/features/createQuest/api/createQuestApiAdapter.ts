import type { CreateQuestV2Payload } from "@/api/QuestApi";
import type {
  QuestV2Detail,
  QuestV2PublishCheck,
} from "@/api/questV2Contracts";
import type { QuestPublishCheck } from "@/features/questBoard/domain/types";

import {
  getDraftRewardSatang,
  getValidDraftHeadcount,
  initialDraft,
  toBangkokDateTime,
  type QuestDraft,
} from "../domain/createQuestModel";

function getServerDateTimeParts(
  value: string | null
): { date: string; time: string } | null {
  const match = /^(\d{4}-\d{2}-\d{2})T([01]\d|2[0-3]):([0-5]\d)/.exec(
    value ?? ""
  );
  if (!match) return null;
  return { date: match[1], time: `${match[2]}:${match[3]}` };
}

export function questDetailToDraft(detail: QuestV2Detail): QuestDraft {
  const start = getServerDateTimeParts(detail.startTime);
  const deadline = getServerDateTimeParts(detail.dueAt);

  return {
    ...initialDraft,
    title: detail.title,
    tag: detail.tag?.id ?? "",
    description: detail.description ?? "",
    conditions: detail.condition.items
      .slice()
      .sort((left, right) => left.position - right.position)
      .map((item) => item.text)
      .join("\n"),
    proofRequired: detail.proofRequired ? "required" : "none",
    startDate: start?.date ?? "",
    deadline: deadline?.date ?? "",
    startTime: start?.time ?? "",
    endTime: deadline?.time ?? "",
    locationMode: detail.locations.length > 0 ? "ON_CAMPUS" : "ONLINE",
    location: detail.locations[0]?.label ?? "",
    imageUris: detail.images
      .slice()
      .sort((left, right) => left.position - right.position)
      .map((image) => image.url),
    candidateMode: detail.mode,
    participation: detail.participation,
    headcount: String(detail.headcount),
    wage: String(detail.questFundingTotal),
  };
}

function isServerTagId(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value.trim()
  );
}

export function toQuestV2Payload(draft: QuestDraft): CreateQuestV2Payload {
  const fundingTotalSatang = getDraftRewardSatang(draft) ?? 0;
  const headcount = getValidDraftHeadcount(draft) ?? 0;
  const location = draft.location.trim();
  const conditionItems = draft.conditions
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);

  return {
    title: draft.title.trim(),
    description: draft.description.trim(),
    condition: {
      items:
        conditionItems.length > 0
          ? conditionItems
          : draft.conditions.trim()
            ? [draft.conditions.trim()]
            : [],
    },
    mode: draft.candidateMode,
    participation: draft.participation,
    questFundingTotal: fundingTotalSatang / 100,
    headcount,
    startTime:
      toBangkokDateTime(draft.startDate, draft.startTime) ??
      `${draft.startDate}T${draft.startTime}:00+07:00`,
    dueAt:
      draft.deadline && draft.endTime
        ? (toBangkokDateTime(draft.deadline, draft.endTime) ??
          `${draft.deadline}T${draft.endTime}:00+07:00`)
        : null,
    tagId: isServerTagId(draft.tag) ? draft.tag.trim() : null,
    proofRequired: draft.proofRequired !== "none",
    locations:
      draft.locationMode === "ON_CAMPUS" && location
        ? [{ label: location }]
        : [],
  };
}

export function adaptV2PublishCheck(
  serverCheck: QuestV2PublishCheck
): QuestPublishCheck {
  return {
    canPublish: serverCheck.canPublish,
    blockers: serverCheck.blockingReasons.map((reason) => reason.code),
    warnings: serverCheck.warnings.map((warning) => warning.code),
    escrow: {
      rewardPoolSatang: serverCheck.questRewardSatang * serverCheck.headcount,
      platformFeeSatang: serverCheck.platformFeeSatang * serverCheck.headcount,
      totalRequiredSatang: serverCheck.escrowRequirementSatang,
      headcount: serverCheck.headcount,
      rewardSatangPerWorker: serverCheck.questRewardSatang,
      platformFeeSatangPerWorker: serverCheck.platformFeeSatang,
      feeRateBasisPoints: serverCheck.platformFeeBps,
    },
  };
}
