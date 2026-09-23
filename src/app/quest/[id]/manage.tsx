import { useLocalSearchParams } from "expo-router";

import HirerQuestManageScreen from "@/features/questBoard/manage/HirerQuestManageScreen";
import { getRouteParam } from "@/utils/navigation";

export default function HirerQuestManageRoute() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  return <HirerQuestManageScreen questId={getRouteParam(params.id)} />;
}
