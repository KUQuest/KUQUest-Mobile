import { StyleSheet } from 'react-native';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  content: {
    width: '100%',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xl,
    gap: spacing.xl,
  },
  tabletContent: {
    alignSelf: 'center',
    maxWidth: 720,
    paddingHorizontal: spacing.xl,
  },
  statusText: {
    padding: spacing.lg,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  errorState: {
    alignItems: 'center',
    padding: spacing.lg,
  },
  retryButton: {
    minHeight: 44,
    minWidth: 140,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
  },
  retryButtonText: {
    color: colors.white,
    fontWeight: '600',
  },
});

export default styles;
