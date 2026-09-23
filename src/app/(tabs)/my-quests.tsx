import { useLocalSearchParams } from "expo-router";

import MyQuestListScreen from "@/features/myQuests/MyQuestListScreen";
import WorkerWorkManagementScreen from "@/features/workerWork/WorkerWorkManagementScreen";
import { useRoleWorkspace } from "@/features/workspace/roleWorkspaceStore";

export default function MyQuestsRoute() {
  const params = useLocalSearchParams<{
    role?: string | string[];
    tab?: string | string[];
  }>();
  const { workspace } = useRoleWorkspace();

  const rawRole = Array.isArray(params.role) ? params.role[0] : params.role;
  const rawTab = Array.isArray(params.tab) ? params.tab[0] : params.tab;
  const role =
    rawRole === "hirer" || rawRole === "worker" ? rawRole : workspace;
  if (role === "worker") {
    return <WorkerWorkManagementScreen initialTab={rawTab} />;
  }
  return <MyQuestListScreen initialTab={rawTab} />;
}
