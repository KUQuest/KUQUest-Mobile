import { MAX_QUEST_IMAGES } from '../questBoard/types';
import type {
  QuestCandidateMode as QuestBoardCandidateMode,
  QuestLocationMode as QuestBoardLocationMode,
  QuestParticipationMode as QuestBoardParticipationMode,
} from '../questBoard/types';

export type QuestDraftCandidateMode = 'FIRST_COME_FIRST_SERVED' | 'CANDIDATE';
export type QuestDraftParticipation = 'SINGLE' | 'GROUP';
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
  proofRequired: string;
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


export interface QuestBoardModeValues {
  candidateMode: QuestBoardCandidateMode;
  participationMode: QuestBoardParticipationMode;
  locationMode: QuestBoardLocationMode;
}

export function toQuestBoardModeValues(draft: Pick<QuestDraft, 'candidateMode' | 'participation' | 'locationMode'>): QuestBoardModeValues {
  return {
    candidateMode: draft.candidateMode === 'CANDIDATE' ? 'REVIEW' : 'NO_CANDIDATE',
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

  const amount = Number(trimmedValue);
  if (!Number.isFinite(amount) || amount < 0 || amount > MAX_REWARD_THB) {
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
  const startDate = normalizeStoredDate(stringValue('startDate', initialDraft.startDate));
  const deadline = normalizeStoredDate(stringValue('deadline', initialDraft.deadline));

  return {
    title: stringValue('title', initialDraft.title),
    tag: stringValue('tag', initialDraft.tag),
    description: stringValue('description', initialDraft.description),
    conditions: stringValue('conditions', initialDraft.conditions),
    proofRequired: ['required', 'optional', 'none'].includes(stringValue('proofRequired', initialDraft.proofRequired))
      ? stringValue('proofRequired', initialDraft.proofRequired)
      : initialDraft.proofRequired,
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
