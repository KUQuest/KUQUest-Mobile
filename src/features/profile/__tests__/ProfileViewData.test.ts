import type { ProfileExperience, ProfileTag } from '../components/ProfileComponents';
import { selectTopProfileTags, sortExperiences } from '../profileViewData';

describe('Student Profile view data rules', () => {
  test('selects the three most frequent tags with stable tie ordering', () => {
    const tags: ProfileTag[] = [
      { id: 'design', name: 'Design', questCount: 4 },
      { id: 'tutor', name: 'Tutor', questCount: 7 },
      { id: 'web', name: 'Web Dev', questCount: 7 },
      { id: 'research', name: 'Research', questCount: 2 },
    ];

    expect(selectTopProfileTags(tags).map((tag) => tag.name)).toEqual(['Tutor', 'Web Dev', 'Design']);
  });

  test('renders Experience in newest-started-first order, preserving ties', () => {
    const experiences: ProfileExperience[] = [
      { id: 'old', title: 'Old', employmentType: 'Internship', organization: '', description: '', startedAt: '2022-01-01', endedAt: '2022-06-01' },
      { id: 'new', title: 'New', employmentType: 'Part-time', organization: '', description: '', startedAt: '2024-01-01', endedAt: null },
      { id: 'tie', title: 'Tie', employmentType: 'Part-time', organization: '', description: '', startedAt: '2024-01-01', endedAt: null },
    ];

    expect(sortExperiences(experiences).map((experience) => experience.id)).toEqual(['new', 'tie', 'old']);
  });
});
