import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

import ProfileScreen from '../ProfileScreen';
import { loadProfileViewData } from '../loadProfileViewData';
import { NavigationVisibilityProvider } from '../../../components/navigation/NavigationVisibilityContext';

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

  it('shows the page skeleton until profile data settles', async () => {
    let resolveProfile!: (value: typeof profileData) => void;
    mockedLoadProfileViewData.mockReturnValueOnce(new Promise<typeof profileData>((resolve) => {
      resolveProfile = resolve;
    }));

    const view = await render(<ProfileScreen />);

    expect(view.getByLabelText('Loading profile...')).toBeTruthy();
    expect(view.queryByTestId('profile-header')).toBeNull();

    resolveProfile(profileData);
    await waitFor(() => expect(view.getByTestId('profile-header')).toBeTruthy());
  });

  it('opens About by default and switches to the selected profile section', async () => {
    const view = await render(<ProfileScreen />);

    await waitFor(() => expect(view.getByTestId('profile-tab-about')).toBeTruthy());
    expect(view.queryByText('Student Profile')).toBeNull();
    expect(view.getByText('Profile')).toBeTruthy();
    expect(view.getByTestId('open-settings')).toBeTruthy();
    expect(view.getByText('Profile Rating')).toBeTruthy();
    expect(view.getByTestId('profile-stats')).toBeTruthy();
    expect(view.getByText('Most frequent Quest categories')).toBeTruthy();
    expect(view.getByTestId('profile-content-scroll').props.stickyHeaderIndices).toBeUndefined();
    expect(view.getByText('A profile description')).toBeTruthy();
    expect(view.queryByText('Advanced React Patterns')).toBeNull();

    await fireEvent.press(view.getByTestId('profile-tab-portfolio'));

    await waitFor(() => expect(view.getByText('Advanced React Patterns')).toBeTruthy());
    expect(view.getByText('View certificate preview')).toBeTruthy();
    expect(view.getByText('Frontend Masters')).toBeTruthy();
    expect(view.queryByText('A profile description')).toBeNull();
    expect(view.getByTestId('profile-tab-portfolio').props.accessibilityState).toEqual({ selected: true });
    expect(view.getByTestId('profile-section-Experience').props.style).toEqual(expect.objectContaining({ marginBottom: 8 }));
    expect(view.getByTestId('profile-section-Portfolio Work').props.style).toEqual(expect.objectContaining({ marginBottom: 8 }));
    expect(view.queryByTestId('profile-tab-experience')).toBeNull();
    expect(view.queryByTestId('profile-tab-works')).toBeNull();
    expect(view.queryByTestId('profile-tab-certificates')).toBeNull();

    await fireEvent.press(view.getByTestId('profile-tab-reviews'));
    await waitFor(() => expect(view.getByTestId('profile-reviews-list')).toBeTruthy());
    expect(view.getByTestId('profile-review-summary')).toBeTruthy();
    expect(view.getByTestId('profile-reviews-list').props.stickyHeaderIndices).toEqual([]);
  });

  it('preserves the profile scroll position when opening Reviews', async () => {
    const view = await render(<ProfileScreen />);

    await waitFor(() => expect(view.getByTestId('profile-tab-about')).toBeTruthy());
    await fireEvent.scroll(view.getByTestId('profile-content-scroll'), { nativeEvent: { contentOffset: { x: 0, y: 180 } } });
    await fireEvent.press(view.getByTestId('profile-tab-reviews'));

    await waitFor(() => expect(view.getByTestId('profile-reviews-list')).toBeTruthy());
    expect(view.getByTestId('profile-reviews-list').props.contentOffset).toEqual({ x: 0, y: 180 });
    expect(view.getByTestId('profile-reviews-list').props.contentContainerStyle).toEqual(expect.objectContaining({ paddingTop: 16 }));
    expect(view.getByTestId('profile-section-Reviews').props.style).toEqual(expect.objectContaining({ marginTop: 16 }));
  });

  it('offers a Settings recovery action when About is empty', async () => {
    mockedLoadProfileViewData.mockResolvedValue({ ...profileData, about: '' });

    const view = await render(<ProfileScreen />);

    await waitFor(() => expect(view.getByTestId('profile-tab-about')).toBeTruthy());
    expect(view.getByText('Manage in Settings')).toBeTruthy();
  });

  it('hides the transparent profile top bar with navigation while scrolling down', async () => {
    const view = await render(
      <NavigationVisibilityProvider>
        <ProfileScreen />
      </NavigationVisibilityProvider>,
    );

    await waitFor(() => expect(view.getByTestId('profile-content-scroll')).toBeTruthy());
    const scrollView = view.getByTestId('profile-content-scroll');
    const getTopBar = () => view.getByTestId('profile-top-bar', { includeHiddenElements: true });

    await fireEvent.scroll(scrollView, { nativeEvent: { contentOffset: { x: 0, y: 0 } } });
    await fireEvent.scroll(scrollView, { nativeEvent: { contentOffset: { x: 0, y: 12 } } });

    await waitFor(() => expect(getTopBar().props.pointerEvents).toBe('none'));
    expect(getTopBar().props.accessibilityElementsHidden).toBe(true);

    await fireEvent.scroll(scrollView, { nativeEvent: { contentOffset: { x: 0, y: 0 } } });
    await waitFor(() => expect(getTopBar().props.pointerEvents).toBe('box-none'));
  });

});
