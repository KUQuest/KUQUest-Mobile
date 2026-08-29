import { fireEvent, render, waitFor } from '@testing-library/react-native';

import ChatInboxScreen from '../ChatInboxScreen';
import { questFixtureAdapter } from '../../questBoard/questFixtureAdapter';

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock('../../../locales/LocaleProvider', () => ({
  useLocale: () => ({ locale: 'en' }),
}));

describe('ChatInboxScreen adapter loading state', () => {
  beforeEach(() => {
    questFixtureAdapter.reset();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('shows the adapter load error and retries through listConversations', async () => {
    const listConversations = jest.spyOn(questFixtureAdapter, 'listConversations')
      .mockImplementationOnce(() => {
        throw new Error('adapter unavailable');
      });

    const view = await render(<ChatInboxScreen viewerId="student-demo" />);

    expect(view.getByText('We could not load your conversations.')).toBeTruthy();
    expect(view.queryByText('Your Quest conversations will appear here.')).toBeNull();

    listConversations.mockImplementation(() => []);
    await fireEvent.press(view.getByText('Try again'));
    await waitFor(() => expect(view.getByText('Your Quest conversations will appear here.')).toBeTruthy());

    expect(listConversations).toHaveBeenCalledWith('student-demo');
  });
});
