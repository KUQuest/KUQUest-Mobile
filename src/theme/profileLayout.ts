export interface ProfileLayoutMetrics {
  pagePadding: number;
  sectionGap: number;
  cardPadding: number;
  photoSize: number;
  nameFontSize: number;
  sectionTitleFontSize: number;
  bodyLineHeight: number;
  gridColumns: 1 | 2;
}

export function getProfileLayoutMetrics(width: number): ProfileLayoutMetrics {
  if (width < 360) {
    return {
      pagePadding: 16,
      sectionGap: 12,
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
    cardPadding: 20,
    photoSize: 96,
    nameFontSize: 22,
    sectionTitleFontSize: 20,
    bodyLineHeight: 24,
    gridColumns: 2,
  };
}
