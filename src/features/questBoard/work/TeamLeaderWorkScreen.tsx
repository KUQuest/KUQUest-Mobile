import type { ReactNode } from "react";

import { QuestTeamRole } from "../domain/types";
import { QuestWorkFrame, type TeamWorkScreenProps } from "./QuestWorkFrame";
import TeamWorkRoleCard from "./components/TeamWorkRoleCard";

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
}: TeamWorkScreenProps & { proofForm: ReactNode }) {
  return (
    <QuestWorkFrame {...frame}>
      <TeamWorkRoleCard
        role={QuestTeamRole.LEADER}
        team={team}
        snapshot={snapshot}
        messages={messages}
      />
      {statusCard}
      {settlementCard}
      {proofForm}
      {actionsCard}
    </QuestWorkFrame>
  );
}
