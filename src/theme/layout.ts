export interface AppChromeMetrics {
  headerHeight: number;
  logoWidth: number;
  logoHeight: number;
  backButtonSize: number;
  navHeight: number;
  navItemHeight: number;
  createButtonSize: number;
  iconSize: number;
  createButtonOffset: number;
  createIconSize: number;
  labelFontSize: number;
  labelLineHeight: number;
}

export function getAppChromeMetrics(width: number, fontScale = 1): AppChromeMetrics {
  const baseMetrics: AppChromeMetrics = width < 400 ? {
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
    } : {
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
  };

  const accessibleFontScale = Math.max(1, fontScale);
  const labelFontSize = Math.ceil(baseMetrics.labelFontSize * accessibleFontScale);
  const labelLineHeight = Math.max(
    baseMetrics.labelLineHeight,
    Math.ceil(baseMetrics.labelLineHeight * accessibleFontScale),
  );
  const navItemHeight = Math.max(
    baseMetrics.navItemHeight,
    baseMetrics.iconSize + labelLineHeight + 16,
  );

  return {
    ...baseMetrics,
    labelFontSize,
    labelLineHeight,
    navItemHeight,
    navHeight: baseMetrics.navHeight + Math.max(0, navItemHeight - baseMetrics.navItemHeight),
  };
}
