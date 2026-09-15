import {
  createQuestIdempotencyKey,
  questApi,
  type CreateQuestV2Payload,
} from "@/api/QuestApi";
import type {
  QuestV2Assignment,
  QuestV2BoardCard,
  QuestV2CanonicalQuest,
  QuestV2Detail,
  QuestV2CancellationOutcome,
  QuestV2PublishCheck,
} from "@/api/questV2Contracts";
import type { QuestBoardQuest, QuestStatus } from "./types";

function timePart(value: string): string | null {
  const match = value.match(/T(\d{2}:\d{2})/);
  return match?.[1] ?? null;
}

function timeRange(startTime: string, dueAt: string): string | undefined {
  const start = timePart(startTime);
  const end = timePart(dueAt);
  return start && end ? `${start}–${end}` : undefined;
}

export function cardToQuestBoardQuest(card: QuestV2BoardCard): QuestBoardQuest {
  const startDate = card.startTime.slice(0, 10);
  const deadline = card.dueAt.slice(0, 10);
  const rewardSatang = Math.round(card.questReward * 100);

  return {
    id: card.id,
    title: card.title,
    tags: card.tag ? [card.tag.name] : [],
    description: "",
    completionCriteria: "",
    proofRequired: "none",
    rewardPerPerson: card.questReward,
    rewardSatang,
    headcount: card.headcount,
    acceptedParticipants: card.activeWorkerCount,
    startDate,
    deadline,
    timeRange: timeRange(card.startTime, card.dueAt),
    postedAt: card.startTime,
    location: card.location ?? "Online",
    locationDetails: { label: card.location },
    locationMode: card.location === null ? "online" : "on-campus",
    participationMode: card.participation === "GROUP" ? "team" : "single",
    candidateMode: card.mode === "CANDIDATE" ? "CANDIDATE" : "NO_CANDIDATE",
    creator: { name: card.hirerName },
    studentInterestMatch: false,
    ownerStudentId: "",
    status: "QUEST_OPEN",
  };
}
export function canonicalToQuestBoardQuest(
  q: QuestV2CanonicalQuest,
  creatorName = "Me"
): QuestBoardQuest {
  const startDate = q.startTime.slice(0, 10);
  const deadline = q.dueAt ? q.dueAt.slice(0, 10) : startDate;
  const rewardSatang = Math.round(q.questFundingTotal * 100);

  return {
    id: q.id,
    title: q.title,
    tags: q.tag ? [q.tag.name] : [],
    description: q.description || "",
    completionCriteria: q.condition.items.map((item) => item.text).join("\n"),
    proofRequired: q.proofRequired ? "required" : "none",
    rewardPerPerson: q.questFundingTotal,
    rewardSatang,
    headcount: q.headcount,
    acceptedParticipants: 0,
    startDate,
    deadline,
    timeRange: q.dueAt ? timeRange(q.startTime, q.dueAt) : undefined,
    postedAt: q.createdAt || q.startTime,
    location: q.locations[0]?.label ?? "Online",
    locationDetails: { label: q.locations[0]?.label ?? null },
    locationMode: q.locations.length > 0 ? "on-campus" : "online",
    participationMode: q.participation === "GROUP" ? "team" : "single",
    candidateMode: q.mode === "CANDIDATE" ? "CANDIDATE" : "NO_CANDIDATE",
    creator: { name: creatorName },
    imageUris: (q as QuestV2Detail).images?.map((img) => img.url) ?? [],
    studentInterestMatch: false,
    ownerStudentId: "",
    status: q.state as QuestStatus,
  };
}

export class LiveQuestService {
  async listBoardQuests(): Promise<QuestBoardQuest[]> {
    const items: QuestBoardQuest[] = [];
    const seenCursors = new Set<string>();
    let cursor: string | undefined;

    do {
      const result = await questApi.listBoard(
        cursor ? { cursor, limit: 50 } : { limit: 50 }
      );
      items.push(...result.items.map(cardToQuestBoardQuest));
      if (!result.nextCursor || seenCursors.has(result.nextCursor)) break;
      seenCursors.add(result.nextCursor);
      cursor = result.nextCursor;
    } while (cursor);

    return items;
  }

  async listMyHirerQuests(): Promise<QuestBoardQuest[]> {
    const result = await questApi.listMine();
    return result.items.map((q) => canonicalToQuestBoardQuest(q, "Me"));
  }

  async listMyWorkerAssignments(): Promise<QuestV2Assignment[]> {
    return questApi.listMyAssignments();
  }

  async getQuestDetail(questId: string): Promise<QuestBoardQuest> {
    try {
      const detail = await questApi.getDetail(questId);
      return canonicalToQuestBoardQuest(detail);
    } catch {
      const publicDetail = await questApi.getPublicDetail(questId);
      return canonicalToQuestBoardQuest(
        publicDetail as unknown as QuestV2CanonicalQuest
      );
    }
  }

  async getPublishCheck(questId: string): Promise<QuestV2PublishCheck> {
    return questApi.getPublishCheck(questId);
  }
  async createQuest(
    payload: CreateQuestV2Payload,
    idempotencyKey?: string
  ): Promise<QuestV2CanonicalQuest> {
    return questApi.createQuest(payload, idempotencyKey);
  }

  async publishQuest(
    questId: string,
    idempotencyKey?: string
  ): Promise<QuestV2Detail> {
    return questApi.publishQuest(questId, idempotencyKey);
  }

  async createAndPublishQuest(
    payload: CreateQuestV2Payload,
    idempotencyKey?: string
  ): Promise<QuestV2Detail> {
    const created = await this.createQuest(
      payload,
      createQuestIdempotencyKey()
    );
    return this.publishQuest(created.id, idempotencyKey);
  }

  async joinQuest(questId: string): Promise<QuestV2Assignment> {
    return questApi.joinQuest(questId);
  }

  async cancelQuest(questId: string): Promise<QuestV2CancellationOutcome> {
    return questApi.cancelQuest(questId);
  }

  async confirmCompletion(questId: string): Promise<{ completedAt: string }> {
    return questApi.confirmCompletion(questId);
  }
}

export const liveQuestService = new LiveQuestService();
