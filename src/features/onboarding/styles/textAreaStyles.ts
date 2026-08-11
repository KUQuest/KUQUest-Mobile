import { StyleSheet } from 'react-native';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { fontFamily } from '@/theme/typography';

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
    width: '100%',
  },
  label: {
    fontFamily: fontFamily.bold,
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  input: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    color: colors.textStrong,
    borderWidth: 1,
    borderColor: colors.borderMuted,
    borderRadius: 8,
    paddingHorizontal: spacing.sm + 4,
    paddingTop: spacing.sm + 4,
    paddingBottom: spacing.sm + 4,
    backgroundColor: colors.white,
    minHeight: 120,
  },
  inputError: {
    borderColor: colors.danger,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  errorText: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    color: colors.danger,
    flex: 1,
  },
  counterText: {
    fontFamily: fontFamily.regular,
    fontSize: 11,
    color: colors.textFaint,
    textAlign: 'right',
  },
});

export default styles;
