import type { TagItem } from "@/api/QuestApi";
import type { QuestBoardQuest } from "@/features/questBoard/domain/types";
import type { SupportedLocale } from "./locale";

export function getTagLabel(
  tag: Pick<TagItem, "name" | "nameTh">,
  locale: SupportedLocale
): string {
  return locale === "th" && tag.nameTh ? tag.nameTh : tag.name;
}

export function getTagLabelById(
  tags: readonly TagItem[],
  tagId: string | null | undefined,
  fallback: string | undefined,
  locale: SupportedLocale
): string | undefined {
  const tag = tagId ? tags.find((item) => item.id === tagId) : undefined;
  return tag ? getTagLabel(tag, locale) : fallback;
}

export function localizeQuestBoardQuest(
  quest: QuestBoardQuest,
  tags: readonly TagItem[],
  locale: SupportedLocale
): QuestBoardQuest {
  if (quest.tags.length === 0) return quest;
  const localizedTag = getTagLabelById(
    tags,
    quest.tagId,
    quest.tags[0],
    locale
  );
  if (!localizedTag || localizedTag === quest.tags[0]) return quest;
  return { ...quest, tags: [localizedTag, ...quest.tags.slice(1)] };
}
