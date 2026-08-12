import { getAppChromeMetrics } from '../theme/layout';

describe('app chrome sizing', () => {
  it('uses compact dimensions on the connected phone width', () => {
    expect(getAppChromeMetrics(384)).toEqual({
      headerHeight: 68,
      logoWidth: 112,
      logoHeight: 56,
      backButtonSize: 44,
      navHeight: 64,
      navItemHeight: 56,
      createButtonSize: 38,
      createButtonOffset: -12,
      iconSize: 22,
      createIconSize: 26,
      labelFontSize: 11,
      labelLineHeight: 14,
    });
  });

  it('keeps the larger reference dimensions for wider phone layouts', () => {
    expect(getAppChromeMetrics(430)).toEqual({
      headerHeight: 80,
      logoWidth: 128,
      logoHeight: 64,
      backButtonSize: 48,
      navHeight: 68,
      navItemHeight: 60,
      createButtonSize: 42,
      createButtonOffset: -16,
      iconSize: 24,
      createIconSize: 28,
      labelFontSize: 12,
      labelLineHeight: 16,
    });
  });

  it('gives navigation labels and their container room to grow with large text', () => {
    const metrics = getAppChromeMetrics(384, 2);

    expect(metrics.labelFontSize).toBe(22);
    expect(metrics.labelLineHeight).toBe(28);
    expect(metrics.navItemHeight).toBeGreaterThan(50);
    expect(metrics.navHeight).toBeGreaterThan(60);
  });
});
