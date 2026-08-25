export interface AppChromeMetrics {
  isTablet: boolean;
  tabletNavWidth: number;
  headerHeight: number;
  logoWidth: number;
  logoHeight: number;
  backButtonSize: number;
  navHeight: number;
  navItemHeight: number;
  createButtonSize: number;
  iconSize: number;
  createIconSize: number;
  labelFontSize: number;
  labelLineHeight: number;
}

export interface CreateQuestLayoutMetrics {
  isExpanded: boolean;
  horizontalPadding: number;
  contentMaxWidth: number;
}

export function getCreateQuestLayoutMetrics(width: number): CreateQuestLayoutMetrics {
  const isExpanded = width >= 768;
  return {
    isExpanded,
    horizontalPadding: width < 360 ? 16 : isExpanded ? 32 : 24,
    contentMaxWidth: isExpanded ? 640 : width,
  };
}

export function getAppChromeMetrics(width: number, fontScale = 1): AppChromeMetrics {
  const isTablet = width >= 768;
  const baseMetrics = width < 400 ? {
      headerHeight: 68,
      logoWidth: 96,
      logoHeight: 48,
      backButtonSize: 48,
      navHeight: 64,
      navItemHeight: 56,
      createButtonSize: 38,
      iconSize: 22,
      createIconSize: 26,
      labelFontSize: 11,
      labelLineHeight: 14,
    } : {
    headerHeight: 80,
      logoWidth: 108,
      logoHeight: 54,
    backButtonSize: 48,
    navHeight: 68,
    navItemHeight: 60,
    createButtonSize: 42,
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
    baseMetrics.iconSize + (labelLineHeight * 2) + 8,
  );

  return {
    isTablet,
    tabletNavWidth: isTablet ? 88 : 0,
    ...baseMetrics,
    labelFontSize,
    labelLineHeight,
    navItemHeight,
    navHeight: baseMetrics.navHeight + Math.max(0, navItemHeight - baseMetrics.navItemHeight),
  };
}
