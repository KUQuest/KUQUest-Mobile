import type { QuestV2AssignmentMineStatus } from "@/api/QuestApi";

export const workerHomeKeys = {
  all: ["workerHome"] as const,
  assignments: (status: QuestV2AssignmentMineStatus) =>
    [...workerHomeKeys.all, "assignments", status] as const,
  boardScope: () => [...workerHomeKeys.all, "board"] as const,
  board: (q: string, tagId: string | null) =>
    [...workerHomeKeys.boardScope(), q, tagId] as const,
  participationDetail: (questId: string) =>
    [...workerHomeKeys.all, "participation-detail", questId] as const,
};
