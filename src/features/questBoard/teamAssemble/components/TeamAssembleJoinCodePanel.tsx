import React from "react";

import { Pressable, Text, TextInput, View } from "@/tw";
import { colors } from "@/theme/colors";
import { formatTimestampDateTime } from "@/domain/datetime";
import type { SupportedLocale } from "@/locales/locale";

import styles from "../groupQuestStyles";

export interface TeamAssembleJoinCodePanelProps {
  locale: SupportedLocale;
  code: string | null;
  codeExpiry: string | null;
  viewerIsMember: boolean;
  isLeader: boolean;
  teamId: string;
  inputCode: string;
  onInputCodeChange: (value: string) => void;
  onJoinTeam?: (joinCode: string) => void;
  onRegenerateJoinCode?: (teamId: string) => void;
  canRegenerateJoinCode?: boolean;
}

export function TeamAssembleJoinCodePanel({
  locale,
  code,
  codeExpiry,
  viewerIsMember,
  isLeader,
  teamId,
  inputCode,
  onInputCodeChange,
  onJoinTeam,
  onRegenerateJoinCode,
  canRegenerateJoinCode,
}: TeamAssembleJoinCodePanelProps) {
  const thai = locale === "th";
  return (
    <View className={styles.section} testID="team-assemble-join-code">
      <View className={styles.sectionHeader}>
        <Text accessibilityRole="header" className={styles.sectionTitle}>
          {thai ? "รหัสเข้าร่วมทีม" : "Team Join Code"}
        </Text>
        {codeExpiry ? (
          <Text className={styles.sectionMeta}>
            {thai
              ? `หมดอายุ ${formatTimestampDateTime(codeExpiry, locale)}`
              : `Expires ${formatTimestampDateTime(codeExpiry, locale)}`}
          </Text>
        ) : null}
      </View>
      {viewerIsMember ? (
        <View className={styles.reviewCard}>
          <Text selectable className={styles.proposalSummaryTitle}>
            {code ?? (thai ? "ยังไม่มีรหัส" : "No code available")}
          </Text>
          {isLeader &&
          canRegenerateJoinCode !== false &&
          onRegenerateJoinCode ? (
            <Pressable
              accessibilityLabel={
                thai ? "สร้างรหัสใหม่" : "Regenerate join code"
              }
              accessibilityRole="button"
              className={styles.memberInvite}
              onPress={() => onRegenerateJoinCode(teamId)}
              testID="team-assemble-regenerate-join-code"
            >
              <Text className={styles.memberInviteText}>
                {thai ? "สร้างรหัสใหม่" : "Regenerate"}
              </Text>
            </Pressable>
          ) : null}
        </View>
      ) : onJoinTeam ? (
        <View className={styles.searchField}>
          <TextInput
            accessibilityLabel={
              thai ? "กรอกรหัสเข้าร่วมทีม" : "Enter team join code"
            }
            autoCapitalize="characters"
            autoCorrect={false}
            className={styles.searchInput}
            onChangeText={onInputCodeChange}
            placeholder={thai ? "กรอกรหัสเข้าร่วมทีม" : "Enter team join code"}
            placeholderTextColor={colors.textFaint}
            testID="team-assemble-join-code-input"
            value={inputCode}
          />
          <Pressable
            accessibilityLabel={thai ? "เข้าร่วมทีม" : "Join team"}
            accessibilityRole="button"
            className={styles.memberInvite}
            disabled={!inputCode.trim()}
            onPress={() => onJoinTeam(inputCode.trim())}
            testID="team-assemble-join"
          >
            <Text className={styles.memberInviteText}>
              {thai ? "เข้าร่วม" : "Join"}
            </Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}
