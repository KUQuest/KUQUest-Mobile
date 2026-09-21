import { useLocalSearchParams } from "expo-router";

import DisputeScreen from "@/features/questBoard/DisputeScreen";
import { getRouteParam } from "@/utils/navigation";

export default function QuestDisputeRoute() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  return <DisputeScreen questId={getRouteParam(params.id)} />;
}
