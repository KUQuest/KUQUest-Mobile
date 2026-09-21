import type { CreateQuestMessages } from "@/locales/createQuestMessages";

import {
  MAX_REWARD_THB,
  validateQuestDraftStep,
  type QuestDraft,
} from "./createQuestModel";
import type { Step } from "./createQuestTypes";

export interface CreateQuestStepValidationResult {
  errors: Record<string, string>;
  firstErrorField: string | null;
  summary: string | null;
}

export function validateCreateQuestStep(
  draft: QuestDraft,
  step: Step,
  now: Date,
  messages: CreateQuestMessages
): CreateQuestStepValidationResult {
  const codeMessages: Record<string, string> = {
    "title:required": messages.titleError,
    "tag:required": messages.questTagError,
    "description:required": messages.descriptionError,
    "conditions:required": messages.completionCriteriaError,
    "startDate:required": messages.startDateError,
    "startDate:startDatePast": messages.startDatePastError,
    "deadline:required": messages.deadlineError,
    "deadline:deadlineOrder": messages.deadlineOrderError,
    "startTime:required": messages.startTimeError,
    "startTime:format": messages.startTimeError,
    "endTime:required": messages.endTimeError,
    "endTime:format": messages.endTimeError,
    "endTime:timeOrder": messages.timeOrderError,
    "location:required": messages.locationError,
    "headcount:required": messages.headcountError,
    "headcount:bounds": messages.headcountError,
    "wage:empty": messages.rewardEmptyError,
    "wage:format": messages.rewardFormatError,
    "wage:bounds": messages.rewardBoundsError(MAX_REWARD_THB),
  };
  const fieldLabels: Record<string, string> = {
    title: messages.titleLabel,
    tag: messages.questTag,
    description: messages.description,
    conditions: messages.completionCriteria,
    startDate: messages.startDate,
    deadline: messages.deadline,
    startTime: messages.startTime,
    endTime: messages.endTime,
    location: messages.location,
    headcount: messages.headcount,
    wage: messages.rewardPerPerson,
  };
  const errors: Record<string, string> = {};

  for (const finding of validateQuestDraftStep(draft, step, now)) {
    errors[finding.field] =
      codeMessages[`${finding.field}:${finding.code}`] ?? messages.saveError;
  }

  const firstErrorField = Object.keys(errors)[0] ?? null;
  return {
    errors,
    firstErrorField,
    summary: firstErrorField
      ? `${fieldLabels[firstErrorField] ?? messages.title}: ${errors[firstErrorField]}`
      : null,
  };
}
