import type { SupportedLocale } from "@/locales/locale";
import {
  prototypeQuestMessages,
  prototypeQuestTagMessages,
} from "@/locales/prototypeQuestMessages";
import type { QuestBoardQuest } from "../domain/types";

export function getLocalizedTag(tag: string, locale: SupportedLocale): string {
  if (locale !== "th") return tag;
  return prototypeQuestTagMessages[locale][tag] ?? tag;
}

export function getLocalizedQuest(
  quest: QuestBoardQuest,
  locale: SupportedLocale
): QuestBoardQuest {
  if (locale !== "th") return quest;
  const translation = prototypeQuestMessages[locale][quest.id];
  if (!translation) return quest;

  const localizedTags =
    translation.tags ?? quest.tags.map((tag) => getLocalizedTag(tag, locale));
  return {
    ...quest,
    title: translation.title,
    tags: localizedTags,
    description: translation.description,
    completionCriteria: translation.completionCriteria,
    location: translation.location,
    creator: {
      ...quest.creator,
      name: translation.creatorName,
      faculty: translation.creatorFaculty ?? quest.creator.faculty,
    },
  };
}
