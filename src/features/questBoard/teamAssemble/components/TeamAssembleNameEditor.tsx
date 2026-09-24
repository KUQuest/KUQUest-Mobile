import React from "react";

import { Pressable, Text, TextInput, View } from "@/tw";
import { colors } from "@/theme/colors";
import type { GroupQuestMessages } from "@/locales/groupQuestMessages";

import styles from "../groupQuestStyles";

export interface TeamAssembleNameEditorProps {
  messages: GroupQuestMessages;
  value: string;
  currentName: string;
  onChange: (value: string) => void;
  onSave: () => void;
}

export function TeamAssembleNameEditor({
  messages,
  value,
  currentName,
  onChange,
  onSave,
}: TeamAssembleNameEditorProps) {
  return (
    <View className={styles.section} testID="team-assemble-name-editor">
      <Text accessibilityRole="header" className={styles.sectionTitle}>
        {messages.teamNameLabel}
      </Text>
      <View className={styles.searchField}>
        <TextInput
          accessibilityLabel={messages.teamNameLabel}
          autoCapitalize="sentences"
          autoCorrect
          className={styles.searchInput}
          maxLength={120}
          onChangeText={onChange}
          placeholder={messages.teamNameLabel}
          placeholderTextColor={colors.textFaint}
          testID="team-assemble-name-input"
          value={value}
        />
        <Pressable
          accessibilityLabel={messages.saveTeamNameLabel}
          accessibilityRole="button"
          className={styles.memberInvite}
          disabled={!value.trim() || value.trim() === currentName.trim()}
          onPress={onSave}
          testID="team-assemble-save-name"
        >
          <Text className={styles.memberInviteText}>
            {messages.saveTeamName}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
