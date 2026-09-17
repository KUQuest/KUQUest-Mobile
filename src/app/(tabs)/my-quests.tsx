import { useLocalSearchParams } from "expo-router";

import MyQuestsScreen from "@/features/myQuests/MyQuestsScreen";

export default function MyQuestsRoute() {
  const params = useLocalSearchParams<{
    role?: string | string[];
    tab?: string | string[];
  }>();

  const rawRole = Array.isArray(params.role) ? params.role[0] : params.role;
  const rawTab = Array.isArray(params.tab) ? params.tab[0] : params.tab;
  const initialRole =
    rawRole === "hirer" ? "hirer" : rawRole === "worker" ? "worker" : undefined;

  return <MyQuestsScreen initialRole={initialRole} initialTab={rawTab} />;
}
