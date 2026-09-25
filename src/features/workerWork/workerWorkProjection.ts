import type { QuestV2ProofSubmission } from "@/api/questV2Contracts";
import { isTerminalStatus } from "@/domain/questLifecycle";
import type { LiveQuestSnapshot } from "@/features/questBoard/live/liveQuestTypes";
import type { WorkerWorkItem, WorkerWorkProjection } from "./workerWorkTypes";

export type {
  WorkerWorkTone,
  WorkerWorkItem,
  WorkerWorkProjection,
} from "./workerWorkTypes";

function proofOwnership(snapshot: LiveQuestSnapshot, viewerId: string) {
  const teamId =
    snapshot.mode === "CANDIDATE" && snapshot.participation === "GROUP"
      ? snapshot.team?.id
      : undefined;
  return (proof: QuestV2ProofSubmission) =>
    proof.submittedByUserId === viewerId ||
    proof.workerId === viewerId ||
    (teamId !== undefined && proof.teamId === teamId);
}

/** Latest sent Proof Submission belonging to this Worker's Assignment. */
export function latestSentProof(
  snapshot: LiveQuestSnapshot,
  viewerId: string
): QuestV2ProofSubmission | null {
  const belongsToViewer = proofOwnership(snapshot, viewerId);
  return snapshot.proofs.reduce<QuestV2ProofSubmission | null>(
    (latest, proof) => {
      if (!belongsToViewer(proof) || !proof.submittedAt) return latest;
      if (!latest?.submittedAt) return proof;
      return proof.submittedAt > latest.submittedAt ? proof : latest;
    },
    null
  );
}

/** This Worker's unsent Proof draft, if the server kept one. */
export function unsentProofDraft(
  snapshot: LiveQuestSnapshot,
  viewerId: string
): QuestV2ProofSubmission | null {
  const belongsToViewer = proofOwnership(snapshot, viewerId);
  return (
    snapshot.proofs.find(
      (proof) => belongsToViewer(proof) && !proof.submittedAt
    ) ?? null
  );
}

function activeStatus(
  snapshot: LiveQuestSnapshot
): Pick<WorkerWorkItem, "status" | "tone" | "action" | "needsAction"> {
  switch (snapshot.nextAction) {
    case "RESPOND_TO_EDIT":
      return {
        status: "respondToEdit",
        tone: "action",
        action: "respondToEdit",
        needsAction: true,
      };
    case "SUBMIT_PROOF":
      return {
        status: "submitProof",
        tone: "action",
        action: "submitProof",
        needsAction: true,
      };
    case "CONFIRM_COMPLETION":
      return {
        status: "confirmCompletion",
        tone: "action",
        action: "confirmCompletion",
        needsAction: true,
      };
    case "CONSENT_UNDERFILLED":
      return {
        status: "consentUnderfilled",
        tone: "action",
        action: "consentUnderfilled",
        needsAction: true,
      };
    default:
      break;
  }
  if (snapshot.state !== "QUEST_IN_PROGRESS") {
    return {
      status: "awaitingStart",
      tone: "neutral",
      action: "open",
      needsAction: false,
    };
  }
  const sentProof = latestSentProof(snapshot, snapshot.viewerId);
  return {
    status:
      sentProof?.status === "PROOF_PENDING" ? "proofPending" : "inProgress",
    tone: "progress",
    action: "open",
    needsAction: false,
  };
}

function historyStatus(
  snapshot: LiveQuestSnapshot
): Pick<WorkerWorkItem, "status" | "tone"> {
  const assignmentState = snapshot.assignment?.state;
  if (
    assignmentState === "ASSIGNMENT_COMPLETED" ||
    (!assignmentState && snapshot.state === "QUEST_COMPLETED")
  ) {
    return { status: "completed", tone: "success" };
  }
  if (assignmentState === "ASSIGNMENT_INCOMPLETE") {
    return { status: "incomplete", tone: "danger" };
  }
  if (snapshot.state === "QUEST_FAILED") {
    return { status: "failed", tone: "danger" };
  }
  return { status: "cancelled", tone: "neutral" };
}

function toItem(
  snapshot: LiveQuestSnapshot,
  status: Pick<WorkerWorkItem, "status" | "tone"> &
    Partial<Pick<WorkerWorkItem, "action" | "needsAction">>
): WorkerWorkItem {
  return {
    questId: snapshot.quest.id,
    title: snapshot.quest.title,
    questState: snapshot.state,
    startTime: snapshot.quest.startTime,
    dueAt: snapshot.dueAt,
    action: "open",
    needsAction: false,
    ...status,
  };
}

function compareDueAsc(a: WorkerWorkItem, b: WorkerWorkItem): number {
  const aKey = a.dueAt ?? a.startTime;
  const bKey = b.dueAt ?? b.startTime;
  return aKey.localeCompare(bKey);
}

/**
 * Splits the Worker's Assignment snapshots into the Work Management
 * sections. Active work is an Active Assignment on a non-terminal Quest
 * (an FCFS Quest can still be open while it fills); everything else the
 * Worker took part in is history.
 */
export function projectWorkerWork(
  snapshots: readonly LiveQuestSnapshot[]
): WorkerWorkProjection {
  const needsAction: WorkerWorkItem[] = [];
  const otherActive: WorkerWorkItem[] = [];
  const history: WorkerWorkItem[] = [];

  for (const snapshot of snapshots) {
    const isActive =
      snapshot.assignment?.state === "ASSIGNMENT_ACTIVE" &&
      !isTerminalStatus(snapshot.state);
    if (isActive) {
      const item = toItem(snapshot, activeStatus(snapshot));
      (item.needsAction ? needsAction : otherActive).push(item);
    } else if (snapshot.assignment || isTerminalStatus(snapshot.state)) {
      history.push(toItem(snapshot, historyStatus(snapshot)));
    }
  }

  needsAction.sort(compareDueAsc);
  otherActive.sort(compareDueAsc);
  history.sort((a, b) => compareDueAsc(b, a));

  return {
    needsAction,
    otherActive,
    history,
    activeCount: needsAction.length + otherActive.length,
  };
}
