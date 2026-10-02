import type {
  DeadlineFilter,
  QuestBoardFilter,
  QuestBoardSort,
  StartTimeBucket,
} from "../domain/types";

export const deadlineOptions: {
  value: DeadlineFilter;
  labelKey: "today" | "within3Days" | "within7Days";
}[] = [
  { value: "today", labelKey: "today" },
  { value: "within-3-days", labelKey: "within3Days" },
  { value: "within-7-days", labelKey: "within7Days" },
];

export const startTimeOptions: {
  value: StartTimeBucket;
  labelKey: "morning" | "afternoon" | "evening";
}[] = [
  { value: "morning", labelKey: "morning" },
  { value: "afternoon", labelKey: "afternoon" },
  { value: "evening", labelKey: "evening" },
];

export const sortOptions: {
  value: QuestBoardSort;
  labelKey: "newest" | "deadlineSoonest" | "rewardHighest";
}[] = [
  { value: "newest", labelKey: "newest" },
  { value: "deadline-soonest", labelKey: "deadlineSoonest" },
  { value: "reward-highest", labelKey: "rewardHighest" },
];

export function getActiveFilterCount(filter: QuestBoardFilter): number {
  return (
    Number(filter.tags.length > 0) +
    Number(filter.rewardMin !== null || filter.rewardMax !== null) +
    Number(filter.deadline !== null) +
    Number(filter.startTimeBuckets.length > 0) +
    Number(filter.locationModes.length > 0)
  );
}
