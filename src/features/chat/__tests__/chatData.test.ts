import { DEFAULT_PROTOTYPE_VIEWER_ID, createQuestFixtureAdapter, questFixtureAdapter } from '../../questBoard/questFixtureAdapter';
import { getChatRouteParams } from '../chatData';
import { QuestStatus } from '../../questBoard/types';

describe('adapter-owned fixture chat data', () => {
  const fixedNow = new Date('2026-08-12T09:00:00.000Z');

  beforeEach(() => {
    questFixtureAdapter.reset();
  });

  it('projects seeded server conversation IDs and messages without a chatData fixture copy', () => {
    const conversation = questFixtureAdapter.getConversation('campus-survey-crew', DEFAULT_PROTOTYPE_VIEWER_ID, fixedNow);

    expect(conversation).toMatchObject({
      id: 'campus-survey-crew',
      capability: { conversationId: 'campus-survey-crew', canRead: true, canWrite: true, readOnly: false },
    });
    expect(questFixtureAdapter.getConversationMessages('campus-survey-crew', DEFAULT_PROTOTYPE_VIEWER_ID, fixedNow)).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'campus-1', sender: 'other' }),
    ]));
  });

  it('lists only readable viewer conversations and rejects a non-member send', () => {
    const created = createQuestFixtureAdapter({ now: fixedNow });
    created.joinDirect('print-documents', DEFAULT_PROTOTYPE_VIEWER_ID, fixedNow);

    expect(created.listConversations(DEFAULT_PROTOTYPE_VIEWER_ID, fixedNow).some((item) => item.id === 'conversation-fixture-print-documents')).toBe(true);
    expect(created.getConversation('conversation-fixture-print-documents', 'not-a-member', fixedNow)).toBeNull();
    expect(created.getConversationMessages('conversation-fixture-print-documents', 'not-a-member', fixedNow)).toEqual([]);

    const denied = created.sendMessage('conversation-fixture-print-documents', 'not-a-member', 'Should be rejected.', fixedNow);
    expect(denied.ok).toBe(false);
    if (!denied.ok) expect(denied.error.code).toBe('FORBIDDEN');
  });

  it('sends session-only messages, notifies subscribers, and clears them on reset', () => {
    const created = createQuestFixtureAdapter({ now: fixedNow });
    created.joinDirect('print-documents', DEFAULT_PROTOTYPE_VIEWER_ID, fixedNow);
    const listener = jest.fn();
    created.subscribe(listener);

    const sent = created.sendMessage('conversation-fixture-print-documents', DEFAULT_PROTOTYPE_VIEWER_ID, 'Meet at the copy shop.', fixedNow);

    expect(sent.ok).toBe(true);
    if (sent.ok) {
      expect(sent.value).toMatchObject({ sender: 'me', text: { en: 'Meet at the copy shop.', th: 'Meet at the copy shop.' } });
      expect(sent.value.id).toBe('conversation-fixture-print-documents-message-2');
    }
    expect(created.getConversationMessages('conversation-fixture-print-documents', DEFAULT_PROTOTYPE_VIEWER_ID, fixedNow)).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'conversation-fixture-print-documents-message-2' }),
    ]));
    expect(listener).toHaveBeenCalledTimes(1);

    created.reset();
    expect(created.getConversation('conversation-fixture-print-documents', DEFAULT_PROTOTYPE_VIEWER_ID, fixedNow)).toBeNull();
  });

  it('marks a viewer read cursor and projects unread counts from adapter state', () => {
    const created = createQuestFixtureAdapter({ now: fixedNow });
    const before = created.getConversation('campus-survey-crew', DEFAULT_PROTOTYPE_VIEWER_ID, fixedNow);
    expect(before?.unreadCount).toBe(2);

    const marked = created.markConversationRead('campus-survey-crew', DEFAULT_PROTOTYPE_VIEWER_ID, fixedNow);
    expect(marked.ok).toBe(true);
    expect(created.getConversation('campus-survey-crew', DEFAULT_PROTOTYPE_VIEWER_ID, fixedNow)?.unreadCount).toBe(0);

    const received = created.sendMessage('campus-survey-crew', 'demo-hirer', 'One more detail.', fixedNow);
    expect(received.ok).toBe(true);
    expect(created.getConversation('campus-survey-crew', DEFAULT_PROTOTYPE_VIEWER_ID, fixedNow)?.unreadCount).toBe(1);
  });

  it('enforces terminal, dispute, and pending partial-start capabilities from Quest context', () => {
    const created = createQuestFixtureAdapter({ now: fixedNow });
    const terminal = created.getConversation('conversation-fixture-clean-study-table', 'demo-worker-3', fixedNow);
    expect(terminal?.capability).toMatchObject({ canRead: true, canWrite: false, readOnly: true, readOnlyReason: 'TERMINAL' });
    const terminalSend = created.sendMessage('conversation-fixture-clean-study-table', 'demo-worker-3', 'No new message.', fixedNow);
    expect(terminalSend.ok).toBe(false);

    const disputed = created.getConversation('conversation-fixture-clean-fridge', 'demo-worker-3', fixedNow);
    expect(disputed?.status).toBe(QuestStatus.QUEST_DISPUTED);
    expect(disputed?.capability).toMatchObject({ canRead: true, canWrite: true, readOnly: false });

    const pending = created.getConversation('conversation-fixture-partial-group-start-demo', 'partial-worker-a', fixedNow);
    expect(pending).toBeTruthy();
    const pendingAtStart = created.getConversation('conversation-fixture-partial-group-start-demo', 'partial-worker-a', new Date('2026-08-26T10:00:00.000Z'));
    expect(pendingAtStart?.capability).toMatchObject({ canRead: true, canWrite: true, readOnly: false });
    const afterDeadline = created.getConversation('conversation-fixture-partial-group-start-demo', 'partial-worker-a', new Date('2026-08-26T10:05:00.000Z'));
    expect(afterDeadline?.capability).toMatchObject({ canRead: true, canWrite: false, readOnly: true, readOnlyReason: 'TERMINAL' });
  });

  it('does not recover a conversation from an unmatched Quest context', () => {
    expect(questFixtureAdapter.getConversation('does-not-exist', DEFAULT_PROTOTYPE_VIEWER_ID)).toBeNull();
    expect(questFixtureAdapter.getConversation('quest-move-boxes-group', DEFAULT_PROTOTYPE_VIEWER_ID)).toBeNull();
  });

  it('denies route write capability when the server conversation id does not match', () => {
    const params = getChatRouteParams({
      conversationId: 'conversation-server-a',
      viewerId: DEFAULT_PROTOTYPE_VIEWER_ID,
      capability: { conversationId: 'conversation-server-b', canRead: true, canWrite: true, readOnly: false },
    });

    expect(params).toMatchObject({
      id: 'conversation-server-a',
      conversationId: 'conversation-server-a',
      canRead: 'false',
      canWrite: 'false',
      readOnly: 'true',
      readOnlyReason: 'NOT_A_MEMBER',
    });
  });
});
