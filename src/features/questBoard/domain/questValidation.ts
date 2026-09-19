import { isValidSatang } from "@/domain/satang";
import {
  QuestCandidateMode,
  QuestParticipation,
  QuestStatus,
  type CanonicalQuestCandidateMode,
  type QuestBoardQuest,
  type QuestContract,
  type QuestDetailState,
  type QuestLocation,
  type QuestStatus as QuestStatusValue,
} from "../types";

export interface QuestFixtureCreateInput {
  title: string;
  tag: string;
  description: string;
  conditions: string;
  proofRequired: QuestContract["proofRequired"];
  startDate: string;
  deadline: string;
  startTime: string;
  endTime: string;
  location: QuestLocation;
  candidateMode: CanonicalQuestCandidateMode;
  participation: "SOLO" | "SINGLE" | "GROUP";
  headcount: number;
  rewardSatang: number;
  imageUris: string[];
}

export type QuestFixtureCreatePayload = QuestFixtureCreateInput;
// Pure quest validation, normalization, and state construction lives here.
function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function safeDate(value: Date | string | undefined, fallback: Date): Date {
  const date =
    value instanceof Date
      ? new Date(value.getTime())
      : new Date(value ?? fallback);
  return Number.isNaN(date.getTime()) ? new Date(fallback.getTime()) : date;
}

function addMilliseconds(value: string, milliseconds: number): string {
  return new Date(new Date(value).getTime() + milliseconds).toISOString();
}

function dateTime(
  date: string,
  time: string | undefined,
  fallback = "09:00"
): string {
  const selectedTime = time?.match(/\d{1,2}:\d{2}/)?.[0] ?? fallback;
  return new Date(`${date}T${selectedTime}:00Z`).toISOString();
}

function splitTimeRange(value: string | undefined): {
  start: string;
  end: string;
} {
  const match = value?.match(/(\d{1,2}:\d{2})\s*[–-]\s*(\d{1,2}:\d{2})/);
  return { start: match?.[1] ?? "09:00", end: match?.[2] ?? "10:00" };
}

function parseCreateDateTime(
  dateValue: unknown,
  timeValue: unknown
): string | null {
  if (typeof dateValue !== "string" || typeof timeValue !== "string")
    return null;
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(dateValue) ||
    !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(timeValue)
  )
    return null;
  const parsed = new Date(`${dateValue}T${timeValue}:00Z`);
  if (Number.isNaN(parsed.getTime())) return null;
  const iso = parsed.toISOString();
  return iso.slice(0, 10) === dateValue && iso.slice(11, 16) === timeValue
    ? iso
    : null;
}

function createPayloadBlockers(payload: QuestFixtureCreateInput): string[] {
  const record =
    payload && typeof payload === "object"
      ? (payload as unknown as Record<string, unknown>)
      : {};
  const blockers: string[] = [];
  const title = typeof record.title === "string" ? record.title.trim() : "";
  const tag = typeof record.tag === "string" ? record.tag.trim() : "";
  const description =
    typeof record.description === "string" ? record.description.trim() : "";
  const conditions =
    typeof record.conditions === "string" ? record.conditions.trim() : "";
  const location =
    record.location && typeof record.location === "object"
      ? (record.location as Record<string, unknown>)
      : null;
  const locationLabel = location?.label;
  const startAt = parseCreateDateTime(record.startDate, record.startTime);
  const endAt = parseCreateDateTime(record.startDate, record.endTime);
  const deadlineAt = parseCreateDateTime(record.deadline, record.endTime);
  const participation = record.participation;
  const headcount = record.headcount;
  const isSingle =
    participation === "SOLO" || participation === QuestParticipation.SINGLE;

  if (!title) blockers.push("TITLE_REQUIRED");
  if (!tag) blockers.push("TAG_REQUIRED");
  if (!description) blockers.push("DESCRIPTION_REQUIRED");
  if (!conditions) blockers.push("COMPLETION_CRITERIA_REQUIRED");
  if (
    record.proofRequired !== "required" &&
    record.proofRequired !== "optional" &&
    record.proofRequired !== "none"
  )
    blockers.push("PROOF_INVALID");
  if (!startAt) blockers.push("START_REQUIRED");
  if (
    !endAt ||
    (startAt && new Date(endAt).getTime() <= new Date(startAt).getTime())
  )
    blockers.push("TIME_ORDER_INVALID");
  if (
    !deadlineAt ||
    (startAt && new Date(deadlineAt).getTime() <= new Date(startAt).getTime())
  )
    blockers.push("DEADLINE_REQUIRED");
  if (
    !location ||
    (locationLabel !== null &&
      (typeof locationLabel !== "string" || !locationLabel.trim()))
  )
    blockers.push("LOCATION_REQUIRED");
  if (
    record.candidateMode !== QuestCandidateMode.NO_CANDIDATE &&
    record.candidateMode !== QuestCandidateMode.CANDIDATE
  )
    blockers.push("CANDIDATE_MODE_INVALID");
  if (!isSingle && participation !== QuestParticipation.GROUP)
    blockers.push("PARTICIPATION_INVALID");
  if (
    !Number.isSafeInteger(record.rewardSatang) ||
    !isValidSatang(record.rewardSatang as number)
  )
    blockers.push("REWARD_INVALID");
  if (!Number.isSafeInteger(headcount) || (headcount as number) < 1)
    blockers.push("HEADCOUNT_INVALID");
  if (isSingle && headcount !== 1)
    blockers.push("SINGLE_HEADCOUNT_MUST_BE_ONE");
  if (
    !Array.isArray(record.imageUris) ||
    record.imageUris.some((uri) => typeof uri !== "string")
  )
    blockers.push("IMAGES_INVALID");
  return [...new Set(blockers)];
}

type CreatedQuestStateResult =
  { state: QuestDetailState } | { blockers: string[] };

function buildCreatedQuestState(
  payload: QuestFixtureCreateInput,
  questId: string,
  hirerId: string,
  now: Date
): CreatedQuestStateResult {
  const blockers = createPayloadBlockers(payload);
  if (blockers.length > 0) return { blockers };

  const startAt = parseCreateDateTime(payload.startDate, payload.startTime);
  const endAt = parseCreateDateTime(payload.startDate, payload.endTime);
  const deadlineAt = parseCreateDateTime(payload.deadline, payload.endTime);
  if (!startAt || !endAt || !deadlineAt)
    return { blockers: ["START_REQUIRED", "DEADLINE_REQUIRED"] };
  const headcount =
    payload.participation === "SOLO" ||
    payload.participation === QuestParticipation.SINGLE
      ? 1
      : payload.headcount;
  const locationLabel =
    payload.location.label === null ? null : payload.location.label.trim();
  const fixture: QuestBoardQuest = {
    id: questId,
    title: payload.title.trim(),
    tags: [payload.tag.trim()],
    description: payload.description.trim(),
    completionCriteria: payload.conditions.trim(),
    proofRequired: payload.proofRequired,
    rewardPerPerson: payload.rewardSatang / 100,
    rewardSatang: payload.rewardSatang,
    headcount,
    acceptedParticipants: 0,
    startDate: startAt.slice(0, 10),
    deadline: deadlineAt.slice(0, 10),
    timeRange: `${payload.startTime}–${payload.endTime}`,
    postedAt: now.toISOString(),
    location: locationLabel ?? "Online",
    locationMode: locationLabel === null ? "online" : "on-campus",
    participationMode: payload.participation === "GROUP" ? "team" : "single",
    candidateMode: payload.candidateMode,
    creator: { name: hirerId },
    imageUris: [...payload.imageUris].slice(0, 3),
    studentInterestMatch: false,
    ownerStudentId: hirerId,
  };
  const state = createState(fixture, QuestStatus.QUEST_DRAFT);
  state.quest.startAt = startAt;
  state.quest.endAt = endAt;
  state.quest.deadlineAt = deadlineAt;
  state.quest.requestedHeadcount = headcount;
  return { state };
}

function canonicalCandidateMode(
  value: QuestBoardQuest["candidateMode"]
): CanonicalQuestCandidateMode {
  return value === QuestCandidateMode.NO_CANDIDATE
    ? QuestCandidateMode.NO_CANDIDATE
    : QuestCandidateMode.CANDIDATE;
}

function canonicalQuest(
  fixture: QuestBoardQuest,
  status: QuestStatusValue
): QuestContract {
  const times = splitTimeRange(fixture.timeRange);
  const rewardSatang =
    fixture.rewardSatang ?? Math.round(fixture.rewardPerPerson * 100);
  return {
    id: fixture.id,
    status,
    title: fixture.title,
    description: fixture.description,
    completionCriteria: fixture.completionCriteria,
    proofRequired: fixture.proofRequired,
    reward: { rewardSatang, currency: "THB" },
    location: {
      label: fixture.locationMode === "online" ? null : fixture.location,
    },
    participation:
      fixture.participationMode === "team"
        ? QuestParticipation.GROUP
        : QuestParticipation.SINGLE,
    candidateMode: canonicalCandidateMode(fixture.candidateMode),
    headcount: fixture.headcount,
    tags: [...fixture.tags],
    startAt: dateTime(fixture.startDate, times.start),
    endAt: dateTime(fixture.startDate, times.end),
    deadlineAt: dateTime(fixture.deadline, times.end),
    postedAt: fixture.postedAt,
    imageUris: [...(fixture.imageUris ?? [])].slice(0, 3),
    hirerId: fixture.ownerStudentId,
  };
}

function blankCapabilities(): QuestDetailState["capabilities"] {
  return {
    availableActions: [],
    canReadConversation: false,
    canWriteConversation: false,
  };
}

function createState(
  fixture: QuestBoardQuest,
  status: QuestStatusValue
): QuestDetailState {
  return {
    quest: canonicalQuest(fixture, status),
    teams: [],
    invitations: [],
    applications: [],
    assignments: [],
    actualHeadcount: 0,
    proofs: [],
    conversation: {
      conversationId: null,
      canRead: false,
      canWrite: false,
      readOnly: true,
      readOnlyReason: "NOT_STARTED",
    },
    conversationMemberIds: [],
    capabilities: blankCapabilities(),
  };
}

export {
  addMilliseconds,
  blankCapabilities,
  buildCreatedQuestState,
  canonicalCandidateMode,
  canonicalQuest,
  clone,
  createPayloadBlockers,
  createState,
  dateTime,
  parseCreateDateTime,
  safeDate,
  splitTimeRange,
};
