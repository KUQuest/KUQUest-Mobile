import { StyleSheet } from 'react-native';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { fontFamily } from '@/theme/typography';

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  box: {
    width: 20,
    height: 20,
    borderWidth: 1.5,
    borderColor: colors.borderMuted,
    borderRadius: 4,
    marginRight: spacing.sm + 2,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.white,
  },
  boxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  boxError: {
    borderColor: colors.danger,
  },
  label: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    color: colors.textSecondary,
    flex: 1,
  },
  errorText: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    color: colors.danger,
    marginTop: 4,
    marginLeft: 30,
  },
});

export default styles;
