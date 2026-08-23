export const MAX_QUEST_IMAGES = 3;

export type QuestLocationMode = 'online' | 'on-campus';
export type QuestParticipationMode = 'single' | 'team';
export type QuestCandidateMode = 'NO_CANDIDATE' | 'REVIEW';
export type QuestBoardSort = 'newest' | 'deadline-soonest' | 'reward-highest';
export type QuestAvailability = 'available' | 'full' | 'closed';

export interface QuestBoardQuest {
  id: string;
  title: string;
  tags: string[];
  description: string;
  completionCriteria: string;
  proofRequired: 'required' | 'optional' | 'none';
  rewardPerPerson: number;
  headcount: number;
  acceptedParticipants: number;
  startDate: string;
  deadline: string;
  timeRange?: string;
  postedAt: string;
  location: string;
  locationMode: QuestLocationMode;
  participationMode: QuestParticipationMode;
  candidateMode: QuestCandidateMode;
  creator: { name: string; faculty?: string; avatarUri?: string };
  imageUris?: string[];
  studentInterestMatch: boolean;
  ownerStudentId: string;
}

export type DeadlineFilter = 'today' | 'within-3-days' | 'within-7-days';
export type StartTimeBucket = 'morning' | 'afternoon' | 'evening';

export interface QuestBoardFilter {
  query: string;
  tags: string[];
  rewardMin: number | null;
  rewardMax: number | null;
  deadline: DeadlineFilter | null;
  startTimeBuckets: StartTimeBucket[];
  locationModes: QuestLocationMode[];
}

export interface QuestBoardQueryOptions {
  currentStudentId?: string;
  now?: Date;
}

export const emptyQuestBoardFilter: QuestBoardFilter = {
  query: '',
  tags: [],
  rewardMin: null,
  rewardMax: null,
  deadline: null,
  startTimeBuckets: [],
  locationModes: [],
};
