import { QuestTeamRole } from "../domain/types";
import { QuestWorkFrame, type TeamWorkScreenProps } from "./QuestWorkFrame";
import TeamWorkRoleCard from "./components/TeamWorkRoleCard";

/**
 * Work Hub for a Team Member of a `GROUP + CANDIDATE` Quest. Members never
 * start work or submit proof (the Team Leader does), so the screen shows the
 * Team's progress, Quest conditions and Work Chat instead of proof controls.
 */
export default function TeamMemberWorkScreen({
  frame,
  snapshot,
  team,
  messages,
  statusCard,
  settlementCard,
  actionsCard,
}: TeamWorkScreenProps) {
  return (
    <QuestWorkFrame {...frame}>
      <TeamWorkRoleCard
        role={QuestTeamRole.MEMBER}
        team={team}
        snapshot={snapshot}
        messages={messages}
      />
      {statusCard}
      {settlementCard}
      {actionsCard}
    </QuestWorkFrame>
  );
}
