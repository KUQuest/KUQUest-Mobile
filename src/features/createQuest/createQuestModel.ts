import {
  MAX_QUEST_IMAGES,
  formatSatang,
  parseSatangInput,
  type QuestCandidateMode as QuestBoardCandidateMode,
  type QuestEscrowSummary,
  type QuestLocation,
  type QuestLocationMode as QuestBoardLocationMode,
  type QuestParticipationMode as QuestBoardParticipationMode,
  type QuestPublishCheck,
} from '../questBoard/types';

export type QuestDraftCandidateMode = 'FIRST_COME_FIRST_SERVED' | 'CANDIDATE';
export type QuestDraftParticipation = 'SINGLE' | 'GROUP';
export type QuestDraftProofRequirement = 'required' | 'optional' | 'none';
export type QuestDraftLocationMode = 'ONLINE' | 'ON_CAMPUS';
export type QuestDraftState = 'DRAFT' | 'OPEN';
export type QuestDraftStep = 1 | 2 | 3;

export interface StoredQuestDraft {
  draft: QuestDraft;
  step: QuestDraftStep;
  state: QuestDraftState;
}

export function getSchedulePickerValue(platform: string, draftValue: Date, temporaryValue: Date | null): Date {
  return platform === 'ios' ? temporaryValue ?? draftValue : draftValue;
}

export function getScheduleTimeValue(value: Date): string {
  const hours = String(value.getHours()).padStart(2, '0');
  const minutes = String(value.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

export function getHeadcountForParticipation(participation: QuestDraftParticipation, currentHeadcount: string): string {
  return participation === 'SINGLE' ? '1' : currentHeadcount;
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
  title: '',
  tag: '',
  description: '',
  conditions: '',
  proofRequired: 'required',
  startDate: '',
  deadline: '',
  startTime: '',
  endTime: '',
  locationMode: 'ON_CAMPUS',
  location: '',
  imageUris: [],
  candidateMode: 'FIRST_COME_FIRST_SERVED',
  participation: 'SINGLE',
  headcount: '1',
  wage: '',
};

// Temporary UI data until draft loading is connected to the API.
export const mockQuestDraft: QuestDraft = {
  ...initialDraft,
  title: 'Draft campus photo session',
  tag: 'design',
  description: 'A demo draft that can be edited before publishing.',
  conditions: 'Upload the final photo set.',
  startDate: '2099-08-26',
  deadline: '2099-08-27',
  startTime: '09:00',
  endTime: '12:00',
  location: 'Student activity building',
  candidateMode: 'CANDIDATE',
  participation: 'GROUP',
  headcount: '2',
  wage: '250',
};


export interface QuestBoardModeValues {
  candidateMode: QuestBoardCandidateMode;
  participationMode: QuestBoardParticipationMode;
  locationMode: QuestBoardLocationMode;
}

export function toQuestBoardModeValues(draft: Pick<QuestDraft, 'candidateMode' | 'participation' | 'locationMode'>): QuestBoardModeValues {
  return {
    candidateMode: draft.candidateMode === 'CANDIDATE' ? 'CANDIDATE' : 'NO_CANDIDATE',
    participationMode: draft.participation === 'GROUP' ? 'team' : 'single',
    locationMode: draft.locationMode === 'ONLINE' ? 'online' : 'on-campus',
  };
}
export function isQuestDraftDirty(draft: QuestDraft): boolean {
  return (Object.keys(initialDraft) as (keyof QuestDraft)[]).some((key) => {
    const currentValue = draft[key];
    const initialValue = initialDraft[key];
    if (Array.isArray(currentValue) && Array.isArray(initialValue)) {
      return currentValue.length !== initialValue.length || currentValue.some((value, index) => value !== initialValue[index]);
    }
    return currentValue !== initialValue;
  });
}

export const MAX_REWARD_THB = 1_000_000;
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
  candidateMode: 'NO_CANDIDATE' | 'CANDIDATE';
  participation: 'SOLO' | 'GROUP';
  headcount: number;
  rewardSatang: number;
  imageUris: string[];
}

function getValidDraftHeadcount(draft: Pick<QuestDraft, 'participation' | 'headcount'>): number | null {
  if (draft.participation === 'SINGLE') return 1;
  const rawHeadcount = draft.headcount.trim();
  if (!rawHeadcount) return null;

  const headcount = Number(rawHeadcount);
  return Number.isSafeInteger(headcount) && headcount > 0 ? headcount : null;
}

export function getDraftRewardSatang(draft: Pick<QuestDraft, 'wage'>): number | null {
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
    location: { label: draft.locationMode === 'ONLINE' ? null : draft.location.trim() || null },
    candidateMode: draft.candidateMode === 'CANDIDATE' ? 'CANDIDATE' : 'NO_CANDIDATE',
    participation: draft.participation === 'GROUP' ? 'GROUP' : 'SOLO',
    headcount: draft.participation === 'SINGLE' ? 1 : Number(draft.headcount),
    rewardSatang: getDraftRewardSatang(draft) ?? 0,
    imageUris: [...draft.imageUris].slice(0, MAX_QUEST_IMAGES),
  };
}

export function calculateQuestEscrow(
  rewardSatang: number,
  headcount: number,
  feeRateBasisPoints = DEFAULT_PLATFORM_FEE_BASIS_POINTS,
): QuestEscrowSummary {
  const safeReward = Number.isSafeInteger(rewardSatang) && rewardSatang >= 0 ? rewardSatang : 0;
  const safeHeadcount = Number.isSafeInteger(headcount) && headcount > 0 ? headcount : 0;
  const platformFeeSatangPerWorker = Math.ceil(safeReward * feeRateBasisPoints / 10_000);
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

export function getQuestPublishCheck(draft: QuestDraft, feeRateBasisPoints = DEFAULT_PLATFORM_FEE_BASIS_POINTS): QuestPublishCheck {
  const headcount = getValidDraftHeadcount(draft);
  const payload = toQuestDraftPayload(draft);
  const blockers: string[] = [];
  const warnings: string[] = [];
  if (!payload.title) blockers.push('TITLE_REQUIRED');
  if (!payload.description) blockers.push('DESCRIPTION_REQUIRED');
  if (!payload.conditions) blockers.push('COMPLETION_CRITERIA_REQUIRED');
  if (!payload.startDate || !payload.startTime) blockers.push('START_REQUIRED');
  if (!payload.deadline || !payload.endTime) blockers.push('DEADLINE_REQUIRED');
  if (draft.locationMode === 'ON_CAMPUS' && !payload.location.label) blockers.push('LOCATION_REQUIRED');
  if (getDraftRewardSatang(draft) === null) blockers.push('REWARD_INVALID');
  if (draft.participation === 'GROUP' && headcount === null) blockers.push('HEADCOUNT_INVALID');
  if (payload.imageUris.length === 0) warnings.push('NO_IMAGES');
  return {
    canPublish: blockers.length === 0,
    blockers,
    warnings,
    escrow: calculateQuestEscrow(payload.rewardSatang, headcount ?? 0, feeRateBasisPoints),
  };
}

export function formatDraftReward(draft: Pick<QuestDraft, 'wage'>, locale: 'en' | 'th' = 'en'): string {
  return formatSatang(getDraftRewardSatang(draft) ?? 0, locale);
}

export interface RewardValidationMessages {
  empty: string;
  format: string;
  bounds: (maximum: number) => string;
}

const defaultRewardValidationMessages: RewardValidationMessages = {
  empty: 'Enter a reward amount in THB.',
  format: 'Enter a valid amount in THB with up to 2 decimal places.',
  bounds: (maximum) => `Reward must be between ฿0 and ฿${maximum.toLocaleString('en-US')}.`,
};

export function getRewardValidationError(value: string, messages: RewardValidationMessages = defaultRewardValidationMessages): string | undefined {
  const trimmedValue = value.trim();
  if (!trimmedValue) return messages.empty;
  if (!/^\d+(?:\.\d{1,2})?$/.test(trimmedValue)) return messages.format;

  const amountSatang = parseSatangInput(trimmedValue);
  if (amountSatang === null || amountSatang > MAX_REWARD_THB * 100) {
    return messages.bounds(MAX_REWARD_THB);
  }

  return undefined;
}

function normalizeCandidateMode(value: string): QuestDraftCandidateMode {
  if (value === 'CANDIDATE' || value === 'review') return 'CANDIDATE';
  return 'FIRST_COME_FIRST_SERVED';
}

function normalizeParticipation(value: string): QuestDraftParticipation {
  if (value === 'GROUP' || value === 'team') return 'GROUP';
  return 'SINGLE';
}

function normalizeLocationMode(value: string): QuestDraftLocationMode {
  return value === 'ONLINE' || value === 'online' ? 'ONLINE' : 'ON_CAMPUS';
}

function normalizeStoredDate(value: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value === '1970-01-01') return '';
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? '' : value;
}

function parseStep(value: unknown): QuestDraftStep {
  return value === 2 || value === 3 ? value : 1;
}

function parseState(value: unknown): QuestDraftState {
  return value === 'OPEN' ? 'OPEN' : 'DRAFT';
}

function parseDraftRecord(record: Record<string, unknown>): QuestDraft {
  const stringValue = (key: keyof QuestDraft, fallback: string) =>
    typeof record[key] === 'string' ? record[key] as string : fallback;
  const participation = normalizeParticipation(stringValue('participation', initialDraft.participation));
  const proofRequiredValue = stringValue('proofRequired', initialDraft.proofRequired);
  const proofRequired: QuestDraftProofRequirement = proofRequiredValue === 'required' || proofRequiredValue === 'optional' || proofRequiredValue === 'none'
    ? proofRequiredValue
    : initialDraft.proofRequired;
  const startDate = normalizeStoredDate(stringValue('startDate', initialDraft.startDate));
  const deadline = normalizeStoredDate(stringValue('deadline', initialDraft.deadline));

  return {
    title: stringValue('title', initialDraft.title),
    tag: stringValue('tag', initialDraft.tag),
    description: stringValue('description', initialDraft.description),
    conditions: stringValue('conditions', initialDraft.conditions),
    proofRequired,
    startDate,
    deadline,
    startTime: stringValue('startTime', initialDraft.startTime),
    endTime: stringValue('endTime', initialDraft.endTime),
    locationMode: normalizeLocationMode(stringValue('locationMode', initialDraft.locationMode)),
    location: stringValue('location', initialDraft.location),
    imageUris: Array.isArray(record.imageUris)
      ? record.imageUris.filter((uri): uri is string => typeof uri === 'string').slice(0, MAX_QUEST_IMAGES)
      : [],
    candidateMode: normalizeCandidateMode(stringValue('candidateMode', initialDraft.candidateMode)),
    participation,
    headcount: getHeadcountForParticipation(participation, stringValue('headcount', initialDraft.headcount)),
    wage: stringValue('wage', initialDraft.wage),
  };
}

export function parseStoredQuestSnapshot(value: string): StoredQuestDraft | null {
  try {
    const parsed: unknown = JSON.parse(value);
    if (!parsed || typeof parsed !== 'object') return null;
    const record = parsed as Record<string, unknown>;
    const draftRecord = record.draft && typeof record.draft === 'object'
      ? record.draft as Record<string, unknown>
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
