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
  selectBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderMuted,
    borderRadius: 8,
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: spacing.sm + 2,
    backgroundColor: colors.white,
    minHeight: 44,
  },
  selectBoxError: {
    borderColor: colors.danger,
  },
  selectBoxSuccess: {
    borderColor: colors.success,
  },
  selectBoxDisabled: {
    backgroundColor: colors.surfaceMuted,
    opacity: 0.6,
  },
  selectText: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    color: colors.textStrong,
  },
  placeholderText: {
    color: colors.textFaint,
  },
  errorText: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    color: colors.danger,
    marginTop: 4,
  },
  helperSlot: {
    minHeight: 18,
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: colors.overlay,
  },
  keyboardAvoidingView: {
    flex: 1,
    justifyContent: 'flex-end',
    width: '100%',
  },
  modalDismissArea: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderMuted,
  },
  modalTitle: {
    fontFamily: fontFamily.bold,
    fontSize: 16,
    color: colors.textStrong,
  },
  closeButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    minWidth: 44,
  },
  clearButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    minWidth: 44,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.md,
    marginVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderMuted,
    borderRadius: 8,
    backgroundColor: colors.surfaceSubtle,
    minHeight: 44,
  },
  searchInput: {
    flex: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    fontFamily: fontFamily.regular,
    fontSize: 14,
    color: colors.textStrong,
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.surfaceMuted,
  },
  optionText: {
    fontFamily: fontFamily.regular,
    fontSize: 16,
    color: colors.textSecondary,
  },
  optionTextSelected: {
    fontFamily: fontFamily.bold,
    color: colors.primary,
  },
  emptyText: {
    padding: spacing.lg,
    textAlign: 'center',
    fontFamily: fontFamily.regular,
    fontSize: 14,
    color: colors.textMuted,
  },
});

export default styles;
