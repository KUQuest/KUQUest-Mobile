import {
  MAX_QUEST_IMAGES,
  formatSatang,
  parseSatangInput,
  type QuestLocation,
  type QuestLocationMode as QuestBoardLocationMode,
  type QuestMode,
  type QuestParticipation,
  type QuestPublishCheck,
} from "../questBoard/types";

export const QUEST_DRAFT_SCHEMA_VERSION = 2 as const;
export const CONDITION_ITEM_MAX_LENGTH = 255;
export const MAX_FUNDING_TOTAL_THB = 1_000_000;

export type QuestDraftMode = QuestMode;
export type QuestDraftParticipation = "SINGLE" | "GROUP";
export type QuestDraftLocationMode = "ONLINE" | "ON_CAMPUS";
export type QuestDraftState = "DRAFT" | "OPEN";
export type QuestDraftStep = 1 | 2 | 3;

export interface QuestDraft {
  title: string;
  tagId: string;
  description: string;
  conditionItems: string[];
  proofRequired: boolean;
  /** Bangkok-offset ISO datetime, or an empty string while not selected. */
  startTime: string;
  /** Bangkok-offset ISO datetime, or an empty string while not selected. */
  dueAt: string;
  locationMode: QuestDraftLocationMode;
  location: string;
  imageUris: string[];
  mode: QuestDraftMode;
  participation: QuestDraftParticipation;
  headcount: string;
  /** Inclusive Quest Funding Total per Worker slot, entered in THB. */
  questFundingTotal: string;
}

export interface StoredQuestDraft {
  version: typeof QUEST_DRAFT_SCHEMA_VERSION;
  requiresReview?: false;
  draft: QuestDraft;
  step: QuestDraftStep;
  state: QuestDraftState;
}

export interface QuestDraftReviewRequired {
  requiresReview: true;
  reason: "LEGACY_SCHEMA" | "UNSUPPORTED_SCHEMA" | "INVALID_V2_DRAFT";
}

export type QuestDraftSnapshot = StoredQuestDraft | QuestDraftReviewRequired;

export const initialDraft: QuestDraft = {
  title: "",
  tagId: "",
  description: "",
  conditionItems: [""],
  proofRequired: true,
  startTime: "",
  dueAt: "",
  locationMode: "ON_CAMPUS",
  location: "",
  imageUris: [],
  mode: "FIRST_COME_FIRST_SERVED",
  participation: "SINGLE",
  headcount: "1",
  questFundingTotal: "",
};

/** Fixture-only data for the existing offline Create Quest prototype. */
export const mockQuestDraft: QuestDraft = {
  ...initialDraft,
  title: "Draft campus photo session",
  tagId: "design",
  description: "A demo draft that can be edited before publishing.",
  conditionItems: ["Upload the final photo set."],
  startTime: "2099-08-26T09:00:00.000+07:00",
  dueAt: "2099-08-27T12:00:00.000+07:00",
  location: "Student activity building",
  mode: "CANDIDATE",
  participation: "GROUP",
  headcount: "2",
  questFundingTotal: "250",
};

export interface QuestBoardModeValues {
  mode: QuestMode;
  participation: QuestParticipation;
  locationMode: QuestBoardLocationMode;
}

export function toQuestBoardModeValues(
  draft: Pick<QuestDraft, "mode" | "participation" | "locationMode">,
): QuestBoardModeValues {
  return {
    mode: draft.mode,
    participation: draft.participation,
    locationMode: draft.locationMode === "ONLINE" ? "online" : "on-campus",
  };
}

export function getSchedulePickerValue(
  platform: string,
  draftValue: Date,
  temporaryValue: Date | null,
): Date {
  return platform === "ios" ? temporaryValue ?? draftValue : draftValue;
}

export function getScheduleTimeValue(value: Date): string {
  const hours = String(value.getHours()).padStart(2, "0");
  const minutes = String(value.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

export function getHeadcountForParticipation(
  participation: QuestDraftParticipation,
  currentHeadcount: string,
): string {
  return participation === "SINGLE" ? "1" : currentHeadcount;
}

export function isQuestDraftDirty(draft: QuestDraft): boolean {
  return (Object.keys(initialDraft) as (keyof QuestDraft)[]).some((key) => {
    const currentValue = draft[key];
    const initialValue = initialDraft[key];
    if (Array.isArray(currentValue) && Array.isArray(initialValue)) {
      return (
        currentValue.length !== initialValue.length ||
        currentValue.some((value, index) => value !== initialValue[index])
      );
    }
    return currentValue !== initialValue;
  });
}

export function addConditionItem(items: string[]): string[] {
  return [...items, ""];
}

export function removeConditionItem(items: string[], index: number): string[] {
  return items.filter((_, itemIndex) => itemIndex !== index);
}

export function updateConditionItem(
  items: string[],
  index: number,
  value: string,
): string[] {
  return items.map((item, itemIndex) => (itemIndex === index ? value : item));
}

export function moveConditionItem(
  items: string[],
  index: number,
  direction: "up" | "down",
): string[] {
  const nextIndex = direction === "up" ? index - 1 : index + 1;
  if (
    index < 0 ||
    index >= items.length ||
    nextIndex < 0 ||
    nextIndex >= items.length
  ) {
    return [...items];
  }
  const next = [...items];
  [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
  return next;
}

export function normalizeConditionItems(items: string[]): string[] {
  return items.map((item) => item.trim());
}

export function getConditionItemValidationError(
  value: string,
): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return "CONDITION_REQUIRED";
  if (trimmed.length > CONDITION_ITEM_MAX_LENGTH) return "CONDITION_TOO_LONG";
  return undefined;
}

export function getConditionValidationErrors(
  items: string[],
): (string | undefined)[] {
  return items.map(getConditionItemValidationError);
}

export function getDraftFundingTotalSatang(
  draft: Pick<QuestDraft, "questFundingTotal">,
): number | null {
  const value = parseSatangInput(draft.questFundingTotal);
  return value !== null && value <= MAX_FUNDING_TOTAL_THB * 100 ? value : null;
}

export function formatDraftFundingTotal(
  draft: Pick<QuestDraft, "questFundingTotal">,
  locale: "en" | "th" = "en",
): string {
  return formatSatang(getDraftFundingTotalSatang(draft) ?? 0, locale);
}

export interface FundingValidationMessages {
  empty: string;
  format: string;
  bounds: (maximum: number) => string;
}

const defaultFundingValidationMessages: FundingValidationMessages = {
  empty: "Enter a Quest Funding Total in THB.",
  format: "Enter a valid amount in THB with up to 2 decimal places.",
  bounds: (maximum) =>
    `Quest Funding Total must be between ฿0 and ฿${maximum.toLocaleString("en-US")}.`,
};

export function getFundingValidationError(
  value: string,
  messages: FundingValidationMessages = defaultFundingValidationMessages,
): string | undefined {
  const trimmedValue = value.trim();
  if (!trimmedValue) return messages.empty;
  if (!/^\d+(?:\.\d{1,2})?$/.test(trimmedValue)) return messages.format;

  const amountSatang = parseSatangInput(trimmedValue);
  if (amountSatang === null || amountSatang > MAX_FUNDING_TOTAL_THB * 100) {
    return messages.bounds(MAX_FUNDING_TOTAL_THB);
  }

  return undefined;
}

export function getBangkokIsoDateTime(value: Date): string {
  const date = `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
  return `${date}T${getScheduleTimeValue(value)}:00.000+07:00`;
}

export function getBangkokDateTimeParts(
  value: string,
): { date: string; time: string } | null {
  const match =
    /^(\d{4}-\d{2}-\d{2})T((?:[01]\d|2[0-3]):[0-5]\d):\d{2}\.\d{3}\+07:00$/.exec(
      value,
    );
  return match ? { date: match[1], time: match[2] } : null;
}

export function isBangkokIsoDateTime(value: string): boolean {
  const parts = getBangkokDateTimeParts(value);
  if (!parts) return false;
  const [year, month, day] = parts.date.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

export interface QuestDraftPayload {
  title: string;
  description: string | null;
  condition: { items: string[] };
  tagId: string | null;
  proofRequired: boolean;
  startTime?: string;
  dueAt: string | null;
  locations: { label: string }[];
  mode: QuestMode;
  participation: QuestParticipation;
  headcount?: number;
  questFundingTotal?: number;
}

/**
 * The production v2 create/update body. Form-only fields are converted here;
 * no reward deduction, lifecycle decision, or client-generated identifier is
 * added to the request.
 */
export function toQuestDraftPayload(draft: QuestDraft): QuestDraftPayload {
  const headcount = getValidDraftHeadcount(draft);
  const fundingTotalSatang = getDraftFundingTotalSatang(draft);
  const conditionItems = normalizeConditionItems(draft.conditionItems);

  return {
    title: draft.title.trim(),
    description: draft.description.trim() || null,
    condition: { items: conditionItems },
    tagId: draft.tagId.trim() || null,
    proofRequired: draft.proofRequired,
    ...(isBangkokIsoDateTime(draft.startTime)
      ? { startTime: draft.startTime }
      : {}),
    dueAt: draft.dueAt
      ? isBangkokIsoDateTime(draft.dueAt)
        ? draft.dueAt
        : null
      : null,
    locations:
      draft.locationMode === "ON_CAMPUS" && draft.location.trim()
        ? [{ label: draft.location.trim() }]
        : [],
    mode: draft.mode,
    participation: draft.participation,
    ...(headcount === null ? {} : { headcount }),
    ...(fundingTotalSatang === null
      ? {}
      : { questFundingTotal: fundingTotalSatang / 100 }),
  };
}

/** Adapter-only serialization for the existing offline fixture workflow. */
export interface QuestFixtureDraftPayload {
  title: string;
  tag: string;
  description: string;
  conditions: string;
  proofRequired: "required" | "optional" | "none";
  startDate: string;
  deadline: string;
  startTime: string;
  endTime: string;
  location: QuestLocation;
  mode: QuestMode;
  participation: QuestParticipation;
  headcount: number;
  rewardSatang: number;
  imageUris: string[];
}

export function toQuestFixtureDraftPayload(
  draft: QuestDraft,
): QuestFixtureDraftPayload {
  const start = getBangkokDateTimeParts(draft.startTime);
  const due = getBangkokDateTimeParts(draft.dueAt);
  const headcount = getValidDraftHeadcount(draft) ?? 0;
  return {
    title: draft.title.trim(),
    tag: draft.tagId,
    description: draft.description.trim(),
    conditions: normalizeConditionItems(draft.conditionItems).join("\n"),
    proofRequired: draft.proofRequired ? "required" : "none",
    startDate: start?.date ?? "",
    deadline: due?.date ?? "",
    startTime: start?.time ?? "",
    endTime: due?.time ?? "",
    location: {
      label:
        draft.locationMode === "ONLINE" ? null : draft.location.trim() || null,
    },
    mode: draft.mode,
    participation: draft.participation,
    headcount,
    rewardSatang: getDraftFundingTotalSatang(draft) ?? 0,
    imageUris: [...draft.imageUris].slice(0, MAX_QUEST_IMAGES),
  };
}

function getValidDraftHeadcount(
  draft: Pick<QuestDraft, "participation" | "headcount">,
): number | null {
  if (draft.participation === "SINGLE") return 1;
  const rawHeadcount = draft.headcount.trim();
  if (!rawHeadcount) return null;
  const headcount = Number(rawHeadcount);
  return Number.isSafeInteger(headcount) && headcount >= 2 && headcount <= 20
    ? headcount
    : null;
}

export function calculateQuestEscrow(
  rewardSatang: number,
  headcount: number,
  feeRateBasisPoints = 500,
) {
  const safeReward =
    Number.isSafeInteger(rewardSatang) && rewardSatang >= 0 ? rewardSatang : 0;
  const safeHeadcount =
    Number.isSafeInteger(headcount) && headcount > 0 ? headcount : 0;
  const platformFeeSatangPerWorker = Math.ceil(
    (safeReward * feeRateBasisPoints) / 10_000,
  );
  const rewardPoolSatang = safeReward * safeHeadcount;
  const platformFeeSatang = platformFeeSatangPerWorker * safeHeadcount;
  return {
    rewardPoolSatang,
    platformFeeSatang,
    totalRequiredSatang: rewardPoolSatang + platformFeeSatang,
    headcount: safeHeadcount,
    rewardSatangPerWorker: safeReward,
    platformFeeSatangPerWorker,
    feeRateBasisPoints,
  };
}

function getDraftEscrowSummary(draft: QuestDraft): QuestPublishCheck["escrow"] {
  const fundingTotalSatang = getDraftFundingTotalSatang(draft) ?? 0;
  const headcount = getValidDraftHeadcount(draft) ?? 0;
  return {
    rewardPoolSatang: 0,
    platformFeeSatang: 0,
    totalRequiredSatang: fundingTotalSatang * headcount,
    headcount,
    rewardSatangPerWorker: 0,
    platformFeeSatangPerWorker: 0,
    feeRateBasisPoints: 0,
  };
}

export function getQuestPublishCheck(draft: QuestDraft): QuestPublishCheck {
  const payload = toQuestDraftPayload(draft);
  const blockers: string[] = [];
  const warnings: string[] = [];
  const conditionErrors = getConditionValidationErrors(draft.conditionItems);

  if (!payload.title) blockers.push("TITLE_REQUIRED");
  if (!payload.tagId) blockers.push("TAG_REQUIRED");
  if (!payload.description) blockers.push("DESCRIPTION_REQUIRED");
  if (conditionErrors.length === 0 || conditionErrors.some(Boolean)) {
    if (
      conditionErrors.length === 0 ||
      conditionErrors.every((error) => error === "CONDITION_REQUIRED")
    ) {
      blockers.push("COMPLETION_CRITERIA_REQUIRED");
    } else {
      blockers.push("CONDITION_INVALID");
    }
  }
  if (!isBangkokIsoDateTime(draft.startTime)) blockers.push("START_REQUIRED");
  if (!isBangkokIsoDateTime(draft.dueAt)) blockers.push("DEADLINE_REQUIRED");
  if (
    isBangkokIsoDateTime(draft.startTime) &&
    isBangkokIsoDateTime(draft.dueAt) &&
    Date.parse(draft.dueAt) <= Date.parse(draft.startTime)
  ) {
    blockers.push("TIME_ORDER_INVALID");
  }
  if (draft.locationMode === "ON_CAMPUS" && !draft.location.trim()) {
    blockers.push("LOCATION_REQUIRED");
  }
  if (getDraftFundingTotalSatang(draft) === null) {
    blockers.push("FUNDING_INVALID");
  }
  if (
    draft.participation === "GROUP" &&
    getValidDraftHeadcount(draft) === null
  ) {
    blockers.push("HEADCOUNT_INVALID");
  }
  if (draft.imageUris.length === 0) warnings.push("NO_IMAGES");

  return {
    canPublish: blockers.length === 0,
    blockers,
    warnings,
    escrow: getDraftEscrowSummary(draft),
  };
}

function normalizeStoredDraft(record: Record<string, unknown>): QuestDraft | null {
  const hasString = (key: keyof QuestDraft): boolean =>
    typeof record[key] === "string";
  if (
    !hasString("title") ||
    !hasString("tagId") ||
    !hasString("description") ||
    !Array.isArray(record.conditionItems) ||
    record.conditionItems.length === 0 ||
    record.conditionItems.some((item) => typeof item !== "string") ||
    typeof record.proofRequired !== "boolean" ||
    !hasString("startTime") ||
    !hasString("dueAt") ||
    !hasString("locationMode") ||
    !hasString("location") ||
    !Array.isArray(record.imageUris) ||
    record.imageUris.some((uri) => typeof uri !== "string") ||
    !hasString("mode") ||
    !hasString("participation") ||
    !hasString("headcount") ||
    !hasString("questFundingTotal")
  ) {
    return null;
  }
  if (
    (record.mode !== "FIRST_COME_FIRST_SERVED" && record.mode !== "CANDIDATE") ||
    (record.participation !== "SINGLE" && record.participation !== "GROUP") ||
    (record.locationMode !== "ONLINE" && record.locationMode !== "ON_CAMPUS") ||
    record.imageUris.length > MAX_QUEST_IMAGES ||
    (record.participation === "SINGLE" && record.headcount !== "1")
  ) {
    return null;
  }
  const draft: QuestDraft = {
    title: record.title as string,
    tagId: record.tagId as string,
    description: record.description as string,
    conditionItems: [...(record.conditionItems as string[])],
    proofRequired: record.proofRequired as boolean,
    startTime: record.startTime as string,
    dueAt: record.dueAt as string,
    locationMode: record.locationMode as QuestDraftLocationMode,
    location: record.location as string,
    imageUris: [...(record.imageUris as string[])],
    mode: record.mode as QuestDraftMode,
    participation: record.participation as QuestDraftParticipation,
    headcount: record.headcount as string,
    questFundingTotal: record.questFundingTotal as string,
  };
  if (
    (draft.startTime && !isBangkokIsoDateTime(draft.startTime)) ||
    (draft.dueAt && !isBangkokIsoDateTime(draft.dueAt)) ||
    getConditionValidationErrors(draft.conditionItems).some(
      (error) => error === "CONDITION_TOO_LONG",
    ) ||
    (draft.questFundingTotal.trim() &&
      getDraftFundingTotalSatang(draft) === null) ||
    (draft.participation === "GROUP" &&
      draft.headcount.trim() &&
      getValidDraftHeadcount(draft) === null)
  ) {
    return null;
  }
  return draft;
}

function parseStep(value: unknown): QuestDraftStep | null {
  return value === 1 || value === 2 || value === 3 ? value : null;
}

function parseState(value: unknown): QuestDraftState | null {
  return value === "OPEN" || value === "DRAFT" ? value : null;
}

export function parseStoredQuestSnapshot(value: string): QuestDraftSnapshot | null {
  try {
    const parsed: unknown = JSON.parse(value);
    if (!parsed || typeof parsed !== "object") return null;
    const record = parsed as Record<string, unknown>;
    if (record.version !== QUEST_DRAFT_SCHEMA_VERSION) {
      return {
        requiresReview: true,
        reason:
          record.version === undefined ? "LEGACY_SCHEMA" : "UNSUPPORTED_SCHEMA",
      };
    }
    if (!record.draft || typeof record.draft !== "object") {
      return { requiresReview: true, reason: "INVALID_V2_DRAFT" };
    }
    const draft = normalizeStoredDraft(record.draft as Record<string, unknown>);
    if (!draft) return { requiresReview: true, reason: "INVALID_V2_DRAFT" };
    const step = parseStep(record.step);
    const state = parseState(record.state);
    if (step === null || state === null) {
      return { requiresReview: true, reason: "INVALID_V2_DRAFT" };
    }
    return {
      version: QUEST_DRAFT_SCHEMA_VERSION,
      draft,
      step,
      state,
    };
  } catch {
    return null;
  }
}

export function parseStoredQuestDraft(value: string): QuestDraft | null {
  const snapshot = parseStoredQuestSnapshot(value);
  return snapshot && "draft" in snapshot ? snapshot.draft : null;
}
