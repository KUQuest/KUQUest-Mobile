import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

import ProfileScreen from '../ProfileScreen';
import { loadProfileViewData } from '../loadProfileViewData';

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
  useFocusEffect: (effect: () => (() => void) | void) => jest.requireActual('react').useEffect(effect, []),
}));

jest.mock('../../auth/AuthService', () => ({
  authService: { signOut: jest.fn() },
}));

jest.mock('../../../locales/LocaleProvider', () => ({
  useLocale: () => ({ locale: 'en' }),
}));

jest.mock('../loadProfileViewData', () => ({
  loadProfileViewData: jest.fn(),
}));

const mockedLoadProfileViewData = loadProfileViewData as jest.MockedFunction<typeof loadProfileViewData>;

const profileData = {
  name: 'Siraphat THAPPHA',
  faculty: 'Engineering',
  university: '',
  occupation: 'Student',
  academicYear: '',
  department: 'Software and Knowledge Engineering',
  tags: [{ id: 'web', name: 'Web Dev' }],
  profileImage: '',
  about: 'A profile description',
  stats: { totalQuests: 42, ratingAverage: 4.9, ratingCount: 15, distribution: { 5: 12, 4: 2, 3: 1, 2: 0, 1: 0 } },
  experiences: [],
  certificates: [{ id: 'certificate', title: 'Advanced React Patterns', issuer: 'Frontend Masters', issuedYear: '2023', link: 'https://example.test/certificate.png' }],
  works: [],
  reviews: [],
  sectionErrors: {},
};

describe('Student Profile screen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedLoadProfileViewData.mockResolvedValue(profileData);
  });

  it('opens About by default and switches to the selected profile section', async () => {
    const view = await render(<ProfileScreen />);

    await waitFor(() => expect(view.getByTestId('profile-tab-about')).toBeTruthy());
    expect(view.getByText('A profile description')).toBeTruthy();
    expect(view.queryByText('Advanced React Patterns')).toBeNull();

    fireEvent.press(view.getByTestId('profile-tab-certificates'));

    await waitFor(() => expect(view.getByText('Advanced React Patterns')).toBeTruthy());
    expect(view.getByText('Frontend Masters')).toBeTruthy();
    expect(view.queryByText('A profile description')).toBeNull();
    expect(view.getByTestId('profile-tab-certificates').props.accessibilityState).toEqual({ selected: true });
  });
});
