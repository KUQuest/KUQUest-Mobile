import { render } from '@testing-library/react-native';

import { LoadingSkeleton, SkeletonBlock } from '../LoadingSkeleton';

describe('LoadingSkeleton', () => {
  it('exposes one busy progressbar and keeps decorative blocks inaccessible', async () => {
    const view = await render(
      <LoadingSkeleton loadingLabel="Loading profile" testID="loading-profile">
        <SkeletonBlock height={24} testID="loading-profile-block" />
      </LoadingSkeleton>,
    );

    const progressbar = view.getByTestId('loading-profile');
    expect(progressbar.props.accessibilityRole).toBe('progressbar');
    expect(progressbar.props.accessibilityState).toEqual({ busy: true });
    expect(progressbar.props.accessibilityLabel).toBe('Loading profile');
    expect(view.getByTestId('loading-profile-block').props.accessible).toBe(false);
  });
});
