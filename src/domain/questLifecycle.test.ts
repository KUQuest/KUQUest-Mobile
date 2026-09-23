import {
  isActionableNextAction,
  isTerminalStatus,
  QuestNextAction,
  QuestStatus,
} from "./questLifecycle";

test("classifies every Quest status", () => {
  const terminal = new Set<QuestStatus>([
    QuestStatus.QUEST_COMPLETED,
    QuestStatus.QUEST_CANCELLED,
    QuestStatus.QUEST_FAILED,
  ]);
  for (const status of Object.values(QuestStatus))
    expect(isTerminalStatus(status)).toBe(terminal.has(status));
});

test("only NONE is non-actionable", () => {
  for (const action of Object.values(QuestNextAction))
    expect(isActionableNextAction(action)).toBe(
      action !== QuestNextAction.NONE
    );
});
