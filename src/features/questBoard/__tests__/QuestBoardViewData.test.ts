import {
  applyQuestBoardFilters,
  getQuestAvailability,
  getVisibleQuests,
  sortQuests,
} from '../questBoardViewData';
import type { QuestBoardFilter, QuestBoardQuest } from '../types';

const quests: QuestBoardQuest[] = [
  {
    id: 'design-match',
    title: 'Design a faculty event poster',
    category: 'design',
    tags: ['Design & creative', 'Campus life'],
    description: 'Create a poster for the faculty event.',
    completionCriteria: 'A final PNG poster is approved.',
    proofRequired: 'required',
    rewardPerPerson: 700,
    headcount: 2,
    acceptedParticipants: 1,
    startDate: '2026-08-14',
    deadline: '2026-08-16',
    postedAt: '2026-08-10T09:00:00.000Z',
    location: 'On campus',
    locationMode: 'on-campus',
    participationMode: 'single',
    candidateMode: 'REVIEW',
    creator: { name: 'Nicha', faculty: 'Architecture' },
    studentInterestMatch: true,
    ownerStudentId: 'creator-1',
  },
  {
    id: 'tech-soon',
    title: 'Fix a small React bug',
    category: 'technology',
    tags: ['Technology'],
    description: 'Resolve a small UI issue.',
    completionCriteria: 'The fix passes review.',
    proofRequired: 'optional',
    rewardPerPerson: 450,
    headcount: 1,
    acceptedParticipants: 0,
    startDate: '2026-08-13',
    deadline: '2026-08-13',
    postedAt: '2026-08-11T09:00:00.000Z',
    location: 'Online',
    locationMode: 'online',
    participationMode: 'single',
    candidateMode: 'NO_CANDIDATE',
    creator: { name: 'Ploy', faculty: 'Engineering' },
    studentInterestMatch: false,
    ownerStudentId: 'creator-2',
  },
  {
    id: 'campus-full',
    title: 'Welcome desk helper',
    category: 'campus-life',
    tags: ['Campus life'],
    description: 'Help visitors find their way.',
    completionCriteria: 'Attend the full shift.',
    proofRequired: 'none',
    rewardPerPerson: 300,
    headcount: 1,
    acceptedParticipants: 1,
    startDate: '2026-08-15',
    deadline: '2026-08-20',
    postedAt: '2026-08-09T09:00:00.000Z',
    location: 'On campus',
    locationMode: 'on-campus',
    participationMode: 'single',
    candidateMode: 'NO_CANDIDATE',
    creator: { name: 'Beam', faculty: 'Education' },
    studentInterestMatch: false,
    ownerStudentId: 'creator-3',
  },
  {
    id: 'own-quest',
    title: 'My own quest',
    category: 'technology',
    tags: ['Technology'],
    description: 'Created by the current Student.',
    completionCriteria: 'Complete it.',
    proofRequired: 'none',
    rewardPerPerson: 1000,
    headcount: 1,
    acceptedParticipants: 0,
    startDate: '2026-08-14',
    deadline: '2026-08-20',
    postedAt: '2026-08-12T09:00:00.000Z',
    location: 'Online',
    locationMode: 'online',
    participationMode: 'single',
    candidateMode: 'REVIEW',
    creator: { name: 'Current Student', faculty: 'Engineering' },
    studentInterestMatch: true,
    ownerStudentId: 'current-student',
  },
];

describe('Quest Board view data', () => {
  it('shows only discoverable Quests and excludes the current Student own Quest', () => {
    expect(getVisibleQuests(quests, { currentStudentId: 'current-student', now: new Date('2026-08-12T09:00:00.000Z') }).map((quest) => quest.id)).toEqual([
      'design-match',
      'tech-soon',
    ]);
  });

  it('filters by search text, categories, reward range, deadline, and participation mode', () => {
    const filter: QuestBoardFilter = {
      query: 'poster',
      categories: ['design'],
      rewardRange: '500-1000',
      deadline: 'within-7-days',
      locationModes: ['on-campus'],
    };

    expect(applyQuestBoardFilters(quests, filter, { currentStudentId: 'current-student', now: new Date('2026-08-12T09:00:00.000Z') }).map((quest) => quest.id)).toEqual(['design-match']);
  });

  it('uses deterministic recommended and secondary sort order', () => {
    const discoverable = getVisibleQuests(quests, { currentStudentId: 'current-student', now: new Date('2026-08-12T09:00:00.000Z') });

    expect(sortQuests(discoverable, 'recommended').map((quest) => quest.id)).toEqual(['design-match', 'tech-soon']);
    expect(sortQuests(discoverable, 'reward-highest').map((quest) => quest.id)).toEqual(['design-match', 'tech-soon']);
    expect(sortQuests(discoverable, 'deadline-soonest').map((quest) => quest.id)).toEqual(['tech-soon', 'design-match']);
  });

  it('reports availability from capacity and deadline independently', () => {
    expect(getQuestAvailability(quests[2], new Date('2026-08-12T09:00:00.000Z'))).toBe('full');
    expect(getQuestAvailability(quests[1], new Date('2026-08-14T09:00:00.000Z'))).toBe('closed');
    expect(getQuestAvailability(quests[0], new Date('2026-08-12T09:00:00.000Z'))).toBe('available');
  });
});
