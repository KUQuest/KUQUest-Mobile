import { useCallback, useState } from "react";

import type { OnboardingStep } from "../auth/types";

export function useOnboardingWizard(initialStep: OnboardingStep) {
  const [currentStep, setCurrentStep] = useState(initialStep);

  const advance = useCallback(() => {
    if (currentStep === 3) return false;
    setCurrentStep((step) => (step === 1 ? 2 : 3));
    return true;
  }, [currentStep]);

  const goBack = useCallback(() => {
    if (currentStep === 1) return false;
    setCurrentStep((step) => (step === 3 ? 2 : 1));
    return true;
  }, [currentStep]);

  return { currentStep, advance, goBack };
}
