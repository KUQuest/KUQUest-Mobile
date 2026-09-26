import React from "react";

import { Text, View } from "@/tw";
import type { SupportedLocale } from "@/locales/locale";
import type { QuestInvitation } from "../../domain/types";

import styles from "../groupQuestStyles";
import {
  TeamAssembleInvitationRow,
  type TeamAssembleInvitationMessages,
} from "./TeamAssembleInvitationRow";

export interface TeamAssembleInvitationsProps {
  invitations: readonly QuestInvitation[];
  title: string;
  locale: SupportedLocale;
  messages: TeamAssembleInvitationMessages;
  viewerId?: string;
  canRespond: boolean;
  directoryNames: ReadonlyMap<string, string>;
  onRespond?: (invitationId: string, accept: boolean) => void;
}

export function TeamAssembleInvitations({
  invitations,
  title,
  locale,
  messages,
  viewerId,
  canRespond,
  directoryNames,
  onRespond,
}: TeamAssembleInvitationsProps) {
  return (
    <View className={styles.section} testID="team-assemble-pending-invitations">
      <View className={styles.sectionHeader}>
        <Text accessibilityRole="header" className={styles.sectionTitle}>
          {title}
        </Text>
        <Text className={styles.sectionMeta}>{invitations.length}</Text>
      </View>
      <View className={styles.invitationList}>
        {invitations.map((invitation) => (
          <TeamAssembleInvitationRow
            canRespond={
              canRespond &&
              Boolean(!viewerId || viewerId === invitation.invitedWorkerId)
            }
            displayName={
              directoryNames.get(invitation.invitedWorkerId) ??
              invitation.invitedWorkerId
            }
            invitation={invitation}
            key={invitation.id}
            locale={locale}
            messages={messages}
            onRespond={onRespond}
          />
        ))}
      </View>
    </View>
  );
}
