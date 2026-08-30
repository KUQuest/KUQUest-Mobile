import { createQuestWorkflow, questWorkflow } from '../questWorkflow';
import { DEFAULT_PROTOTYPE_VIEWER_ID, createQuestFixtureAdapter, questFixtureAdapter } from '../questFixtureAdapter';


describe('QuestWorkflow', () => {
  beforeEach(() => {
    questFixtureAdapter.reset();
  });

  it('exposes board and detail projections from the canonical adapter', () => {
    const board = questWorkflow.getQuestBoardModel(DEFAULT_PROTOTYPE_VIEWER_ID);
    const firstQuest = board[0];

    expect(firstQuest).toBeDefined();
    expect(questWorkflow.getQuestBoardQuest(firstQuest.id, DEFAULT_PROTOTYPE_VIEWER_ID)).toEqual(firstQuest);
    expect(questWorkflow.getQuestDetailState(firstQuest.id, DEFAULT_PROTOTYPE_VIEWER_ID)?.quest.id).toBe(firstQuest.id);
    expect(questWorkflow.getMyQuestsModel(DEFAULT_PROTOTYPE_VIEWER_ID)).toEqual(
      questFixtureAdapter.listStates(DEFAULT_PROTOTYPE_VIEWER_ID),
    );
  });

  it('owns board surface states and viewer-specific My Quests projections', () => {
    expect(questWorkflow.getQuestBoardSurfaceModel(DEFAULT_PROTOTYPE_VIEWER_ID, 'loading')).toEqual({ kind: 'loading' });
    expect(questWorkflow.getQuestBoardSurfaceModel(DEFAULT_PROTOTYPE_VIEWER_ID, 'error')).toEqual({ kind: 'error' });
    expect(questWorkflow.getQuestBoardSurfaceModel(DEFAULT_PROTOTYPE_VIEWER_ID, 'empty')).toEqual({ kind: 'empty' });
    expect(questWorkflow.getQuestBoardSurfaceModel(DEFAULT_PROTOTYPE_VIEWER_ID, 'full')).toMatchObject({ kind: 'unavailable', availability: 'full' });

    const projections = questWorkflow.getMyQuestsProjection(DEFAULT_PROTOTYPE_VIEWER_ID);
    expect(projections.find((projection) => projection.quest.id === 'worker-pending-demo')).toMatchObject({
      relationship: 'applicant',
      tab: 'pending',
      hasPendingApplication: true,
      hasAssignment: false,
    });
    expect(projections.find((projection) => projection.quest.id === 'buy-lunch')).toMatchObject({
      relationship: 'worker',
      tab: 'accepted',
      hasAssignment: true,
      groupChatCapability: expect.objectContaining({ canRead: true, canWrite: true }),
    });
  });

  it('derives detail and settlement projections for the explicit viewer', () => {
    const detail = questWorkflow.getQuestDetailProjection('print-documents', DEFAULT_PROTOTYPE_VIEWER_ID);
    expect(detail).toMatchObject({
      quest: { id: 'print-documents' },
      applicationStatus: 'none',
      isOwner: false,
      isAssigned: false,
    });

    const adapter = createQuestFixtureAdapter({ now: new Date('2026-08-13T10:00:00.000Z') });
    const workflow = createQuestWorkflow(adapter);
    workflow.confirmCompletion('buy-lunch', DEFAULT_PROTOTYPE_VIEWER_ID);
    workflow.completeQuest('buy-lunch', 'student-creator-4');

    expect(workflow.getSettlement('buy-lunch', DEFAULT_PROTOTYPE_VIEWER_ID)).toMatchObject({ requestedHeadcount: 1, actualHeadcount: 1 });
  });

  it('routes domain actions and preserves subscription refresh', () => {
    const workflow = createQuestWorkflow(questFixtureAdapter);
    const listener = jest.fn();
    const unsubscribe = workflow.subscribe(listener);

    const result = workflow.joinDirect('print-documents', DEFAULT_PROTOTYPE_VIEWER_ID);

    expect(result.ok).toBe(true);
    expect(listener).toHaveBeenCalled();
    expect(workflow.getQuestDetailState('print-documents', DEFAULT_PROTOTYPE_VIEWER_ID)?.assignments).toEqual(
      expect.arrayContaining([expect.objectContaining({ workerId: DEFAULT_PROTOTYPE_VIEWER_ID })]),
    );

    unsubscribe();
  });

  it('owns clock refresh while a screen is subscribed', () => {
    jest.useFakeTimers();
    try {
      const workflow = createQuestWorkflow(questFixtureAdapter, { refreshIntervalMs: 1000 });
      const listener = jest.fn();
      const initialNow = workflow.getNow();
      const unsubscribe = workflow.subscribe(listener);

      jest.advanceTimersByTime(1000);

      expect(listener).toHaveBeenCalledTimes(1);
      expect(workflow.getNow()).toEqual(new Date(initialNow.getTime() + 1000));
      unsubscribe();
    } finally {
      jest.useRealTimers();
    }
  });
});
