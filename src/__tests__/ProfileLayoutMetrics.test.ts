import { getProfileLayoutMetrics } from '../theme/profileLayout';

describe('profile layout policy', () => {
  it('keeps compact Student Profile content visually restrained while preserving readable text', () => {
    expect(getProfileLayoutMetrics(384)).toEqual({
      pagePadding: 16,
      sectionGap: 20,
      cardPadding: 20,
      photoSize: 112,
      nameFontSize: 24,
      sectionTitleFontSize: 20,
      bodyLineHeight: 24,
      workCardWidth: 260,
    });
  });

  it('uses a wider content composition without scaling phone content up unnecessarily', () => {
    expect(getProfileLayoutMetrics(600)).toEqual({
      pagePadding: 24,
      sectionGap: 24,
      cardPadding: 24,
      photoSize: 120,
      nameFontSize: 26,
      sectionTitleFontSize: 22,
      bodyLineHeight: 26,
      workCardWidth: 280,
    });
  });
});
