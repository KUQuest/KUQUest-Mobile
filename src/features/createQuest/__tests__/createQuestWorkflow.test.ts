import {
  canNavigateToCreateQuestStep,
  getInitialCreateQuestStep,
  getNextCreateQuestStep,
  getPreviousCreateQuestStep,
  isServerEditMode,
  resolveCreateQuestFlowMode,
} from "../createQuestWorkflow";

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
});
