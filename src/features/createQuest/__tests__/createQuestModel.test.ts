import { calculateQuestEscrow, formatDraftReward, getDraftRewardSatang, getHeadcountForParticipation, getQuestPublishCheck, getRewardValidationError, getSchedulePickerValue, getScheduleTimeValue, initialDraft, isQuestDraftDirty, MAX_REWARD_THB, parseStoredQuestDraft, parseStoredQuestSnapshot, toQuestDraftPayload, toQuestBoardModeValues } from '../createQuestModel';

describe('Create Quest model', () => {
  describe('getHeadcountForParticipation', () => {
    test('always returns one Worker for SINGLE', () => {
      expect(getHeadcountForParticipation('SINGLE', '')).toBe('1');
      expect(getHeadcountForParticipation('SINGLE', '4')).toBe('1');
    });

    test('keeps the editable maximum for GROUP', () => {
      expect(getHeadcountForParticipation('GROUP', '4')).toBe('4');
    });
  });

  describe('isQuestDraftDirty', () => {
    test('detects proof and location changes', () => {
      expect(isQuestDraftDirty({ ...initialDraft, proofRequired: 'optional' })).toBe(true);
      expect(isQuestDraftDirty({ ...initialDraft, locationMode: 'ONLINE' })).toBe(true);
    });

    test('does not flag an untouched draft', () => {
      expect(isQuestDraftDirty(initialDraft)).toBe(false);
    });
  });

  describe('toQuestBoardModeValues', () => {
    test('maps draft values through the canonical Quest Board vocabulary', () => {
      expect(toQuestBoardModeValues({
        candidateMode: 'CANDIDATE',
        participation: 'GROUP',
        locationMode: 'ONLINE',
      })).toEqual({
        candidateMode: 'CANDIDATE',
        participationMode: 'team',
        locationMode: 'online',
      });
    });
  });

  describe('getRewardValidationError', () => {
    test('accepts zero and rewards with up to two decimal places', () => {
      expect(getRewardValidationError('0')).toBeUndefined();
      expect(getRewardValidationError('1250.50')).toBeUndefined();
    });

    test('rejects malformed decimal values', () => {
      expect(getRewardValidationError('12.345')).toContain('up to 2 decimal places');
      expect(getRewardValidationError('1.2.3')).toContain('up to 2 decimal places');
    });

    test('rejects rewards outside the client-side safety bound', () => {
      expect(getRewardValidationError(String(MAX_REWARD_THB + 1))).toContain('between ฿0');
    });
  });

  describe('headcount publish validation', () => {
    const publishableGroupDraft = {
      ...initialDraft,
      title: 'Quest',
      description: 'Do work',
      conditions: 'Work is complete',
      startDate: '2099-08-26',
      deadline: '2099-08-27',
      startTime: '09:00',
      endTime: '12:00',
      location: 'Activity building',
      wage: '250',
      participation: 'GROUP' as const,
    };

    test.each(['0', '-2', '', 'not-a-number', '2.5'])('blocks invalid GROUP headcount %p without one-place escrow fallback', (headcount) => {
      const check = getQuestPublishCheck({ ...publishableGroupDraft, headcount });

      expect(check.blockers).toContain('HEADCOUNT_INVALID');
      expect(check.canPublish).toBe(false);
      expect(check.escrow).toMatchObject({ headcount: 0, rewardPoolSatang: 0, platformFeeSatang: 0, totalRequiredSatang: 0 });
    });

    test('preserves a valid positive GROUP headcount for publishing and escrow', () => {
      const check = getQuestPublishCheck({ ...publishableGroupDraft, headcount: '3' });

      expect(check.blockers).not.toContain('HEADCOUNT_INVALID');
      expect(check.canPublish).toBe(true);
      expect(check.escrow).toMatchObject({ headcount: 3, rewardPoolSatang: 75000 });
    });

    test('keeps the SINGLE headcount invariant at one', () => {
      const draft = { ...publishableGroupDraft, participation: 'SINGLE' as const, headcount: '9' };
      const check = getQuestPublishCheck(draft);

      expect(toQuestDraftPayload(draft).headcount).toBe(1);
      expect(check.blockers).not.toContain('HEADCOUNT_INVALID');
      expect(check.escrow.headcount).toBe(1);
    });
  });

  describe('satang payload and Escrow', () => {
    test('parses THB input into integer satang without floating point rounding', () => {
      expect(getDraftRewardSatang({ wage: '1250.50' })).toBe(125050);
      expect(getDraftRewardSatang({ wage: '12.345' })).toBeNull();
      expect(formatDraftReward({ wage: '1250.50' })).toBe('฿1,250.50');
    });

    test('uses a label-only location and canonical mode values in the payload', () => {
      const payload = toQuestDraftPayload({ ...initialDraft, wage: '250.50', location: 'Library entrance', locationMode: 'ON_CAMPUS', participation: 'GROUP', headcount: '3', candidateMode: 'CANDIDATE' });
      expect(payload).toMatchObject({ rewardSatang: 25050, participation: 'GROUP', candidateMode: 'CANDIDATE', location: { label: 'Library entrance' } });
      expect(Object.keys(payload.location)).toEqual(['label']);
    });

    test('reports reward pool plus per-Worker Platform Fee with ceiling rounding', () => {
      expect(calculateQuestEscrow(101, 3, 500)).toMatchObject({ rewardPoolSatang: 303, platformFeeSatangPerWorker: 6, platformFeeSatang: 18, totalRequiredSatang: 321 });
    });

    test('allows an image-free publish with a warning when required fields are valid', () => {
      const check = getQuestPublishCheck({ ...initialDraft, title: 'Quest', description: 'Do work', conditions: 'Work is complete', startDate: '2099-08-26', deadline: '2099-08-27', startTime: '09:00', endTime: '12:00', location: 'Activity building', wage: '250' });
      expect(check.canPublish).toBe(true);
      expect(check.blockers).toEqual([]);
      expect(check.warnings).toContain('NO_IMAGES');
      expect(check.escrow.totalRequiredSatang).toBe(26250);
    });
  });

  describe('getSchedulePickerValue', () => {
    test('uses the latest draft value on Android instead of stale iOS picker state', () => {
      const draftValue = new Date(2026, 9, 20, 15, 45);
      const stalePickerValue = new Date(2026, 7, 20, 9, 0);

      expect(getSchedulePickerValue('android', draftValue, stalePickerValue)).toBe(draftValue);
    });

    test('keeps the temporary spinner value on iOS', () => {
      const draftValue = new Date(2026, 9, 20, 15, 45);
      const temporaryPickerValue = new Date(2026, 9, 21, 16, 0);

      expect(getSchedulePickerValue('ios', draftValue, temporaryPickerValue)).toBe(temporaryPickerValue);
    });
  });

  describe('getScheduleTimeValue', () => {
    test('keeps the selected time independent from an epoch date', () => {
      const timeOnlyPickerValue = new Date(0);
      timeOnlyPickerValue.setHours(7, 0, 0, 0);

      expect(getScheduleTimeValue(timeOnlyPickerValue)).toBe('07:00');
    });
  });

  describe('parseStoredQuestDraft', () => {
    test('clears epoch dates left by the old time picker flow', () => {
      expect(parseStoredQuestDraft(JSON.stringify({ startDate: '1970-01-01', startTime: '07:00' }))).toMatchObject({
        startDate: '',
        startTime: '07:00',
      });
    });

    test('restores valid fields and limits image previews to three', () => {
      const draft = parseStoredQuestDraft(JSON.stringify({
        title: 'Design a poster',
        tag: 'design',
        imageUris: ['one', 'two', 'three', 'four'],
        candidateMode: 'review',
        participation: 'team',
      }));

      expect(draft).toMatchObject({
        title: 'Design a poster',
        tag: 'design',
        candidateMode: 'CANDIDATE',
        participation: 'GROUP',
      });
      expect(draft?.imageUris).toEqual(['one', 'two', 'three']);
    });

    test('migrates legacy mode and participation values', () => {
      expect(parseStoredQuestDraft(JSON.stringify({
        candidateMode: 'NO_CANDIDATE',
        participation: 'single',
      }))).toMatchObject({
        candidateMode: 'FIRST_COME_FIRST_SERVED',
        participation: 'SINGLE',
        headcount: '1',
      });
    });

    test('restores the current step, state, schedule, and location mode', () => {
      expect(parseStoredQuestSnapshot(JSON.stringify({
        draft: { startTime: '09:00', endTime: '12:00', locationMode: 'on-campus', location: 'Faculty building' },
        step: 2,
        state: 'OPEN',
      }))).toMatchObject({
        step: 2,
        state: 'OPEN',
        draft: { startTime: '09:00', endTime: '12:00', locationMode: 'ON_CAMPUS', location: 'Faculty building' },
      });
    });

    test('supports legacy flat drafts with safe defaults', () => {
      expect(parseStoredQuestSnapshot(JSON.stringify({ title: 'Legacy Quest', state: 'DRAFT' }))).toMatchObject({
        step: 1,
        state: 'DRAFT',
        draft: { title: 'Legacy Quest', startTime: '', endTime: '', locationMode: 'ON_CAMPUS' },
      });
    });

    test('normalizes unsupported stored values and enforces single headcount', () => {
      expect(parseStoredQuestDraft(JSON.stringify({ participation: 'SINGLE', candidateMode: 'unknown', locationMode: 'unknown', headcount: '9', imageUris: [1, 'valid', null] }))).toMatchObject({
        participation: 'SINGLE',
        candidateMode: 'FIRST_COME_FIRST_SERVED',
        locationMode: 'ON_CAMPUS',
        headcount: '1',
        imageUris: ['valid'],
      });
    });

    test('ignores corrupt stored data', () => {
      expect(parseStoredQuestDraft('{not-json')).toBeNull();
      expect(parseStoredQuestDraft('null')).toBeNull();
      expect(parseStoredQuestSnapshot('{not-json')).toBeNull();
    });
  });
});
