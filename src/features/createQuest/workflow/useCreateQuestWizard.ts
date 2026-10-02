import { useCallback, useState } from "react";
import type { Dispatch, SetStateAction } from "react";

import {
  canNavigateToCreateQuestStep,
  getInitialCreateQuestStep,
  getNextCreateQuestStep,
  getPreviousCreateQuestStep,
  type CreateQuestFlowMode,
} from "./createQuestWorkflow";
import type { CompletionState, Step } from "../createQuestTypes";

export function useCreateQuestWizard({ initialStep }: { initialStep: Step }) {
  const [step, setStep] = useState<Step>(initialStep);
  const [completedState, setCompletedState] = useState<CompletionState | null>(
    null
  );
  const [logisticsExpanded, setLogisticsExpanded] = useState(false);
  const [pendingInvalidField, setPendingInvalidField] = useState<string | null>(
    null
  );

  const advance = useCallback(() => {
    const nextStep = getNextCreateQuestStep(step);
    if (!nextStep) return false;
    setStep(nextStep);
    return true;
  }, [step]);

  const retreat = useCallback(() => {
    const previousStep = getPreviousCreateQuestStep(step);
    if (!previousStep) return false;
    setStep(previousStep);
    return true;
  }, [step]);

  const selectPreviousStep = useCallback(
    (targetStep: Step) => {
      if (!canNavigateToCreateQuestStep(step, targetStep)) return false;
      setPendingInvalidField(null);
      setStep(targetStep);
      return true;
    },
    [step]
  );

  const resetWizard = useCallback((mode: CreateQuestFlowMode) => {
    setStep(getInitialCreateQuestStep(mode));
    setCompletedState(null);
    setLogisticsExpanded(false);
    setPendingInvalidField(null);
  }, []);

  return {
    step,
    setStep: setStep as Dispatch<SetStateAction<Step>>,
    completedState,
    setCompletedState: setCompletedState as Dispatch<
      SetStateAction<CompletionState | null>
    >,
    logisticsExpanded,
    setLogisticsExpanded,
    pendingInvalidField,
    setPendingInvalidField,
    advance,
    retreat,
    selectPreviousStep,
    resetWizard,
  };
}
