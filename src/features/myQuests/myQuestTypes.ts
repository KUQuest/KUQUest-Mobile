import type { WorkConversationCapability } from "@/features/questBoard/domain/types";
export type HirerTab = "active" | "draft" | "completed";
export type StatusTone = "success" | "warning" | "danger" | "neutral";
export type CategoryTone = "green" | "blue" | "purple";
/** Card actions route to existing Quest screens; cancel is handled separately. */
export type QuestCardAction = "edit" | "manage" | "review" | "dispute";
export type QuestSummary = {
  id: string;
  title: string;
  tag: string;
  categoryTone: CategoryTone;
  startsAt: string;
  endsAt: string;
  location: string;
  /** An online Quest has no physical location. */
  online: boolean;
  description: string;
  detail: string;
  teamSize: string;
  mode: string;
  reward: string;
  status: string;
  statusTone: StatusTone;
  primaryAction: QuestCardAction;
  secondaryAction?: QuestCardAction;
  /**
   * Set only for ADR 0003 Tier 1 (no penalty) states. Assigned and In Progress
   * cancellation stays behind the Manage screen.
   */
  cancelFromCard?: "draft" | "open";
  groupChatId?: string;
  groupChatCapability?: WorkConversationCapability;
  groupChatViewerId?: string;
  host?: string;
  appliedOn?: string;
  reason?: string;
};
