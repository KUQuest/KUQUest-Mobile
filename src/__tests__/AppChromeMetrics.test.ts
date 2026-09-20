import {
  getActionBarPaddingBottom,
  getAppChromeMetrics,
  getBottomNavigationInset,
  getCreateQuestLayoutMetrics,
} from "../theme/layout";

describe("app chrome sizing", () => {
  it("uses compact dimensions on the connected phone width", () => {
    expect(getAppChromeMetrics(384)).toEqual({
      isTablet: false,
      tabletNavWidth: 0,
      headerHeight: 68,
      logoWidth: 96,
      logoHeight: 48,
      backButtonSize: 48,
      navHeight: 60,
      navItemHeight: 48,
      createButtonSize: 36,
      iconSize: 22,
      createIconSize: 25,
    });
  });

  it("keeps the larger reference dimensions for wider phone layouts", () => {
    expect(getAppChromeMetrics(430)).toEqual({
      isTablet: false,
      tabletNavWidth: 0,
      headerHeight: 80,
      logoWidth: 108,
      logoHeight: 54,
      backButtonSize: 48,
      navHeight: 64,
      navItemHeight: 52,
      createButtonSize: 40,
      iconSize: 24,
      createIconSize: 28,
    });
  });

  it("uses a navigation rail on expanded widths", () => {
    expect(getAppChromeMetrics(768)).toMatchObject({
      isTablet: true,
      tabletNavWidth: 88,
    });
  });

  it("keeps compact navigation targets usable with large text settings", () => {
    const metrics = getAppChromeMetrics(384, 2);

    expect(metrics.navItemHeight).toBe(60);
    expect(metrics.navHeight).toBe(72);
  });

  it("keeps the Create Quest form readable on compact and expanded widths", () => {
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

describe("bottom navigation insets", () => {
  it("reserves no bottom inset when a tablet shows the navigation rail", () => {
    const metrics = getAppChromeMetrics(768);

    expect(getBottomNavigationInset(metrics, 34)).toBe(0);
  });

  it("reserves the navigation height plus the inset on phones", () => {
    const metrics = getAppChromeMetrics(384);

    expect(getBottomNavigationInset(metrics, 12)).toBe(metrics.navHeight + 12);
  });
});

describe("action bar bottom padding", () => {
  it("keeps a comfortable minimum when the bottom inset is small", () => {
    expect(getActionBarPaddingBottom(0)).toBe(16);
  });

  it("clears a tall bottom inset", () => {
    expect(getActionBarPaddingBottom(34)).toBe(42);
  });
});
