import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, Text, View } from 'react-native';
import { CheckSquare, Grid2X2, MessageSquare, Plus, type LucideIcon } from 'lucide-react-native';

import { useLocale } from '@/locales/LocaleProvider';
import { navigationMessages } from '@/locales/navigationMessages';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { TopBar } from './TopBar';

interface FeaturePlaceholderProps {
  titleKey: 'boardTitle' | 'myQuestsTitle' | 'createTitle' | 'chatTitle';
}

const featureConfig: Record<FeaturePlaceholderProps['titleKey'], { descriptionKey: 'boardDescription' | 'myQuestsDescription' | 'createDescription' | 'chatDescription'; icon: LucideIcon }> = {
  boardTitle: { descriptionKey: 'boardDescription', icon: Grid2X2 },
  myQuestsTitle: { descriptionKey: 'myQuestsDescription', icon: CheckSquare },
  createTitle: { descriptionKey: 'createDescription', icon: Plus },
  chatTitle: { descriptionKey: 'chatDescription', icon: MessageSquare },
};

export function FeaturePlaceholder({ titleKey }: FeaturePlaceholderProps) {
  const { locale } = useLocale();
  const messages = navigationMessages[locale];
  const { descriptionKey, icon: Icon } = featureConfig[titleKey];

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
      <TopBar />
      <View style={styles.content}>
        <View style={styles.iconFrame}>
          <Icon color={colors.primary} size={32} strokeWidth={2} />
        </View>
        <Text style={styles.title}>{messages[titleKey]}</Text>
        <Text style={styles.description}>{messages[descriptionKey]}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.background,
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'flex-start',
    padding: 24,
    paddingTop: 56,
  },
  iconFrame: {
    alignItems: 'center',
    backgroundColor: colors.surfaceAccent,
    borderColor: colors.borderAccent,
    borderRadius: 24,
    borderWidth: 1,
    height: 64,
    justifyContent: 'center',
    marginBottom: 20,
    width: 64,
  },
  title: {
    ...typography.heading,
    color: colors.primary,
    textAlign: 'left',
  },
  description: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: 8,
    maxWidth: 360,
    textAlign: 'left',
  },
});
