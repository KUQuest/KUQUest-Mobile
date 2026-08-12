import { StyleSheet } from 'react-native';

import { colors } from '@/theme/colors';
import { fontFamily } from '@/theme/typography';

const styles = StyleSheet.create({
  container: {
    alignItems: 'stretch',
    backgroundColor: 'transparent',
    paddingHorizontal: 10,
    paddingTop: 6,
  },
  bar: {
    alignItems: 'center',
    backgroundColor: colors.surfaceNavTranslucent,
    borderColor: colors.borderNav,
    borderRadius: 28,
    borderWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: 6,
    paddingTop: 4,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 3,
  },
  item: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    minWidth: 48,
    minHeight: 48,
    paddingHorizontal: 2,
  },
  itemPressed: {
    opacity: 0.62,
  },
  activeLabel: {
    color: colors.successBright,
    fontFamily: fontFamily.bold,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 10,
    fontFamily: fontFamily.semiBold,
    lineHeight: 12,
    marginTop: 2,
    textAlign: 'center',
    includeFontPadding: false,
    maxWidth: '100%',
  },
  createItem: {
    paddingHorizontal: 4,
  },
  createIcon: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderColor: colors.surface,
    borderWidth: 2,
    borderRadius: 999,
    elevation: 6,
    justifyContent: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
  },
  unreadBadge: {
    backgroundColor: colors.dangerIcon,
    borderColor: colors.surface,
    borderRadius: 7,
    borderWidth: 2,
    height: 14,
    position: 'absolute',
    right: 24,
    top: 9,
    width: 14,
  },
});

export default styles;
