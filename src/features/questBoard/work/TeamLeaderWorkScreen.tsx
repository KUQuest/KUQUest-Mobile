import type { ReactNode } from "react";

import { QuestTeamRole } from "../domain/types";
import { QuestWorkFrame, type TeamWorkScreenProps } from "./QuestWorkFrame";
import TeamWorkRoleCard from "./components/TeamWorkRoleCard";
import TeamRewardAllocationCard from "./components/TeamRewardAllocationCard";

/**
 * Work Hub for the Team Leader of a `GROUP + CANDIDATE` Quest. The Leader alone
 * starts work and submits or confirms the Team's work, so the proof form sits
 * between the Quest summary and the action cards.
 */
export default function TeamLeaderWorkScreen({
  frame,
  snapshot,
  team,
  messages,
  statusCard,
  settlementCard,
  proofForm,
  actionsCard,
  onSubmitAllocation,
  allocationSending = false,
}: TeamWorkScreenProps & { proofForm: ReactNode }) {
  const allocationCard = snapshot.teamRewardAllocation ? (
    <TeamRewardAllocationCard
      allocation={snapshot.teamRewardAllocation}
      messages={messages}
      submitting={allocationSending}
      onSubmit={onSubmitAllocation ?? (async () => undefined)}
    />
  ) : null;
  // A pending split is the Leader's only remaining duty, so it comes first.
  const allocationPending = snapshot.teamRewardAllocation?.status === "PENDING";
  return (
    <QuestWorkFrame {...frame}>
      <TeamWorkRoleCard
        role={QuestTeamRole.LEADER}
        team={team}
        snapshot={snapshot}
        messages={messages}
      />
      {allocationPending ? allocationCard : null}
      {statusCard}
      {settlementCard}
      {allocationPending ? null : allocationCard}
      {proofForm}
      {actionsCard}
    </QuestWorkFrame>
  );
}
