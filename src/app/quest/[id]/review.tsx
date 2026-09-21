import { useLocalSearchParams } from "expo-router";

import QuestReviewScreen from "@/features/questBoard/QuestReviewScreen";
import { getRouteParam } from "@/utils/navigation";
export default function QuestReviewRoute() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  return <QuestReviewScreen questId={getRouteParam(params.id)} />;
}
