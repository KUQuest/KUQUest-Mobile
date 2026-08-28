import { render, waitFor, within } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import QuestDetailScreen from '../QuestDetailScreen';
import { authService } from '../../auth/AuthService';
import { resetOfflinePrototypeDemo } from '../../auth/demoMode';

const mockGetSession = authService.getSession as jest.MockedFunction<typeof authService.getSession>;

jest.mock('../../auth/AuthService', () => ({
  authService: {
    getSession: jest.fn(),
  },
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({ back: jest.fn(), canGoBack: jest.fn(() => true), push: jest.fn(), replace: jest.fn() }),
  useLocalSearchParams: () => ({}),
  useFocusEffect: jest.fn(),
}));

jest.mock('../../../locales/LocaleProvider', () => ({
  useLocale: () => ({ locale: 'en' }),
}));

describe('QuestDetailScreen loading state', () => {
  beforeEach(() => {
    mockGetSession.mockReset();
    mockGetSession.mockResolvedValue(null);
    delete process.env.EXPO_PUBLIC_PROFILE_DEMO;
    resetOfflinePrototypeDemo();
  });

  it('renders the canonical loading preview without a local database', async () => {
    const view = await render(<QuestDetailScreen previewState="loading" questId="print-documents" />);

    expect(view.getByLabelText('Loading Quests')).toBeTruthy();
    expect(view.queryByText('Quest not found')).toBeNull();
  });

  it('keeps the loading footer in the pulsing accessibility group with settled spacing', async () => {
    const loading = await render(<QuestDetailScreen previewState="loading" questId="print-documents" />);
    const loadingGroup = loading.getByTestId('quest-detail-loading-skeleton');
    const loadingFooter = within(loadingGroup).getByTestId('quest-detail-loading-action-bar');
    expect(loadingFooter).toBeTruthy();

    const settled = await render(<QuestDetailScreen studentId="student-demo" questId="print-documents" />);
    await waitFor(() => expect(settled.getByTestId('quest-action-bar')).toBeTruthy());
    expect(StyleSheet.flatten(loadingFooter.props.style)?.paddingBottom).toBe(
      StyleSheet.flatten(settled.getByTestId('quest-action-bar').props.style)?.paddingBottom,
    );
  });

  it('does not expose Apply until application state hydration completes outside demo mode', async () => {
    let resolveSession!: (value: Awaited<ReturnType<typeof authService.getSession>>) => void;
    mockGetSession.mockReturnValueOnce(new Promise((resolve) => {
      resolveSession = resolve;
    }));

    const view = await render(<QuestDetailScreen questId="print-documents" />);

    expect(view.getByTestId('quest-detail-loading-skeleton')).toBeTruthy();
    expect(view.queryByTestId('quest-apply-button')).toBeNull();

    resolveSession(null);
    await waitFor(() => expect(view.getByTestId('quest-apply-button')).toBeTruthy());
  });

  it('renders normal and hidden fixture routes without waiting for unavailable auth in demo mode', async () => {
    process.env.EXPO_PUBLIC_PROFILE_DEMO = 'true';
    mockGetSession.mockReturnValue(new Promise(() => undefined));

    const routes = [
      ['print-documents', 'Photocopy course documents'],
      ['team-forming-demo', 'Form a campus event team'],
      ['team-selection-demo', 'Choose a campus event team'],
      ['single-candidate-demo', 'Select a campus helper'],
      ['partial-group-start-demo', 'Start a partial campus crew'],
    ] as const;

    for (const [questId, title] of routes) {
      const view = await render(<QuestDetailScreen questId={questId} />);

      expect(view.queryByTestId('quest-detail-loading-skeleton')).toBeNull();
      expect(view.getAllByText(title).length).toBeGreaterThan(0);
    }

    expect(mockGetSession).not.toHaveBeenCalled();
  });
});
