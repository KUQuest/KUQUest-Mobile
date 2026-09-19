import React from "react";

import { CircleX } from "lucide-react-native";

import { Pressable, Text, View } from "@/tw";
import { colors } from "@/theme/colors";

import styles from "./groupQuestStyles";

export interface TeamAssembleRosterRowMember {
  workerId: string;
  displayName?: string;
  role?: string;
}

export interface TeamAssembleRosterRowProps {
  member: TeamAssembleRosterRowMember;
  role: string;
  acceptedLabel: string;
  canLeave?: boolean;
  canRemove?: boolean;
  onLeave?: () => void;
  onRemove?: () => void;
  leaveLabel?: string;
  removeLabel?: string;
}

function initialsFor(value: string): string {
  const words = value
    .replace(/[-_]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (words.length === 0) return "?";
  return words
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
}

export function TeamAssembleRosterRow({
  member,
  role,
  acceptedLabel,
  canLeave,
  canRemove,
  onLeave,
  onRemove,
  leaveLabel = "Leave",
  removeLabel = "Remove",
}: TeamAssembleRosterRowProps) {
  const name = member.displayName ?? member.workerId;
  return (
    <View
      accessibilityLabel={`${name}. ${role}. ${acceptedLabel}`}
      className={styles.rosterRow}
      testID={`team-assemble-roster-member-${member.workerId}`}
    >
      <View className={styles.rosterAvatar}>
        <Text className={styles.rosterAvatarText}>{initialsFor(name)}</Text>
      </View>
      <View className={styles.rosterCopy}>
        <Text className={styles.rosterName} numberOfLines={1}>
          {name}
        </Text>
        <Text className={styles.rosterRole}>{role}</Text>
      </View>
      {canRemove && onRemove ? (
        <Pressable
          accessibilityLabel={`${removeLabel}: ${name}`}
          accessibilityRole="button"
          className={styles.searchClear}
          onPress={onRemove}
          testID={`team-assemble-remove-member-${member.workerId}`}
        >
          <CircleX color={colors.dangerDark} size={18} strokeWidth={2} />
        </Pressable>
      ) : canLeave && onLeave ? (
        <Pressable
          accessibilityLabel={`${leaveLabel}: ${name}`}
          accessibilityRole="button"
          className={styles.memberInvite}
          onPress={onLeave}
          testID={`team-assemble-leave-team-${member.workerId}`}
        >
          <Text className={styles.memberInviteText}>{leaveLabel}</Text>
        </Pressable>
      ) : null}
      <Text className={styles.rosterStatus}>{acceptedLabel}</Text>
    </View>
  );
}
