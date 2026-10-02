import React from "react";
import { Crown, Users } from "lucide-react-native";

import { Text, View } from "@/tw";
import type { QuestV2Team } from "@/api/questV2Contracts";
import { cn } from "@/tw/cn";
import { useAppTheme } from "@/features/workspace/AppThemeProvider";
import { type QuestWorkMessages } from "@/locales/questWorkMessages";
import {
  QuestProofStatus,
  QuestStatus,
  QuestTeamRole,
} from "../../domain/types";
import type { LiveQuestSnapshot } from "../../live/liveQuestService";

export interface TeamWorkRoleCardProps {
  role: typeof QuestTeamRole.LEADER | typeof QuestTeamRole.MEMBER;
  team: QuestV2Team;
  snapshot: LiveQuestSnapshot;
  messages: QuestWorkMessages;
}

/** What the viewer owes the team right now; null once the Quest is closed. */
function dutyText(
  role: TeamWorkRoleCardProps["role"],
  snapshot: LiveQuestSnapshot,
  messages: QuestWorkMessages
): string | null {
  const leader = role === QuestTeamRole.LEADER;
  switch (snapshot.state) {
    case QuestStatus.QUEST_ASSIGNED:
      return leader ? messages.leaderDutyStart : messages.memberDutyStart;
    case QuestStatus.QUEST_IN_PROGRESS:
      if (
        snapshot.proofs.some(
          (proof) => proof.status === QuestProofStatus.PROOF_PENDING
        )
      ) {
        return messages.teamDutyReview;
      }
      if (!leader) return messages.memberDutyWork;
      return snapshot.proofRequired
        ? messages.leaderDutySubmitProof
        : messages.leaderDutyConfirm;
    case QuestStatus.QUEST_COMPLETED:
      return messages.teamDutyDone;
    default:
      return null;
  }
}

export default function TeamWorkRoleCard({
  role,
  team,
  snapshot,
  messages,
}: TeamWorkRoleCardProps) {
  const { colors: palette } = useAppTheme();
  const duty = dutyText(role, snapshot, messages);
  const leader = role === QuestTeamRole.LEADER;

  return (
    <View className={styles.card} testID={`team-work-${role.toLowerCase()}`}>
      <View className={styles.header}>
        <View className={styles.roleRow}>
          {leader ? (
            <Crown color={palette.primaryDark} size={18} />
          ) : (
            <Users color={palette.primaryDark} size={18} />
          )}
          <Text accessibilityRole="header" className={styles.roleTitle}>
            {leader ? messages.teamLeaderRole : messages.teamMemberRole}
          </Text>
        </View>
        {duty ? <Text className={styles.duty}>{duty}</Text> : null}
      </View>
      <View className={styles.roster}>
        <Text className={styles.rosterTitle}>
          {`${team.name} · ${messages.teamRoster(team.members.length)}`}
        </Text>
        {team.members.map((member) => (
          <View key={member.memberId} className={styles.memberRow}>
            <Text className={styles.memberName} numberOfLines={1}>
              {member.member?.displayName ?? messages.teamMemberRole}
            </Text>
            {member.memberId === team.leaderId ? (
              <Text className={cn(styles.badge, styles.leaderBadge)}>
                {messages.teamLeaderBadge}
              </Text>
            ) : null}
            {member.memberId === snapshot.viewerId ? (
              <Text className={styles.badge}>{messages.teamYouBadge}</Text>
            ) : null}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = {
  card: "overflow-hidden rounded-ku-card border border-ku-primary-border bg-ku-primary-subtle",
  header: "gap-ku-sm p-ku-md",
  roleRow: "flex-row items-center gap-ku-sm",
  roleTitle: "font-ku-bold text-ku-subtitle text-ku-primary-dark",
  duty: "font-ku-regular text-ku-body-small text-ku-text",
  roster: "gap-ku-sm border-t border-ku-primary-border bg-ku-surface p-ku-md",
  rosterTitle: "font-ku-semibold text-ku-body-small text-ku-text-strong",
  memberRow: "min-h-[32px] flex-row items-center gap-ku-sm",
  memberName: "shrink font-ku-regular text-ku-body-small text-ku-text",
  badge:
    "rounded-ku-pill bg-ku-surface-raised px-ku-sm py-ku-2 font-ku-semibold text-ku-label text-ku-text-secondary",
  leaderBadge: "bg-ku-primary-subtle text-ku-primary-dark",
} as const;
