import type { OnboardingStep } from '../auth/types';

export function parseOnboardingStep(value: string | string[] | undefined): OnboardingStep {
  const step = Array.isArray(value) ? value[0] : value;
  if (step === '2') return 2;
  if (step === '3') return 3;
  return 1;
}
