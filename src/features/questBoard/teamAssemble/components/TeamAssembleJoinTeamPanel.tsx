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
  onJoinTeam,
}: {
  initialInvite?: string;
  locale: SupportedLocale;
  submitting?: boolean;
  onJoinTeam: (teamId: string, joinCode: string) => void;
}) {
  const messages = groupQuestMessages[locale];
  const [invite, setInvite] = useState(initialInvite);
  const parsed = parseTeamInvite(invite);
  const invalid = invite.trim().length > 0 && parsed === null;
  const disabled = submitting || parsed === null;

  return (
    <View className={styles.section} testID="team-assemble-join-team">
      <Text accessibilityRole="header" className={styles.sectionTitle}>
        {messages.joinTeamTitle}
      </Text>
      <Text className={styles.helper}>{messages.joinTeamDescription}</Text>
      <View className={styles.searchField}>
        <TextInput
          accessibilityLabel={messages.joinTeamCodeLabel}
          autoCapitalize="none"
          autoCorrect={false}
          className={styles.searchInput}
          onChangeText={setInvite}
          placeholder={messages.joinTeamCodePlaceholder}
          placeholderTextColor={colors.textFaint}
          testID="team-assemble-join-code-input"
          value={invite}
        />
      </View>
      {invalid ? (
        <Text
          accessibilityRole="alert"
          className={cn(styles.helper, "text-ku-danger-dark")}
        >
          {messages.joinTeamInvalidInvite}
        </Text>
      ) : null}
      <Pressable
        accessibilityLabel={messages.joinTeam}
        accessibilityRole="button"
        accessibilityState={{ disabled, busy: submitting }}
        className={cn(styles.submitButton, disabled && "opacity-60")}
        disabled={disabled}
        onPress={() => {
          if (parsed) onJoinTeam(parsed.teamId, parsed.joinCode);
        }}
        testID="team-assemble-join"
      >
        <Text className={styles.submitButtonText}>
          {submitting ? messages.joiningTeam : messages.joinTeam}
        </Text>
      </Pressable>
    </View>
  );
}
