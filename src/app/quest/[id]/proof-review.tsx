import { useLocalSearchParams } from "expo-router";

import HirerProofReviewScreen from "@/features/questBoard/review/HirerProofReviewScreen";
import { getRouteParam } from "@/utils/navigation";

export default function HirerProofReviewRoute() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  return <HirerProofReviewScreen questId={getRouteParam(params.id)} />;
}
