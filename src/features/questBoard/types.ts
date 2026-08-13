export type QuestCategory = 'design' | 'technology' | 'tutoring' | 'campus-life';
export type QuestLocationMode = 'online' | 'on-campus';
export type QuestParticipationMode = 'single' | 'team';
export type QuestCandidateMode = 'NO_CANDIDATE' | 'REVIEW';
export type QuestBoardSort = 'recommended' | 'newest' | 'deadline-soonest' | 'reward-highest';
export type QuestAvailability = 'available' | 'full' | 'closed';

export interface QuestBoardQuest {
  id: string;
  title: string;
  category: QuestCategory;
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
  studentInterestMatch: boolean;
  ownerStudentId: string;
}

export type DeadlineFilter = 'today' | 'within-3-days' | 'within-7-days';
export type StartTimeBucket = 'morning' | 'afternoon' | 'evening';

export interface QuestBoardFilter {
  query: string;
  categories: QuestCategory[];
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
  categories: [],
  tags: [],
  rewardMin: null,
  rewardMax: null,
  deadline: null,
  startTimeBuckets: [],
  locationModes: [],
};
