import * as ImagePicker from "expo-image-picker";
import { useCallback, useState } from "react";

import { MAX_QUEST_IMAGES } from "../questBoard/types";
import type { CreateQuestMessages } from "@/locales/createQuestMessages";

import type { QuestDraft } from "./createQuestModel";

type DraftUpdater = <K extends keyof QuestDraft>(
  field: K,
  value: QuestDraft[K]
) => void;

export function useCreateQuestImages({
  draft,
  messages,
  updateDraft,
}: {
  draft: QuestDraft;
  messages: CreateQuestMessages;
  updateDraft: DraftUpdater;
}) {
  const [imageError, setImageError] = useState<string>();

  const pickImages = useCallback(async () => {
    setImageError(undefined);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsMultipleSelection: true,
        selectionLimit: MAX_QUEST_IMAGES,
        quality: 0.6,
      });
      if (!result.canceled) {
        updateDraft(
          "imageUris",
          result.assets.slice(0, MAX_QUEST_IMAGES).map((asset) => asset.uri)
        );
      }
    } catch {
      setImageError(messages.imageError);
    }
  }, [messages.imageError, updateDraft]);

  const removeImage = useCallback(
    (index: number) => {
      updateDraft(
        "imageUris",
        draft.imageUris.filter((_, imageIndex) => imageIndex !== index)
      );
      setImageError(undefined);
    },
    [draft.imageUris, updateDraft]
  );

  return { imageError, setImageError, pickImages, removeImage };
}
