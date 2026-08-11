import { onboardingMessages } from '../locales/registrationOnboarding';
import { createEmptyProfile } from '../features/profile/types';
import { validateProfileBasics, validateProfileDetails } from '../features/onboarding/validation';

const messages = onboardingMessages.en;

function createValidProfile() {
  return {
    ...createEmptyProfile(),
    name: 'Test Student',
    telephone: '0812345678',
    occupation: 'Student',
    studentId: '6712345678',
    faculty: 'Engineering',
    department: 'Software Engineering',
    acceptedTerms: true,
  };
}

describe('onboarding validation', () => {
  test('accepts a complete first step', () => {
    expect(validateProfileBasics(createValidProfile(), false, messages, true)).toEqual({});
  });

  test('rejects telephone values that do not match the backend contract', () => {
    const errors = validateProfileBasics({ ...createValidProfile(), telephone: '812345678' }, false, messages, true);
    expect(errors).toEqual({ telephone: messages.invalidTelephone });
  });

  test('requires a student ID and terms acceptance for a new student', () => {
    const errors = validateProfileBasics({ ...createValidProfile(), studentId: '', acceptedTerms: false }, false, messages, true);
    expect(errors).toEqual({ studentId: messages.requiredField, acceptedTerms: messages.requiredField });
  });

  test('validates started certificate and portfolio rows against API fields', () => {
    const errors = validateProfileDetails({
      certificates: [{ name: '', issuer: 'KU', issuedAt: '2024/01/01', imageUri: '' }],
      works: [{ imageUri: '', title: 'A project', detail: '' }],
    }, messages);

    expect(errors).toEqual({
      cert_0_name: messages.requiredField,
      cert_0_issuedAt: messages.invalidDate,
      work_0_imageUri: messages.requiredField,
    });
  });
});
