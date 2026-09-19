import {
  CheckSquare,
  Grid2X2,
  MessageSquare,
  Plus,
  type LucideIcon,
} from "lucide-react-native";

import { Pressable, Text, View } from "@/tw";

import { ScreenLayout } from "@/components/layout/ScreenLayout";
import { useLocale } from "@/features/preferences/localeStore";
import { navigationMessages } from "@/locales/navigationMessages";
import { colors } from "@/theme/colors";
interface FeaturePlaceholderProps {
  titleKey: "boardTitle" | "myQuestsTitle" | "createTitle" | "chatTitle";
  actionLabel?: string;
  onAction?: () => void;
}

const featureConfig: Record<
  FeaturePlaceholderProps["titleKey"],
  {
    descriptionKey:
      | "boardDescription"
      | "myQuestsDescription"
      | "createDescription"
      | "chatDescription";
    icon: LucideIcon;
  }
> = {
  boardTitle: { descriptionKey: "boardDescription", icon: Grid2X2 },
  myQuestsTitle: { descriptionKey: "myQuestsDescription", icon: CheckSquare },
  createTitle: { descriptionKey: "createDescription", icon: Plus },
  chatTitle: { descriptionKey: "chatDescription", icon: MessageSquare },
};

export function FeaturePlaceholder({
  titleKey,
  actionLabel,
  onAction,
}: FeaturePlaceholderProps) {
  const { locale } = useLocale();
  const messages = navigationMessages[locale];
  const { descriptionKey, icon: Icon } = featureConfig[titleKey];

  return (
    <ScreenLayout
      edges={["top", "left", "right"]}
      className="flex-1 bg-ku-background"
    >
      <View className="flex-1 justify-start p-[24px] pt-[24px]">
        <View className="mb-[20px] h-[64px] w-[64px] items-center justify-center rounded-[24px] border border-ku-border-accent bg-ku-surface-accent">
          <Icon color={colors.primary} size={32} strokeWidth={2} />
        </View>
        <Text className="text-left font-ku-bold text-ku-title text-ku-primary">
          {messages[titleKey]}
        </Text>
        <Text className="mt-[8px] max-w-[360px] text-left font-ku-regular text-ku-body text-ku-text-secondary">
          {messages[descriptionKey]}
        </Text>
        {actionLabel && onAction ? (
          <Pressable
            accessibilityRole="button"
            className="mt-[24px] min-h-[44px] justify-center self-start rounded-ku-pill bg-ku-primary px-[24px]"
            onPress={onAction}
          >
            <Text className="font-ku-semibold text-ku-white">
              {actionLabel}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </ScreenLayout>
  );
}
