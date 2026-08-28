import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import mockReact, { type ReactNode } from 'react';

import QuestDetailScreen from '../QuestDetailScreen';
import { questFixtureAdapter } from '../questFixtureAdapter';

const mockRouter = { back: jest.fn(), push: jest.fn() };

jest.mock('expo-router', () => ({
  useRouter: () => mockRouter,
  useLocalSearchParams: () => ({}),
}));

jest.mock('react-native/Libraries/Modal/Modal', () => ({
  __esModule: true,
  default: ({ visible, children }: { visible: boolean; children: ReactNode }) =>
    visible ? mockReact.createElement(mockReact.Fragment, null, children) : null,
}));

describe('Quest prototype detail panels', () => {
  beforeEach(() => {
    questFixtureAdapter.reset();
    mockRouter.back.mockClear();
    mockRouter.push.mockClear();
  });

  it('renders the server edit-consent countdown and applies a Worker vote', async () => {
    const now = new Date('2026-08-12T09:00:00.000Z');
    const view = await render(<QuestDetailScreen now={now} questId="walk-together" />);

    expect(view.getByTestId('quest-edit-consent-state')).toBeTruthy();
    expect(view.getByText('Consent time remaining: 05:00')).toBeTruthy();

    await fireEvent.press(view.getByTestId('quest-approve-edit'));
    await waitFor(() => expect(view.getByText('1 of 2 Workers approved the proposed edit.')).toBeTruthy());
  });

  it('opens an empty team sheet and creates a team for a new Worker leader', async () => {
    const view = await render(<QuestDetailScreen now={new Date('2026-08-12T09:00:00.000Z')} questId="team-forming-demo" studentId="demo-worker-3" />);

    await fireEvent.press(view.getByTestId('quest-open-team-sheet'));
    expect(view.getByTestId('team-assemble-empty')).toBeTruthy();
    await fireEvent.press(view.getByTestId('team-assemble-create'));
    await waitFor(() => expect(view.getByTestId('team-assemble-roster')).toBeTruthy());
    expect(view.getByTestId('team-assemble-roster-member-demo-worker-3')).toBeTruthy();
  });

  it('opens the team sheet and allows a leader to invite and submit a partial roster', async () => {
    const view = await render(<QuestDetailScreen now={new Date('2026-08-12T09:00:00.000Z')} questId="team-forming-demo" studentId="demo-team-leader" />);

    await fireEvent.press(view.getByTestId('quest-open-team-sheet'));
    await fireEvent.press(view.getByTestId('team-assemble-invite-member-demo-worker-2'));

    expect(view.getAllByText('Invitation pending').length).toBeGreaterThan(0);
    expect(view.getByText(/Expires/)).toBeTruthy();
    await fireEvent.press(view.getByTestId('team-assemble-review-roster'));
    await fireEvent.press(view.getByTestId('team-assemble-confirm-submit'));
    await waitFor(() => expect(view.getByTestId('team-assemble-locked-state')).toBeTruthy());
  });

  it('opens the individual Candidate review sheet for the Hirer and selects an Applicant', async () => {
    const view = await render(<QuestDetailScreen now={new Date('2026-08-12T09:00:00.000Z')} questId="single-candidate-demo" mode="post" />);

    await fireEvent.press(view.getByTestId('quest-open-candidate-review-sheet'));
    expect(view.getByTestId('candidate-review-sheet')).toBeTruthy();
    expect(view.getByTestId('candidate-review-summary')).toBeTruthy();

    await fireEvent.press(view.getByTestId('candidate-review-accept-fixture-application-single-candidate-demo-single-applicant-a'));
    await waitFor(() => expect(view.getByText('Selected')).toBeTruthy());
  });

  it('shows only submitted team proposals to the Hirer and reflects one accepted selection', async () => {
    const view = await render(<QuestDetailScreen now={new Date('2026-08-12T09:00:00.000Z')} questId="team-selection-demo" mode="post" />);

    await fireEvent.press(view.getByTestId('quest-open-candidate-review-sheet'));
    expect(view.getByTestId('candidate-review-proposal-fixture-application-team-selection-demo-team-a')).toBeTruthy();
    expect(view.getByTestId('candidate-review-proposal-fixture-application-team-selection-demo-team-b')).toBeTruthy();
    expect(view.queryByText('Forming')).toBeNull();

    await fireEvent.press(view.getByTestId('candidate-review-accept-fixture-application-team-selection-demo-team-a'));
    await waitFor(() => expect(view.getAllByText('Selected').length).toBeGreaterThan(0));
    expect(view.getAllByText('Rejected').length).toBeGreaterThan(0);
  });

  it('opens partial Group start consent at the start boundary and records the current Worker vote', async () => {
    const now = new Date('2026-08-26T10:00:00.000Z');
    const view = await render(<QuestDetailScreen now={now} questId="partial-group-start-demo" studentId="partial-worker-a" />);

    expect(view.getByTestId('partial-group-start-consent-sheet')).toBeTruthy();
    expect(view.getByText('The existing Quest chat stays writable while this vote is pending.')).toBeTruthy();
    await fireEvent.press(view.getByTestId('partial-group-start-approve'));
    await waitFor(() => expect(view.getAllByText('1 of 3 approved').length).toBeGreaterThan(0));
  });

  it('projects a timed-out partial start when the detail clock advances', async () => {
    const start = new Date('2026-08-26T10:00:00.000Z');
    const view = await render(<QuestDetailScreen now={start} questId="partial-group-start-demo" studentId="partial-worker-a" />);

    await act(async () => {
      view.rerender(<QuestDetailScreen now={new Date('2026-08-26T10:05:00.000Z')} questId="partial-group-start-demo" studentId="partial-worker-a" />);
    });
    await waitFor(() => expect(view.getByTestId('partial-group-start-cancelled')).toBeTruthy());
    expect(view.getAllByText(/five-minute consent window ended/).length).toBeGreaterThan(0);
  });

  it('keeps the consent sheet open with a read-only terminal status after rejection', async () => {
    const view = await render(<QuestDetailScreen now={new Date('2026-08-26T10:00:00.000Z')} questId="partial-group-start-demo" studentId="partial-worker-a" />);

    await fireEvent.press(view.getByTestId('partial-group-start-reject'));
    await waitFor(() => expect(view.getByTestId('partial-group-start-cancelled')).toBeTruthy());
    expect(view.getAllByText(/Reserved rewards are fully refunded/).length).toBeGreaterThan(0);
    expect(view.queryByTestId('partial-group-start-approve')).toBeNull();
  });
});
