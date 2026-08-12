import type {
  DeadlineFilter,
  QuestAvailability,
  QuestBoardFilter,
  QuestBoardQueryOptions,
  QuestBoardQuest,
  QuestBoardSort,
  QuestLocationMode,
} from './types';

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfDay(value: Date): number {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate()).getTime();
}

function parseDate(value: string): Date {
  return new Date(`${value}T12:00:00`);
}

function compareText(left: string, right: string): number {
  return left.localeCompare(right);
}

function comparePostedAt(left: QuestBoardQuest, right: QuestBoardQuest): number {
  const postedDifference = new Date(right.postedAt).getTime() - new Date(left.postedAt).getTime();
  return postedDifference || compareText(left.id, right.id);
}

export function getQuestAvailability(quest: QuestBoardQuest, now = new Date()): QuestAvailability {
  if (quest.acceptedParticipants >= quest.headcount) return 'full';
  if (startOfDay(parseDate(quest.deadline)) < startOfDay(now)) return 'closed';
  return 'available';
}

export function getVisibleQuests(quests: QuestBoardQuest[], options: QuestBoardQueryOptions = {}): QuestBoardQuest[] {
  const now = options.now ?? new Date();
  return quests.filter((quest) => {
    if (options.currentStudentId && quest.ownerStudentId === options.currentStudentId) return false;
    return getQuestAvailability(quest, now) === 'available';
  });
}

function matchesRewardRange(quest: QuestBoardQuest, range: QuestBoardFilter['rewardRange']): boolean {
  if (!range) return true;
  if (range === 'under-500') return quest.rewardPerPerson < 500;
  if (range === '500-1000') return quest.rewardPerPerson >= 500 && quest.rewardPerPerson <= 1000;
  return quest.rewardPerPerson > 1000;
}

function matchesDeadline(quest: QuestBoardQuest, deadline: DeadlineFilter | null, now: Date): boolean {
  if (!deadline) return true;
  const daysUntilDeadline = Math.floor((startOfDay(parseDate(quest.deadline)) - startOfDay(now)) / DAY_MS);
  if (deadline === 'today') return daysUntilDeadline === 0;
  if (deadline === 'within-3-days') return daysUntilDeadline >= 0 && daysUntilDeadline <= 3;
  return daysUntilDeadline >= 0 && daysUntilDeadline <= 7;
}

function matchesLocationMode(quest: QuestBoardQuest, modes: QuestLocationMode[]): boolean {
  return modes.length === 0 || modes.includes(quest.locationMode);
}

export function applyQuestBoardFilters(
  quests: QuestBoardQuest[],
  filter: QuestBoardFilter,
  options: QuestBoardQueryOptions = {},
): QuestBoardQuest[] {
  const now = options.now ?? new Date();
  const query = filter.query.trim().toLocaleLowerCase();
  return getVisibleQuests(quests, options).filter((quest) => {
    const searchableText = [quest.title, quest.category, ...quest.tags].join(' ').toLocaleLowerCase();
    const matchesQuery = !query || searchableText.includes(query);
    const matchesCategory = filter.categories.length === 0 || filter.categories.includes(quest.category);
    return matchesQuery
      && matchesCategory
      && matchesRewardRange(quest, filter.rewardRange)
      && matchesDeadline(quest, filter.deadline, now)
      && matchesLocationMode(quest, filter.locationModes);
  });
}

export function sortQuests(quests: QuestBoardQuest[], sort: QuestBoardSort): QuestBoardQuest[] {
  return [...quests].sort((left, right) => {
    if (sort === 'recommended') {
      const interestDifference = Number(right.studentInterestMatch) - Number(left.studentInterestMatch);
      if (interestDifference) return interestDifference;
      const deadlineDifference = parseDate(left.deadline).getTime() - parseDate(right.deadline).getTime();
      return deadlineDifference || comparePostedAt(left, right);
    }
    if (sort === 'newest') return comparePostedAt(left, right);
    if (sort === 'deadline-soonest') {
      const deadlineDifference = parseDate(left.deadline).getTime() - parseDate(right.deadline).getTime();
      return deadlineDifference || comparePostedAt(left, right);
    }
    const rewardDifference = right.rewardPerPerson - left.rewardPerPerson;
    if (rewardDifference) return rewardDifference;
    const deadlineDifference = parseDate(left.deadline).getTime() - parseDate(right.deadline).getTime();
    return deadlineDifference || comparePostedAt(left, right);
  });
}
