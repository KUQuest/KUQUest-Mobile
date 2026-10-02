import { QuestNextAction, QuestStatus } from "@/domain/questLifecycle";
import { questNextActionLabels, questStatusLabels } from "./questStatusLabels";

test("provides labels for every status and next action", () => {
  for (const locale of ["en", "th"] as const) {
    for (const value of Object.values(QuestStatus))
      expect(questStatusLabels[locale][value]).toBeTruthy();
    for (const value of Object.values(QuestNextAction))
      expect(questNextActionLabels[locale][value]).toBeTruthy();
  }
});
