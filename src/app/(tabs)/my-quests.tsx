import MyQuestsScreen from "@/features/myQuests/MyQuestsScreen";
import WorkerWorkManagementScreen from "@/features/workerHome/screens/WorkerWorkManagementScreen";
import { useRoleWorkspace } from "@/components/navigation/RoleWorkspaceContext";

export default function MyQuestsRoute() {
  const { workspace } = useRoleWorkspace();
  if (workspace === "worker") {
    return <WorkerWorkManagementScreen />;
  }
  return <MyQuestsScreen initialRole="hirer" />;
}
