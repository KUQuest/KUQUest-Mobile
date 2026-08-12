import { getProfileLayoutMetrics } from '../theme/profileLayout';

describe('profile layout policy', () => {
  it('keeps compact Student Profile content visually restrained while preserving readable text', () => {
    expect(getProfileLayoutMetrics(384)).toEqual({
      pagePadding: 16,
      sectionGap: 16,
      cardPadding: 20,
      photoSize: 96,
      nameFontSize: 22,
      sectionTitleFontSize: 18,
      bodyLineHeight: 22,
      workCardWidth: 200,
    });
  });

  it('uses a wider content composition without scaling phone content up unnecessarily', () => {
    expect(getProfileLayoutMetrics(600)).toEqual({
      pagePadding: 24,
      sectionGap: 20,
      cardPadding: 24,
      photoSize: 104,
      nameFontSize: 24,
      sectionTitleFontSize: 20,
      bodyLineHeight: 24,
      workCardWidth: 220,
    });
  });
});
