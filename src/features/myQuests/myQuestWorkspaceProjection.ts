import type { QuestV2CanonicalQuest } from "@/api/questV2Contracts";
import type { TagItem } from "@/api/QuestApi";
import { myQuestMessages } from "@/locales/myQuestMessages";
import type { SupportedLocale } from "@/locales/locale";
import { getLiveHirerItems } from "./myQuestService";
import type { HirerTab, QuestSummary } from "./myQuestTypes";

export type MyQuestTab = HirerTab;
export interface MyQuestWorkspaceProjection {
  tabs: MyQuestTab[];
  tabLabels: Record<MyQuestTab, string>;
  selectedTab: MyQuestTab;
  items: QuestSummary[];
  selectedTabLabel: string;
  emptyTitle: string;
  emptyDescription: string;
}

export interface ProjectMyQuestWorkspaceInput {
  requestedTab?: string;
  locale: SupportedLocale;
  hirerQuests: QuestV2CanonicalQuest[] | null;
  tagCatalog?: readonly TagItem[];
  proofReviewableQuestIds?: ReadonlySet<string>;
}

const hirerTabs: HirerTab[] = ["active", "draft", "completed"];

function normalizeTab(requestedTab: string | undefined): MyQuestTab {
  return requestedTab === "draft" || requestedTab === "completed"
    ? requestedTab
    : "active";
}

/** Projects the Hirer's owned Quests into the Work Management tabs. */
export function projectMyQuestWorkspace({
  requestedTab,
  locale,
  hirerQuests,
  tagCatalog = [],
  proofReviewableQuestIds,
}: ProjectMyQuestWorkspaceInput): MyQuestWorkspaceProjection {
  const selectedTab = normalizeTab(requestedTab);
  const messages = myQuestMessages[locale];

  return {
    tabs: hirerTabs,
    tabLabels: messages.tabs,
    selectedTab,
    items: hirerQuests
      ? getLiveHirerItems(
          hirerQuests,
          selectedTab,
          locale,
          tagCatalog,
          proofReviewableQuestIds
        )
      : [],
    selectedTabLabel: messages.tabs[selectedTab],
    emptyTitle: messages.emptyTitle[selectedTab],
    emptyDescription: messages.emptyDescription,
  };
}
