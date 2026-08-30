import { createQuestWorkflow, questWorkflow } from '../questWorkflow';
import { DEFAULT_PROTOTYPE_VIEWER_ID, questFixtureAdapter } from '../questFixtureAdapter';

const fixedNow = new Date('2026-08-12T09:00:00.000Z');

describe('QuestWorkflow', () => {
  beforeEach(() => {
    questFixtureAdapter.reset();
  });

  it('exposes board and detail projections from the canonical adapter', () => {
    const board = questWorkflow.getQuestBoardModel(DEFAULT_PROTOTYPE_VIEWER_ID, fixedNow);
    const firstQuest = board[0];

    expect(firstQuest).toBeDefined();
    expect(questWorkflow.getQuestBoardQuest(firstQuest.id, DEFAULT_PROTOTYPE_VIEWER_ID, fixedNow)).toEqual(firstQuest);
    expect(questWorkflow.getQuestDetailState(firstQuest.id, DEFAULT_PROTOTYPE_VIEWER_ID, fixedNow)?.quest.id).toBe(firstQuest.id);
    expect(questWorkflow.getMyQuestsModel(DEFAULT_PROTOTYPE_VIEWER_ID, fixedNow)).toEqual(
      questFixtureAdapter.listStates(DEFAULT_PROTOTYPE_VIEWER_ID, fixedNow),
    );
  });

  it('routes domain actions and preserves subscription refresh', () => {
    const workflow = createQuestWorkflow(questFixtureAdapter);
    const listener = jest.fn();
    const unsubscribe = workflow.subscribe(listener);

    const result = workflow.joinDirect('print-documents', DEFAULT_PROTOTYPE_VIEWER_ID, fixedNow);

    expect(result.ok).toBe(true);
    expect(listener).toHaveBeenCalled();
    expect(workflow.getQuestDetailState('print-documents', DEFAULT_PROTOTYPE_VIEWER_ID, fixedNow)?.assignments).toEqual(
      expect.arrayContaining([expect.objectContaining({ workerId: DEFAULT_PROTOTYPE_VIEWER_ID })]),
    );

    unsubscribe();
  });
});
