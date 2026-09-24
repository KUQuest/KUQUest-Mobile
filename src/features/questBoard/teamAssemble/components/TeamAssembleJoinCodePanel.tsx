import React from "react";

import { RefreshCw, Share2 } from "lucide-react-native";

import { Pressable, Text, TextInput, View } from "@/tw";
import { colors } from "@/theme/colors";
import { formatTimestampDateTime } from "@/domain/datetime";
import type { SupportedLocale } from "@/locales/locale";
import type { GroupQuestMessages } from "@/locales/groupQuestMessages";

import styles from "../groupQuestStyles";

export interface TeamAssembleJoinCodePanelProps {
  locale: SupportedLocale;
  messages: GroupQuestMessages;
  code: string | null;
  codeExpiry: string | null;
  viewerIsMember: boolean;
  isLeader: boolean;
  teamId: string;
  inputCode: string;
  onInputCodeChange: (value: string) => void;
  onJoinTeam?: (joinCode: string) => void;
  onRegenerateJoinCode?: (teamId: string) => void;
  /** Present only while the plaintext Join Code is known on this device. */
  onShareInvite?: () => void;
  canRegenerateJoinCode?: boolean;
}

export function TeamAssembleJoinCodePanel({
  locale,
  messages,
  code,
  codeExpiry,
  viewerIsMember,
  isLeader,
  teamId,
  inputCode,
  onInputCodeChange,
  onJoinTeam,
  onRegenerateJoinCode,
  onShareInvite,
  canRegenerateJoinCode,
}: TeamAssembleJoinCodePanelProps) {
  const canRegenerate =
    isLeader && canRegenerateJoinCode !== false && onRegenerateJoinCode;
  return (
    <View className={styles.section} testID="team-assemble-join-code">
      <Text accessibilityRole="header" className={styles.sectionTitle}>
        {messages.inviteMembersTitle}
      </Text>
      {viewerIsMember ? (
        <View className="mt-ku-sm rounded-[16px] border border-ku-border-subtle bg-ku-surface p-ku-md">
          {code ? (
            <>
              <Text className="text-center font-ku-regular text-ku-label text-ku-text-muted">
                {messages.joinCodeLabel}
              </Text>
              <Text
                accessibilityLabel={`${messages.joinCodeLabel} ${code.split("").join(" ")}`}
                className="mt-ku-xs text-center font-ku-bold text-[30px] leading-[38px] tracking-[6px] text-ku-text-strong"
                selectable
                testID="team-assemble-join-code-value"
              >
                {code}
              </Text>
              {codeExpiry ? (
                <Text className="mt-ku-2 text-center font-ku-regular text-ku-label text-ku-text-muted">
                  {messages.joinCodeExpires(
                    formatTimestampDateTime(codeExpiry, locale)
                  )}
                </Text>
              ) : null}
            </>
          ) : (
            <Text className="font-ku-regular text-ku-body-small text-ku-text-secondary">
              {isLeader
                ? messages.joinCodeHiddenForLeader
                : messages.joinCodeHiddenForMember}
            </Text>
          )}
          {onShareInvite ? (
            <Pressable
              accessibilityLabel={messages.shareInviteLabel}
              accessibilityRole="button"
              className={styles.submitButton}
              onPress={onShareInvite}
              testID="team-assemble-share-invite"
            >
              <Share2 color={colors.onPrimary} size={18} strokeWidth={2.3} />
              <Text className={styles.submitButtonText}>
                {messages.shareInvite}
              </Text>
            </Pressable>
          ) : null}
          {canRegenerate ? (
            <Pressable
              accessibilityLabel={messages.regenerateJoinCodeLabel}
              accessibilityRole="button"
              className={
                code
                  ? "mt-ku-xs min-h-[48px] flex-row items-center justify-center gap-ku-xs"
                  : styles.submitButton
              }
              onPress={() => onRegenerateJoinCode(teamId)}
              testID="team-assemble-regenerate-join-code"
            >
              <RefreshCw
                color={code ? colors.primary : colors.onPrimary}
                size={16}
                strokeWidth={2.3}
              />
              <Text
                className={
                  code
                    ? "font-ku-semibold text-ku-body-small text-ku-primary"
                    : styles.submitButtonText
                }
              >
                {messages.regenerateJoinCode}
              </Text>
            </Pressable>
          ) : null}
        </View>
      ) : onJoinTeam ? (
        <View className={styles.searchField}>
          <TextInput
            accessibilityLabel={messages.enterJoinCode}
            autoCapitalize="characters"
            autoCorrect={false}
            className={styles.searchInput}
            onChangeText={onInputCodeChange}
            placeholder={messages.enterJoinCode}
            placeholderTextColor={colors.textFaint}
            testID="team-assemble-join-code-input"
            value={inputCode}
          />
          <Pressable
            accessibilityLabel={messages.joinTeam}
            accessibilityRole="button"
            className={styles.memberInvite}
            disabled={!inputCode.trim()}
            onPress={() => onJoinTeam(inputCode.trim())}
            testID="team-assemble-join"
          >
            <Text className={styles.memberInviteText}>
              {messages.joinShort}
            </Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}
