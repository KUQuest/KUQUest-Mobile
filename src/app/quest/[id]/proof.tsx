import { Redirect, useLocalSearchParams } from "expo-router";

import QuestProofScreen from "@/features/questBoard/proof/QuestProofScreen";
import { useRoleWorkspace } from "@/features/workspace/roleWorkspaceStore";
import { getRouteParam } from "@/utils/navigation";

export default function QuestProofRoute() {
  const { workspace } = useRoleWorkspace();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const questId = getRouteParam(params.id);
  if (workspace === "worker" && questId) {
    // Workers submit proof inline in the Work Hub.
    return (
      <Redirect
        href={{ pathname: "/quest/[id]/work", params: { id: questId } }}
      />
    );
  }
  return <QuestProofScreen />;
}
