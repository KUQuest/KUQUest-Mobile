import { StyleSheet } from 'react-native';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'flex-start',
    justifyContent: 'center',
    position: 'relative',
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.surface,
    borderBottomWidth: 0,
    elevation: 0,
    shadowOpacity: 0,
  },
  profileContainer: {
    alignItems: 'flex-start',
    backgroundColor: colors.surface,
    borderBottomWidth: 0,
    elevation: 0,
    paddingHorizontal: spacing.lg,
    shadowOpacity: 0,
  },
  backButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonPosition: {
    left: spacing.md,
    position: 'absolute',
  },
  logo: {
    resizeMode: 'contain',
  },
  profileLogo: {
    height: 36,
    width: 80,
  },
});

export default styles;
