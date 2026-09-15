import { useEffect, useState } from "react";
import { useLocalSearchParams } from "expo-router";

import { Pressable, SafeAreaView, Text, View } from "@/tw";
import { useLocale } from "@/locales/LocaleProvider";
import CreateQuestScreen from "@/features/createQuest/CreateQuestScreen";
import {
  getQuestDraftStorageKey,
  listQuestDrafts,
  type QuestDraftListItem,
} from "@/features/createQuest/createQuestPersistence";

export default function CreateScreen() {
  const { editQuestId } = useLocalSearchParams<{
    editQuestId?: string | string[];
  }>();
  const { locale } = useLocale();
  const normalizedEditQuestId = Array.isArray(editQuestId)
    ? editQuestId.length === 1
      ? editQuestId[0]
      : undefined
    : editQuestId;
  const [selectedDraftId, setSelectedDraftId] = useState<string | null>(
    normalizedEditQuestId ?? null
  );
  const [drafts, setDrafts] = useState<QuestDraftListItem[]>([]);
  const [loadingDrafts, setLoadingDrafts] = useState(!normalizedEditQuestId);

  useEffect(() => {
    if (normalizedEditQuestId) return;
    let active = true;
    void (async () => {
      try {
        const storageKey = await getQuestDraftStorageKey();
        const storedDrafts = await listQuestDrafts(storageKey);
        if (active) setDrafts(storedDrafts);
      } finally {
        if (active) setLoadingDrafts(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [normalizedEditQuestId]);

  if (selectedDraftId) {
    return <CreateQuestScreen editQuestId={selectedDraftId} />;
  }

  if (loadingDrafts) {
    return (
      <SafeAreaView className="bg-ku-background flex-1 items-center justify-center">
        <Text className="text-ku-text-secondary">Loading Quest drafts…</Text>
      </SafeAreaView>
    );
  }

  if (drafts.length === 0) return <CreateQuestScreen />;

  const copy =
    locale === "th"
      ? {
          title: "สร้างเควสต์",
          description: "เลือกฉบับร่างเพื่อแก้ไข หรือเริ่มเควสต์ใหม่",
          newQuest: "สร้างเควสต์ใหม่",
          edit: "แก้ไขฉบับร่าง",
        }
      : {
          title: "Create Quest",
          description: "Choose a draft to edit or start a new Quest.",
          newQuest: "Create new Quest",
          edit: "Edit draft",
        };

  return (
    <SafeAreaView className="bg-ku-background flex-1 px-[20px] pt-[32px]">
      <Text className="text-ku-text-strong font-ku-bold text-ku-title">
        {copy.title}
      </Text>
      <Text className="text-ku-text-secondary mt-[8px]">
        {copy.description}
      </Text>
      <Pressable
        accessibilityRole="button"
        className="bg-ku-primary mt-[24px] min-h-[52px] items-center justify-center rounded-[16px]"
        onPress={() => setDrafts([])}
      >
        <Text className="text-ku-white font-ku-semibold">{copy.newQuest}</Text>
      </Pressable>
      <View className="mt-[24px] gap-[12px]">
        {drafts.map(({ id, snapshot }) => (
          <Pressable
            accessibilityRole="button"
            className="border-ku-border-subtle bg-ku-card min-h-[72px] rounded-[16px] border px-[16px] py-[12px]"
            key={id}
            onPress={() => setSelectedDraftId(id)}
          >
            <Text className="text-ku-text-strong font-ku-semibold">
              {snapshot.draft.title || copy.edit}
            </Text>
            <Text className="text-ku-text-secondary mt-[4px]">{copy.edit}</Text>
          </Pressable>
        ))}
      </View>
    </SafeAreaView>
  );
}
