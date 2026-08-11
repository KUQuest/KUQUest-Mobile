import { render } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { ProfileHeader } from '../features/profile/components/ProfileComponents';

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
});
