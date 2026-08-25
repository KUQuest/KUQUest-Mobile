import { StyleSheet } from 'react-native';

import { colors } from '@/theme/colors';
import { fontFamily } from '@/theme/typography';

const styles = StyleSheet.create({
  bar: {
    backgroundColor: colors.surface,
    borderTopColor: colors.borderSubtle,
    borderTopWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: 8,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 12,
  },
  item: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    minWidth: 48,
    minHeight: 48,
    paddingHorizontal: 4,
  },
  activeItem: {
    backgroundColor: colors.surfaceSuccess,
    borderColor: colors.borderSuccess,
    borderRadius: 16,
    borderWidth: 1,
    marginVertical: 6,
    paddingHorizontal: 6,
  },
  icon: {
    marginBottom: 3,
  },
  label: {
    color: colors.textSecondary,
    fontFamily: fontFamily.medium,
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'center',
    includeFontPadding: false,
    maxWidth: '100%',
  },
  labelSlot: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 32,
    width: '100%',
  },
  activeLabel: {
    color: colors.primary,
    fontFamily: fontFamily.bold,
  },
  activeIndicator: {
    backgroundColor: colors.primary,
    borderRadius: 2,
    height: 3,
    marginTop: 3,
    width: 24,
  },
  createItem: {
    paddingTop: 0,
  },
  createIcon: {
    alignItems: 'center',
    backgroundColor: colors.primaryDeep,
    borderColor: colors.surface,
    borderRadius: 40,
    borderWidth: 3,
    elevation: 8,
    justifyContent: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 7,
  },
  createLabel: {
    color: colors.textSecondary,
    fontFamily: fontFamily.bold,
    fontSize: 12,
    lineHeight: 16,
    marginTop: 2,
    includeFontPadding: false,
    maxWidth: '100%',
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
