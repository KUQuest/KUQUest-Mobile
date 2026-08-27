import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import mockReact, { type ReactNode } from 'react';
import { Alert } from 'react-native';

import QuestDetailScreen from '../QuestDetailScreen';
import { resetQuestApplicationStatuses } from '../questApplication';

const mockRouter = { back: jest.fn(), push: jest.fn() };
const mockRouteParams: { id?: string; intent?: string; mode?: string; joinStatus?: string } = {};

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
    delete mockRouteParams.mode;
    delete mockRouteParams.joinStatus;
  });

  it('requires confirmation and shows an immediate Accepted outcome for first-come Quests', async () => {
    const view = await render(<QuestDetailScreen now={new Date('2026-08-12T09:00:00.000Z')} questId="print-documents" />);

    expect(view.getByText('Photocopy course documents')).toBeTruthy();
    expect(view.getByText('Join Quest')).toBeTruthy();
    expect(view.getByText('15 Aug 2026')).toBeTruthy();
    expect(view.getByTestId('quest-schedule-timeline')).toBeTruthy();
    expect(view.getByText('Start work')).toBeTruthy();
    expect(view.getByText('Work window')).toBeTruthy();
    expect(view.getByText('Finish by')).toBeTruthy();
    expect(view.getByText('12:00–13:00')).toBeTruthy();
    expect(view.getAllByText('On campus').length).toBeGreaterThan(0);

    await fireEvent.press(view.getByTestId('quest-apply-button'));
    expect(view.getByText('Confirm your participation')).toBeTruthy();
    expect(view.getAllByText('฿80 / person')).toHaveLength(2);

    await fireEvent.press(view.getByTestId('confirm-quest-application'));

    await waitFor(() => expect(view.getByText('Participation confirmed')).toBeTruthy());
    expect(view.getByTestId('view-my-quests')).toBeTruthy();
    expect(view.queryByText('Join Quest')).toBeNull();
  });

  it('renders up to three Quest reference images in Detail', async () => {
    const view = await render(<QuestDetailScreen now={new Date('2026-08-12T09:00:00.000Z')} questId="move-boxes" />);

    expect(view.getByLabelText('3 photos')).toBeTruthy();
    expect(view.getByLabelText('Quest image 1')).toBeTruthy();
    expect(view.getByLabelText('Quest image 3')).toBeTruthy();
  });

  it('shows Application pending for reviewed-candidate Quests', async () => {
    const view = await render(<QuestDetailScreen now={new Date('2026-08-12T09:00:00.000Z')} questId="move-boxes" />);

    await fireEvent.press(view.getByTestId('quest-apply-button'));
    await fireEvent.press(view.getByTestId('confirm-quest-application'));

    await waitFor(() => expect(view.getByText('Application pending')).toBeTruthy());
    expect(view.getByText('The Quest owner will review your application.')).toBeTruthy();
    expect(view.getByTestId('view-my-quests')).toBeTruthy();
  });

  it('shows a Leave action for a joined Quest and removes the active state after confirmation', async () => {
    const view = await render(<QuestDetailScreen now={new Date('2026-08-12T09:00:00.000Z')} questId="print-documents" mode="join" joinStatus="accepted" />);

    expect(view.getByText('Participation confirmed')).toBeTruthy();
    expect(view.getByTestId('quest-leave-button')).toBeTruthy();
    expect(view.queryByTestId('quest-apply-button')).toBeNull();

    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    await fireEvent.press(view.getByTestId('quest-leave-button'));
    expect(alertSpy).toHaveBeenCalledWith('Leave Quest', 'You will leave this Quest and lose your confirmed place.', expect.any(Array));
    const leaveConfirmation = alertSpy.mock.calls[0][2]?.find((button) => button.text === 'Leave Quest');
    await act(async () => {
      leaveConfirmation?.onPress?.();
    });

    await waitFor(() => expect(view.getByText('You left this Quest')).toBeTruthy());
    expect(view.queryByTestId('quest-leave-button')).toBeNull();
    alertSpy.mockRestore();
  });

  it('shows Edit post for the owner view and opens the create flow with the Quest id', async () => {
    const view = await render(<QuestDetailScreen now={new Date('2026-08-12T09:00:00.000Z')} questId="clean-fan" mode="post" />);

    expect(view.getByText('Your Quest post')).toBeTruthy();
    expect(view.getByTestId('quest-edit-post-button')).toBeTruthy();
    expect(view.queryByTestId('quest-apply-button')).toBeNull();
    expect(view.queryByTestId('quest-leave-button')).toBeNull();

    await fireEvent.press(view.getByTestId('quest-edit-post-button'));
    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: '/create', params: { editQuestId: 'clean-fan' } });
  });

  it('navigates accepted participants to My Quests', async () => {
    const view = await render(<QuestDetailScreen now={new Date('2026-08-12T09:00:00.000Z')} questId="print-documents" />);

    await fireEvent.press(view.getByTestId('quest-apply-button'));
    await fireEvent.press(view.getByTestId('confirm-quest-application'));
    await waitFor(() => expect(view.getByTestId('view-my-quests')).toBeTruthy());
    await fireEvent.press(view.getByTestId('view-my-quests'));

    expect(mockRouter.push).toHaveBeenCalledWith('/my-quests');
  });

  it('opens confirmation when entered through Take Quest', async () => {
    mockRouteParams.id = 'move-boxes';
    mockRouteParams.intent = 'apply';

    const view = await render(<QuestDetailScreen now={new Date('2026-08-12T09:00:00.000Z')} />);

    await waitFor(() => expect(view.getByText('Confirm your application')).toBeTruthy());
    expect(view.getByTestId('confirm-quest-application')).toBeTruthy();
  });

  it('explains unavailable application states in Detail', async () => {
    const view = await render(<QuestDetailScreen now={new Date('2026-08-12T09:00:00.000Z')} previewState="full" questId="print-documents" />);

    expect(view.getByText('Quest full')).toBeTruthy();
    expect(view.getByText('This Quest is no longer accepting applications.')).toBeTruthy();
    expect(view.queryByTestId('view-my-quests')).toBeNull();
    expect(view.queryByTestId('quest-apply-button')).toBeNull();
  });

  it('renders a not-found state for an unknown route id', async () => {
    mockRouteParams.id = 'does-not-exist';

    const view = await render(<QuestDetailScreen />);

    expect(view.getByText('Quest not found')).toBeTruthy();
    expect(view.queryByText('Help move boxes to the dorm')).toBeNull();
  });
});
