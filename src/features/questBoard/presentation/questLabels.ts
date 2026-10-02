import { isTerminalStatus } from "@/domain/questLifecycle";
import {
  questNextActionLabels,
  questStatusLabels,
} from "@/locales/questStatusLabels";
import type { SupportedLocale } from "@/locales/locale";
import type { QuestWorkMessages } from "@/locales/questWorkMessages";
import {
  QuestAssignmentStatus,
  QuestNextAction,
  QuestStatus,
} from "../domain/types";
import type { LiveQuestSnapshot } from "../live/liveQuestTypes";

export function nextActionLabel(
  action: QuestNextAction,
  messages: QuestWorkMessages,
  locale: SupportedLocale
): string {
  const overrides: Partial<Record<QuestNextAction, string>> = {
    [QuestNextAction.WAIT_FOR_START]: messages.waitingForStart,
    [QuestNextAction.SUBMIT_PROOF]: messages.proofCta,
    [QuestNextAction.CONFIRM_COMPLETION]: messages.confirmationCta,
    [QuestNextAction.RESPOND_TO_EDIT]: messages.editTitle,
  };
  return overrides[action] ?? questNextActionLabels[locale][action];
}

export function workStatusLabel(
  state: QuestStatus,
  messages: QuestWorkMessages,
  locale: SupportedLocale
): string {
  if (state === QuestStatus.QUEST_ASSIGNED) return messages.assigned;
  if (state === QuestStatus.QUEST_IN_PROGRESS) return messages.inProgress;
  if (isTerminalStatus(state)) return messages.terminal;
  return questStatusLabels[locale][state];
}

const assignmentStateLabels: Record<
  SupportedLocale,
  Record<QuestAssignmentStatus, string>
> = {
  en: {
    [QuestAssignmentStatus.ASSIGNMENT_ACTIVE]: "Active",
    [QuestAssignmentStatus.ASSIGNMENT_COMPLETED]: "Completed",
    [QuestAssignmentStatus.ASSIGNMENT_INCOMPLETE]: "Incomplete",
    [QuestAssignmentStatus.ASSIGNMENT_CANCELLED]: "Cancelled",
  },
  th: {
    [QuestAssignmentStatus.ASSIGNMENT_ACTIVE]: "กำลังปฏิบัติงาน",
    [QuestAssignmentStatus.ASSIGNMENT_COMPLETED]: "เสร็จสิ้น",
    [QuestAssignmentStatus.ASSIGNMENT_INCOMPLETE]: "ไม่สำเร็จ",
    [QuestAssignmentStatus.ASSIGNMENT_CANCELLED]: "ยกเลิกแล้ว",
  },
};

export function assignmentLabel(
  assignment: LiveQuestSnapshot["assignment"],
  locale: SupportedLocale
): string {
  if (!assignment?.state) return "—";
  const state = assignment.state as QuestAssignmentStatus;
  return (
    assignmentStateLabels[locale]?.[state] ??
    questStatusLabels[locale][assignment.state as QuestStatus] ??
    assignment.state
  );
}
