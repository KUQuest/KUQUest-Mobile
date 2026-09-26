import type { LiveQuestSnapshot } from "@/features/questBoard/live/liveQuestTypes";
import type {
  WorkerWorkActionKey,
  WorkerWorkStatusKey,
} from "@/locales/workerWorkMessages";

export type WorkerWorkTone =
  "action" | "progress" | "success" | "danger" | "neutral";

export interface WorkerWorkItem {
  questId: string;
  title: string;
  startTime: string;
  dueAt: string | null;
  questState: LiveQuestSnapshot["state"];
  status: WorkerWorkStatusKey;
  tone: WorkerWorkTone;
  action: WorkerWorkActionKey;
  needsAction: boolean;
}

export interface WorkerWorkProjection {
  needsAction: WorkerWorkItem[];
  otherActive: WorkerWorkItem[];
  history: WorkerWorkItem[];
  activeCount: number;
}
