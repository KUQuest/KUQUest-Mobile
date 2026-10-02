import type { Step } from "../createQuestTypes";

export type CreateQuestFlowMode =
  | { kind: "new" }
  | { kind: "local-draft"; draftId: string }
  | { kind: "server-edit"; questId?: string };

export function resolveCreateQuestFlowMode({
  editMode = false,
  editQuestId,
}: {
  editMode?: boolean;
  editQuestId?: string;
}): CreateQuestFlowMode {
  if (editMode) return { kind: "server-edit", questId: editQuestId };
  if (editQuestId) return { kind: "local-draft", draftId: editQuestId };
  return { kind: "new" };
}

export function getInitialCreateQuestStep(mode: CreateQuestFlowMode): Step {
  return mode.kind === "local-draft" ? 2 : 1;
}

export function getNextCreateQuestStep(step: Step): Step | null {
  return step < 3 ? ((step + 1) as Step) : null;
}

export function getPreviousCreateQuestStep(step: Step): Step | null {
  return step > 1 ? ((step - 1) as Step) : null;
}

export function canNavigateToCreateQuestStep(
  currentStep: Step,
  targetStep: Step
): boolean {
  return targetStep < currentStep;
}

export function isServerEditMode(
  mode: CreateQuestFlowMode
): mode is Extract<CreateQuestFlowMode, { kind: "server-edit" }> {
  return mode.kind === "server-edit";
}
