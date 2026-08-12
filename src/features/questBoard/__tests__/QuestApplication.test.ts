import {
  getQuestApplicationOutcome,
  getQuestApplicationStore,
  resetQuestApplicationStatuses,
} from '../questApplication';
import type { QuestBoardQuest } from '../types';

const baseQuest: QuestBoardQuest = {
  id: 'quest-1',
  title: 'Build a prototype',
  category: 'technology',
  tags: ['Technology'],
  description: 'Build a prototype.',
  completionCriteria: 'A working prototype.',
  proofRequired: 'required',
  rewardPerPerson: 700,
  headcount: 2,
  acceptedParticipants: 0,
  startDate: '2026-08-14',
  deadline: '2026-08-20',
  postedAt: '2026-08-10T09:00:00.000Z',
  location: 'Online',
  locationMode: 'online',
  participationMode: 'single',
  candidateMode: 'NO_CANDIDATE',
  creator: { name: 'Creator' },
  studentInterestMatch: false,
  ownerStudentId: 'creator',
};

describe('Quest application outcomes', () => {
  it('accepts an available first-come Quest immediately', () => {
    expect(getQuestApplicationOutcome(baseQuest, new Date('2026-08-12T09:00:00.000Z'))).toBe('accepted');
  });

  it('keeps reviewed-candidate applications pending', () => {
    expect(getQuestApplicationOutcome({ ...baseQuest, candidateMode: 'REVIEW' }, new Date('2026-08-12T09:00:00.000Z'))).toBe('pending');
  });

  it('blocks applications for full or closed Quests', () => {
    expect(getQuestApplicationOutcome({ ...baseQuest, acceptedParticipants: 2 }, new Date('2026-08-12T09:00:00.000Z'))).toBe('full');
    expect(getQuestApplicationOutcome({ ...baseQuest, deadline: '2026-08-11' }, new Date('2026-08-12T09:00:00.000Z'))).toBe('closed');
  });

  it('isolates application state by Student session', () => {
    resetQuestApplicationStatuses();
    const firstStudent = getQuestApplicationStore('student-one');
    const secondStudent = getQuestApplicationStore('student-two');

    firstStudent.setStatus(baseQuest.id, 'accepted');

    expect(firstStudent.getStatus(baseQuest.id)).toBe('accepted');
    expect(secondStudent.getStatus(baseQuest.id)).toBe('none');
  });
});
