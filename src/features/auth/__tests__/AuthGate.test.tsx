import { fireEvent, render, waitFor } from '@testing-library/react-native';

import AuthGate from '../AuthGate';
import { parsePrototypeDeepLink } from '../demoDeepLink';
import { resetOfflinePrototypeDemo } from '../demoMode';

const mockReplace = jest.fn();
const mockRouter = { replace: mockReplace };
const mockGetSession = jest.fn();
const mockGetRoutingDestination = jest.fn();
const mockGetInitialURL = jest.fn();
const mockGetLinkingURL = jest.fn();
const mockAddEventListener = jest.fn();

const devFlag = globalThis as typeof globalThis & { __DEV__?: boolean };
const initialDevFlag = devFlag.__DEV__;

jest.mock('expo-router', () => ({
  useRouter: () => mockRouter,
}));

jest.mock('expo-linking', () => ({
  getInitialURL: (...args: unknown[]) => mockGetInitialURL(...args),
  getLinkingURL: (...args: unknown[]) => mockGetLinkingURL(...args),
  addEventListener: (...args: unknown[]) => mockAddEventListener(...args),
}));

jest.mock('../AuthService', () => ({
  authService: {
    getSession: (...args: unknown[]) => mockGetSession(...args),
    getRoutingDestination: (...args: unknown[]) => mockGetRoutingDestination(...args),
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
  beforeAll(() => {
    devFlag.__DEV__ = true;
  });

  afterAll(() => {
    if (initialDevFlag === undefined) delete devFlag.__DEV__;
    else devFlag.__DEV__ = initialDevFlag;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetInitialURL.mockResolvedValue(null);
    mockGetLinkingURL.mockReturnValue(null);
    mockAddEventListener.mockReturnValue({ remove: jest.fn() });
    delete process.env.EXPO_PUBLIC_PROFILE_DEMO;
    resetOfflinePrototypeDemo();
  });

  it('normalizes both supported scheme URI forms and ignores non-prototype routes', () => {
    expect(parsePrototypeDeepLink('kuquestmobile-debug:///quest/team-forming-demo')).toBe('/quest/team-forming-demo');
    expect(parsePrototypeDeepLink('kuquestmobile-debug://quest/team-forming-demo')).toBe('/quest/team-forming-demo');
    expect(parsePrototypeDeepLink('kuquestmobile-debug:///settings')).toBeUndefined();
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

  it('keeps the initial quest route when the demo gate opens after an offline session lookup', async () => {
    mockGetInitialURL.mockResolvedValueOnce('kuquestmobile-debug:///quest/team-forming-demo');
    mockGetSession.mockRejectedValueOnce(new TypeError('Network request failed'));

    const view = await render(<AuthGate />);

    await waitFor(() => expect(view.getByText('Developer mode')).toBeTruthy());
    fireEvent.press(view.getByTestId('dev-launch-home'));

    expect(mockReplace).toHaveBeenCalledWith('/quest/team-forming-demo');
    expect(mockReplace).not.toHaveBeenCalledWith('/(tabs)');
  });

  it('prefers an authenticated cold deep link over the default routing destination', async () => {
    let resolveInitialUrl: (url: string | null) => void = () => undefined;
    mockGetInitialURL.mockImplementationOnce(() => new Promise<string | null>((resolve) => {
      resolveInitialUrl = resolve;
    }));
    mockGetSession.mockResolvedValueOnce({ user: { id: 'user-1' } });
    mockGetRoutingDestination.mockResolvedValueOnce({ type: 'HOME' });

    render(<AuthGate />);

    await waitFor(() => expect(mockGetInitialURL).toHaveBeenCalledTimes(1));
    expect(mockGetSession).not.toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();

    resolveInitialUrl('kuquestmobile-debug://quest/team-forming-demo');

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/quest/team-forming-demo'));
    expect(mockGetRoutingDestination).not.toHaveBeenCalled();
  });

  it('keeps the error and retry surface for an HTTP session failure', async () => {
    mockGetSession.mockRejectedValueOnce({ status: 500, message: 'Server error' });

    const view = await render(<AuthGate />);

    await waitFor(() => expect(view.getByText('Unable to load your session')).toBeTruthy());
    expect(view.queryByText('Developer mode')).toBeNull();
    expect(view.getByText('Retry')).toBeTruthy();
  });
});
