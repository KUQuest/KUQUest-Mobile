import type { QuestV2CanonicalQuest } from "@/api/questV2Contracts";
import { myQuestMessages } from "@/locales/myQuestMessages";
import type { SupportedLocale } from "@/locales/locale";
import type { LiveQuestSnapshot } from "@/features/questBoard/liveQuestService";
import {
  getLiveHirerItems,
  getLiveWorkerItems,
  type HirerTab,
  type QuestSummary,
  type WorkerTab,
} from "./myQuestService";

export type MyQuestRole = "worker" | "hirer";
export type MyQuestTab = WorkerTab | HirerTab;
export interface MyQuestWorkspaceProjection {
  tabs: MyQuestTab[];
  tabLabels: Record<string, string>;
  selectedTab: MyQuestTab;
  items: QuestSummary[];
  selectedTabLabel: string;
  emptyTitle: string;
  emptyDescription: string;
}

export interface ProjectMyQuestWorkspaceInput {
  role: MyQuestRole;
  requestedTab?: string;
  locale: SupportedLocale;
  hirerQuests: QuestV2CanonicalQuest[] | null;
  workerSnapshots: LiveQuestSnapshot[] | null;
  viewerId: string;
}

const workerTabs: WorkerTab[] = ["pending", "accepted", "history"];
const hirerTabs: HirerTab[] = ["active", "draft", "completed"];

function normalizeTab(
  role: MyQuestRole,
  requestedTab: string | undefined
): MyQuestTab {
  if (role === "hirer") {
    return requestedTab === "draft" || requestedTab === "completed"
      ? requestedTab
      : "active";
  }
  return requestedTab === "accepted" || requestedTab === "history"
    ? requestedTab
    : "pending";
}

export function projectMyQuestWorkspace({
  role,
  requestedTab,
  locale,
  hirerQuests,
  workerSnapshots,
  viewerId,
}: ProjectMyQuestWorkspaceInput): MyQuestWorkspaceProjection {
  const tabs = role === "hirer" ? hirerTabs : workerTabs;
  const selectedTab = normalizeTab(role, requestedTab);
  const messages = myQuestMessages[locale];
  const items =
    role === "hirer"
      ? hirerQuests
        ? getLiveHirerItems(hirerQuests, selectedTab as HirerTab, locale)
        : []
      : workerSnapshots
        ? getLiveWorkerItems(
            workerSnapshots,
            selectedTab as WorkerTab,
            locale,
            viewerId
          )
        : [];
  const tabLabels =
    role === "hirer" ? messages.tabs.hirer : messages.tabs.worker;
  const selectedTabLabel =
    role === "hirer"
      ? messages.tabs.hirer[selectedTab as HirerTab]
      : messages.tabs.worker[selectedTab as WorkerTab];

  return {
    tabs,
    tabLabels,
    selectedTab,
    items,
    selectedTabLabel,
    emptyTitle:
      role === "hirer"
        ? messages.emptyTitle.hirer[selectedTab as HirerTab]
        : messages.emptyTitle.worker[selectedTab as WorkerTab],
    emptyDescription: messages.emptyDescription[role],
  };
}
