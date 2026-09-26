import type { LiveQuestSnapshot } from "@/features/questBoard/live/liveQuestService";

type SnapshotOverrides = Partial<
  Omit<LiveQuestSnapshot, "quest" | "assignment" | "capabilities">
> & {
  id: string;
  title: string;
  assignmentState?: NonNullable<LiveQuestSnapshot["assignment"]>["state"];
  capabilities?: Partial<LiveQuestSnapshot["capabilities"]>;
  workConversationId?: string;
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
      startTime: "2026-10-01T09:00:00Z",
      dueAt,
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
