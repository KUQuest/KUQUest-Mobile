import { spacing } from './spacing';

export interface ProfileLayoutMetrics {
  pagePadding: number;
  sectionGap: number;
  portfolioSectionGap: number;
  cardPadding: number;
  photoSize: number;
  nameFontSize: number;
  sectionTitleFontSize: number;
  bodyLineHeight: number;
  gridColumns: 1 | 2;
}

export function getProfileLayoutMetrics(width: number, fontScale = 1): ProfileLayoutMetrics {
  const usesSingleColumn = width < 384 || fontScale >= 1.3;

  if (width < 384) {
    return {
      pagePadding: 16,
      sectionGap: 12,
      portfolioSectionGap: spacing.md,
      cardPadding: 16,
      photoSize: 88,
      nameFontSize: 20,
      sectionTitleFontSize: 18,
      bodyLineHeight: 22,
      gridColumns: 1,
    };
  }

  return {
    pagePadding: 20,
    sectionGap: 16,
    portfolioSectionGap: spacing.lg,
    cardPadding: 20,
    photoSize: 96,
    nameFontSize: 22,
    sectionTitleFontSize: 20,
    bodyLineHeight: 24,
    gridColumns: usesSingleColumn ? 1 : 2,
  };
}
