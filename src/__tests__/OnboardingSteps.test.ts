import { parseOnboardingStep } from '../features/onboarding/steps';
import type { OnboardingStep } from '../features/auth/types';

const cases: [string | string[] | undefined, OnboardingStep][] = [
  [undefined, 1],
  ['invalid', 1],
  ['2', 2],
  [['3'], 3],
];

describe('parseOnboardingStep', () => {
  test.each(cases)('normalizes %p to step %p', (value, expected) => {
    expect(parseOnboardingStep(value)).toBe(expected);
  });
});
