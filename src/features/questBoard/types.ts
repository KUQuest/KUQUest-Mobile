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

export type RewardRange = 'under-500' | '500-1000' | 'over-1000';
export type DeadlineFilter = 'today' | 'within-3-days' | 'within-7-days';

export interface QuestBoardFilter {
  query: string;
  categories: QuestCategory[];
  rewardRange: RewardRange | null;
  deadline: DeadlineFilter | null;
  locationModes: QuestLocationMode[];
}

export interface QuestBoardQueryOptions {
  currentStudentId?: string;
  now?: Date;
}

export const emptyQuestBoardFilter: QuestBoardFilter = {
  query: '',
  categories: [],
  rewardRange: null,
  deadline: null,
  locationModes: [],
};
