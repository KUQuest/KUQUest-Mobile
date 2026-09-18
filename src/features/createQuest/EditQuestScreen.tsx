import { useRouter } from "expo-router";

import { Button } from "@/components/ui/Button";
import { ScreenLayout } from "@/components/layout/ScreenLayout";
import { useLocale } from "@/locales/LocaleProvider";
import { createQuestMessages } from "@/locales/createQuestMessages";
import { Text, View } from "@/tw";

import CreateQuestScreen from "./CreateQuestScreen";

export interface EditQuestScreenProps {
  questId?: string;
}

export default function EditQuestScreen({ questId }: EditQuestScreenProps) {
  const router = useRouter();
  const { locale } = useLocale();
  const messages = createQuestMessages[locale];

  if (!questId) {
    return (
      <ScreenLayout className="bg-ku-background flex-1 items-center justify-center p-[24px]">
        <View className="w-full items-center gap-[12px]">
          <Text accessibilityRole="alert" className="text-ku-text-secondary">
            {messages.loadDraftError}
          </Text>
          <Button onPress={() => router.replace("/(tabs)")} className="w-full">
            {messages.back}
          </Button>
        </View>
      </ScreenLayout>
    );
  }

  return <CreateQuestScreen editMode editQuestId={questId} />;
}
