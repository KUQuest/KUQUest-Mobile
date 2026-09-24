import { useLocalSearchParams } from "expo-router";

import { resolveQuestDetailRoute } from "@/features/questBoard/detail/questDetailRoute";
import TeamAssembleScreen from "@/features/questBoard/teamAssemble/TeamAssembleScreen";

export default function QuestTeamRoute() {
  const params = useLocalSearchParams();
  return <TeamAssembleScreen {...resolveQuestDetailRoute(params)} />;
}
