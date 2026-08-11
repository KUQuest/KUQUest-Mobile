import { StyleSheet } from 'react-native';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { fontFamily } from '@/theme/typography';

const styles = StyleSheet.create({
  container: {
    height: 64,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  backButton: {
    width: 28,
    alignItems: 'center',
  },
  backIcon: {
    color: colors.primaryDeep,
    fontSize: 36,
    lineHeight: 36,
  },
  logo: {
    color: colors.primaryDark,
    fontSize: 24,
    fontFamily: fontFamily.bold,
    fontWeight: '700',
  },
  spacer: {
    width: 28,
  },
});

export default styles;
