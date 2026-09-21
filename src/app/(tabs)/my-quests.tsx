import { useLocalSearchParams } from "expo-router";

import { useRoleWorkspace } from "@/features/workspace/roleWorkspaceStore";
import WorkerWorkManagementScreen from "@/features/workerHome/screens/WorkerWorkManagementScreen";
import MyQuestListScreen from "@/features/myQuests/MyQuestListScreen";

export default function MyQuestsRoute() {
  const { workspace } = useRoleWorkspace();
  const params = useLocalSearchParams<{
    tab?: string | string[];
  }>();

  const rawTab = Array.isArray(params.tab) ? params.tab[0] : params.tab;
  if (workspace === "worker") {
    return <WorkerWorkManagementScreen />;
  }
  return <MyQuestListScreen initialRole="hirer" initialTab={rawTab} />;
}
