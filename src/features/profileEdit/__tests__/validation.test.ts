import { validateBasics, validateCertificate, validateExperience, validatePortfolio } from '../validation';

const messages = {
  required: 'Required',
  invalidDate: 'Invalid date',
  invalidExperienceDates: 'End date must be after start date',
};

describe('Profile edit validation', () => {
  test('requires a full display name', () => {
    expect(validateBasics('Ada', 'Required', 'Full name')).toEqual({ name: 'Full name' });
    expect(validateBasics('Ada Lovelace', 'Required', 'Full name')).toEqual({});
  });

  test('validates an Experience entry and date order', () => {
    expect(validateExperience({ title: '', employmentType: '', organization: '', description: '', startedAt: '2026-02-01', endedAt: '2026-01-01' }, messages)).toEqual({
      title: 'Required',
      employmentType: 'Required',
      endedAt: 'End date must be after start date',
    });
  });

  test('validates Portfolio Work and Certificates', () => {
    expect(validatePortfolio({ title: '', description: '', imageUri: '' }, messages)).toEqual({ title: 'Required' });
    expect(validateCertificate({ name: 'AWS', issuer: '', issuedAt: 'not-a-date', imageUri: '' }, messages)).toEqual({
      issuer: 'Required',
      issuedAt: 'Invalid date',
    });
  });
});
