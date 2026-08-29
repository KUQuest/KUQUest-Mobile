import { fireEvent, render } from '@testing-library/react-native';

import ChatInboxScreen from '../ChatInboxScreen';
import { setActivePrototypePersona } from '../../../components/ui/prototypeMenuState';
import { questFixtureAdapter } from '../../questBoard/questFixtureAdapter';

const mockRouter = { push: jest.fn() };

jest.mock('expo-router', () => ({
  useRouter: () => mockRouter,
}));

jest.mock('../../../locales/LocaleProvider', () => ({
  useLocale: () => ({ locale: 'en' }),
}));

describe('ChatInboxScreen navigation', () => {
  beforeEach(() => {
    questFixtureAdapter.reset();
    mockRouter.push.mockClear();
  });

  it('forwards the server conversation and capability context when opening a Quest chat', async () => {
    const view = await render(<ChatInboxScreen viewerId="student-demo" />);

    await fireEvent.press(view.getByTestId('chat-conversation-conversation-fixture-buy-lunch'));

    expect(mockRouter.push).toHaveBeenCalledWith({
      pathname: '/chat/[id]',
      params: {
        id: 'conversation-fixture-buy-lunch',
        conversationId: 'conversation-fixture-buy-lunch',
        questId: 'buy-lunch',
        viewerId: 'student-demo',
        canRead: 'true',
        canWrite: 'true',
        readOnly: 'false',
      },
    });
  });

  it('uses the active Prototype persona when no viewer override is provided', async () => {
    setActivePrototypePersona('demo-worker-3');
    const conversation = questFixtureAdapter.listConversations('demo-worker-3')[0];
    expect(conversation).toBeTruthy();

    const view = await render(<ChatInboxScreen />);
    await fireEvent.press(view.getByTestId(`chat-conversation-${conversation.id}`));

    expect(mockRouter.push).toHaveBeenCalledWith(expect.objectContaining({
      params: expect.objectContaining({ viewerId: 'demo-worker-3' }),
    }));
  });
});
