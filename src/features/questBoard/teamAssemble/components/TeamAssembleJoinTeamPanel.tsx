import { useState } from "react";

import { groupQuestMessages } from "@/locales/groupQuestMessages";
import type { SupportedLocale } from "@/locales/locale";
import { Pressable, Text, TextInput, View } from "@/tw";
import { cn } from "@/tw/cn";
import { colors } from "@/theme/colors";

import styles from "../groupQuestStyles";
import { parseTeamInvite } from "../teamInvite";

export function TeamAssembleJoinTeamPanel({
  initialInvite = "",
  locale,
  submitting = false,
  error,
  onJoinTeam,
}: {
  initialInvite?: string;
  locale: SupportedLocale;
  submitting?: boolean;
  error?: string | null;
  onJoinTeam: (teamId: string, joinCode: string) => void;
}) {
  const messages = groupQuestMessages[locale];
  const parsedInitialInvite = parseTeamInvite(initialInvite);
  const [invite, setInvite] = useState(
    parsedInitialInvite?.joinCode ?? initialInvite
  );
  const parsed = parseTeamInvite(invite);
  const teamId = parsed?.teamId ?? parsedInitialInvite?.teamId ?? "";
  const joinCode = parsed?.joinCode ?? invite.trim();
  const disabled = submitting || joinCode.length === 0;

  return (
    <View className={styles.section} testID="team-assemble-join-team">
      <Text accessibilityRole="header" className={styles.sectionTitle}>
        {messages.joinTeamTitle}
      </Text>
      <Text className={styles.helper}>{messages.joinTeamDescription}</Text>
      <View className={styles.searchField}>
        <TextInput
          accessibilityLabel={messages.joinTeamCodeLabel}
          autoCapitalize="characters"
          autoCorrect={false}
          className={styles.searchInput}
          onChangeText={setInvite}
          onSubmitEditing={() => {
            if (!disabled) onJoinTeam(teamId, joinCode);
          }}
          placeholder={messages.joinTeamCodePlaceholder}
          placeholderTextColor={colors.textFaint}
          returnKeyType="join"
          testID="team-assemble-join-code-input"
          value={invite}
        />
      </View>
      {error ? (
        <Text
          accessibilityRole="alert"
          className={cn(styles.helper, "text-ku-danger-dark")}
        >
          {error}
        </Text>
      ) : null}
      <Pressable
        accessibilityLabel={messages.joinTeam}
        accessibilityRole="button"
        accessibilityState={{ disabled, busy: submitting }}
        className={cn(styles.submitButton, disabled && "opacity-60")}
        disabled={disabled}
        onPress={() => onJoinTeam(teamId, joinCode)}
        testID="team-assemble-join"
      >
        <Text className={styles.submitButtonText}>
          {submitting ? messages.joiningTeam : messages.joinTeam}
        </Text>
      </Pressable>
    </View>
  );
}
