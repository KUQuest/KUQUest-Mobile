import React, { useState } from "react";

import { Plus, UsersRound } from "lucide-react-native";

import { Pressable, Text, TextInput, View } from "@/tw";
import { cn } from "@/tw/cn";
import { useAppTheme } from "@/features/workspace/AppThemeProvider";

import styles from "../groupQuestStyles";

/** Candidate Team names are 1–100 characters on the Server. */
const TEAM_NAME_MAX_LENGTH = 100;

export interface TeamAssembleEmptyStateProps {
  title: string;
  description: string;
  createLabel: string;
  teamNameLabel?: string;
  busy?: boolean;
  onCreateTeam?: (name: string) => void;
}

export function TeamAssembleEmptyState({
  title,
  description,
  createLabel,
  teamNameLabel,
  busy = false,
  onCreateTeam,
}: TeamAssembleEmptyStateProps) {
  const { colors } = useAppTheme();
  const [name, setName] = useState("");
  const disabled = busy || !name.trim();
  return (
    <View className={styles.emptyState} testID="team-assemble-empty">
      <View className={styles.emptyIcon}>
        <UsersRound color={colors.primary} size={26} strokeWidth={1.9} />
      </View>
      <Text className={styles.emptyTitle}>{title}</Text>
      <Text className={styles.emptyText}>{description}</Text>
      {onCreateTeam ? (
        <>
          <View className={cn(styles.searchField, "self-stretch")}>
            <TextInput
              accessibilityLabel={teamNameLabel}
              className={styles.searchInput}
              maxLength={TEAM_NAME_MAX_LENGTH}
              onChangeText={setName}
              onSubmitEditing={() => {
                if (!disabled) onCreateTeam(name.trim());
              }}
              placeholder={teamNameLabel}
              placeholderTextColor={colors.textFaint}
              returnKeyType="done"
              testID="team-assemble-name-input"
              value={name}
            />
          </View>
          <Pressable
            accessibilityLabel={createLabel}
            accessibilityRole="button"
            accessibilityState={{ disabled, busy }}
            className={cn(styles.retryButton, disabled && "opacity-60")}
            disabled={disabled}
            onPress={() => onCreateTeam(name.trim())}
            testID="team-assemble-create"
          >
            <Plus color={colors.onPrimary} size={18} strokeWidth={2.5} />
            <Text className={styles.retryButtonText}>{createLabel}</Text>
          </Pressable>
        </>
      ) : null}
    </View>
  );
}
