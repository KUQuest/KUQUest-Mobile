export const fontFamily = {
  regular: 'NotoSansThai_400Regular',
  medium: 'NotoSansThai_500Medium',
  semiBold: 'NotoSansThai_600SemiBold',
  bold: 'NotoSansThai_700Bold',
} as const;

export const typography = {
  display: { fontFamily: fontFamily.bold, fontSize: 44, lineHeight: 52 },
  displaySmall: { fontFamily: fontFamily.bold, fontSize: 32, lineHeight: 40 },
  headline: { fontFamily: fontFamily.bold, fontSize: 30, lineHeight: 38 },
  titleLarge: { fontFamily: fontFamily.bold, fontSize: 28, lineHeight: 36 },
  title: { fontFamily: fontFamily.bold, fontSize: 24, lineHeight: 29 },
  titleSmall: { fontFamily: fontFamily.bold, fontSize: 22, lineHeight: 28 },
  section: { fontFamily: fontFamily.semiBold, fontSize: 20, lineHeight: 26 },
  emphasisLarge: { fontFamily: fontFamily.bold, fontSize: 19, lineHeight: 24 },
  subtitle: { fontFamily: fontFamily.semiBold, fontSize: 18, lineHeight: 24 },
  emphasis: { fontFamily: fontFamily.semiBold, fontSize: 17, lineHeight: 23 },
  body: { fontFamily: fontFamily.regular, fontSize: 16, lineHeight: 24 },
  control: { fontFamily: fontFamily.medium, fontSize: 15, lineHeight: 22 },
  bodySmall: { fontFamily: fontFamily.regular, fontSize: 14, lineHeight: 21 },
  meta: { fontFamily: fontFamily.regular, fontSize: 13, lineHeight: 19 },
  label: { fontFamily: fontFamily.regular, fontSize: 12, lineHeight: 18 },
  labelStrong: { fontFamily: fontFamily.bold, fontSize: 12, lineHeight: 18 },
  caption: { fontFamily: fontFamily.regular, fontSize: 11, lineHeight: 16 },
  nav: { fontFamily: fontFamily.semiBold, fontSize: 10, lineHeight: 12 },
} as const;
