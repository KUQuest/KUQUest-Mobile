import { getAppChromeMetrics } from '../theme/layout';

describe('app chrome sizing', () => {
  it('uses compact dimensions on the connected phone width', () => {
    expect(getAppChromeMetrics(384)).toEqual({
      headerHeight: 68,
      logoWidth: 112,
      logoHeight: 56,
      backButtonSize: 44,
      navHeight: 72,
      navItemHeight: 60,
      createButtonSize: 56,
      createButtonOffset: -20,
      iconSize: 26,
      createIconSize: 34,
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
      navHeight: 84,
      navItemHeight: 68,
      createButtonSize: 64,
      createButtonOffset: -24,
      iconSize: 30,
      createIconSize: 38,
      labelFontSize: 12,
      labelLineHeight: 16,
    });
  });

  it('gives navigation labels and their container room to grow with large text', () => {
    const metrics = getAppChromeMetrics(384, 2);

    expect(metrics.labelFontSize).toBe(22);
    expect(metrics.labelLineHeight).toBe(28);
    expect(metrics.navItemHeight).toBeGreaterThan(60);
    expect(metrics.navHeight).toBeGreaterThan(72);
  });
});
