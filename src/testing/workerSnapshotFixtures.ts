import type { QuestV2DisputeWindow } from "@/api/questV2Contracts";
import type { LiveQuestSnapshot } from "@/features/questBoard/live/liveQuestService";

type SnapshotOverrides = Partial<
  Omit<LiveQuestSnapshot, "quest" | "assignment" | "capabilities">
> & {
  id: string;
  title: string;
  assignmentState?: NonNullable<LiveQuestSnapshot["assignment"]>["state"];
  capabilities?: Partial<LiveQuestSnapshot["capabilities"]>;
  workConversationId?: string;
  startTime?: string;
  dispute?: QuestV2DisputeWindow | null;
};

/** Builds a Worker-actor live Quest snapshot for Work Management tests. */
export function workerSnapshot({
  id,
  title,
  assignmentState = "ASSIGNMENT_ACTIVE",
  capabilities = {},
  workConversationId,
  state = "QUEST_IN_PROGRESS",
  dueAt = "2026-10-01T12:00:00Z",
  startTime = "2026-10-01T09:00:00Z",
  dispute,
  ...overrides
}: SnapshotOverrides): LiveQuestSnapshot {
  return {
    viewerId: "worker-1",
    actor: "WORKER",
    mode: "FIRST_COME_FIRST_SERVED",
    participation: "SINGLE",
    state,
    quest: {
      id,
      title,
      description: null,
      condition: { items: [] },
      tag: { id: "tag-1", name: "Campus" },
      mode: "FIRST_COME_FIRST_SERVED",
      participation: "SINGLE",
      state,
      questReward: 250,
      headcount: 1,
      activeWorkerCount: 1,
      startTime,
      dueAt,
      ...(dispute === undefined ? {} : { dispute }),
      proofRequired: true,
      hirerName: "Ploy",
      locations: [],
      images: [],
    },
    assignment: {
      questId: id,
      workerId: "worker-1",
      state: assignmentState,
      questState: state,
      startedAt: null,
    },
    assignments: [],
    application: null,
    applications: [],
    team: null,
    teamRole: null,
    teams: [],
    underfilled: null,
    editRequest: null,
    proofs: [],
    workConversation: workConversationId
      ? ({ id: workConversationId } as LiveQuestSnapshot["workConversation"])
      : null,
    proofRequired: true,
    dueAt,
    nextAction: "NONE",
    capabilities: {
      canReadWorkChat: Boolean(workConversationId),
      canSubmitProof: false,
      canStartWork: false,
      canConfirmCompletion: false,
      ...capabilities,
    } as LiveQuestSnapshot["capabilities"],
    ...overrides,
  };
}
