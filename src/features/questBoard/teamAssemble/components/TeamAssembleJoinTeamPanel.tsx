import { useState } from "react";

import type { QuestV2Team } from "@/api/questV2Contracts";
import { groupQuestMessages } from "@/locales/groupQuestMessages";
import type { SupportedLocale } from "@/locales/locale";
import { Pressable, Text, TextInput, View } from "@/tw";
import { cn } from "@/tw/cn";
import { colors } from "@/theme/colors";

import styles from "../groupQuestStyles";

export function TeamAssembleJoinTeamPanel({
  teams,
  locale,
  submitting = false,
  onJoinTeam,
}: {
  teams: readonly QuestV2Team[];
  locale: SupportedLocale;
  submitting?: boolean;
  onJoinTeam: (teamId: string, joinCode: string) => void;
}) {
  const messages = groupQuestMessages[locale];
  const [teamId, setTeamId] = useState("");
  const [joinCode, setJoinCode] = useState("");
  if (teams.length === 0) return null;

  return (
    <View className={styles.section} testID="team-assemble-join-team">
      <Text accessibilityRole="header" className={styles.sectionTitle}>
        {messages.joinTeamTitle}
      </Text>
      <Text className={styles.helper}>{messages.joinTeamDescription}</Text>
      <View className={styles.memberList}>
        {teams.map((team) => {
          const selected = team.id === teamId;
          return (
            <Pressable
              accessibilityLabel={`${team.name}, ${messages.rosterCount(team.members.length, team.headcount)}`}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              className={cn(
                styles.memberRow,
                selected && styles.memberRowSelected
              )}
              key={team.id}
              onPress={() => setTeamId(team.id)}
              testID={`team-assemble-join-target-${team.id}`}
            >
              <View className={styles.memberCopy}>
                <Text className={styles.memberName}>{team.name}</Text>
                <Text className={styles.memberHandle}>
                  {messages.rosterCount(team.members.length, team.headcount)}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
      <View className={styles.searchField}>
        <TextInput
          accessibilityLabel={messages.joinTeamCodeLabel}
          autoCapitalize="characters"
          autoCorrect={false}
          className={styles.searchInput}
          maxLength={8}
          onChangeText={(value: string) => setJoinCode(value.toUpperCase())}
          placeholder={messages.joinTeamCodePlaceholder}
          placeholderTextColor={colors.textFaint}
          testID="team-assemble-join-code-input"
          value={joinCode}
        />
      </View>
      <Pressable
        accessibilityLabel={messages.joinTeam}
        accessibilityRole="button"
        accessibilityState={{
          disabled: submitting || !teamId || !joinCode.trim(),
        }}
        className={styles.bulkInviteButton}
        disabled={submitting || !teamId || !joinCode.trim()}
        onPress={() => onJoinTeam(teamId, joinCode.trim())}
        testID="team-assemble-join"
      >
        <Text className={styles.bulkInviteButtonText}>
          {submitting ? messages.joiningTeam : messages.joinTeam}
        </Text>
      </Pressable>
    </View>
  );
}
