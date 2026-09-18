import QuestProofScreen from "@/features/questBoard/QuestProofScreen";
import WorkerProofUploadScreen from "@/features/workerHome/screens/WorkerProofUploadScreen";
import { useRoleWorkspace } from "@/features/workspace/roleWorkspaceStore";

export default function QuestProofRoute() {
  const { workspace } = useRoleWorkspace();
  if (workspace === "worker") {
    return <WorkerProofUploadScreen />;
  }
  return <QuestProofScreen />;
}
