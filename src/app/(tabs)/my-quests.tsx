import { useLocalSearchParams } from "expo-router";

import MyQuestListScreen from "@/features/myQuests/MyQuestListScreen";

export default function MyQuestsRoute() {
  const params = useLocalSearchParams<{
    role?: string | string[];
    tab?: string | string[];
  }>();

  const rawRole = Array.isArray(params.role) ? params.role[0] : params.role;
  const rawTab = Array.isArray(params.tab) ? params.tab[0] : params.tab;
  const initialRole =
    rawRole === "hirer" ? "hirer" : rawRole === "worker" ? "worker" : undefined;
  return <MyQuestListScreen initialRole={initialRole} initialTab={rawTab} />;
}
