export interface ProfileLayoutMetrics {
  pagePadding: number;
  sectionGap: number;
  cardPadding: number;
  photoSize: number;
  nameFontSize: number;
  sectionTitleFontSize: number;
  bodyLineHeight: number;
  workCardWidth: number;
}

export function getProfileLayoutMetrics(width: number): ProfileLayoutMetrics {
  if (width < 400) {
    return {
      pagePadding: 16,
      sectionGap: 20,
      cardPadding: 20,
      photoSize: 112,
      nameFontSize: 24,
      sectionTitleFontSize: 20,
      bodyLineHeight: 24,
      workCardWidth: 260,
    };
  }

  return {
    pagePadding: 24,
    sectionGap: 24,
    cardPadding: 24,
    photoSize: 120,
    nameFontSize: 26,
    sectionTitleFontSize: 22,
    bodyLineHeight: 26,
    workCardWidth: 280,
  };
}
