import { useRouter } from "expo-router";

import { Button } from "@/components/ui/Button";
import { ScreenLayout } from "@/components/layout/ScreenLayout";
import { useLocale } from "@/features/preferences/localeStore";
import { createQuestMessages } from "@/locales/createQuestMessages";
import { Text, View } from "@/tw";

import CreateQuestScreen from "../CreateQuestScreen";

export interface EditQuestScreenProps {
  questId?: string;
}

export default function EditQuestScreen({ questId }: EditQuestScreenProps) {
  const router = useRouter();
  const { locale } = useLocale();
  const messages = createQuestMessages[locale];

  if (!questId) {
    return (
      <ScreenLayout className="flex-1 items-center justify-center bg-ku-background p-ku-lg">
        <View className="w-full items-center gap-ku-12">
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
