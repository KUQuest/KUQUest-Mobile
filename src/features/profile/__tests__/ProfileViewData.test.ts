import type { ProfileExperience } from '../components/ProfileComponents';
import { sortExperiences } from '../profileViewData';

describe('Student Profile view data rules', () => {
  test('renders Experience in newest-started-first order, preserving ties', () => {
    const experiences: ProfileExperience[] = [
      { id: 'old', title: 'Old', employmentType: 'Internship', organization: '', description: '', startedAt: '2022-01-01', endedAt: '2022-06-01' },
      { id: 'new', title: 'New', employmentType: 'Part-time', organization: '', description: '', startedAt: '2024-01-01', endedAt: null },
      { id: 'tie', title: 'Tie', employmentType: 'Part-time', organization: '', description: '', startedAt: '2024-01-01', endedAt: null },
    ];

    expect(sortExperiences(experiences).map((experience) => experience.id)).toEqual(['new', 'tie', 'old']);
  });
});
