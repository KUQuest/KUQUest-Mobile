import { useLocalSearchParams } from "expo-router";

import SelectRosterScreen from "@/features/questBoard/SelectRosterScreen";
import { getRouteParam } from "@/utils/navigation";

export default function SelectRosterRoute() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  return <SelectRosterScreen questId={getRouteParam(params.id)} />;
}
