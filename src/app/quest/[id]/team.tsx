import { useLocalSearchParams } from "expo-router";

import {
  parseSingleRouteParam,
  resolveQuestDetailRoute,
} from "@/features/questBoard/detail/questDetailRoute";
import TeamAssembleScreen from "@/features/questBoard/teamAssemble/TeamAssembleScreen";
import { createTeamInviteLink } from "@/features/questBoard/teamAssemble/teamInvite";

export default function QuestTeamRoute() {
  const params = useLocalSearchParams();
  const route = resolveQuestDetailRoute(params);
  const teamId = parseSingleRouteParam(params.teamId);
  const code = parseSingleRouteParam(params.code);
  return (
    <TeamAssembleScreen
      {...route}
      initialInvite={
        route.questId && teamId && code
          ? createTeamInviteLink(route.questId, teamId, code)
          : undefined
      }
    />
  );
}
