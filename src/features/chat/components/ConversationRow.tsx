import { memo } from "react";

import { Avatar } from "@/components/ui/Avatar";
import { formatTimeInBangkok } from "@/domain/datetime";
import { chatMessages } from "@/locales/chatMessages";
import { Pressable, Text, View } from "@/tw";
import { cn } from "@/tw/cn";

import type { ChatConversation } from "../chatTypes";
import styles from "../chatStyles";

interface ConversationRowProps {
  conversation: ChatConversation;
  locale: "en" | "th";
  inquiry?: boolean;
  onPress: (conversation: ChatConversation) => void;
  onOpenProfile?: (participantId: string) => void;
}

export const ConversationRow = memo(function ConversationRow({
  conversation,
  locale,
  inquiry = false,
  onPress,
  onOpenProfile,
}: ConversationRowProps) {
  const messages = chatMessages[locale];
  const participantName = conversation.participantName.split(/\s+/)[0];
  const label = [
    conversation.questTitle[locale],
    participantName,
    conversation.latestMessage[locale],
    conversation.unreadCount > 0
      ? messages.unreadCount(conversation.unreadCount)
      : undefined,
  ]
    .filter(Boolean)
    .join(". ");

  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      className={styles.conversationRow}
      onPress={() => onPress(conversation)}
      testID={`chat-conversation-${conversation.id}`}
    >
      <Avatar
        accessibilityLabel={
          participantId
            ? `View profile of ${conversation.participantName}`
            : undefined
        }
        className={styles.avatar}
        imageTestID={`chat-avatar-image-${participantId ?? conversation.id}`}
        name={conversation.participantName}
        onPress={
          participantId && onOpenProfile
            ? (event) => {
              event.stopPropagation();
              onOpenProfile(participantId);
            }
            : undefined
        }
        style={{ backgroundColor: conversation.avatarColor }}
        testID={`chat-avatar-${participantId ?? conversation.id}`}
        textClassName={styles.avatarText}
        uri={conversation.participantAvatarUrl}
      />
      <View className={styles.rowCopy}>
        <Text className={styles.questTitle} numberOfLines={2}>
          {conversation.questTitle[locale]}
        </Text>
        <Text
          className={cn(
            styles.participant,
            inquiry && styles.inquiryParticipant
          )}
        >
          {participantName}
        </Text>
        <Text className={styles.latestMessage} numberOfLines={2}>
          {conversation.latestMessage[locale]}
        </Text>
      </View>
      <View className={styles.rowMeta}>
        <Text className={styles.rowTime}>
          {formatTimeInBangkok(conversation.latestAt)}
        </Text>
        {conversation.unreadCount > 0 ? (
          <View
            accessibilityLabel={messages.unreadCount(conversation.unreadCount)}
            className={cn(
              styles.unreadBadge,
              inquiry && styles.inquiryUnreadBadge
            )}
          >
            <Text
              className={cn(
                styles.unreadText,
                inquiry && styles.inquiryUnreadText
              )}
            >
              {conversation.unreadCount}
            </Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
});
