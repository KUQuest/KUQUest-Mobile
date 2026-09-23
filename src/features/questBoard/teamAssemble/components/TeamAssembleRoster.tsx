import React from "react";

import { Text, View } from "@/tw";

import styles from "../groupQuestStyles";
import {
  TeamAssembleRosterRow,
  type TeamAssembleRosterRowMember,
} from "./TeamAssembleRosterRow";

export interface TeamAssembleRosterProps {
  members: readonly TeamAssembleRosterRowMember[];
  rosterLabel: string;
  rosterCountLabel: string;
  acceptedLabel: string;
  teamStatusLabel: string;
  helper: string;
  isLocked: boolean;
  canonical: boolean;
  isLeader: boolean;
  viewerId?: string;
  canLeaveTeam?: boolean;
  canRemoveMember?: boolean;
  onLeaveTeam?: () => void;
  onRemoveMember?: (memberId: string) => void;
  leaveLabel: string;
  removeLabel: string;
  leaderLabel: string;
  memberLabel: string;
}

export function TeamAssembleRoster({
  members,
  rosterLabel,
  rosterCountLabel,
  acceptedLabel,
  teamStatusLabel,
  helper,
  isLocked,
  canonical,
  isLeader,
  viewerId,
  canLeaveTeam,
  canRemoveMember,
  onLeaveTeam,
  onRemoveMember,
  leaveLabel,
  removeLabel,
  leaderLabel,
  memberLabel,
}: TeamAssembleRosterProps) {
  return (
    <View className={`${styles.section} ${styles.sectionFirst}`}>
      <View className={styles.sectionHeader}>
        <Text accessibilityRole="header" className={styles.sectionTitle}>
          {rosterLabel}
        </Text>
        <Text
          accessibilityLabel={rosterCountLabel}
          className={styles.sectionMeta}
          testID="team-assemble-roster-count"
        >
          {rosterCountLabel}
        </Text>
      </View>
      <View
        accessibilityLabel={rosterCountLabel}
        className={styles.rosterCard}
        testID="team-assemble-roster"
      >
        <View className={styles.rosterHeader}>
          <Text className={styles.rosterCount}>{rosterCountLabel}</Text>
          {isLocked ? (
            <Text className={styles.rosterStatus}>{teamStatusLabel}</Text>
          ) : null}
        </View>
        <View className={styles.rosterList}>
          {members.map((member) => (
            <TeamAssembleRosterRow
              acceptedLabel={acceptedLabel}
              canLeave={
                canonical &&
                !isLocked &&
                canLeaveTeam !== false &&
                member.workerId === viewerId &&
                Boolean(onLeaveTeam)
              }
              canRemove={
                canonical &&
                !isLocked &&
                isLeader &&
                canRemoveMember !== false &&
                member.workerId !== viewerId &&
                Boolean(onRemoveMember)
              }
              key={member.workerId}
              leaveLabel={leaveLabel}
              member={member}
              onLeave={onLeaveTeam}
              onRemove={
                onRemoveMember
                  ? () => onRemoveMember(member.workerId)
                  : undefined
              }
              removeLabel={removeLabel}
              role={member.role === "LEADER" ? leaderLabel : memberLabel}
            />
          ))}
        </View>
        {!isLocked ? <Text className={styles.helper}>{helper}</Text> : null}
      </View>
    </View>
  );
}
