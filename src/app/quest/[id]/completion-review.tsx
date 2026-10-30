import { useLocalSearchParams } from "expo-router";

import HirerCompletionReviewScreen from "@/features/questBoard/review/HirerCompletionReviewScreen";
import { getRouteParam } from "@/utils/navigation";

export default function HirerCompletionReviewRoute() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  return <HirerCompletionReviewScreen questId={getRouteParam(params.id)} />;
}
