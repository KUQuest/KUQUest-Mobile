import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

import SettingsScreen from '../SettingsScreen';
import { authService } from '../../auth/AuthService';

const mockBack = jest.fn();
const mockReplace = jest.fn();
const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ back: mockBack, push: mockPush, replace: mockReplace }),
}));

jest.mock('../../auth/AuthService', () => ({
  authService: { signOut: jest.fn().mockResolvedValue(undefined) },
}));

jest.mock('../../../locales/LocaleProvider', () => ({
  useLocale: () => ({ locale: 'en' }),
}));

describe('Settings screen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.EXPO_PUBLIC_PROFILE_DEMO;
  });

  it('renders grouped account, preference, support, and about content', async () => {
    const view = await render(<SettingsScreen />);

    expect(view.getByRole('header', { name: 'Settings' })).toBeTruthy();
    expect(view.getByText('Account')).toBeTruthy();
    expect(view.getByText('Preferences')).toBeTruthy();
    expect(view.getByText('Support')).toBeTruthy();
    expect(view.getByText('Version 1.0.0')).toBeTruthy();
    expect(view.getByText('Edit Profile')).toBeTruthy();
    expect(view.getByTestId('settings-notifications')).toBeTruthy();
    expect(view.getByTestId('settings-scroll').props.contentContainerStyle?.paddingBottom).toBeGreaterThanOrEqual(24);
    expect(view.getByTestId('settings-content')).toBeTruthy();
  });

  it('renders a red logout button at the bottom and returns to the start screen', async () => {
    const view = await render(<SettingsScreen />);

    fireEvent.press(view.getByTestId('settings-logout'));

    await waitFor(() => {
      expect(authService.signOut).toHaveBeenCalledTimes(1);
      expect(mockReplace).toHaveBeenCalledWith('/');
    });
  });

  it('renders a red logout button at the bottom and returns to the start screen', async () => {
    const view = await render(<SettingsScreen />);

    fireEvent.press(view.getByTestId('settings-logout'));

    await waitFor(() => {
      expect(authService.signOut).toHaveBeenCalledTimes(1);
      expect(mockReplace).toHaveBeenCalledWith('/');
    });
  });

  it('toggles quest notifications', async () => {
    const view = await render(<SettingsScreen />);
    const toggle = view.getByTestId('settings-notifications');

    expect(toggle.props.accessibilityState.checked).toBe(true);
    fireEvent.press(toggle);
    await waitFor(() => expect(view.getByTestId('settings-notifications').props.accessibilityState.checked).toBe(false));
  });

  it('switches account from settings', async () => {
    const view = await render(<SettingsScreen />);

    fireEvent.press(view.getByTestId('settings-switch-account'));

    await waitFor(() => {
      expect(authService.signOut).toHaveBeenCalledTimes(1);
      expect(mockReplace).toHaveBeenCalledWith('/');
    });
  });

  it('revokes the session before returning to the dev overlay', async () => {
    process.env.EXPO_PUBLIC_PROFILE_DEMO = 'true';
    const view = await render(<SettingsScreen />);

    fireEvent.press(view.getByTestId('settings-dev-overlay'));

    await waitFor(() => {
      expect(authService.signOut).toHaveBeenCalledTimes(1);
      expect(mockReplace).toHaveBeenCalledWith('/');
    });
  });

  it('opens Edit Profile from settings', async () => {
    const view = await render(<SettingsScreen />);

    fireEvent.press(view.getByTestId('settings-edit-profile'));

    expect(mockPush).toHaveBeenCalledWith('/profile/edit');
  });
});
