import React from "react";

import { LogOut, UserPlus } from "lucide-react-native";

import { Pressable, Text, View } from "@/tw";
import { colors } from "@/theme/colors";

import styles from "../groupQuestStyles";
import {
  TeamAssembleRosterRow,
  type TeamAssembleRosterRowMember,
} from "./TeamAssembleRosterRow";

export interface TeamAssembleRosterProps {
  members: readonly TeamAssembleRosterRowMember[];
  requiredHeadcount: number;
  rosterLabel: string;
  rosterCountLabel: string;
  acceptedLabel: string;
  openSlotLabel: string;
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
  requiredHeadcount,
  rosterLabel,
  rosterCountLabel,
  acceptedLabel,
  openSlotLabel,
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
  const editable = canonical && !isLocked;
  const openSlots = editable
    ? Math.max(0, requiredHeadcount - members.length)
    : 0;
  const filled = Math.min(1, members.length / Math.max(1, requiredHeadcount));
  const viewerCanLeave = Boolean(
    editable &&
    canLeaveTeam !== false &&
    onLeaveTeam &&
    viewerId &&
    members.some((member) => member.workerId === viewerId)
  );
  return (
    <View className={styles.section}>
      <View className={styles.sectionHeader}>
        <Text accessibilityRole="header" className={styles.sectionTitle}>
          {rosterLabel}
        </Text>
        <Text
          accessibilityLabel={rosterCountLabel}
          className={styles.sectionMeta}
          testID="team-assemble-roster-count"
        >
          {isLocked ? teamStatusLabel : rosterCountLabel}
        </Text>
      </View>
      <View className={styles.rosterCard} testID="team-assemble-roster">
        <View
          accessibilityElementsHidden
          className="h-[6px] w-full overflow-hidden rounded-ku-pill bg-ku-surface-muted"
          importantForAccessibility="no-hide-descendants"
        >
          <View
            className={styles.progressFill}
            style={{ width: `${filled * 100}%` }}
          />
        </View>
        <View className={styles.rosterList}>
          {members.map((member) => (
            <TeamAssembleRosterRow
              acceptedLabel={canonical ? undefined : acceptedLabel}
              canRemove={
                editable &&
                isLeader &&
                canRemoveMember !== false &&
                member.workerId !== viewerId &&
                Boolean(onRemoveMember)
              }
              key={member.workerId}
              member={member}
              onRemove={
                onRemoveMember
                  ? () => onRemoveMember(member.workerId)
                  : undefined
              }
              removeLabel={removeLabel}
              role={member.role === "LEADER" ? leaderLabel : memberLabel}
            />
          ))}
          {Array.from({ length: openSlots }, (_, index) => (
            <View
              className={styles.rosterRow}
              key={`open-${index}`}
              testID="team-assemble-roster-open-slot"
            >
              <View className="h-[32px] w-[32px] items-center justify-center rounded-ku-pill border border-dashed border-ku-border">
                <UserPlus color={colors.textFaint} size={16} strokeWidth={2} />
              </View>
              <Text className="ml-ku-sm flex-1 font-ku-regular text-ku-body-small text-ku-text-muted">
                {openSlotLabel}
              </Text>
            </View>
          ))}
        </View>
        {!isLocked ? <Text className={styles.helper}>{helper}</Text> : null}
        {viewerCanLeave && viewerId ? (
          <Pressable
            accessibilityLabel={leaveLabel}
            accessibilityRole="button"
            className="mt-ku-sm min-h-[48px] flex-row items-center justify-center gap-ku-xs border-t border-ku-border-subtle pt-ku-xs"
            onPress={onLeaveTeam}
            testID={`team-assemble-leave-team-${viewerId}`}
          >
            <LogOut color={colors.dangerDark} size={16} strokeWidth={2.2} />
            <Text className="font-ku-semibold text-ku-body-small text-ku-danger-dark">
              {leaveLabel}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
