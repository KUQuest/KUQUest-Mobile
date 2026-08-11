import { StyleSheet } from 'react-native';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { fontFamily } from '@/theme/typography';

const styles = StyleSheet.create({
  host: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  content: {
    width: '100%',
    maxWidth: 420,
    justifyContent: 'space-between',
    paddingVertical: spacing.lg,
    gap: spacing.xl,
  },
  langToggle: {
    alignSelf: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: colors.surfaceAccent,
    borderWidth: 1,
    borderColor: colors.borderAccent,
  },
  langToggleText: {
    fontFamily: fontFamily.bold,
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  headerSection: {
    alignItems: 'center',
    marginTop: 4,
  },
  title: {
    fontFamily: fontFamily.bold,
    fontSize: 44,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: fontFamily.semiBold,
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
    letterSpacing: 2.5,
    textAlign: 'center',
    textTransform: 'uppercase',
    marginTop: 6,
  },
  formSection: {
    width: '100%',
    gap: spacing.md,
  },
  noticeCard: {
    backgroundColor: colors.surfaceSuccess,
    borderColor: colors.borderSuccess,
    borderWidth: 1,
    borderRadius: 16,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 4,
  },
  noticeText: {
    flex: 1,
    fontFamily: fontFamily.regular,
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  noticeTextBold: {
    fontFamily: fontFamily.bold,
    fontWeight: '700',
    color: colors.textStrong,
  },
  errorCard: {
    backgroundColor: colors.surfaceDanger,
    borderColor: colors.borderDanger,
    borderWidth: 1,
    borderRadius: 16,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 4,
  },
  errorContent: {
    flex: 1,
    gap: 10,
  },
  errorText: {
    fontFamily: fontFamily.medium,
    fontSize: 14,
    color: colors.dangerDark,
    lineHeight: 20,
    fontWeight: '500',
  },
  retryButton: {
    alignSelf: 'flex-start',
    backgroundColor: colors.dangerDark,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
  },
  retryButtonText: {
    fontFamily: fontFamily.bold,
    color: colors.white,
    fontSize: 13,
    fontWeight: '700',
  },
  hostWrapper: {
    width: '100%',
    alignSelf: 'stretch',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginVertical: 4,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.borderMuted,
  },
  dividerText: {
    fontFamily: fontFamily.medium,
    fontSize: 14,
    color: colors.textMuted,
    fontWeight: '500',
  },
  footerSection: {
    alignItems: 'center',
    gap: 12,
  },
  footerLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
  },
  footerLinkText: {
    fontFamily: fontFamily.medium,
    fontSize: 13,
    fontWeight: '500',
    color: colors.textMuted,
  },
  copyrightText: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    color: colors.textFaint,
    textAlign: 'center',
  },
});

export default styles;
