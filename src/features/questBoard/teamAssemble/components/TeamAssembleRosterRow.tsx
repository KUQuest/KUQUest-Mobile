import React from "react";

import { CircleX } from "lucide-react-native";

import { Pressable, Text, View } from "@/tw";
import { colors } from "@/theme/colors";
import { useSelectRosterMemberProfile } from "../../roster/useSelectRosterMemberProfile";

import styles from "../groupQuestStyles";

export interface TeamAssembleRosterRowMember {
  workerId: string;
  displayName?: string;
  role?: string;
}

export interface TeamAssembleRosterRowProps {
  member: TeamAssembleRosterRowMember;
  role: string;
  /** Omitted for Candidate Team members, who join directly and never hold an invitation. */
  acceptedLabel?: string;
  canRemove?: boolean;
  onRemove?: () => void;
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
  canRemove,
  onRemove,
  removeLabel = "Remove",
}: TeamAssembleRosterRowProps) {
  // Candidate Team members arrive as bare ids; resolve the public profile name.
  const needsProfile = member.displayName === member.workerId;
  const profile = useSelectRosterMemberProfile(
    needsProfile ? member.workerId : ""
  );
  const name = needsProfile
    ? (profile?.displayName ?? "…")
    : (member.displayName ?? member.workerId);
  return (
    <View
      accessibilityLabel={[name, role, acceptedLabel]
        .filter(Boolean)
        .join(". ")}
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
      {acceptedLabel ? (
        <Text className={styles.rosterStatus}>{acceptedLabel}</Text>
      ) : null}
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
      ) : null}
    </View>
  );
}
