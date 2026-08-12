import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { ProfileHeader, ProfileStats, Reviews } from '../features/profile/components/ProfileComponents';

describe('Student Profile presentation', () => {
  it('keeps a long Student name readable and the edit action available', async () => {
    const view = await render(
      <ProfileHeader
        data={{
          department: 'Agro-Industrial Innovation and Technology',
          faculty: 'Agro-Industry',
          name: 'Siraphat THAPPHA with a longer display name',
          occupation: 'Teacher',
          profileImage: '',
        }}
        editProfileLabel="Edit your profile"
        onEditPress={() => undefined}
      />
    );

    const nameStyle = StyleSheet.flatten(view.getByText('Siraphat THAPPHA with a longer display name').props.style);

    expect(nameStyle).toMatchObject({ maxWidth: '100%', textAlign: 'center' });
    expect(view.getByText('Edit your profile')).toBeTruthy();
  });

  it('renders profile statistics and filters Reviews by star rating', async () => {
    const view = await render(<>
      <ProfileStats stats={{ totalQuests: 42, ratingAverage: 4.9, ratingCount: 2, distribution: { 5: 1, 4: 1, 3: 0, 2: 0, 1: 0 } }} ratingLabel="Profile Rating" questsLabel="Total Quests" reviewCountLabel="reviews" emptyText="No ratings" />
      <Reviews
        reviews={[
          { id: 'review-5', reviewerName: 'Alex', reviewerAvatar: '', rating: 5, comment: 'Excellent', createdAt: '2026-07-01', questTitle: '' },
          { id: 'review-3', reviewerName: 'Mina', reviewerAvatar: '', rating: 3, comment: 'Good', createdAt: '2026-06-01', questTitle: '' },
        ]}
        sectionTitle="Reviews"
        emptyText="No reviews"
        allLabel="All"
      />
    </>);

    expect(view.getByText('4.9')).toBeTruthy();
    expect(view.getByText('42')).toBeTruthy();
    expect(view.getByText('Excellent')).toBeTruthy();
    expect(view.getByText('Good')).toBeTruthy();
    fireEvent.press(view.getByRole('button', { name: '5 stars' }));
    await waitFor(() => {
      expect(view.getByText('Excellent')).toBeTruthy();
      expect(view.queryByText('Good')).toBeNull();
    });
  });
});
