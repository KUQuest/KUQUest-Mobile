import type {
  QuestMode,
  QuestParticipation,
} from "@/features/questBoard/domain/types";
import type { CanonicalHirerQuestStatus } from "./hirerHomeStatuses";

export type { CanonicalHirerQuestStatus } from "./hirerHomeStatuses";
export const timelineStageOrder = [
  "open",
  "assigned",
  "inProgress",
  "review",
  "completed",
] as const;
export type TimelineStageKey = (typeof timelineStageOrder)[number];
export type TimelineStageState =
  "completed" | "current" | "upcoming" | "terminal";
export interface QuestProgressStage {
  key: TimelineStageKey;
  state: TimelineStageState;
}
export interface LocalizedHirerCopy {
  en: string;
  th: string;
}
export interface HirerHomeQuestFixture {
  id: string;
  title: LocalizedHirerCopy;
  tag?: LocalizedHirerCopy;
  status: CanonicalHirerQuestStatus;
  worker: {
    id: string;
    displayName: LocalizedHirerCopy;
    avatarUri?: string;
    faculty?: LocalizedHirerCopy;
  };
  startTime: string;
  dueAt: string;
}
export interface QuestMemberProfile {
  id: string;
  displayName: string;
  avatarUri?: string;
  faculty?: string;
}
export interface LiveHirerQuestCardData {
  id: string;
  title: string;
  tag?: string;
  status: CanonicalHirerQuestStatus;
  mode: QuestMode;
  participation: QuestParticipation;
  headcount: number;
  startTime: string;
  dueAt?: string | null;
  assignedWorkers: QuestMemberProfile[];
  applicants: QuestMemberProfile[];
  proofPending: boolean;
}
export interface HirerHomeData {
  activeQuests: LiveHirerQuestCardData[];
  activeQuestCount: number;
  draftCount: number;
  completedCount: number;
  hasPartialFailure?: boolean;
}
