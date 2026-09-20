import HomeScreen from "@/features/home/HomeScreen";
import WorkerHomeScreen from "@/features/workerHome/WorkerHomeScreen";
import { useRoleWorkspace } from "@/features/workspace/roleWorkspaceStore";

export default function HomeRoute() {
  const { workspace } = useRoleWorkspace();

  return workspace === "worker" ? <WorkerHomeScreen /> : <HomeScreen />;
}
