import { parseQuestIntent, parseQuestRouteId } from '../questRoute';
import { parseBoardPreviewState } from '../questBoardHarness';

describe('Quest route parsing', () => {
  it('accepts only a single non-empty quest id', () => {
    expect(parseQuestRouteId('quest-1')).toBe('quest-1');
    expect(parseQuestRouteId(['quest-1'])).toBe('quest-1');
    expect(parseQuestRouteId(['quest-1', 'quest-2'])).toBeUndefined();
    expect(parseQuestRouteId('')).toBeUndefined();
  });

  it('accepts only known preview and intent values', () => {
    expect(parseQuestIntent('apply')).toBe('apply');
    expect(parseQuestIntent('unexpected')).toBeUndefined();
    expect(parseBoardPreviewState('application-pending')).toBe('application-pending');
    expect(parseBoardPreviewState('unexpected')).toBeUndefined();
    expect(parseBoardPreviewState(['application-pending', 'full'])).toBeUndefined();
  });
});
