import { WorkerWorkManagementView } from "./components/WorkerWorkManagementView";
import { useWorkerWorkController } from "./workflow/useWorkerWorkController";

export interface WorkerWorkManagementScreenProps {
  initialTab?: string;
}

export default function WorkerWorkManagementScreen({
  initialTab,
}: WorkerWorkManagementScreenProps = {}) {
  const viewProps = useWorkerWorkController({ initialTab });
  return <WorkerWorkManagementView {...viewProps} />;
}
