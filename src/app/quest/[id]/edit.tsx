import { useLocalSearchParams } from "expo-router";

import EditQuestScreen from "@/features/createQuest/EditQuestScreen";
import { getRouteParam } from "@/utils/navigation";

export default function QuestEditRoute() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  return <EditQuestScreen questId={getRouteParam(params.id)} />;
}
