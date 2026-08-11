export const fontFamily = {
  regular: 'NotoSansThai_400Regular',
  medium: 'NotoSansThai_500Medium',
  semiBold: 'NotoSansThai_600SemiBold',
  bold: 'NotoSansThai_700Bold',
} as const;

export const typography = {
  body: {
    fontFamily: fontFamily.regular,
    fontSize: 16,
  },
  bodySmall: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
  },
  label: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
  },
  labelStrong: {
    fontFamily: fontFamily.bold,
    fontSize: 12,
  },
  heading: {
    fontFamily: fontFamily.bold,
    fontSize: 24,
  },
} as const;
