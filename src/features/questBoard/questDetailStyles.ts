import { StyleSheet } from 'react-native';

import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { fontFamily } from '@/theme/typography';

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.background,
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 132,
    paddingHorizontal: spacing.lg,
  },
  header: {
    paddingTop: spacing.md,
  },
  category: {
    color: colors.primary,
    fontFamily: fontFamily.semiBold,
    fontSize: 12,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  title: {
    color: colors.textStrong,
    fontFamily: fontFamily.bold,
    fontSize: 29,
    lineHeight: 37,
    marginTop: spacing.xs,
  },
  creator: {
    color: colors.textSecondary,
    fontFamily: fontFamily.regular,
    fontSize: 13,
    marginTop: spacing.sm,
  },
  heroCard: {
    backgroundColor: colors.surfaceAccent,
    borderColor: colors.borderAccent,
    borderRadius: 18,
    borderWidth: 1,
    marginTop: spacing.lg,
    padding: spacing.md,
  },
  heroPrimary: {
    paddingBottom: spacing.sm,
  },
  heroDetails: {
    flexDirection: 'row',
  },
  heroItem: {
    flex: 1,
  },
  heroItemDivider: {
    borderLeftColor: colors.borderAccent,
    borderLeftWidth: 1,
    marginLeft: spacing.sm,
    paddingLeft: spacing.sm,
  },
  heroLabel: {
    color: colors.textSecondary,
    fontFamily: fontFamily.regular,
    fontSize: 11,
  },
  heroValue: {
    color: colors.primary,
    fontFamily: fontFamily.bold,
    fontSize: 18,
    marginTop: 2,
  },
  heroDetail: {
    color: colors.textSecondary,
    fontFamily: fontFamily.regular,
    fontSize: 11,
    marginTop: 2,
  },
  section: {
    marginTop: spacing.xl,
  },
  sectionTitle: {
    color: colors.textStrong,
    fontFamily: fontFamily.bold,
    fontSize: 19,
    marginBottom: spacing.sm,
  },
  body: {
    color: colors.textSecondary,
    fontFamily: fontFamily.regular,
    fontSize: 15,
    lineHeight: 24,
  },
  requirementCard: {
    backgroundColor: colors.white,
    borderColor: colors.borderSubtle,
    borderRadius: 14,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md,
  },
  requirementRow: {
    gap: 2,
  },
  requirementLabel: {
    color: colors.textMuted,
    fontFamily: fontFamily.medium,
    fontSize: 12,
  },
  requirementValue: {
    color: colors.textStrong,
    fontFamily: fontFamily.medium,
    fontSize: 13,
    lineHeight: 20,
  },
  confirmHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statusCard: {
    alignItems: 'center',
    backgroundColor: colors.surfaceSuccess,
    borderColor: colors.borderSuccess,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: spacing.lg,
    padding: spacing.md,
  },
  statusCardBlocked: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.borderSubtle,
  },
  statusTitle: {
    color: colors.primary,
    fontFamily: fontFamily.bold,
    fontSize: 17,
    textAlign: 'center',
  },
  statusDescription: {
    color: colors.textSecondary,
    fontFamily: fontFamily.regular,
    fontSize: 13,
    lineHeight: 20,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  actionBar: {
    backgroundColor: colors.background,
    borderTopColor: colors.borderSubtle,
    borderTopWidth: 1,
    bottom: 0,
    left: 0,
    padding: spacing.md,
    position: 'absolute',
    right: 0,
  },
  primaryAction: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 999,
    justifyContent: 'center',
    minHeight: 52,
    paddingHorizontal: spacing.lg,
  },
  primaryActionDisabled: {
    backgroundColor: colors.textMuted,
  },
  primaryActionText: {
    color: colors.white,
    fontFamily: fontFamily.semiBold,
    fontSize: 15,
  },
  modalBackdrop: {
    backgroundColor: colors.overlay,
    flex: 1,
    justifyContent: 'flex-end',
  },
  confirmSheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.lg,
  },
  confirmTitle: {
    color: colors.textStrong,
    fontFamily: fontFamily.bold,
    fontSize: 22,
  },
  confirmDescription: {
    color: colors.textSecondary,
    fontFamily: fontFamily.regular,
    fontSize: 14,
    lineHeight: 22,
    marginTop: spacing.xs,
  },
  confirmSummary: {
    backgroundColor: colors.surfaceAccent,
    borderRadius: 14,
    gap: spacing.xs,
    marginTop: spacing.md,
    padding: spacing.md,
  },
  confirmSummaryText: {
    color: colors.textStrong,
    fontFamily: fontFamily.medium,
    fontSize: 14,
  },
  confirmActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  cancelAction: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    minHeight: 50,
  },
  cancelActionText: {
    color: colors.textStrong,
    fontFamily: fontFamily.semiBold,
    fontSize: 14,
  },
  confirmAction: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 999,
    flex: 1.4,
    justifyContent: 'center',
    minHeight: 50,
  },
  confirmActionText: {
    color: colors.white,
    fontFamily: fontFamily.semiBold,
    fontSize: 14,
  },
});

export default styles;
