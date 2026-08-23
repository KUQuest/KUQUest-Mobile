import { getProfileLayoutMetrics } from '../theme/profileLayout';

describe('profile layout policy', () => {
  it('keeps compact Student Profile content visually restrained while preserving readable text', () => {
    expect(getProfileLayoutMetrics(320)).toEqual({
      pagePadding: 16,
      sectionGap: 12,
      portfolioSectionGap: 16,
      cardPadding: 16,
      photoSize: 88,
      nameFontSize: 20,
      sectionTitleFontSize: 18,
      bodyLineHeight: 22,
      gridColumns: 1,
    });

    expect(getProfileLayoutMetrics(360).gridColumns).toBe(1);
    expect(getProfileLayoutMetrics(384).gridColumns).toBe(2);
  });

  it('keeps native text scaling consistent and collapses evidence columns at large font sizes', () => {
    expect(getProfileLayoutMetrics(600, 1.5)).toMatchObject({
      pagePadding: 20,
      sectionGap: 16,
      portfolioSectionGap: 24,
      cardPadding: 20,
      photoSize: 96,
      nameFontSize: 22,
      sectionTitleFontSize: 20,
      bodyLineHeight: 24,
      gridColumns: 1,
    });
  });

  it('uses a wider content composition without scaling phone content up unnecessarily', () => {
    expect(getProfileLayoutMetrics(600)).toEqual({
      pagePadding: 20,
      sectionGap: 16,
      portfolioSectionGap: 24,
      cardPadding: 20,
      photoSize: 96,
      nameFontSize: 22,
      sectionTitleFontSize: 20,
      bodyLineHeight: 24,
      gridColumns: 2,
    });
  });
});
