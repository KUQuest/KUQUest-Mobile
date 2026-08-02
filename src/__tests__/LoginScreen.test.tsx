import React from 'react';
import { render, fireEvent, screen, waitFor } from '@testing-library/react-native';
import LoginScreen from '../app/LoginScreen';
import { AuthService } from '../auth/AuthService';
import { authMessages } from '../locales/authMessages';

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

  test('2. Can toggle language between Thai and English', async () => {
    await render(<LoginScreen authAdapter={mockAuth} locale="th" />);

    expect(screen.getByText(authMessages.th.signUpWithGoogle)).toBeTruthy();

    const langButton = screen.getByTestId('language-switcher');
    await fireEvent.press(langButton);

    expect(screen.getByText(authMessages.en.signUpWithGoogle)).toBeTruthy();
    expect(screen.getByText(authMessages.en.signInWithGoogle)).toBeTruthy();
  });

  test('3. Clicking Sign Up with Google for registered student routes to HOME destination', async () => {
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

  test('4. Clicking Sign In with Google for unregistered @ku.th email shows error banner and Retry button in Thai', async () => {
    const onNavigate = jest.fn();
    await render(
      <LoginScreen
        authAdapter={mockAuth}
        onNavigate={onNavigate}
        mockCredentialForTesting="unregistered@ku.th"
        locale="th"
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

  test('5. Non @ku.th email domain rejection shows INVALID_EMAIL_DOMAIN message without navigating', async () => {
    const onNavigate = jest.fn();
    await render(
      <LoginScreen
        authAdapter={mockAuth}
        onNavigate={onNavigate}
        mockCredentialForTesting="outsider@gmail.com"
        locale="en"
      />
    );

    const signInButton = screen.getByTestId('signin-button');
    await fireEvent.press(signInButton);

    await waitFor(() => {
      expect(screen.getByTestId('error-banner')).toBeTruthy();
      expect(screen.getByTestId('error-message').props.children).toBe(
        authMessages.en.errors.INVALID_EMAIL_DOMAIN
      );
    });
  });

  test('6. Pressing Retry button re-attempts the authentication flow', async () => {
    const onNavigate = jest.fn();
    await render(
      <LoginScreen
        authAdapter={mockAuth}
        onNavigate={onNavigate}
        mockCredentialForTesting="unregistered@ku.th"
        locale="th"
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
