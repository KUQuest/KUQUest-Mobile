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

export function getQuestBoardTags(quests: QuestBoardQuest[]): string[] {
  const tags = new Map<string, string>();
  quests.flatMap((quest) => quest.tags).forEach((tag) => {
    const normalizedTag = tag.toLocaleLowerCase();
    if (!tags.has(normalizedTag)) tags.set(normalizedTag, tag);
  });
  return [...tags.values()].sort((left, right) => left.localeCompare(right, undefined, { sensitivity: 'base' }));
}

export function getStartTimeBucket(timeRange: string | undefined): QuestBoardFilter['startTimeBuckets'][number] | null {
  const startTime = timeRange?.match(/^(\d{2}):(\d{2})/);
  if (!startTime) return null;

  const hour = Number(startTime[1]);
  const minute = Number(startTime[2]);
  if (hour > 23 || minute > 59) return null;
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}

function matchesTags(quest: QuestBoardQuest, tags: string[]): boolean {
  if (tags.length === 0) return true;
  const normalizedTags = quest.tags.map((tag) => tag.toLocaleLowerCase());
  return tags.some((tag) => normalizedTags.includes(tag.toLocaleLowerCase()));
}

function matchesRewardBounds(quest: QuestBoardQuest, minimum: number | null, maximum: number | null): boolean {
  return (minimum === null || quest.rewardPerPerson >= minimum)
    && (maximum === null || quest.rewardPerPerson <= maximum);
}

function matchesStartTimeBucket(quest: QuestBoardQuest, buckets: QuestBoardFilter['startTimeBuckets']): boolean {
  const bucket = getStartTimeBucket(quest.timeRange);
  return buckets.length === 0 || (bucket !== null && buckets.includes(bucket));
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
      && matchesTags(quest, filter.tags)
      && matchesRewardBounds(quest, filter.rewardMin, filter.rewardMax)
      && matchesDeadline(quest, filter.deadline, now)
      && matchesStartTimeBucket(quest, filter.startTimeBuckets)
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
