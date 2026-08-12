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
      sectionGap: 16,
      cardPadding: 20,
      photoSize: 96,
      nameFontSize: 22,
      sectionTitleFontSize: 18,
      bodyLineHeight: 22,
      workCardWidth: 200,
    };
  }

  return {
    pagePadding: 24,
    sectionGap: 20,
    cardPadding: 24,
    photoSize: 104,
    nameFontSize: 24,
    sectionTitleFontSize: 20,
    bodyLineHeight: 24,
    workCardWidth: 220,
  };
}
