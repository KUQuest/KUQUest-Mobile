import {
  MAX_QUEST_IMAGES,
  type QuestCandidateMode as QuestBoardCandidateMode,
  type QuestEscrowSummary,
  type QuestLocation,
  type QuestLocationMode as QuestBoardLocationMode,
  type QuestParticipationMode as QuestBoardParticipationMode,
  type QuestPublishCheck,
} from "../../questBoard/domain/types";

import { formatDateTime } from "@/domain/datetime";
import { createQuestMessages } from "@/locales/createQuestMessages";
import { formatSatang, parseSatangInput } from "@/domain/satang";

export type QuestDraftCandidateMode = "FIRST_COME_FIRST_SERVED" | "CANDIDATE";
export type QuestDraftParticipation = "SINGLE" | "GROUP";
export type QuestDraftProofRequirement = "required" | "optional" | "none";
export type QuestDraftLocationMode = "ONLINE" | "ON_CAMPUS";
export type QuestDraftState = "DRAFT" | "OPEN";
export type QuestDraftStep = 1 | 2 | 3;

export interface StoredQuestDraft {
  draft: QuestDraft;
  step: QuestDraftStep;
  state: QuestDraftState;
}

export function getHeadcountForParticipation(
  participation: QuestDraftParticipation,
  currentHeadcount: string
): string {
  return participation === "SINGLE" ? "1" : currentHeadcount;
}

export function formatQuestDuration(
  startMs: number,
  endMs: number,
  locale: "en" | "th" = "th"
): string {
  const diffMs = endMs - startMs;
  if (diffMs <= 0) return "";
  const totalMinutes = Math.floor(diffMs / (60 * 1000));
  const days = Math.floor(totalMinutes / (24 * 60));
  const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
  const minutes = totalMinutes % 60;

  if (locale === "th") {
    const parts: string[] = [];
    if (days > 0) parts.push(`${days} วัน`);
    if (hours > 0) parts.push(`${hours} ชั่วโมง`);
    if (minutes > 0 && days === 0) parts.push(`${minutes} นาที`);
    return parts.join(" ") || "< 1 นาที";
  }
  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0 && days === 0) parts.push(`${minutes}m`);
  return parts.join(" ") || "< 1 min";
}
export interface QuestScheduleDisplay {
  range: string;
  duration: string;
  crossesMidnight: boolean;
}

export function formatQuestSchedule(
  schedule: Pick<
    QuestDraft,
    "startDate" | "startTime" | "deadline" | "endTime"
  >,
  locale: "en" | "th",
  emptyLabel: string
): QuestScheduleDisplay {
  const hasValues =
    Boolean(schedule.startDate) &&
    Boolean(schedule.startTime) &&
    Boolean(schedule.deadline) &&
    Boolean(schedule.endTime) &&
    TIME_PATTERN.test(schedule.startTime) &&
    TIME_PATTERN.test(schedule.endTime);
  if (!hasValues) {
    return { range: emptyLabel, duration: "", crossesMidnight: false };
  }

  const startMs = getDateTimeValue(schedule.startDate, schedule.startTime);
  const endMs = getDateTimeValue(schedule.deadline, schedule.endTime);
  const duration =
    startMs !== null && endMs !== null && endMs > startMs
      ? formatQuestDuration(startMs, endMs, locale)
      : "";

  return {
    range: `${formatDateTime(schedule.startDate, schedule.startTime, locale, emptyLabel)} – ${formatDateTime(schedule.deadline, schedule.endTime, locale, emptyLabel)}`,
    duration,
    crossesMidnight:
      startMs !== null &&
      endMs !== null &&
      endMs > startMs &&
      schedule.startDate !== schedule.deadline,
  };
}

export function addHoursToTime(time: string, hoursToAdd: number): string {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time);
  if (!match) return "12:00";
  const hours = (Number(match[1]) + hoursToAdd) % 24;
  const minutes = Number(match[2]);
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function getRelativeDateValue(daysOffset = 0): string {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function addDaysToDate(dateStr: string, daysToAdd: number): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr))
    return getRelativeDateValue(daysToAdd);
  const date = new Date(`${dateStr}T12:00:00`);
  if (Number.isNaN(date.getTime())) return getRelativeDateValue(daysToAdd);
  date.setDate(date.getDate() + daysToAdd);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getNearestQuarterHour(now = new Date()): {
  hours: string;
  minutes: string;
} {
  const minutes = now.getMinutes();
  const roundedMinutes = Math.ceil(minutes / 5) * 5;
  const date = new Date(now);
  date.setMinutes(roundedMinutes, 0, 0);
  const hoursStr = String(date.getHours()).padStart(2, "0");
  const minutesStr = String(date.getMinutes()).padStart(2, "0");
  return { hours: hoursStr, minutes: minutesStr };
}

export interface QuestDraft {
  title: string;
  tag: string;
  description: string;
  conditions: string;
  proofRequired: QuestDraftProofRequirement;
  startDate: string;
  deadline: string;
  startTime: string;
  endTime: string;
  locationMode: QuestDraftLocationMode;
  location: string;
  imageUris: string[];
  candidateMode: QuestDraftCandidateMode;
  participation: QuestDraftParticipation;
  headcount: string;
  wage: string;
}

export const initialDraft: QuestDraft = {
  title: "",
  tag: "",
  description: "",
  conditions: "",
  proofRequired: "required",
  startDate: "",
  deadline: "",
  startTime: "",
  endTime: "",
  locationMode: "ON_CAMPUS",
  location: "",
  imageUris: [],
  candidateMode: "FIRST_COME_FIRST_SERVED",
  participation: "SINGLE",
  headcount: "1",
  wage: "",
};

export interface QuestBoardModeValues {
  candidateMode: QuestBoardCandidateMode;
  participationMode: QuestBoardParticipationMode;
  locationMode: QuestBoardLocationMode;
}

export function toQuestBoardModeValues(
  draft: Pick<QuestDraft, "candidateMode" | "participation" | "locationMode">
): QuestBoardModeValues {
  return {
    candidateMode:
      draft.candidateMode === "CANDIDATE" ? "CANDIDATE" : "NO_CANDIDATE",
    participationMode: draft.participation === "GROUP" ? "team" : "single",
    locationMode: draft.locationMode === "ONLINE" ? "online" : "on-campus",
  };
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

export const MAX_REWARD_THB = 700_000;
export const MIN_REWARD_THB = 1;
export const DEFAULT_PLATFORM_FEE_BASIS_POINTS = 500;

export interface QuestDraftPayload {
  title: string;
  tag: string;
  description: string;
  conditions: string;
  proofRequired: QuestDraftProofRequirement;
  startDate: string;
  deadline: string;
  startTime: string;
  endTime: string;
  location: QuestLocation;
  candidateMode: "NO_CANDIDATE" | "CANDIDATE";
  participation: "SOLO" | "GROUP";
  headcount: number;
  rewardSatang: number;
  imageUris: string[];
}

// Team Quests take 2–20 participants (docs/api/api.yaml headcount + GROUP rule).
const MIN_GROUP_HEADCOUNT = 2;
const MAX_GROUP_HEADCOUNT = 20;

export function getValidDraftHeadcount(
  draft: Pick<QuestDraft, "participation" | "headcount">
): number | null {
  if (draft.participation === "SINGLE") return 1;
  const rawHeadcount = draft.headcount.trim();
  if (!rawHeadcount) return null;

  const headcount = Number(rawHeadcount);
  return Number.isSafeInteger(headcount) &&
    headcount >= MIN_GROUP_HEADCOUNT &&
    headcount <= MAX_GROUP_HEADCOUNT
    ? headcount
    : null;
}

export function getDraftRewardSatang(
  draft: Pick<QuestDraft, "wage">
): number | null {
  const value = parseSatangInput(draft.wage);
  return value !== null && value <= MAX_REWARD_THB * 100 ? value : null;
}

export function toQuestDraftPayload(draft: QuestDraft): QuestDraftPayload {
  return {
    title: draft.title.trim(),
    tag: draft.tag,
    description: draft.description.trim(),
    conditions: draft.conditions.trim(),
    proofRequired: draft.proofRequired,
    startDate: draft.startDate,
    deadline: draft.deadline,
    startTime: draft.startTime,
    endTime: draft.endTime,
    location: {
      label:
        draft.locationMode === "ONLINE" ? null : draft.location.trim() || null,
    },
    candidateMode:
      draft.candidateMode === "CANDIDATE" ? "CANDIDATE" : "NO_CANDIDATE",
    participation: draft.participation === "GROUP" ? "GROUP" : "SOLO",
    headcount: draft.participation === "SINGLE" ? 1 : Number(draft.headcount),
    rewardSatang: getDraftRewardSatang(draft) ?? 0,
    imageUris: [...draft.imageUris].slice(0, MAX_QUEST_IMAGES),
  };
}

function getNetRewardSatang(
  fundingTotalSatang: number,
  feeRateBasisPoints: number
): number {
  const safeFundingTotal =
    Number.isSafeInteger(fundingTotalSatang) && fundingTotalSatang >= 0
      ? fundingTotalSatang
      : 0;
  const safeFeeRate =
    Number.isFinite(feeRateBasisPoints) && feeRateBasisPoints >= 0
      ? feeRateBasisPoints
      : 0;
  let low = 0;
  let high = safeFundingTotal;
  let best = 0;

  while (low <= high) {
    const candidate = Math.floor((low + high) / 2);
    const requiredFee = Math.ceil((candidate * safeFeeRate) / 10_000);
    if (candidate + requiredFee <= safeFundingTotal) {
      best = candidate;
      low = candidate + 1;
    } else {
      high = candidate - 1;
    }
  }

  return best;
}

export function calculateQuestEscrow(
  fundingTotalSatang: number,
  headcount: number,
  feeRateBasisPoints = DEFAULT_PLATFORM_FEE_BASIS_POINTS
): QuestEscrowSummary {
  const safeFundingTotal =
    Number.isSafeInteger(fundingTotalSatang) && fundingTotalSatang >= 0
      ? fundingTotalSatang
      : 0;
  const safeHeadcount =
    Number.isSafeInteger(headcount) && headcount > 0 ? headcount : 0;
  const rewardSatangPerWorker = getNetRewardSatang(
    safeFundingTotal,
    feeRateBasisPoints
  );
  const platformFeeSatangPerWorker = safeFundingTotal - rewardSatangPerWorker;
  const rewardPoolSatang = rewardSatangPerWorker * safeHeadcount;
  const platformFeeSatang = platformFeeSatangPerWorker * safeHeadcount;
  return {
    rewardPoolSatang,
    platformFeeSatang,
    totalRequiredSatang: safeFundingTotal * safeHeadcount,
    headcount: safeHeadcount,
    rewardSatangPerWorker,
    platformFeeSatangPerWorker,
    feeRateBasisPoints,
  };
}

export function getQuestPublishCheck(
  draft: QuestDraft,
  feeRateBasisPoints = DEFAULT_PLATFORM_FEE_BASIS_POINTS,
  now = new Date()
): QuestPublishCheck {
  const headcount = getValidDraftHeadcount(draft);
  const payload = toQuestDraftPayload(draft);
  const blockers: string[] = [];
  const warnings: string[] = [];
  if (!payload.title) blockers.push("TITLE_REQUIRED");
  if (!payload.description) blockers.push("DESCRIPTION_REQUIRED");
  if (!payload.conditions) blockers.push("COMPLETION_CRITERIA_REQUIRED");
  if (!payload.startDate || !payload.startTime) blockers.push("START_REQUIRED");
  if (!payload.deadline || !payload.endTime) blockers.push("DEADLINE_REQUIRED");
  const startMs = getDateTimeValue(draft.startDate, draft.startTime);
  if (startMs !== null && startMs <= now.getTime())
    blockers.push("QUEST_START_TIME_NOT_IN_FUTURE");
  if (draft.locationMode === "ON_CAMPUS" && !payload.location.label)
    blockers.push("LOCATION_REQUIRED");
  if (getDraftRewardSatang(draft) === null) blockers.push("REWARD_INVALID");
  if (draft.participation === "GROUP" && headcount === null)
    blockers.push("HEADCOUNT_INVALID");
  if (payload.imageUris.length === 0) warnings.push("NO_IMAGES");
  return {
    canPublish: blockers.length === 0,
    blockers,
    warnings,
    escrow: calculateQuestEscrow(
      payload.rewardSatang,
      headcount ?? 0,
      feeRateBasisPoints
    ),
  };
}

export function formatDraftReward(
  draft: Pick<QuestDraft, "wage">,
  locale: "en" | "th" = "en"
): string {
  return formatSatang(getDraftRewardSatang(draft) ?? 0, locale);
}

export interface RewardValidationMessages {
  empty: string;
  format: string;
  bounds: (maximum: number) => string;
}

const defaultRewardValidationMessages: RewardValidationMessages = {
  empty: createQuestMessages.en.rewardEmptyError,
  format: createQuestMessages.en.rewardFormatError,
  bounds: createQuestMessages.en.rewardBoundsError,
};

export function getRewardValidationError(
  value: string,
  messages: RewardValidationMessages = defaultRewardValidationMessages
): string | undefined {
  const trimmedValue = value.trim();
  if (!trimmedValue) return messages.empty;
  if (!/^\d+(?:\.\d{1,2})?$/.test(trimmedValue)) return messages.format;

  const amountSatang = parseSatangInput(trimmedValue);
  if (
    amountSatang === null ||
    amountSatang < MIN_REWARD_THB * 100 ||
    amountSatang > MAX_REWARD_THB * 100
  ) {
    return messages.bounds(MAX_REWARD_THB);
  }

  return undefined;
}

export const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

export function toDateValue(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export function getDateTimeValue(
  dateValue: string,
  timeValue: string
): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateValue) || !TIME_PATTERN.test(timeValue))
    return null;
  const date = new Date(`${dateValue}T${timeValue}:00`);
  return Number.isNaN(date.getTime()) ? null : date.getTime();
}

export function formatBangkokIso(date: Date): string {
  const b = new Date(date.getTime() + 7 * 60 * 60 * 1000);
  return `${b.toISOString().slice(0, 19)}+07:00`;
}

export function toBangkokDateTime(
  dateStr: string,
  timeStr: string
): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr) || !TIME_PATTERN.test(timeStr))
    return null;
  const [yearStr, monthStr, dayStr] = dateStr.split("-");
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);
  const check = new Date(Date.UTC(year, month - 1, day));
  if (
    check.getUTCFullYear() !== year ||
    check.getUTCMonth() !== month - 1 ||
    check.getUTCDate() !== day
  ) {
    return null;
  }
  return `${dateStr}T${timeStr}:00+07:00`;
}

export interface QuestDraftStepFinding {
  field:
    | "title"
    | "tag"
    | "description"
    | "conditions"
    | "startDate"
    | "deadline"
    | "startTime"
    | "endTime"
    | "location"
    | "headcount"
    | "wage";
  code: string;
}

export function validateQuestDraftStep(
  draft: QuestDraft,
  step: QuestDraftStep,
  now: Date
): QuestDraftStepFinding[] {
  const findings: QuestDraftStepFinding[] = [];
  if (step === 1) {
    if (!draft.title.trim())
      findings.push({ field: "title", code: "required" });
    if (!draft.tag) findings.push({ field: "tag", code: "required" });
    if (!draft.description.trim())
      findings.push({ field: "description", code: "required" });
    if (!draft.conditions.trim())
      findings.push({ field: "conditions", code: "required" });
  }
  if (step === 2) {
    const today = toDateValue(now);
    if (!draft.startDate)
      findings.push({ field: "startDate", code: "required" });
    else if (draft.startDate < today)
      findings.push({ field: "startDate", code: "startDatePast" });
    if (!draft.deadline) findings.push({ field: "deadline", code: "required" });
    if (draft.startDate && draft.deadline && draft.deadline < draft.startDate)
      findings.push({ field: "deadline", code: "deadlineOrder" });
    if (!draft.startTime)
      findings.push({ field: "startTime", code: "required" });
    else if (!TIME_PATTERN.test(draft.startTime))
      findings.push({ field: "startTime", code: "format" });
    if (!draft.endTime) findings.push({ field: "endTime", code: "required" });
    else if (!TIME_PATTERN.test(draft.endTime))
      findings.push({ field: "endTime", code: "format" });
    const startDateTime = getDateTimeValue(draft.startDate, draft.startTime);
    const endDateTime = getDateTimeValue(draft.deadline, draft.endTime);
    if (
      draft.startDate >= today &&
      startDateTime !== null &&
      startDateTime <= now.getTime()
    )
      findings.push({ field: "startTime", code: "startTimePast" });
    if (
      startDateTime !== null &&
      endDateTime !== null &&
      endDateTime <= startDateTime
    )
      findings.push({ field: "endTime", code: "timeOrder" });
    if (draft.locationMode === "ON_CAMPUS" && !draft.location.trim())
      findings.push({ field: "location", code: "required" });
    if (draft.participation === "GROUP") {
      if (!draft.headcount.trim())
        findings.push({ field: "headcount", code: "required" });
      else if (getValidDraftHeadcount(draft) === null)
        findings.push({ field: "headcount", code: "bounds" });
    }
    // Reuse the reward rule; sentinel messages double as codes.
    const wageCode = getRewardValidationError(draft.wage, {
      empty: "empty",
      format: "format",
      bounds: () => "bounds",
    });
    if (wageCode) findings.push({ field: "wage", code: wageCode });
  }
  return findings;
}

function normalizeCandidateMode(value: string): QuestDraftCandidateMode {
  if (value === "CANDIDATE" || value === "review") return "CANDIDATE";
  return "FIRST_COME_FIRST_SERVED";
}

function normalizeParticipation(value: string): QuestDraftParticipation {
  if (value === "GROUP" || value === "team") return "GROUP";
  return "SINGLE";
}

function normalizeLocationMode(value: string): QuestDraftLocationMode {
  return value === "ONLINE" || value === "online" ? "ONLINE" : "ON_CAMPUS";
}

function normalizeStoredDate(value: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value === "1970-01-01") return "";
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? "" : value;
}

function parseStep(value: unknown): QuestDraftStep {
  return value === 2 || value === 3 ? value : 1;
}

function parseState(value: unknown): QuestDraftState {
  return value === "OPEN" ? "OPEN" : "DRAFT";
}

function parseDraftRecord(record: Record<string, unknown>): QuestDraft {
  const stringValue = (key: keyof QuestDraft, fallback: string) =>
    typeof record[key] === "string" ? (record[key] as string) : fallback;
  const participation = normalizeParticipation(
    stringValue("participation", initialDraft.participation)
  );
  const proofRequiredValue = stringValue(
    "proofRequired",
    initialDraft.proofRequired
  );
  const proofRequired: QuestDraftProofRequirement =
    proofRequiredValue === "required" ||
    proofRequiredValue === "optional" ||
    proofRequiredValue === "none"
      ? proofRequiredValue
      : initialDraft.proofRequired;
  const startDate = normalizeStoredDate(
    stringValue("startDate", initialDraft.startDate)
  );
  const deadline = normalizeStoredDate(
    stringValue("deadline", initialDraft.deadline)
  );

  return {
    title: stringValue("title", initialDraft.title),
    tag: stringValue("tag", initialDraft.tag),
    description: stringValue("description", initialDraft.description),
    conditions: stringValue("conditions", initialDraft.conditions),
    proofRequired,
    startDate,
    deadline,
    startTime: stringValue("startTime", initialDraft.startTime),
    endTime: stringValue("endTime", initialDraft.endTime),
    locationMode: normalizeLocationMode(
      stringValue("locationMode", initialDraft.locationMode)
    ),
    location: stringValue("location", initialDraft.location),
    imageUris: Array.isArray(record.imageUris)
      ? record.imageUris
          .filter((uri): uri is string => typeof uri === "string")
          .slice(0, MAX_QUEST_IMAGES)
      : [],
    candidateMode: normalizeCandidateMode(
      stringValue("candidateMode", initialDraft.candidateMode)
    ),
    participation,
    headcount: getHeadcountForParticipation(
      participation,
      stringValue("headcount", initialDraft.headcount)
    ),
    wage: stringValue("wage", initialDraft.wage),
  };
}

export function parseStoredQuestSnapshot(
  value: string
): StoredQuestDraft | null {
  try {
    const parsed: unknown = JSON.parse(value);
    if (!parsed || typeof parsed !== "object") return null;
    const record = parsed as Record<string, unknown>;
    const draftRecord =
      record.draft && typeof record.draft === "object"
        ? (record.draft as Record<string, unknown>)
        : record;
    return {
      draft: parseDraftRecord(draftRecord),
      step: parseStep(record.step),
      state: parseState(record.state),
    };
  } catch {
    return null;
  }
}

export function parseStoredQuestDraft(value: string): QuestDraft | null {
  return parseStoredQuestSnapshot(value)?.draft ?? null;
}
