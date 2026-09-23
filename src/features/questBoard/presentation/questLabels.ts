import { isTerminalStatus } from "@/domain/questLifecycle";
import {
  questNextActionLabels,
  questStatusLabels,
} from "@/locales/questStatusLabels";
import type { SupportedLocale } from "@/locales/locale";
import type { QuestWorkMessages } from "@/locales/questWorkMessages";
import { QuestNextAction, QuestStatus } from "../domain/types";
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

export function assignmentLabel(
  assignment: LiveQuestSnapshot["assignment"],
  locale: SupportedLocale
): string {
  return assignment?.state
    ? (questStatusLabels[locale][assignment.state as QuestStatus] ??
        assignment.state)
    : "—";
}
