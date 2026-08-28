import { fireEvent, render } from '@testing-library/react-native';

import ChatConversationScreen from '../ChatConversationScreen';
import { questFixtureAdapter } from '../../questBoard/questFixtureAdapter';

const mockRouter = { back: jest.fn(), replace: jest.fn() };
const mockRouteParams: {
  id?: string;
  conversationId?: string;
  questId?: string;
  ownerName?: string;
  questTitle?: string;
  viewerId?: string;
  canRead?: string;
  canWrite?: string;
  readOnly?: string;
  readOnlyReason?: string;
} = {};

jest.mock('expo-router', () => ({
  useRouter: () => mockRouter,
  useLocalSearchParams: () => mockRouteParams,
}));

jest.mock('../../../locales/LocaleProvider', () => ({
  useLocale: () => ({ locale: 'en' }),
}));

describe('ChatConversationScreen', () => {
  beforeEach(() => {
    questFixtureAdapter.reset();
    questFixtureAdapter.joinDirect('print-documents', 'student-demo', new Date('2026-08-12T09:00:00.000Z'));
    mockRouter.back.mockClear();
    mockRouter.replace.mockClear();
    mockRouteParams.id = 'conversation-fixture-print-documents';
    mockRouteParams.conversationId = 'conversation-fixture-print-documents';
    mockRouteParams.questId = 'print-documents';
    mockRouteParams.ownerName = 'Mild P.';
    mockRouteParams.questTitle = 'Photocopy course documents';
    mockRouteParams.viewerId = 'student-demo';
    mockRouteParams.canRead = 'true';
    mockRouteParams.canWrite = 'true';
    mockRouteParams.readOnly = 'false';
    delete mockRouteParams.readOnlyReason;
  });

  it('opens a dynamic Quest owner conversation and sends a message', async () => {
    const view = await render(<ChatConversationScreen />);

    expect(view.getAllByText('Photocopy course documents').length).toBeGreaterThan(0);
    expect(view.getByText('Mild P. · Quest owner')).toBeTruthy();
    expect(view.getByText('Hi! Feel free to ask about this Quest.')).toBeTruthy();

    await fireEvent.changeText(view.getByLabelText('Message the Quest owner…'), 'Could you confirm the meeting point?');
    await fireEvent.press(view.getByLabelText('Send message'));

    expect(view.getByText('Could you confirm the meeting point?')).toBeTruthy();
  });

  it('keeps the adapter conversation read-only when capability route context is missing', async () => {
    delete mockRouteParams.conversationId;
    delete mockRouteParams.canRead;
    delete mockRouteParams.canWrite;
    delete mockRouteParams.readOnly;

    const view = await render(<ChatConversationScreen />);

    expect(view.getByTestId('conversation-read-only-banner')).toBeTruthy();
    expect(view.getByText('Hi! Feel free to ask about this Quest.')).toBeTruthy();
    expect(view.queryByLabelText('Message the Quest owner…')).toBeNull();
  });

  it('keeps a terminal conversation readable but read-only', async () => {
    mockRouteParams.id = 'conversation-fixture-clean-study-table';
    mockRouteParams.conversationId = 'conversation-fixture-clean-study-table';
    mockRouteParams.questId = 'clean-study-table';
    mockRouteParams.viewerId = 'demo-worker-3';
    mockRouteParams.canRead = 'true';
    mockRouteParams.canWrite = 'false';
    mockRouteParams.readOnly = 'true';
    mockRouteParams.readOnlyReason = 'TERMINAL';

    const view = await render(<ChatConversationScreen />);

    expect(view.getByTestId('conversation-read-only-banner')).toBeTruthy();
    expect(view.getByText('This Quest is complete or cancelled. You can still read the conversation, but new messages are disabled.')).toBeTruthy();
    expect(view.queryByLabelText('Message the Quest owner…')).toBeNull();
  });

  it('keeps a disputed conversation writable for an authorized member', async () => {
    mockRouteParams.id = 'conversation-fixture-clean-fridge';
    mockRouteParams.conversationId = 'conversation-fixture-clean-fridge';
    mockRouteParams.questId = 'clean-fridge';
    mockRouteParams.viewerId = 'demo-worker-3';
    mockRouteParams.ownerName = 'Dispute owner';
    mockRouteParams.questTitle = 'Disputed Quest';
    mockRouteParams.canRead = 'true';
    mockRouteParams.canWrite = 'true';
    mockRouteParams.readOnly = 'false';
    delete mockRouteParams.readOnlyReason;

    const view = await render(<ChatConversationScreen />);

    expect(view.queryByTestId('conversation-read-only-banner')).toBeNull();
    await fireEvent.changeText(view.getByLabelText('Message the Quest owner…'), 'I can share the work evidence.');
    await fireEvent.press(view.getByLabelText('Send message'));

    expect(view.getByText('I can share the work evidence.')).toBeTruthy();
  });
});
