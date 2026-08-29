import { act, fireEvent, render, waitFor } from '@testing-library/react-native';

import MyQuestsScreen from '../MyQuestsScreen';
import { DEFAULT_PROTOTYPE_VIEWER_ID, questFixtureAdapter } from '../../questBoard/questFixtureAdapter';

jest.mock('expo-router', () => ({
  useRouter: () => ({ back: jest.fn(), push: jest.fn() }),
}));

jest.mock('../../../locales/LocaleProvider', () => ({
  useLocale: () => ({ locale: 'en' }),
}));

describe('MyQuestsScreen adapter state', () => {
  beforeEach(() => {
    questFixtureAdapter.reset();
  });

  it('renders the adapter read model instead of a static Quest fallback', async () => {
    const view = await render(<MyQuestsScreen />);

    expect(view.getByText('Join a campus event team')).toBeTruthy();
    expect(view.queryByText('Help move boxes to the dorm')).toBeNull();
  });

  it('uses the adapter empty state instead of falling back to static fixtures', async () => {
    const listStatesSpy = jest.spyOn(questFixtureAdapter, 'listStates').mockReturnValue([]);

    try {
      const view = await render(<MyQuestsScreen />);

      expect(view.getByText('No Quest applications yet')).toBeTruthy();
      expect(view.queryByText('Join a campus event team')).toBeNull();
    } finally {
      listStatesSpy.mockRestore();
    }
  });

  it('refreshes when the adapter publishes a state change', async () => {
    const view = await render(<MyQuestsScreen />);

    await act(async () => {
      questFixtureAdapter.withdrawCandidate('worker-pending-demo', DEFAULT_PROTOTYPE_VIEWER_ID);
    });

    await waitFor(() => expect(view.getByText('No Quest applications yet')).toBeTruthy());
    expect(view.queryByText('Join a campus event team')).toBeNull();
  });

  it('does not fabricate a loading state for synchronous adapter data', async () => {
    const view = await render(<MyQuestsScreen />);

    expect(view.queryByTestId('my-quests-loading-skeleton')).toBeNull();
    expect(view.queryByTestId('my-quests-loading-count')).toBeNull();

    await fireEvent.press(view.getByTestId('my-quests-status-next'));
    expect(view.getByText('Buy lunch from the canteen')).toBeTruthy();
  });
});
