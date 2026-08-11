export interface AppChromeMetrics {
  headerHeight: number;
  logoWidth: number;
  logoHeight: number;
  backButtonSize: number;
  navHeight: number;
  navItemHeight: number;
  createButtonSize: number;
  createButtonOffset: number;
  iconSize: number;
  createIconSize: number;
  labelFontSize: number;
  labelLineHeight: number;
}

export function getAppChromeMetrics(width: number, fontScale = 1): AppChromeMetrics {
  const baseMetrics: AppChromeMetrics = width < 400 ? {
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
    } : {
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
