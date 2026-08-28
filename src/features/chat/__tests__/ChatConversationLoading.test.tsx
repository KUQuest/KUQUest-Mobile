import { render } from '@testing-library/react-native';

import ChatConversationScreen from '../ChatConversationScreen';
import { questFixtureAdapter } from '../../questBoard/questFixtureAdapter';

const mockRouteParams: {
  id?: string;
  conversationId?: string;
  questId?: string;
  viewerId?: string;
  canRead?: string;
  canWrite?: string;
  readOnly?: string;
} = {
  id: 'conversation-pending',
  conversationId: 'conversation-pending',
  viewerId: 'student-demo',
  canRead: 'true',
  canWrite: 'true',
  readOnly: 'false',
};

jest.mock('expo-router', () => ({
  useRouter: () => ({ back: jest.fn(), replace: jest.fn() }),
  useLocalSearchParams: () => mockRouteParams,
}));

jest.mock('../../../locales/LocaleProvider', () => ({
  useLocale: () => ({ locale: 'en' }),
}));

describe('ChatConversationScreen adapter loading state', () => {
  beforeEach(() => {
    questFixtureAdapter.reset();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('shows not found when the adapter has no conversation instead of using a fallback', async () => {
    const getConversation = jest.spyOn(questFixtureAdapter, 'getConversation');

    const view = await render(<ChatConversationScreen />);

    expect(getConversation).toHaveBeenCalledWith('conversation-pending', 'student-demo');
    expect(view.getByText('This Quest conversation could not be found.')).toBeTruthy();
  });
});
