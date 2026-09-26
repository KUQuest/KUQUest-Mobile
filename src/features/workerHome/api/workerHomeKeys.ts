import type { QuestV2AssignmentMineStatus } from "@/api/QuestApi";

export const workerHomeKeys = {
  all: ["workerHome"] as const,
  assignments: (status: QuestV2AssignmentMineStatus) =>
    [...workerHomeKeys.all, "assignments", status] as const,
  board: (q: string, tagId: string | null) =>
    [...workerHomeKeys.all, "board", q, tagId] as const,
  tags: () => [...workerHomeKeys.all, "tags"] as const,
  participationDetail: (questId: string) =>
    [...workerHomeKeys.all, "participation-detail", questId] as const,
  liveSnapshot: (questId: string, viewerId: string) =>
    [...workerHomeKeys.all, "live-snapshot", questId, viewerId] as const,
};
