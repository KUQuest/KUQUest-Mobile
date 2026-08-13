import { getProfileLayoutMetrics } from '../theme/profileLayout';

describe('profile layout policy', () => {
  it('keeps compact Student Profile content visually restrained while preserving readable text', () => {
    expect(getProfileLayoutMetrics(320)).toEqual({
      pagePadding: 16,
      sectionGap: 12,
      cardPadding: 16,
      photoSize: 88,
      nameFontSize: 20,
      sectionTitleFontSize: 18,
      bodyLineHeight: 22,
      gridColumns: 1,
    });

    expect(getProfileLayoutMetrics(384).gridColumns).toBe(2);
  });

  it('uses a wider content composition without scaling phone content up unnecessarily', () => {
    expect(getProfileLayoutMetrics(600)).toEqual({
      pagePadding: 20,
      sectionGap: 16,
      cardPadding: 20,
      photoSize: 96,
      nameFontSize: 22,
      sectionTitleFontSize: 20,
      bodyLineHeight: 24,
      gridColumns: 2,
    });
  });
});
