import type {
  QuestV2CandidateApplication,
  QuestV2ProofSubmission,
} from "@/api/questV2Contracts";
import { isTerminalStatus } from "@/domain/questLifecycle";
import {
  QuestApplicationStatus,
  QuestAssignmentStatus,
  QuestMode,
  QuestNextAction,
  QuestParticipation,
  QuestProofStatus,
  QuestStatus,
  QuestTeamStatus,
} from "@/features/questBoard/domain/types";
import type { LiveQuestSnapshot } from "@/features/questBoard/live/liveQuestTypes";
import type { WorkerWorkItem, WorkerWorkProjection } from "./workerWorkTypes";

export type {
  WorkerWorkTone,
  WorkerWorkItem,
  WorkerWorkProjection,
} from "./workerWorkTypes";

function proofOwnership(snapshot: LiveQuestSnapshot, viewerId: string) {
  const teamId =
    snapshot.mode === QuestMode.CANDIDATE &&
    snapshot.participation === QuestParticipation.GROUP
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
    case QuestNextAction.CONSENT_UNDERFILLED:
      return {
        status: "consentUnderfilled",
        tone: "action",
        action: "consentUnderfilled",
        needsAction: true,
      };
    default:
      break;
  }
  if (snapshot.state !== QuestStatus.QUEST_IN_PROGRESS) {
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
      sentProof?.status === QuestProofStatus.PROOF_PENDING
        ? "proofPending"
        : "inProgress",
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
    assignmentState === QuestAssignmentStatus.ASSIGNMENT_COMPLETED ||
    (!assignmentState && snapshot.state === QuestStatus.QUEST_COMPLETED)
  ) {
    return { status: "completed", tone: "success" };
  }
  if (assignmentState === QuestAssignmentStatus.ASSIGNMENT_INCOMPLETE) {
    return { status: "incomplete", tone: "danger" };
  }
  if (snapshot.state === QuestStatus.QUEST_FAILED) {
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
    destination: "workHub",
    ...status,
  };
}

function compareDueAsc(a: WorkerWorkItem, b: WorkerWorkItem): number {
  const aKey = a.dueAt ?? a.startTime;
  const bKey = b.dueAt ?? b.startTime;
  return aKey.localeCompare(bKey);
}

function candidateApplicationItem(
  application: QuestV2CandidateApplication
): WorkerWorkItem {
  const { quest } = application;
  const selected =
    application.state === QuestApplicationStatus.APPLICATION_SELECTED ||
    application.state === QuestTeamStatus.TEAM_SELECTED;
  const base = {
    questId: application.questId,
    title: quest.title,
    questState: quest.state,
    startTime: quest.startTime,
    dueAt: quest.dueAt,
    action: "open" as const,
    needsAction: false,
    destination: selected ? ("workHub" as const) : ("questDetail" as const),
  };
  switch (application.state) {
    case QuestApplicationStatus.APPLICATION_APPLIED:
    case QuestTeamStatus.TEAM_SUBMITTED:
      return {
        ...base,
        status:
          quest.state === QuestStatus.QUEST_OPEN
            ? "pendingSelection"
            : "notSelected",
        tone: quest.state === QuestStatus.QUEST_OPEN ? "progress" : "neutral",
      };
    case QuestTeamStatus.TEAM_FORMING:
      return { ...base, status: "teamForming", tone: "progress" };
    case QuestApplicationStatus.APPLICATION_SELECTED:
    case QuestTeamStatus.TEAM_SELECTED:
      return { ...base, status: "selected", tone: "success" };
    case QuestApplicationStatus.APPLICATION_REJECTED:
    case QuestTeamStatus.TEAM_REJECTED:
      return { ...base, status: "rejected", tone: "danger" };
    case QuestApplicationStatus.APPLICATION_WITHDRAWN:
    case QuestTeamStatus.TEAM_DISBANDED:
      return { ...base, status: "withdrawn", tone: "neutral" };
  }
}

/**
 * Projects Worker Assignments and Candidate applications into Work Management
 * without representing an application as an Assignment.
 */
export function projectWorkerWork(
  snapshots: readonly LiveQuestSnapshot[],
  applications: readonly QuestV2CandidateApplication[] = []
): WorkerWorkProjection {
  const needsAction: WorkerWorkItem[] = [];
  const otherActive: WorkerWorkItem[] = [];
  const history: WorkerWorkItem[] = [];
  const seenQuestIds = new Set(snapshots.map((snapshot) => snapshot.quest.id));

  // Assignment-backed snapshots take precedence over application records.
  for (const snapshot of snapshots) {
    const isActive =
      snapshot.assignment?.state === QuestAssignmentStatus.ASSIGNMENT_ACTIVE &&
      !isTerminalStatus(snapshot.state);
    if (isActive) {
      const item = toItem(snapshot, activeStatus(snapshot));
      (item.needsAction ? needsAction : otherActive).push(item);
    } else if (snapshot.assignment || isTerminalStatus(snapshot.state)) {
      history.push(toItem(snapshot, historyStatus(snapshot)));
    }
  }
  for (const application of applications) {
    if (seenQuestIds.has(application.questId)) continue;
    seenQuestIds.add(application.questId);
    const item = candidateApplicationItem(application);
    if (
      item.status === "rejected" ||
      item.status === "withdrawn" ||
      item.status === "notSelected"
    ) {
      history.push(item);
    } else {
      otherActive.push(item);
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
