import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { Experience, MyWork, ProfileHeader, ProfileStats, Reviews } from '../components/ProfileComponents';

describe('Student Profile presentation', () => {
  it('keeps a long Student name readable and the edit action available', async () => {
    const view = await render(
      <ProfileHeader
        data={{
          department: 'Agro-Industrial Innovation and Technology',
          faculty: 'Agro-Industry',
          name: 'Siraphat THAPPHA with a longer display name',
          occupation: 'Teacher',
          university: 'State University',
          academicYear: '3',
          profileImage: '',
        }}
        editProfileLabel="Edit your profile"
        onEditPress={() => undefined}
      />
    );

    const nameStyle = StyleSheet.flatten(view.getByText('Siraphat THAPPHA with a longer display name').props.style);

    expect(nameStyle).toMatchObject({ maxWidth: '100%', textAlign: 'center' });
    expect(view.getByText('Edit your profile')).toBeTruthy();
    expect(view.getByText('Agro-Industry')).toBeTruthy();
    expect(view.getByText('Agro-Industrial Innovation and Technology')).toBeTruthy();
    expect(view.getByText('State University · Teacher · 3')).toBeTruthy();
  });

  it('renders profile statistics and filters Reviews by star rating', async () => {
    const view = await render(<>
      <ProfileStats stats={{ totalQuests: 42, ratingAverage: 4.9, ratingCount: 2, distribution: { 5: 1, 4: 1, 3: 0, 2: 0, 1: 0 } }} ratingLabel="User Rating" questsLabel="Total Quests" />
      <Reviews
        reviews={[
          { id: 'review-5', reviewerName: 'Alex', reviewerAvatar: '', rating: 5, comment: 'Excellent', createdAt: '2026-07-01', questTitle: '' },
          { id: 'review-3', reviewerName: 'Mina', reviewerAvatar: '', rating: 3, comment: 'Good', createdAt: '2026-06-01', questTitle: 'Design review' },
        ]}
        stats={{ totalQuests: 42, ratingAverage: 4.9, ratingCount: 2, distribution: { 5: 1, 4: 1, 3: 0, 2: 0, 1: 0 } }}
        sectionTitle="Reviews"
        emptyText="No reviews"
        allLabel="All"
        reviewCountLabel="reviews"
      />
    </>);

    expect(view.getAllByText('4.9')).toHaveLength(2);
    expect(view.getByText('42')).toBeTruthy();
    expect(view.getByText('Excellent')).toBeTruthy();
    expect(view.getByText('Good')).toBeTruthy();
    expect(view.getByText('Design review')).toBeTruthy();
    fireEvent.press(view.getByRole('button', { name: '5 stars' }));
    await waitFor(() => {
      expect(view.getByText('Excellent')).toBeTruthy();
      expect(view.queryByText('Good')).toBeNull();
    });
  });

  it('renders the employment type for each experience', async () => {
    const view = await render(
      <Experience
        experiences={[{
          id: 'experience-1',
          title: 'Frontend Developer',
          employmentType: 'Internship',
          organization: 'Tech Startup Inc.',
          description: 'Built responsive UI components.',
          startedAt: '2023-06-01',
          endedAt: null,
        }]}
        sectionTitle="Experience"
        emptyText="No experience"
        presentLabel="Present"
        locale="en"
      />
    );

    expect(view.getByText('Internship')).toBeTruthy();
  });

  it('keeps Portfolio Work usable when an optional image is missing', async () => {
    const view = await render(
      <MyWork works={[{ id: 'work-1', title: 'Quest project', detail: 'A useful project', imageUri: '' }]} sectionTitle="My work" emptyText="No work" noImageText="No image" />
    );

    expect(view.getByText('Quest project')).toBeTruthy();
    expect(view.getByText('A useful project')).toBeTruthy();
    expect(view.getByText('No image')).toBeTruthy();
  });
});
