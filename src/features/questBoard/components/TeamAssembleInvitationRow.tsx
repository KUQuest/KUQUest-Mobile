import React from "react";

import { Clock3 } from "lucide-react-native";

import { Pressable, Text, View } from "@/tw";
import { formatTimestampDateTime } from "@/domain/datetime";
import type { SupportedLocale } from "@/locales/locale";
import { colors } from "@/theme/colors";
import type { QuestInvitation } from "../types";

import styles from "./groupQuestStyles";

export interface TeamAssembleInvitationMessages {
  pendingInvitation: string;
  invitationExpires: (date: string) => string;
  acceptInvitation: string;
  declineInvitation: string;
}

export interface TeamAssembleInvitationRowProps {
  invitation: QuestInvitation;
  displayName: string;
  messages: TeamAssembleInvitationMessages;
  locale: SupportedLocale;
  canRespond: boolean;
  onRespond?: (invitationId: string, accept: boolean) => void;
}

export function TeamAssembleInvitationRow({
  invitation,
  displayName,
  messages,
  locale,
  canRespond,
  onRespond,
}: TeamAssembleInvitationRowProps) {
  return (
    <View
      className={styles.invitationRow}
      testID={`team-assemble-invitation-${invitation.id}`}
    >
      <View className={styles.invitationHeader}>
        <View className={styles.invitationCopy}>
          <Text className={styles.invitationName} numberOfLines={1}>
            {displayName}
          </Text>
          <Text className={styles.invitationStatus}>
            {messages.pendingInvitation}
          </Text>
          <Text className={styles.invitationExpiry}>
            {messages.invitationExpires(
              formatTimestampDateTime(invitation.expiresAt, locale)
            )}
          </Text>
        </View>
        <Clock3 color={colors.textMuted} size={18} strokeWidth={2} />
      </View>
      {canRespond && onRespond ? (
        <View className={styles.invitationActions}>
          <Pressable
            accessibilityLabel={`${messages.acceptInvitation}: ${displayName}`}
            accessibilityRole="button"
            className={`${styles.invitationAction} ${styles.invitationActionAccept}`}
            onPress={() => onRespond(invitation.id, true)}
            testID={`team-assemble-accept-invitation-${invitation.id}`}
          >
            <Text
              className={`${styles.invitationActionText} ${styles.invitationActionTextAccept}`}
            >
              {messages.acceptInvitation}
            </Text>
          </Pressable>
          <Pressable
            accessibilityLabel={`${messages.declineInvitation}: ${displayName}`}
            accessibilityRole="button"
            className={`${styles.invitationAction} ${styles.invitationActionDecline}`}
            onPress={() => onRespond(invitation.id, false)}
            testID={`team-assemble-decline-invitation-${invitation.id}`}
          >
            <Text
              className={`${styles.invitationActionText} ${styles.invitationActionTextDecline}`}
            >
              {messages.declineInvitation}
            </Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}
