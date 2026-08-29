import { fireEvent, render, waitFor } from '@testing-library/react-native';
import mockReact, { type ReactNode } from 'react';

import QuestBoardScreen from '../QuestBoardScreen';
import { setActivePrototypePersona } from '../../../components/ui/prototypeMenuState';
import { questFixtureAdapter } from '../questFixtureAdapter';
import { questFixtures } from '../questFixtures';

const mockRouter = { push: jest.fn() };
let mockLocale: 'en' | 'th' = 'en';

jest.mock('expo-router', () => ({
  useRouter: () => mockRouter,
}));

jest.mock('../../../locales/LocaleProvider', () => ({
  useLocale: () => ({ locale: mockLocale }),
}));

jest.mock('react-native/Libraries/Modal/Modal', () => ({
  __esModule: true,
  default: ({ visible, children }: { visible: boolean; children: ReactNode }) =>
    visible ? mockReact.createElement(mockReact.Fragment, null, children) : null,
}));

describe('Quest Board screen', () => {
  it('provides fixtures for all Single/Group and First-come/Candidate combinations', () => {
    expect(new Set(questFixtures.map((quest) => `${quest.participationMode}:${quest.candidateMode}`))).toEqual(new Set([
      'single:CANDIDATE',
      'single:NO_CANDIDATE',
      'team:CANDIDATE',
      'team:NO_CANDIDATE',
    ]));
    expect(questFixtures.every((quest) => quest.tags.length <= 1)).toBe(true);
  });

  beforeEach(() => {
    mockRouter.push.mockClear();
    mockLocale = 'en';
  });

  it('renders Quest cards with decision signals and one detail action', async () => {
    const view = await render(<QuestBoardScreen now={new Date('2026-08-12T09:00:00.000Z')} currentStudentId="student-demo" />);

    expect(view.getByText('Quest Board')).toBeTruthy();
    expect(view.getByText('Find a Quest that fits your skills and time.')).toBeTruthy();
    expect(view.queryByText('13 Quests')).toBeNull();
    expect(view.getByText('Help move boxes to the dorm')).toBeTruthy();
    expect(view.getByText('Clean a dorm fan')).toBeTruthy();
    expect(view.getByText('Photocopy course documents')).toBeTruthy();
    expect(view.getByText('Deliver drinks to the library')).toBeTruthy();
    expect(view.getByText('Go running together')).toBeTruthy();
    expect(view.queryByText('Welcome desk helper')).toBeNull();
    expect(view.getByTestId('quest-card-tags-move-boxes')).toBeTruthy();
    expect(view.getByText('Help carry labelled boxes from the parking area to Dorm 13.')).toBeTruthy();
    expect(view.queryByTestId('quest-card-images-move-boxes')).toBeNull();
    expect(view.queryByText('3 photos')).toBeNull();
    expect(view.queryByTestId('quest-card-deadline-move-boxes')).toBeNull();
    expect(view.getByTestId('quest-card-spots-move-boxes')).toBeTruthy();
    expect(view.getAllByText('2 of 2 spots left').length).toBeGreaterThan(0);
    expect(view.queryByText('Ending soon')).toBeNull();
    expect(view.queryByTestId('quest-card-creator-move-boxes')).toBeNull();
    expect(view.queryByText('Nicha S.')).toBeNull();
    expect(view.queryByText('Nicha S. · Architecture')).toBeNull();
    expect(view.getAllByText('2 of 2 spots left').length).toBeGreaterThan(0);
    expect(view.getAllByText('Single person · Apply for review').length).toBeGreaterThan(0);
    expect(view.getAllByText('Team · First-come, first-served').length).toBeGreaterThan(0);
    expect(view.getByTestId('quest-detail-move-boxes')).toBeTruthy();
    expect(view.queryByTestId('quest-take-move-boxes')).toBeNull();

    await fireEvent.press(view.getByTestId('quest-detail-move-boxes'));

    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: '/quest/[id]', params: { id: 'move-boxes' } });
  });

  it('shows the Home funding summary above Quest Board results', async () => {
    const view = await render(<QuestBoardScreen now={new Date('2026-08-12T09:00:00.000Z')} currentStudentId="student-demo" />);

    expect(view.getByTestId('home-funding-summary')).toBeTruthy();
    expect(view.getByText('My funding')).toBeTruthy();
    expect(view.getByText('HELD FOR QUESTS')).toBeTruthy();
    expect(view.getByText('No active Quest Funding yet')).toBeTruthy();
    expect(view.getByText('Settlement')).toBeTruthy();
    expect(view.getByText('View history')).toBeTruthy();
    expect(view.getByText('Refunds')).toBeTruthy();
    expect(view.getByText('Policy')).toBeTruthy();
    expect(view.getByText('Quest Board')).toBeTruthy();
  });

  it('localizes the Home funding summary in Thai', async () => {
    mockLocale = 'th';
    const view = await render(<QuestBoardScreen now={new Date('2026-08-12T09:00:00.000Z')} currentStudentId="student-demo" />);

    expect(view.getByText('เงินของฉัน')).toBeTruthy();
    expect(view.getByText('เงินที่กันไว้กับเควสต์')).toBeTruthy();
    expect(view.getByText('ยังไม่มี Quest Funding ที่กำลังดำเนินการ')).toBeTruthy();
    expect(view.getByText('การชำระเงิน')).toBeTruthy();
    expect(view.getByText('ดูรายการ')).toBeTruthy();
    expect(view.getByText('การคืนเงิน')).toBeTruthy();
    expect(view.getByText('นโยบาย')).toBeTruthy();
    expect(view.getByText('กระดานเควสต์')).toBeTruthy();
  });

  it('opens Quest Detail as the only card action', async () => {
    const view = await render(<QuestBoardScreen now={new Date('2026-08-12T09:00:00.000Z')} currentStudentId="student-demo" />);

    await fireEvent.press(view.getByTestId('quest-detail-move-boxes'));

    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: '/quest/[id]', params: { id: 'move-boxes' } });
  });

  it('filters immediately from search and shows a recoverable no-match state', async () => {
    const view = await render(<QuestBoardScreen now={new Date('2026-08-12T09:00:00.000Z')} currentStudentId="student-demo" />);

    await fireEvent.changeText(view.getByTestId('quest-board-search'), 'deliver drinks');

    await waitFor(() => {
      expect(view.getByText('Deliver drinks to the library')).toBeTruthy();
      expect(view.queryByText('Help move boxes to the dorm')).toBeNull();
    });

    await fireEvent.changeText(view.getByTestId('quest-board-search'), 'does not exist');

    await waitFor(() => expect(view.getByText('No quests found')).toBeTruthy());
    expect(view.getByTestId('clear-quest-search')).toBeTruthy();
  });

  it('suggests tags from search and commits them with location filters from the bottom sheet', async () => {
    const view = await render(<QuestBoardScreen now={new Date('2026-08-12T09:00:00.000Z')} currentStudentId="student-demo" />);

    await fireEvent.press(view.getByTestId('open-quest-filters'));
    expect(view.getByTestId('quest-filter-sheet').props.style).toEqual(expect.objectContaining({ height: '88%', paddingBottom: expect.any(Number) }));
    await fireEvent.changeText(view.getByTestId('quest-filter-tag-search'), 'clean');
    await waitFor(() => expect(view.getByTestId('quest-filter-tag-cleaning')).toBeTruthy());
    await fireEvent.press(view.getByTestId('quest-filter-tag-cleaning'));
    expect(view.getByTestId('quest-filter-selected-tag-cleaning')).toBeTruthy();
    await fireEvent.press(view.getByTestId('quest-filter-location-on-campus'));
    expect(view.getByText('2 filters selected')).toBeTruthy();
    await fireEvent.press(view.getByTestId('apply-quest-filters'));

    await waitFor(() => {
      expect(view.getByText('Clean a dorm fan')).toBeTruthy();
      expect(view.queryByText('Help move boxes to the dorm')).toBeNull();
      expect(view.getByTestId('active-quest-filter-tag-cleaning')).toBeTruthy();
    });
  });

  it('discards an unfinished filter draft when the modal is closed', async () => {
    const view = await render(<QuestBoardScreen now={new Date('2026-08-12T09:00:00.000Z')} currentStudentId="student-demo" />);

    await fireEvent.press(view.getByTestId('open-quest-filters'));
    await fireEvent.changeText(view.getByTestId('quest-filter-tag-search'), 'clean');
    await fireEvent.press(view.getByTestId('quest-filter-tag-cleaning'));
    await fireEvent.press(view.getByTestId('close-quest-filters'));
    await fireEvent.press(view.getByTestId('open-quest-filters'));

    expect(view.queryByTestId('quest-filter-selected-tag-cleaning')).toBeNull();
  });

  it('discards a filter draft when the backdrop is pressed', async () => {
    const view = await render(<QuestBoardScreen />);

    await fireEvent.press(view.getByTestId('open-quest-filters'));
    await fireEvent.changeText(view.getByTestId('quest-filter-tag-search'), 'clean');
    await fireEvent.press(view.getByTestId('quest-filter-tag-cleaning'));
    await fireEvent.press(view.getByTestId('quest-filter-backdrop'));
    await fireEvent.press(view.getByTestId('open-quest-filters'));

    expect(view.queryByTestId('quest-filter-selected-tag-cleaning')).toBeNull();
  });

  it('keeps the filter modal open when Clear all is pressed', async () => {
    const view = await render(<QuestBoardScreen />);

    await fireEvent.press(view.getByTestId('open-quest-filters'));
    await fireEvent.changeText(view.getByTestId('quest-filter-tag-search'), 'clean');
    await fireEvent.press(view.getByTestId('quest-filter-tag-cleaning'));
    await fireEvent.press(view.getByText('Clear all'));

    expect(view.getByText('Filter Quests')).toBeTruthy();
    expect(view.queryByTestId('quest-filter-selected-tag-cleaning')).toBeNull();
  });

  it('filters by reward bounds, tags, and start-time buckets', async () => {
    const view = await render(<QuestBoardScreen now={new Date('2026-08-12T09:00:00.000Z')} currentStudentId="student-demo" />);

    await fireEvent.press(view.getByTestId('open-quest-filters'));
    await fireEvent.changeText(view.getByTestId('quest-filter-reward-min'), '80');
    await fireEvent.changeText(view.getByTestId('quest-filter-reward-max'), '80');
    await fireEvent.changeText(view.getByTestId('quest-filter-tag-search'), 'print');
    await fireEvent.press(view.getByTestId('quest-filter-tag-printing'));
    await fireEvent.press(view.getByTestId('quest-filter-start-time-afternoon'));
    await fireEvent.press(view.getByTestId('apply-quest-filters'));

    await waitFor(() => {
      expect(view.getByText('Photocopy course documents')).toBeTruthy();
      expect(view.queryByText('Help move boxes to the dorm')).toBeNull();
      expect(view.getByTestId('active-quest-filter-tag-printing')).toBeTruthy();
      expect(view.getByTestId('active-quest-filter-reward')).toBeTruthy();
      expect(view.getByTestId('active-quest-filter-start-time-afternoon')).toBeTruthy();
    });
  });

  it('preserves Quest Board Search when filters are cleared', async () => {
    const view = await render(<QuestBoardScreen />);

    await fireEvent.changeText(view.getByTestId('quest-board-search'), 'deliver drinks');
    await fireEvent.press(view.getByTestId('open-quest-filters'));
    await fireEvent.press(view.getByText('Clear all'));
    await fireEvent.press(view.getByTestId('apply-quest-filters'));

    expect(view.getByTestId('quest-board-search').props.value).toBe('deliver drinks');
    expect(view.getByText('Deliver drinks to the library')).toBeTruthy();
    expect(view.queryByText('Help move boxes to the dorm')).toBeNull();
  });

  it('does not offer an unmatched tag or allow creating one', async () => {
    const view = await render(<QuestBoardScreen />);

    await fireEvent.press(view.getByTestId('open-quest-filters'));
    await fireEvent.changeText(view.getByTestId('quest-filter-tag-search'), 'quantum computing');

    await waitFor(() => expect(view.getByText('No matching tags')).toBeTruthy());
    expect(view.queryByTestId('quest-filter-tag-quantum computing')).toBeNull();
  });

  it('selects multiple tag suggestions with OR semantics', async () => {
    const view = await render(<QuestBoardScreen now={new Date('2026-08-12T09:00:00.000Z')} currentStudentId="student-demo" />);

    await fireEvent.press(view.getByTestId('open-quest-filters'));
    await fireEvent.changeText(view.getByTestId('quest-filter-tag-search'), 'clean');
    await fireEvent.press(view.getByTestId('quest-filter-tag-cleaning'));
    await fireEvent.changeText(view.getByTestId('quest-filter-tag-search'), 'delivery');
    await fireEvent.press(view.getByTestId('quest-filter-tag-delivery'));

    expect(view.getByTestId('quest-filter-selected-tag-cleaning')).toBeTruthy();
    expect(view.getByTestId('quest-filter-selected-tag-delivery')).toBeTruthy();

    await fireEvent.press(view.getByTestId('apply-quest-filters'));

    await waitFor(() => {
      expect(view.getByText('Clean a dorm fan')).toBeTruthy();
      expect(view.getByText('Deliver drinks to the library')).toBeTruthy();
      expect(view.queryByText('Photocopy course documents')).toBeNull();
    });
  });

  it('keeps Apply disabled for invalid reward bounds', async () => {
    const view = await render(<QuestBoardScreen />);

    await fireEvent.press(view.getByTestId('open-quest-filters'));
    await fireEvent.changeText(view.getByTestId('quest-filter-reward-min'), '900');
    await fireEvent.changeText(view.getByTestId('quest-filter-reward-max'), '800');

    expect(view.getByTestId('quest-filter-reward-error')).toBeTruthy();
    expect(view.getByTestId('apply-quest-filters').props.accessibilityState).toMatchObject({ disabled: true });
  });

  it('changes deterministic sort order from the sort sheet', async () => {
    const view = await render(<QuestBoardScreen now={new Date('2026-08-12T09:00:00.000Z')} currentStudentId="student-demo" />);

    await fireEvent.press(view.getByTestId('open-quest-sort'));
    expect(view.queryByTestId('quest-sort-recommended')).toBeNull();
    await waitFor(() => expect(view.getByTestId('quest-sort-reward-highest')).toBeTruthy());
    await fireEvent.press(view.getByTestId('quest-sort-reward-highest'));

    await waitFor(() => {
      const firstCardTitle = view.getByTestId('quest-card-title-move-boxes');
      expect(firstCardTitle.props.children).toBe('Help move boxes to the dorm');
      expect(view.getByText('Sort by: Reward highest')).toBeTruthy();
    });
  });

  it('exposes loading, empty, and retryable error preview states', async () => {
    const loading = await render(<QuestBoardScreen initialPreviewState="loading" />);
    expect(loading.getByTestId('quest-skeleton-1')).toBeTruthy();
    expect(loading.getByLabelText('Loading Quests')).toBeTruthy();

    const empty = await render(<QuestBoardScreen initialPreviewState="empty" />);
    expect(empty.getByText('No quests available yet.')).toBeTruthy();

    const error = await render(<QuestBoardScreen initialPreviewState="error" />);
    await fireEvent.press(error.getByText('Try again'));
    await waitFor(() => expect(error.getByLabelText('Quest Board refreshed')).toBeTruthy());
    expect(error.getByText('Help move boxes to the dorm')).toBeTruthy();
  });

  it('keeps application outcomes out of Quest cards and keeps the action in Quest Detail', async () => {
    const pending = await render(<QuestBoardScreen initialPreviewState="application-pending" now={new Date('2026-08-12T09:00:00.000Z')} />);

    expect(pending.queryByText('Application pending')).toBeNull();
    expect(pending.getByText('Help move boxes to the dorm')).toBeTruthy();
    expect(pending.queryByTestId('quest-take-move-boxes')).toBeNull();
  });

  it('forwards application preview scenarios into Quest Detail', async () => {
    const view = await render(<QuestBoardScreen initialPreviewState="application-pending" now={new Date('2026-08-12T09:00:00.000Z')} />);

    await fireEvent.press(view.getByTestId('quest-detail-move-boxes'));

    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: '/quest/[id]', params: { id: 'move-boxes', preview: 'application-pending' } });
  });

  it('exposes the dev-only prototype menu without adding scenarios to Board discovery', async () => {
    setActivePrototypePersona('student-demo');
    const view = await render(<QuestBoardScreen now={new Date('2026-08-12T09:00:00.000Z')} />);

    expect(view.getByTestId('quest-board-prototype-menu-trigger')).toBeTruthy();
    expect(view.queryByText('Form a campus event team')).toBeNull();

    await fireEvent.press(view.getByTestId('quest-board-prototype-menu-trigger'));
    await fireEvent.press(view.getByTestId('quest-board-prototype-menu-persona-demo-worker-2'));
    await fireEvent.press(view.getByTestId('quest-board-prototype-menu-trigger'));
    await fireEvent.press(view.getByTestId('quest-board-prototype-menu-scenario-single-candidate-demo'));

    expect(mockRouter.push).toHaveBeenCalledWith('/quest/single-candidate-demo');

    const resetSpy = jest.spyOn(questFixtureAdapter, 'reset');
    await fireEvent.press(view.getByTestId('quest-board-prototype-menu-trigger'));
    await fireEvent.press(view.getByTestId('quest-board-prototype-menu-reset-all'));
    expect(resetSpy).toHaveBeenCalledTimes(1);
    resetSpy.mockRestore();
  });
});
