import { useLocalSearchParams } from "expo-router";

import PartialGroupStartConsentScreen from "@/features/questBoard/teamAssemble/PartialGroupStartConsentScreen";
import { resolveQuestDetailRoute } from "@/features/questBoard/detail/questDetailRoute";

export default function PartialStartRoute() {
  const params = useLocalSearchParams();
  return (
    <PartialGroupStartConsentScreen {...resolveQuestDetailRoute(params)} />
  );
}
