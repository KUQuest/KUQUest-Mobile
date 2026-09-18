import { Image, Pressable, ScrollView, Text, View } from "@/tw";

import styles from "../questDetailStyles";

export interface QuestParticipant {
  id: string;
  displayName: string;
  avatarUrl?: string;
  avatarFileId?: string;
}

function initialsFor(name: string): string {
  const initials = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0] ?? "")
    .join("")
    .toUpperCase();
  return initials || "?";
}

export interface QuestParticipantRosterProps {
  participants: readonly QuestParticipant[];
  title: string;
  countLabel: string;
  profileLabel: (name: string) => string;
  onOpenProfile: (participantId: string) => void;
}

export function QuestParticipantRoster({
  participants,
  title,
  countLabel,
  profileLabel,
  onOpenProfile,
}: QuestParticipantRosterProps) {
  return (
    <View
      accessibilityLabel={`${title}. ${countLabel}`}
      className={styles.participantRosterCard}
      testID="quest-participant-roster"
    >
      <View className={styles.participantRosterHeader}>
        <Text className={styles.participantRosterTitle}>{title}</Text>
        <Text
          accessibilityLabel={countLabel}
          className={styles.participantRosterCount}
          testID="quest-participant-roster-count"
        >
          {countLabel}
        </Text>
      </View>
      {participants.length > 0 ? (
        <ScrollView
          horizontal
          contentContainerClassName={styles.participantRosterList}
          showsHorizontalScrollIndicator={false}
          testID="quest-participant-roster-list"
        >
          {participants.map((participant) => (
            <Pressable
              accessibilityLabel={profileLabel(participant.displayName)}
              accessibilityRole="button"
              className={styles.participantRosterItem}
              key={participant.id}
              onPress={() => onOpenProfile(participant.id)}
              testID={`quest-participant-${participant.id}`}
            >
              <View className={styles.participantRosterAvatar}>
                {participant.avatarUrl ? (
                  <Image
                    accessibilityLabel={participant.displayName}
                    cachePolicy="memory-disk"
                    contentFit="cover"
                    source={
                      participant.avatarFileId
                        ? {
                            uri: participant.avatarUrl,
                            cacheKey: participant.avatarFileId,
                          }
                        : { uri: participant.avatarUrl }
                    }
                    className="h-full w-full"
                    testID={`quest-participant-avatar-${participant.id}`}
                  />
                ) : (
                  <Text className={styles.participantRosterAvatarText}>
                    {initialsFor(participant.displayName)}
                  </Text>
                )}
              </View>
              <Text className={styles.participantRosterName} numberOfLines={1}>
                {participant.displayName}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      ) : null}
    </View>
  );
}
