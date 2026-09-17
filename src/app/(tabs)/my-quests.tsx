import { useLocalSearchParams } from "expo-router";

import MyQuestsScreen from "@/features/myQuests/MyQuestsScreen";
import DraftQuestsScreen from "@/features/myQuests/DraftQuestsScreen";

export default function MyQuestsRoute() {
  const params = useLocalSearchParams<{
    role?: string | string[];
    tab?: string | string[];
  }>();

  const rawRole = Array.isArray(params.role) ? params.role[0] : params.role;
  const rawTab = Array.isArray(params.tab) ? params.tab[0] : params.tab;
  const initialRole =
    rawRole === "hirer" ? "hirer" : rawRole === "worker" ? "worker" : undefined;
  if (initialRole === "hirer" && rawTab === "draft") {
    return <DraftQuestsScreen />;
  }

  return <MyQuestsScreen initialRole={initialRole} initialTab={rawTab} />;
}
