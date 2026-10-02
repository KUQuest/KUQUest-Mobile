import { questWorkMessages } from "@/locales/questWorkMessages";
import { QuestNextAction, QuestStatus } from "../../domain/types";
import { nextActionLabel, workStatusLabel } from "../questLabels";

test("uses work overrides and typed fallthrough labels", () => {
  const messages = questWorkMessages.en;
  expect(nextActionLabel(QuestNextAction.WAIT_FOR_START, messages, "en")).toBe(
    messages.waitingForStart
  );
  expect(nextActionLabel(QuestNextAction.SUBMIT_PROOF, messages, "en")).toBe(
    messages.proofCta
  );
  expect(
    nextActionLabel(QuestNextAction.CONFIRM_COMPLETION, messages, "en")
  ).toBe(messages.confirmationCta);
  expect(nextActionLabel(QuestNextAction.RESPOND_TO_EDIT, messages, "en")).toBe(
    messages.editTitle
  );
  expect(nextActionLabel(QuestNextAction.REVIEW_PROOF, messages, "en")).toBe(
    "Review proof"
  );
  expect(nextActionLabel(QuestNextAction.CREATE_REVIEW, messages, "en")).toBe(
    "Write a review"
  );
});

test("labels work lifecycle states", () => {
  const messages = questWorkMessages.en;
  expect(workStatusLabel(QuestStatus.QUEST_ASSIGNED, messages, "en")).toBe(
    messages.assigned
  );
  expect(workStatusLabel(QuestStatus.QUEST_IN_PROGRESS, messages, "en")).toBe(
    messages.inProgress
  );
  expect(workStatusLabel(QuestStatus.QUEST_COMPLETED, messages, "en")).toBe(
    messages.terminal
  );
});
