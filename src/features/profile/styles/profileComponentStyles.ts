import { StyleSheet } from 'react-native';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { fontFamily } from '@/theme/typography';

const styles = StyleSheet.create({
  heroCard: {
    alignItems: 'center',
    alignSelf: 'stretch',
    padding: 20,
    borderRadius: 16,
    backgroundColor: colors.white,
  },
  photoFrame: {
    width: 112,
    height: 112,
    borderRadius: 56,
    overflow: 'hidden',
    borderWidth: 6,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surfaceImage,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  initials: {
    color: colors.primaryDark,
    fontSize: 32,
    fontFamily: fontFamily.bold,
    fontWeight: '700',
  },
  name: {
    marginTop: spacing.sm + 4,
    color: colors.text,
    fontSize: 24,
    fontFamily: fontFamily.bold,
    fontWeight: '700',
    textAlign: 'center',
  },
  meta: {
    marginTop: 4,
    color: colors.textSecondary,
    fontFamily: fontFamily.regular,
    fontSize: 16,
  },
  subtleMeta: {
    marginTop: 2,
    color: colors.textSubtle,
    fontFamily: fontFamily.regular,
    fontSize: 14,
  },
  editButton: {
    minHeight: 48,
    marginTop: spacing.lg,
    backgroundColor: colors.primaryDark,
  },
  section: {
    alignSelf: 'stretch',
    borderRadius: 16,
    padding: 20,
    backgroundColor: colors.white,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 20,
    fontFamily: fontFamily.semiBold,
    fontWeight: '600',
  },
  rule: {
    height: 1,
    backgroundColor: colors.borderSubtle,
    marginTop: spacing.sm + 4,
    marginBottom: spacing.md + 4,
  },
  body: {
    color: colors.textSecondary,
    fontFamily: fontFamily.regular,
    fontSize: 16,
    lineHeight: 24,
  },
  emptyText: {
    color: colors.textSubtle,
    fontFamily: fontFamily.regular,
    fontSize: 14,
  },
  experience: {
    flexDirection: 'row',
    borderLeftWidth: 2,
    borderLeftColor: colors.borderSubtle,
    paddingLeft: spacing.md + 4,
    paddingBottom: spacing.lg,
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.success,
    marginTop: 5,
    marginLeft: -26,
    marginRight: spacing.md,
  },
  experienceContent: {
    flex: 1,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    marginBottom: spacing.md + 4,
  },
  badge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.successLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: colors.primaryDark,
    fontSize: 18,
    fontFamily: fontFamily.bold,
    fontWeight: '700',
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    color: colors.text,
    fontSize: 15,
    fontFamily: fontFamily.semiBold,
    fontWeight: '600',
  },
  itemMeta: {
    color: colors.textSubtle,
    fontFamily: fontFamily.regular,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 2,
  },
  itemDescription: {
    color: colors.textSecondary,
    fontFamily: fontFamily.regular,
    fontSize: 14,
    lineHeight: 22,
    marginTop: 6,
  },
  workList: {
    gap: spacing.md + 4,
  },
  workCard: {
    width: 260,
  },
  workImage: {
    width: 260,
    height: 160,
    borderRadius: 12,
    marginBottom: spacing.sm + 4,
  },
});

export default styles;
