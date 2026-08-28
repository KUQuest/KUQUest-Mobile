import { fireEvent, render, waitFor } from '@testing-library/react-native';

import AuthGate from '../AuthGate';
import { resetOfflinePrototypeDemo } from '../demoMode';

const mockReplace = jest.fn();
const mockGetSession = jest.fn();
const mockGetRoutingDestination = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

jest.mock('../AuthService', () => ({
  authService: {
    getSession: mockGetSession,
    getRoutingDestination: mockGetRoutingDestination,
  },
  isAuthNetworkError: (error: unknown) => Boolean(error && typeof error === 'object' && 'message' in error && /network request failed/i.test(String(error.message))),
}));

jest.mock('../LoginScreen', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('../../../locales/LocaleProvider', () => ({
  useLocale: () => ({ locale: 'en' }),
}));

describe('AuthGate offline prototype fallback', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.EXPO_PUBLIC_PROFILE_DEMO;
    resetOfflinePrototypeDemo();
  });

  it('opens the existing demo launch path when session lookup cannot reach the backend', async () => {
    mockGetSession.mockRejectedValueOnce(new TypeError('Network request failed'));

    const view = await render(<AuthGate />);

    await waitFor(() => expect(view.getByText('Developer mode')).toBeTruthy());
    expect(view.queryByRole('alert')).toBeNull();
    expect(mockGetRoutingDestination).not.toHaveBeenCalled();

    fireEvent.press(view.getByTestId('dev-launch-home'));
    expect(mockReplace).toHaveBeenCalledWith('/(tabs)');
  });

  it('keeps the error and retry surface for an HTTP session failure', async () => {
    mockGetSession.mockRejectedValueOnce({ status: 500, message: 'Server error' });

    const view = await render(<AuthGate />);

    await waitFor(() => expect(view.getByRole('alert')).toBeTruthy());
    expect(view.queryByText('Developer mode')).toBeNull();
    expect(view.getByText('Try again')).toBeTruthy();
  });
});
