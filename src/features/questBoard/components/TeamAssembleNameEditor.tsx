import React from "react";

import { Pressable, Text, TextInput, View } from "@/tw";
import { colors } from "@/theme/colors";
import type { SupportedLocale } from "@/locales/locale";

import styles from "./groupQuestStyles";

export interface TeamAssembleNameEditorProps {
  locale: SupportedLocale;
  value: string;
  currentName: string;
  onChange: (value: string) => void;
  onSave: () => void;
}

export function TeamAssembleNameEditor({
  locale,
  value,
  currentName,
  onChange,
  onSave,
}: TeamAssembleNameEditorProps) {
  const thai = locale === "th";
  return (
    <View className={styles.section} testID="team-assemble-name-editor">
      <Text accessibilityRole="header" className={styles.sectionTitle}>
        {thai ? "ชื่อทีม" : "Team name"}
      </Text>
      <View className={styles.searchField}>
        <TextInput
          accessibilityLabel={thai ? "ชื่อทีม" : "Team name"}
          autoCapitalize="sentences"
          autoCorrect
          className={styles.searchInput}
          maxLength={120}
          onChangeText={onChange}
          placeholder={thai ? "ชื่อทีม" : "Team name"}
          placeholderTextColor={colors.textFaint}
          testID="team-assemble-name-input"
          value={value}
        />
        <Pressable
          accessibilityLabel={thai ? "บันทึกชื่อทีม" : "Save team name"}
          accessibilityRole="button"
          className={styles.memberInvite}
          disabled={!value.trim() || value.trim() === currentName.trim()}
          onPress={onSave}
          testID="team-assemble-save-name"
        >
          <Text className={styles.memberInviteText}>
            {thai ? "บันทึก" : "Save"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
