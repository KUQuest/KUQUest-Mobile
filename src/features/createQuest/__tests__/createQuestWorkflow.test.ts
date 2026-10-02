import { createQuestMessages } from "@/locales/createQuestMessages";
import {
  canNavigateToCreateQuestStep,
  getInitialCreateQuestStep,
  getNextCreateQuestStep,
  getPreviousCreateQuestStep,
  isServerEditMode,
  resolveCreateQuestFlowMode,
} from "../workflow/createQuestWorkflow";

describe("Create Quest workflow boundaries", () => {
  it("keeps local draft ids separate from server edit ids", () => {
    expect(resolveCreateQuestFlowMode({})).toEqual({ kind: "new" });
    expect(
      resolveCreateQuestFlowMode({ editQuestId: "local-draft-1" })
    ).toEqual({ kind: "local-draft", draftId: "local-draft-1" });
    expect(
      resolveCreateQuestFlowMode({ editMode: true, editQuestId: "quest-1" })
    ).toEqual({ kind: "server-edit", questId: "quest-1" });
    expect(isServerEditMode({ kind: "server-edit", questId: "quest-1" })).toBe(
      true
    );
  });

  it("starts local drafts in team setup and bounds wizard transitions", () => {
    expect(getInitialCreateQuestStep({ kind: "new" })).toBe(1);
    expect(
      getInitialCreateQuestStep({ kind: "local-draft", draftId: "draft-1" })
    ).toBe(2);
    expect(
      getInitialCreateQuestStep({ kind: "server-edit", questId: "quest-1" })
    ).toBe(1);

    expect(getNextCreateQuestStep(1)).toBe(2);
    expect(getNextCreateQuestStep(2)).toBe(3);
    expect(getNextCreateQuestStep(3)).toBeNull();
    expect(getPreviousCreateQuestStep(1)).toBeNull();
    expect(getPreviousCreateQuestStep(2)).toBe(1);
    expect(getPreviousCreateQuestStep(3)).toBe(2);
    expect(canNavigateToCreateQuestStep(3, 2)).toBe(true);
    expect(canNavigateToCreateQuestStep(2, 3)).toBe(false);
  });
  it("provides localized error messages for open quest edit constraints", () => {
    for (const locale of ["en", "th"] as const) {
      const messages = createQuestMessages[locale];
      expect(messages.apiErrors.QUEST_OPEN_FIELD_LOCKED).toBeDefined();
      expect(messages.apiErrors.QUEST_OPEN_EDIT_CLOSED).toBeDefined();
      expect(messages.apiErrors.INVALID_OPEN_QUEST).toBeDefined();
    }
  });
});
