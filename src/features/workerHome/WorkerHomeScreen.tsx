import { ScreenLayout } from "@/components/layout/ScreenLayout";
import { WorkerHomeContent } from "./components/WorkerHomeContent";
import { useWorkerHomeController } from "./workflow/useWorkerHomeController";

export default function WorkerHomeScreen() {
  const { frame, content } = useWorkerHomeController();

  return (
    <ScreenLayout {...frame}>
      <WorkerHomeContent {...content} />
    </ScreenLayout>
  );
}
