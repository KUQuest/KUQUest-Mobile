import { useLocalSearchParams } from "expo-router";

import QuestDetailScreen from "@/features/questBoard/QuestDetailScreen";
import { resolveQuestDetailRoute } from "@/features/questBoard/detail/questDetailRoute";

export default function QuestDetailRoute() {
  const params = useLocalSearchParams();
  return <QuestDetailScreen {...resolveQuestDetailRoute(params)} />;
}
