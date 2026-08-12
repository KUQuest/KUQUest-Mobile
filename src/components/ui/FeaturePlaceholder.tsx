import { CheckSquare, Grid2X2, MessageSquare, Plus, type LucideIcon } from 'lucide-react-native';

import { Pressable, SafeAreaView, Text, View } from '@/tw';
import { useLocale } from '@/locales/LocaleProvider';
import { navigationMessages } from '@/locales/navigationMessages';
import { colors } from '@/theme/colors';
import { TopBar } from './TopBar';

interface FeaturePlaceholderProps {
  titleKey: 'boardTitle' | 'myQuestsTitle' | 'createTitle' | 'chatTitle';
  actionLabel?: string;
  onAction?: () => void;
}

const featureConfig: Record<FeaturePlaceholderProps['titleKey'], { descriptionKey: 'boardDescription' | 'myQuestsDescription' | 'createDescription' | 'chatDescription'; icon: LucideIcon }> = {
  boardTitle: { descriptionKey: 'boardDescription', icon: Grid2X2 },
  myQuestsTitle: { descriptionKey: 'myQuestsDescription', icon: CheckSquare },
  createTitle: { descriptionKey: 'createDescription', icon: Plus },
  chatTitle: { descriptionKey: 'chatDescription', icon: MessageSquare },
};

export function FeaturePlaceholder({ titleKey, actionLabel, onAction }: FeaturePlaceholderProps) {
  const { locale } = useLocale();
  const messages = navigationMessages[locale];
  const { descriptionKey, icon: Icon } = featureConfig[titleKey];

  return (
    <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-ku-background">
      <TopBar />
      <View className="flex-1 justify-start p-[24px] pt-[56px]">
        <View className="items-center bg-ku-surface-accent border-ku-border-accent rounded-[24px] border h-[64px] justify-center mb-[20px] w-[64px]">
          <Icon color={colors.primary} size={32} strokeWidth={2} />
        </View>
        <Text className="font-ku-bold text-ku-primary text-[24px] text-left">{messages[titleKey]}</Text>
        <Text className="font-ku-regular text-ku-text-secondary mt-[8px] max-w-[360px] text-[16px] text-left leading-[24px]">{messages[descriptionKey]}</Text>
        {actionLabel && onAction ? <Pressable accessibilityRole="button" className="self-start bg-ku-primary rounded-ku-pill mt-[24px] min-h-[44px] justify-center px-[24px]" onPress={onAction}><Text className="text-ku-white font-semibold">{actionLabel}</Text></Pressable> : null}
      </View>
    </SafeAreaView>
  );
}
