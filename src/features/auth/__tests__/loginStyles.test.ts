import styles from '../styles/loginStyles';

describe('login layout typography', () => {
  it('uses the shared typography tokens', () => {
    expect(styles.title).toContain('text-ku-heading');
    expect(styles.subtitle).toContain('text-ku-label');
    expect(styles.noticeText).toContain('text-ku-body-small');
    expect(styles.retryButtonText).toContain('text-ku-meta');
  });
});
