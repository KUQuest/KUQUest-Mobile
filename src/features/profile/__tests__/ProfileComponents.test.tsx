import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { AboutMe, Certificates, Experience, MyWork, ProfileHeader, ProfileStats, Reviews } from '../components/ProfileComponents';

describe('Student Profile presentation', () => {
  it('gives an empty About section a clear Settings recovery action', async () => {
    const onEditPress = jest.fn();
    const view = await render(<AboutMe about="" sectionTitle="About" emptyText="No description yet" emptyActionLabel="Manage in Settings" onEditPress={onEditPress} />);

    fireEvent.press(view.getByRole('button', { name: 'Manage in Settings' }));

    expect(onEditPress).toHaveBeenCalledTimes(1);
  });

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

    expect(view.getByText('Siraphat THAPPHA with a longer display name')).toBeTruthy();
    expect(view.getByText('Edit your profile')).toBeTruthy();
    expect(view.getByText('Agro-Industry')).toBeTruthy();
    expect(view.getByText('Agro-Industrial Innovation and Technology')).toBeTruthy();
    expect(view.getByText('Teacher')).toBeTruthy();
  });

  it('shows only occupation, faculty, and department in the profile identity', async () => {
    const data = {
      academicYear: '3',
      department: 'Economics',
      faculty: 'Economics',
      name: 'Jane Doe',
      occupation: 'Student',
      profileImage: '',
      university: 'State University',
    };
    const view = await render(
      <ProfileHeader data={data} />
    );

    expect(view.getByText('Student')).toBeTruthy();
    expect(view.getAllByText('Economics')).toHaveLength(2);
    expect(view.queryByText('State University')).toBeNull();
    expect(view.queryByText('3')).toBeNull();
  });

  it('labels and renders every backend-provided Quest category', async () => {
    const view = await render(
      <ProfileHeader
        data={{
          department: '',
          faculty: '',
          name: 'Jane Doe',
          occupation: '',
          profileImage: '',
          tags: [
            { id: 'design', name: 'Design', questCount: 4 },
            { id: 'web', name: 'Web', questCount: 3 },
            { id: 'tutor', name: 'Tutor', questCount: 2 },
          ],
        }}
        accessibilityLabels={{ questCategoriesLabel: 'Most frequent Quest categories', profileImageLabel: (name) => `${name} profile image` }}
      />
    );

    expect(view.getByText('Most frequent Quest categories')).toBeTruthy();
    expect(view.getByText('Design')).toBeTruthy();
    expect(view.getByText('Web')).toBeTruthy();
    expect(view.getByText('Tutor')).toBeTruthy();
  });

  it('uses the avatar file id as the native image cache key', async () => {
    const view = await render(
      <ProfileHeader
        data={{
          department: '',
          faculty: '',
          name: 'Jane Doe',
          occupation: '',
          profileImage: { uri: 'https://example.test/avatar.jpg', cacheKey: 'avatar-file-2' },
        }}
      />
    );

    expect(view.getByLabelText('Jane Doe profile image').props.source).toEqual([{
      uri: 'https://example.test/avatar.jpg',
      cacheKey: 'avatar-file-2',
    }]);
  });

  it('renders profile statistics and filters Reviews by star rating', async () => {
    const view = await render(<>
      <Reviews
        reviews={[
          { id: 'review-5', reviewerName: 'Alex', reviewerAvatar: '', rating: 5, comment: 'Excellent', createdAt: '2026-07-01', questTitle: '' },
          { id: 'review-3', reviewerName: 'Mina', reviewerAvatar: '', rating: 3, comment: 'Good', createdAt: '2026-06-01', questTitle: 'Design review' },
          { id: 'review-1', reviewerName: 'Kai', reviewerAvatar: '', rating: 1, comment: 'Needs improvement', createdAt: '2026-05-01', questTitle: 'Quest feedback' },
        ]}
        stats={{ totalQuests: 42, ratingAverage: 4.9, ratingCount: 3, distribution: { 5: 1, 4: 1, 3: 0, 2: 0, 1: 1 } }}
        sectionTitle="Reviews"
        emptyText="No reviews"
        allLabel="All"
        eligibleReviewsLabel={(count) => `${count} eligible Quest reviews`}
        filteredReviewsLabel={(count, rating) => `Showing ${count} ${rating}-star reviews`}
        reviewCountLabel="reviews"
      />
    </>);

    expect(view.getByText('4.9')).toBeTruthy();
    expect(view.getByTestId('profile-review-summary')).toBeTruthy();
    expect(view.getAllByText('Reviews').length).toBeGreaterThan(0);
    expect(view.getByText('Excellent')).toBeTruthy();
    expect(view.getByText('Good')).toBeTruthy();
    expect(view.getByText('Design review')).toBeTruthy();
    expect(view.getByTestId('profile-reviews-list')).toBeTruthy();
    expect(view.getByText('Needs improvement')).toBeTruthy();
    expect(view.getByRole('button', { name: '1 stars: 1 reviews' })).toBeTruthy();
    fireEvent.press(view.getByTestId('review-filter-1'));
    await waitFor(() => {
      expect(view.getByText('Needs improvement')).toBeTruthy();
      expect(view.queryByText('Excellent')).toBeNull();
      expect(view.queryByText('Good')).toBeNull();
      expect(view.getByText('Showing 1 1-star reviews')).toBeTruthy();
    });
    expect(view.getByText('Showing 1 1-star reviews').props.accessibilityLiveRegion).toBe('polite');
  });

  it('renders Certificate cards with issuer, year, and preview interaction', async () => {
    const view = await render(<Certificates certificates={[{ id: 'certificate-1', title: 'React Patterns', issuer: 'Frontend Masters', issuedYear: '2023', link: 'https://example.test/certificate.png' }]} sectionTitle="Certificates" emptyText="No certificates" previewUnavailableText="Image unavailable" closeLabel="Close preview" unavailableText="Certificate unavailable" />);

    expect(view.getByText('React Patterns')).toBeTruthy();
    expect(view.getByText('Frontend Masters')).toBeTruthy();
    expect(view.getByText('2023')).toBeTruthy();
    expect(view.getByText('View certificate preview')).toBeTruthy();
    fireEvent.press(view.getByRole('button', { name: 'React Patterns preview' }));
    await waitFor(() => expect(view.getAllByLabelText('Close preview').length).toBeGreaterThan(0));
  });

  it('gives the certificate viewer image an explicit width', async () => {
    const view = await render(<Certificates certificates={[{ id: 'certificate-viewer-layout', title: 'Viewer layout', issuer: 'KU', issuedYear: '2026', link: 'https://example.test/certificate.png' }]} sectionTitle="Certificates" emptyText="No certificates" previewUnavailableText="Image unavailable" closeLabel="Close preview" unavailableText="Certificate unavailable" />);

    fireEvent.press(view.getByRole('button', { name: 'Viewer layout preview' }));
    await waitFor(() => expect(view.getByTestId('certificate-preview-image')).toBeTruthy());

    expect(view.getByTestId('certificate-preview-image').props.style).toEqual(expect.objectContaining({ width: '100%' }));
    expect(view.getByTestId('certificate-preview-image').props.contentFit).toBe('contain');
  });

  it('shows a Certificate fallback and disables preview after image failure', async () => {
    const view = await render(<Certificates certificates={[{ id: 'broken-certificate', title: 'Broken certificate', issuer: 'KU', issuedYear: '2024', link: 'https://example.test/broken.png' }]} sectionTitle="Certificates" emptyText="No certificates" previewUnavailableText="Image unavailable" closeLabel="Close preview" unavailableText="Certificate unavailable" />);
    fireEvent(view.getByLabelText('Broken certificate certificate'), 'error', { nativeEvent: {} });

    await waitFor(() => expect(view.getByText('Image unavailable')).toBeTruthy());
    expect(view.getByRole('button', { name: 'Broken certificate Image unavailable' }).props.accessibilityState).toMatchObject({ disabled: true });
  });

  it('disables a Certificate preview after the modal image fails', async () => {
    const view = await render(<Certificates certificates={[{ id: 'modal-broken-certificate', title: 'Modal broken certificate', issuer: 'KU', issuedYear: '2024', link: 'https://example.test/modal-broken.png' }]} sectionTitle="Certificates" emptyText="No certificates" previewUnavailableText="Image unavailable" closeLabel="Close preview" unavailableText="Certificate unavailable" />);

    fireEvent.press(view.getByRole('button', { name: 'Modal broken certificate preview' }));
    await waitFor(() => expect(view.getByLabelText('Close preview')).toBeTruthy());
    fireEvent(view.getByTestId('certificate-preview-image'), 'error', { nativeEvent: {} });

    await waitFor(() => expect(view.getByText('Certificate unavailable')).toBeTruthy());
    fireEvent.press(view.getByLabelText('Close preview'));
    expect(view.getByRole('button', { name: 'Modal broken certificate Image unavailable' }).props.accessibilityState).toMatchObject({ disabled: true });
  });

  it('does not show empty content when an Experience section is unavailable', async () => {
    const view = await render(
      <Experience experiences={[]} sectionTitle="Experience" emptyText="No experience" presentLabel="Present" locale="en" errorText="This section is temporarily unavailable." retryLabel="Try again" onRetry={() => undefined} />
    );

    expect(view.getByText('This section is temporarily unavailable.')).toBeTruthy();
    expect(view.queryByText('No experience')).toBeNull();
  });

  it('does not show an empty rating state when Profile Rating is unavailable', async () => {
    const view = await render(
      <Reviews reviews={[]} stats={{ totalQuests: null, ratingAverage: null, ratingCount: 0, distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } }} sectionTitle="Reviews" emptyText="No reviews" allLabel="All" eligibleReviewsLabel={(count) => `${count} eligible Quest reviews`} filteredReviewsLabel={(count, rating) => `Showing ${count} ${rating}-star reviews`} reviewCountLabel="reviews" noRatingLabel="No ratings yet" ratingErrorText="This section is temporarily unavailable." retryLabel="Try again" onRetry={() => undefined} />
    );

    expect(view.getByText('This section is temporarily unavailable.')).toBeTruthy();
    expect(view.queryByText('No ratings yet')).toBeNull();
  });

  it('uses the no-rating message when a Student has no Profile Rating', async () => {
    const view = await render(
      <ProfileStats stats={{ totalQuests: 0, ratingAverage: null, ratingCount: 0, distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } }} ratingLabel="Profile Rating" questsLabel="Total Quests" noRatingLabel="No Profile Rating yet" />
    );

    expect(view.getByText('No Profile Rating yet')).toBeTruthy();
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
      <MyWork works={[{ id: 'work-1', title: 'Quest project', detail: 'A useful project', imageUri: '' }]} sectionTitle="My work" emptyText="No work" noImageText="No image" viewLabel="View project details" closeLabel="Close project details" />
    );

    expect(view.getByText('Quest project')).toBeTruthy();
    expect(view.getByText('A useful project')).toBeTruthy();
    expect(view.getByText('No image')).toBeTruthy();
    fireEvent.press(view.getByRole('button', { name: 'Quest project: View project details' }));
    await waitFor(() => expect(view.getByLabelText('Close project details')).toBeTruthy());
  });

  it('shows every Portfolio Work image in the project details sheet', async () => {
    const view = await render(
      <MyWork works={[{ id: 'work-gallery', title: 'Gallery project', detail: 'Two screenshots', imageUri: 'https://example.test/cover.png', imageUris: ['https://example.test/cover.png', 'https://example.test/detail.png'] }]} sectionTitle="My work" emptyText="No work" noImageText="No image" viewLabel="View project details" closeLabel="Close project details" />
    );

    fireEvent.press(view.getByRole('button', { name: 'Gallery project: View project details' }));
    await waitFor(() => {
      expect(view.getByLabelText('Gallery project image 1')).toBeTruthy();
      expect(view.getByLabelText('Gallery project image 2')).toBeTruthy();
    });
  });
});
