/* The contract exposes named values and matching string-union types. */
/* eslint-disable @typescript-eslint/no-redeclare */

/** Raw Quest lifecycle values returned by the Quest API. */
export const QuestStatus = {
  QUEST_DRAFT: "QUEST_DRAFT",
  QUEST_OPEN: "QUEST_OPEN",
  /** Legacy umbrella value. New adapter state never emits this value. */
  QUEST_AWAITING_CONSENT: "QUEST_AWAITING_CONSENT",
  QUEST_AWAITING_PARTIAL_GROUP_START_CONSENT:
    "QUEST_AWAITING_PARTIAL_GROUP_START_CONSENT",
  QUEST_AWAITING_EDIT_CONSENT: "QUEST_AWAITING_EDIT_CONSENT",
  QUEST_ASSIGNED: "QUEST_ASSIGNED",
  QUEST_IN_PROGRESS: "QUEST_IN_PROGRESS",
  QUEST_SUBMITTED: "QUEST_SUBMITTED",
  QUEST_APPROVED: "QUEST_APPROVED",
  QUEST_REWORK: "QUEST_REWORK",
  QUEST_COMPLETED: "QUEST_COMPLETED",
  QUEST_CANCELLED: "QUEST_CANCELLED",
  QUEST_FAILED: "QUEST_FAILED",
  QUEST_DISPUTED: "QUEST_DISPUTED",
  QUEST_HIDDEN: "QUEST_HIDDEN",
} as const;
export type QuestStatus = (typeof QuestStatus)[keyof typeof QuestStatus];

/** Server-derived next action for the authenticated viewer. */
export const QuestNextAction = {
  NONE: "NONE",
  JOIN: "JOIN",
  APPLY: "APPLY",
  WITHDRAW_APPLICATION: "WITHDRAW_APPLICATION",
  CREATE_TEAM: "CREATE_TEAM",
  JOIN_TEAM: "JOIN_TEAM",
  SUBMIT_TEAM: "SUBMIT_TEAM",
  SELECT_CANDIDATE: "SELECT_CANDIDATE",
  SELECT_TEAM: "SELECT_TEAM",
  DECIDE_UNDERFILLED: "DECIDE_UNDERFILLED",
  CONSENT_UNDERFILLED: "CONSENT_UNDERFILLED",
  RESPOND_TO_EDIT: "RESPOND_TO_EDIT",
  WAIT_FOR_START: "WAIT_FOR_START",
  SUBMIT_PROOF: "SUBMIT_PROOF",
  CONFIRM_COMPLETION: "CONFIRM_COMPLETION",
  REVIEW_PROOF: "REVIEW_PROOF",
  CANCEL: "CANCEL",
  CREATE_REVIEW: "CREATE_REVIEW",
} as const;
export type QuestNextAction =
  (typeof QuestNextAction)[keyof typeof QuestNextAction];

export const TERMINAL_STATUSES: ReadonlySet<QuestStatus> = new Set([
  QuestStatus.QUEST_COMPLETED,
  QuestStatus.QUEST_CANCELLED,
  QuestStatus.QUEST_FAILED,
]);

export function isTerminalStatus(status: QuestStatus | undefined): boolean {
  return status !== undefined && TERMINAL_STATUSES.has(status);
}

export function isActionableNextAction(action: QuestNextAction): boolean {
  return action !== QuestNextAction.NONE;
}
