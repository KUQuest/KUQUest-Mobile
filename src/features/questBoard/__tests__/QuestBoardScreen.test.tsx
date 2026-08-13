import { fireEvent, render, waitFor } from '@testing-library/react-native';
import mockReact, { type ReactNode } from 'react';

import QuestBoardScreen from '../QuestBoardScreen';

const mockRouter = { push: jest.fn() };

jest.mock('expo-router', () => ({
  useRouter: () => mockRouter,
}));

jest.mock('react-native/Libraries/Modal/Modal', () => ({
  __esModule: true,
  default: ({ visible, children }: { visible: boolean; children: ReactNode }) =>
    visible ? mockReact.createElement(mockReact.Fragment, null, children) : null,
}));

describe('Quest Board screen', () => {
  beforeEach(() => {
    mockRouter.push.mockClear();
  });

  it('renders the populated Quest Board with mode chips and card actions', async () => {
    const view = await render(<QuestBoardScreen now={new Date('2026-08-12T09:00:00.000Z')} currentStudentId="student-demo" />);

    expect(view.getByText('Design a faculty event poster')).toBeTruthy();
    expect(view.getByText('Fix a small React bug')).toBeTruthy();
    expect(view.getByText('Tutor a first-year student')).toBeTruthy();
    expect(view.getByText('Map the campus food spots')).toBeTruthy();
    expect(view.getByText('Build a club landing page')).toBeTruthy();
    expect(view.getByText('Photograph the faculty fair')).toBeTruthy();
    expect(view.getAllByText('First-come, first-served').length).toBeGreaterThan(0);
    expect(view.getByTestId('quest-card-category-design-faculty-poster')).toBeTruthy();
    expect(view.getByTestId('quest-card-creator-design-faculty-poster')).toBeTruthy();
    expect(view.getByText('Posted by Nicha S. · Architecture')).toBeTruthy();
    expect(view.getByTestId('quest-card-participation-design-faculty-poster')).toBeTruthy();
    expect(view.getByTestId('quest-card-selection-design-faculty-poster')).toBeTruthy();
    expect(view.getByTestId('quest-detail-design-faculty-poster')).toBeTruthy();
    expect(view.getByTestId('quest-take-design-faculty-poster')).toBeTruthy();

    await fireEvent.press(view.getByTestId('quest-detail-design-faculty-poster'));

    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: '/quest/[id]', params: { id: 'design-faculty-poster' } });
  });

  it('opens the application confirmation intent from Take Quest', async () => {
    const view = await render(<QuestBoardScreen now={new Date('2026-08-12T09:00:00.000Z')} currentStudentId="student-demo" />);

    await fireEvent.press(view.getByTestId('quest-take-design-faculty-poster'));

    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: '/quest/[id]', params: { id: 'design-faculty-poster', intent: 'apply' } });
  });

  it('filters immediately from search and shows a recoverable no-match state', async () => {
    const view = await render(<QuestBoardScreen now={new Date('2026-08-12T09:00:00.000Z')} currentStudentId="student-demo" />);

    await fireEvent.changeText(view.getByTestId('quest-board-search'), 'campus food');

    await waitFor(() => {
      expect(view.getByText('Map the campus food spots')).toBeTruthy();
      expect(view.queryByText('Design a faculty event poster')).toBeNull();
    });

    await fireEvent.changeText(view.getByTestId('quest-board-search'), 'does not exist');

    await waitFor(() => expect(view.getByText('No quests found')).toBeTruthy());
    expect(view.getByTestId('clear-quest-search')).toBeTruthy();
  });

  it('commits category and location filters from the bottom sheet', async () => {
    const view = await render(<QuestBoardScreen now={new Date('2026-08-12T09:00:00.000Z')} currentStudentId="student-demo" />);

    await fireEvent.press(view.getByTestId('open-quest-filters'));
    await waitFor(() => expect(view.getByTestId('quest-filter-category-technology')).toBeTruthy());
    await fireEvent.press(view.getByTestId('quest-filter-category-technology'));
    await fireEvent.press(view.getByTestId('quest-filter-location-online'));
    expect(view.getByText('2 filters selected')).toBeTruthy();
    await fireEvent.press(view.getByTestId('apply-quest-filters'));

    await waitFor(() => {
      expect(view.getByText('Build a club landing page')).toBeTruthy();
      expect(view.getByText('Fix a small React bug')).toBeTruthy();
      expect(view.queryByText('Design a faculty event poster')).toBeNull();
      expect(view.getByTestId('active-quest-filter-technology')).toBeTruthy();
    });
  });

  it('discards an unfinished filter draft when the modal is closed', async () => {
    const view = await render(<QuestBoardScreen now={new Date('2026-08-12T09:00:00.000Z')} currentStudentId="student-demo" />);

    await fireEvent.press(view.getByTestId('open-quest-filters'));
    await fireEvent.press(view.getByTestId('quest-filter-category-technology'));
    await fireEvent.press(view.getByTestId('close-quest-filters'));
    await fireEvent.press(view.getByTestId('open-quest-filters'));

    expect(view.getByTestId('quest-filter-category-technology').props.accessibilityState).toEqual({ checked: false });
  });

  it('discards a filter draft when the backdrop is pressed', async () => {
    const view = await render(<QuestBoardScreen />);

    await fireEvent.press(view.getByTestId('open-quest-filters'));
    await fireEvent.press(view.getByTestId('quest-filter-category-technology'));
    await fireEvent.press(view.getByTestId('quest-filter-backdrop'));
    await fireEvent.press(view.getByTestId('open-quest-filters'));

    expect(view.getByTestId('quest-filter-category-technology').props.accessibilityState).toEqual({ checked: false });
  });

  it('keeps the filter modal open when Clear all is pressed', async () => {
    const view = await render(<QuestBoardScreen />);

    await fireEvent.press(view.getByTestId('open-quest-filters'));
    await fireEvent.press(view.getByTestId('quest-filter-category-technology'));
    await fireEvent.press(view.getByText('Clear all'));

    expect(view.getByText('Filter Quests')).toBeTruthy();
    expect(view.getByTestId('quest-filter-category-technology').props.accessibilityState).toEqual({ checked: false });
  });

  it('filters by reward bounds, tags, and start-time buckets', async () => {
    const view = await render(<QuestBoardScreen now={new Date('2026-08-12T09:00:00.000Z')} currentStudentId="student-demo" />);

    await fireEvent.press(view.getByTestId('open-quest-filters'));
    await fireEvent.changeText(view.getByTestId('quest-filter-reward-min'), '700');
    await fireEvent.changeText(view.getByTestId('quest-filter-reward-max'), '800');
    await fireEvent.press(view.getByTestId('quest-filter-tag-Study support'));
    await fireEvent.press(view.getByTestId('quest-filter-start-time-afternoon'));
    await fireEvent.press(view.getByTestId('apply-quest-filters'));

    await waitFor(() => {
      expect(view.getByText('Tutor a first-year student')).toBeTruthy();
      expect(view.queryByText('Design a faculty event poster')).toBeNull();
      expect(view.getByTestId('active-quest-filter-tag-Study support')).toBeTruthy();
      expect(view.getByTestId('active-quest-filter-reward')).toBeTruthy();
      expect(view.getByTestId('active-quest-filter-start-time-afternoon')).toBeTruthy();
    });
  });

  it('preserves Quest Board Search when filters are cleared', async () => {
    const view = await render(<QuestBoardScreen />);

    await fireEvent.changeText(view.getByTestId('quest-board-search'), 'campus food');
    await fireEvent.press(view.getByTestId('open-quest-filters'));
    await fireEvent.press(view.getByText('Clear all'));
    await fireEvent.press(view.getByTestId('apply-quest-filters'));

    expect(view.getByTestId('quest-board-search').props.value).toBe('campus food');
    expect(view.getByText('Map the campus food spots')).toBeTruthy();
    expect(view.queryByText('Design a faculty event poster')).toBeNull();
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
    await waitFor(() => expect(view.getByTestId('quest-sort-reward-highest')).toBeTruthy());
    await fireEvent.press(view.getByTestId('quest-sort-reward-highest'));

    await waitFor(() => {
      const firstCardTitle = view.getByTestId('quest-card-title-club-landing-page');
      expect(firstCardTitle.props.children).toBe('Build a club landing page');
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
    expect(error.getByLabelText('Quest Board retry completed')).toBeTruthy();
  });

  it('forwards application preview scenarios into Quest Detail', async () => {
    const view = await render(<QuestBoardScreen initialPreviewState="application-pending" now={new Date('2026-08-12T09:00:00.000Z')} />);

    await fireEvent.press(view.getByTestId('quest-detail-design-faculty-poster'));

    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: '/quest/[id]', params: { id: 'design-faculty-poster', preview: 'application-pending' } });
  });
});
