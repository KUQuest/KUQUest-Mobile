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
    minHeight: 48,
    minWidth: 48,
    paddingHorizontal: 2,
  },
  activeItem: {
    backgroundColor: colors.successLight,
    borderRadius: 44,
    marginVertical: 8,
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
  },
  activeLabel: {
    color: colors.primary,
    fontFamily: fontFamily.bold,
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
