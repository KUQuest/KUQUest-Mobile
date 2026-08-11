import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, View } from 'react-native';

import { useLocale } from '@/locales/LocaleProvider';
import { navigationMessages } from '@/locales/navigationMessages';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { TopBar } from './TopBar';

interface FeaturePlaceholderProps {
  titleKey: 'myQuestsTitle' | 'createTitle' | 'chatTitle';
}

export function FeaturePlaceholder({ titleKey }: FeaturePlaceholderProps) {
  const { locale } = useLocale();
  const messages = navigationMessages[locale];

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={{ backgroundColor: colors.background, flex: 1 }}>
      <TopBar />
      <View style={{ alignItems: 'center', flex: 1, justifyContent: 'center', padding: 24 }}>
        <Text style={{ ...typography.heading, color: colors.primary, textAlign: 'center' }}>{messages[titleKey]}</Text>
        <Text style={{ ...typography.body, color: colors.textSecondary, marginTop: 8, textAlign: 'center' }}>
          {messages.placeholderDescription}
        </Text>
      </View>
    </SafeAreaView>
  );
}
