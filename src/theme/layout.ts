import { spacing } from "./spacing";

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
}

export interface CreateQuestLayoutMetrics {
  isExpanded: boolean;
  horizontalPadding: number;
  contentMaxWidth: number;
}

export type BottomNavigationMetrics = Pick<
  AppChromeMetrics,
  "isTablet" | "navHeight"
>;

export function getCreateQuestLayoutMetrics(
  width: number
): CreateQuestLayoutMetrics {
  const isExpanded = width >= 768;
  return {
    isExpanded,
    horizontalPadding: width < 360 ? 16 : isExpanded ? 32 : 24,
    contentMaxWidth: isExpanded ? 640 : width,
  };
}

export function getAppChromeMetrics(
  width: number,
  fontScale = 1
): AppChromeMetrics {
  const isTablet = width >= 768;
  const baseMetrics =
    width < 400
      ? {
          headerHeight: 68,
          logoWidth: 96,
          logoHeight: 48,
          backButtonSize: 48,
          navHeight: 60,
          navItemHeight: 48,
          createButtonSize: 36,
          iconSize: 22,
          createIconSize: 25,
        }
      : {
          headerHeight: 80,
          logoWidth: 108,
          logoHeight: 54,
          backButtonSize: 48,
          navHeight: 64,
          navItemHeight: 52,
          createButtonSize: 40,
          iconSize: 24,
          createIconSize: 28,
        };

  const accessibleFontScale = Math.min(Math.max(1, fontScale), 1.25);
  const navItemHeight = Math.max(
    baseMetrics.navItemHeight,
    Math.ceil(baseMetrics.navItemHeight * accessibleFontScale)
  );

  return {
    isTablet,
    tabletNavWidth: isTablet ? 88 : 0,
    ...baseMetrics,
    navItemHeight,
    navHeight:
      baseMetrics.navHeight +
      Math.max(0, navItemHeight - baseMetrics.navItemHeight),
  };
}

export function getBottomNavigationInset(
  metrics: BottomNavigationMetrics,
  bottomInset: number
): number {
  return metrics.isTablet ? 0 : metrics.navHeight + bottomInset;
}

export function getActionBarPaddingBottom(bottomInset: number): number {
  return Math.max(spacing.md, bottomInset + spacing.sm);
}
