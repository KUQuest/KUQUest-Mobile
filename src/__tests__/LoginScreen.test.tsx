import React from 'react';
import { render, fireEvent, screen, waitFor } from '@testing-library/react-native';
import LoginScreen from '../features/auth/LoginScreen';
import { AuthService } from '../features/auth/AuthService';
import { authMessages } from '../locales/authMessages';

jest.mock('expo-localization', () => ({
  getLocales: () => [{ languageCode: 'th' }],
}));

describe('LoginScreen UI & FE-19 Acceptance Criteria', () => {
  let mockAuth: AuthService;

  beforeEach(() => {
    mockAuth = new AuthService();
  });

  test('1. Displays separate Sign Up with Google and Sign In with Google buttons in default Thai language', async () => {
    await render(<LoginScreen authAdapter={mockAuth} />);

    expect(screen.getByTestId('signup-button')).toBeTruthy();
    expect(screen.getByTestId('signin-button')).toBeTruthy();

    expect(screen.getByText(authMessages.th.signUpWithGoogle)).toBeTruthy();
    expect(screen.getByText(authMessages.th.signInWithGoogle)).toBeTruthy();
  });

  test('2. Clicking Sign Up with Google for registered student routes to HOME destination', async () => {
    const onNavigate = jest.fn();
    await render(
      <LoginScreen
        authAdapter={mockAuth}
        onNavigate={onNavigate}
        mockCredentialForTesting="student.test@ku.th"
      />
    );

    const signUpButton = screen.getByTestId('signup-button');
    await fireEvent.press(signUpButton);

    await waitFor(() => {
      expect(onNavigate).toHaveBeenCalledWith({ type: 'HOME' });
    });
  });

  test('3. Clicking Sign In with Google for unregistered @ku.th email shows error banner and Retry button in Thai', async () => {
    const onNavigate = jest.fn();
    await render(
      <LoginScreen
        authAdapter={mockAuth}
        onNavigate={onNavigate}
        mockCredentialForTesting="unregistered@ku.th"
      />
    );

    const signInButton = screen.getByTestId('signin-button');
    await fireEvent.press(signInButton);

    await waitFor(() => {
      expect(screen.getByTestId('error-banner')).toBeTruthy();
      expect(screen.getByTestId('error-message').props.children).toBe(
        authMessages.th.errors.ACCOUNT_NOT_FOUND
      );
      expect(screen.getByTestId('retry-button')).toBeTruthy();
      expect(onNavigate).not.toHaveBeenCalled();
    });
  });

  test('4. Non @ku.th email domain rejection shows INVALID_EMAIL_DOMAIN message without navigating', async () => {
    const onNavigate = jest.fn();
    await render(
      <LoginScreen
        authAdapter={mockAuth}
        onNavigate={onNavigate}
        mockCredentialForTesting="outsider@gmail.com"
      />
    );

    const signInButton = screen.getByTestId('signin-button');
    await fireEvent.press(signInButton);

    await waitFor(() => {
      expect(screen.getByTestId('error-banner')).toBeTruthy();
      expect(screen.getByTestId('error-message').props.children).toBe(
        authMessages.th.errors.INVALID_EMAIL_DOMAIN
      );
    });
  });

  test('5. Pressing Retry button re-attempts the authentication flow', async () => {
    const onNavigate = jest.fn();
    await render(
      <LoginScreen
        authAdapter={mockAuth}
        onNavigate={onNavigate}
        mockCredentialForTesting="unregistered@ku.th"
      />
    );

    // Initial signin -> fails with ACCOUNT_NOT_FOUND
    await fireEvent.press(screen.getByTestId('signin-button'));
    await waitFor(() => {
      expect(screen.getByTestId('error-banner')).toBeTruthy();
    });

    // Register the user before clicking Retry
    mockAuth.registerMockAccount({
      id: 'usr_retry',
      email: 'unregistered@ku.th',
      name: 'Retry Student',
      onboardingStatus: 'COMPLETED',
    });

    const retryBtn = screen.getByTestId('retry-button');
    await fireEvent.press(retryBtn);

    await waitFor(() => {
      expect(onNavigate).toHaveBeenCalledWith({ type: 'HOME' });
    });
  });
});
