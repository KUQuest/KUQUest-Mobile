import { getAppChromeMetrics, getCreateQuestLayoutMetrics } from '../theme/layout';

describe('app chrome sizing', () => {
  it('uses compact dimensions on the connected phone width', () => {
    expect(getAppChromeMetrics(384)).toEqual({
      isTablet: false,
      tabletNavWidth: 0,
      headerHeight: 68,
      logoWidth: 96,
      logoHeight: 48,
      backButtonSize: 48,
      navHeight: 66,
      navItemHeight: 58,
      createButtonSize: 38,
      createButtonOffset: -20,
      iconSize: 22,
      createIconSize: 26,
      labelFontSize: 11,
      labelLineHeight: 14,
    });
  });

  it('keeps the larger reference dimensions for wider phone layouts', () => {
    expect(getAppChromeMetrics(430)).toEqual({
      isTablet: false,
      tabletNavWidth: 0,
      headerHeight: 80,
      logoWidth: 108,
      logoHeight: 54,
      backButtonSize: 48,
      navHeight: 72,
      navItemHeight: 64,
      createButtonSize: 42,
      createButtonOffset: -24,
      iconSize: 24,
      createIconSize: 28,
      labelFontSize: 12,
      labelLineHeight: 16,
    });
  });

  it('uses a navigation rail on expanded widths', () => {
    expect(getAppChromeMetrics(768)).toMatchObject({ isTablet: true, tabletNavWidth: 88 });
  });

  it('gives navigation labels and their container room to grow with large text', () => {
    const metrics = getAppChromeMetrics(384, 2);

    expect(metrics.labelFontSize).toBe(22);
    expect(metrics.labelLineHeight).toBe(28);
    expect(metrics.navItemHeight).toBeGreaterThan(50);
    expect(metrics.navHeight).toBeGreaterThan(60);
  });

  it('keeps the Create Quest form readable on compact and expanded widths', () => {
    expect(getCreateQuestLayoutMetrics(320)).toEqual({
      isExpanded: false,
      horizontalPadding: 16,
      contentMaxWidth: 320,
    });
    expect(getCreateQuestLayoutMetrics(1024)).toEqual({
      isExpanded: true,
      horizontalPadding: 32,
      contentMaxWidth: 640,
    });
  });
});
