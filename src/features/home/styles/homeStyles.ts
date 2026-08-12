import { StyleSheet } from 'react-native';

import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    width: '100%',
    padding: spacing.md,
    gap: spacing.lg,
  },
  header: {
    alignItems: 'center',
    paddingTop: spacing.md,
  },
  title: {
    ...typography.heading,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    color: colors.textMuted,
  },
  statusText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    padding: spacing.lg,
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 200,
  },
  logoutButton: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 8,
    paddingVertical: spacing.sm + 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutText: {
    ...typography.body,
    fontWeight: 'bold',
    color: colors.primary,
  },
});

export default styles;
