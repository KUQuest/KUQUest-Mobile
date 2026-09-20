import { useLocalSearchParams } from "expo-router";

import MyQuestListScreen from "@/features/myQuests/MyQuestListScreen";
import { useRoleWorkspace } from "@/features/workspace/roleWorkspaceStore";

export default function MyQuestsRoute() {
  const params = useLocalSearchParams<{
    role?: string | string[];
    tab?: string | string[];
  }>();
  const { workspace } = useRoleWorkspace();

  const rawRole = Array.isArray(params.role) ? params.role[0] : params.role;
  const rawTab = Array.isArray(params.tab) ? params.tab[0] : params.tab;
  const initialRole =
    rawRole === "hirer" || rawRole === "worker" ? rawRole : workspace;
  return <MyQuestListScreen initialRole={initialRole} initialTab={rawTab} />;
}
