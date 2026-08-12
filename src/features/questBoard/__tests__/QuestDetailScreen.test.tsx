import { fireEvent, render, waitFor } from '@testing-library/react-native';
import mockReact, { type ReactNode } from 'react';

import QuestDetailScreen from '../QuestDetailScreen';
import { resetQuestApplicationStatuses } from '../questApplication';

const mockRouter = { back: jest.fn(), push: jest.fn() };
const mockRouteParams: { id?: string; intent?: string } = {};

jest.mock('expo-router', () => ({
  useRouter: () => mockRouter,
  useLocalSearchParams: () => mockRouteParams,
}));

jest.mock('react-native/Libraries/Modal/Modal', () => ({
  __esModule: true,
  default: ({ visible, children }: { visible: boolean; children: ReactNode }) =>
    visible ? mockReact.createElement(mockReact.Fragment, null, children) : null,
}));

describe('Quest Detail screen', () => {
  beforeEach(() => {
    resetQuestApplicationStatuses();
    mockRouter.back.mockClear();
    delete mockRouteParams.id;
    delete mockRouteParams.intent;
  });

  it('requires confirmation and shows an immediate Accepted outcome for first-come Quests', async () => {
    const view = await render(<QuestDetailScreen now={new Date('2026-08-12T09:00:00.000Z')} questId="react-bug-fix" />);

    expect(view.getByText('Fix a small React bug')).toBeTruthy();
    expect(view.getByText('Apply now')).toBeTruthy();

    await fireEvent.press(view.getByTestId('quest-apply-button'));
    expect(view.getByText('Confirm your application')).toBeTruthy();
    expect(view.getAllByText('฿450 / person')).toHaveLength(2);

    await fireEvent.press(view.getByTestId('confirm-quest-application'));

    await waitFor(() => expect(view.getByText('Application accepted')).toBeTruthy());
    expect(view.queryByText('Apply now')).toBeNull();
  });

  it('shows Application pending for reviewed-candidate Quests', async () => {
    const view = await render(<QuestDetailScreen now={new Date('2026-08-12T09:00:00.000Z')} questId="design-faculty-poster" />);

    await fireEvent.press(view.getByTestId('quest-apply-button'));
    await fireEvent.press(view.getByTestId('confirm-quest-application'));

    await waitFor(() => expect(view.getByText('Application pending')).toBeTruthy());
  });

  it('opens confirmation when entered through Take Quest', async () => {
    mockRouteParams.id = 'design-faculty-poster';
    mockRouteParams.intent = 'apply';

    const view = await render(<QuestDetailScreen now={new Date('2026-08-12T09:00:00.000Z')} />);

    await waitFor(() => expect(view.getByText('Confirm your application')).toBeTruthy());
    expect(view.getByTestId('confirm-quest-application')).toBeTruthy();
  });

  it('explains unavailable application states in Detail', async () => {
    const view = await render(<QuestDetailScreen now={new Date('2026-08-12T09:00:00.000Z')} previewState="full" questId="react-bug-fix" />);

    expect(view.getByText('Quest full')).toBeTruthy();
    expect(view.queryByTestId('quest-apply-button')).toBeNull();
  });

  it('renders a not-found state for an unknown route id', async () => {
    mockRouteParams.id = 'does-not-exist';

    const view = await render(<QuestDetailScreen />);

    expect(view.getByText('Quest not found')).toBeTruthy();
    expect(view.queryByText('Design a faculty event poster')).toBeNull();
  });
});
