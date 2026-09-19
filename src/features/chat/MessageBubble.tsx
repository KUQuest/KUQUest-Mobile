import React, { useEffect, useState } from "react";
import { ActivityIndicator } from "react-native";
import { Download, FileText, ImagePlus } from "lucide-react-native";

import { Image, Pressable, Text, View } from "@/tw";
import { cn } from "@/tw/cn";
import { colors } from "@/theme/colors";
import { chatApi } from "@/api/ChatApi";
import { liveQuestService } from "@/features/questBoard/liveQuestService";
import type { ChatMessages } from "@/locales/chatMessages";
import type { ChatConversation } from "./chatTypes";
import {
  ChatAvatar,
  localizedText,
  type DisplayChatMessage,
  type RenderAttachment,
} from "./ChatConversationPresentation";
import { attachmentLinkCache } from "./attachmentLinkCache";
import styles from "./chatStyles";

const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".heic"];

export function isImageAttachment(attachment: {
  mediaType?: string;
  name?: string;
  fileName?: string;
  kind?: string;
}): boolean {
  if (
    attachment.mediaType &&
    attachment.mediaType.toLowerCase().startsWith("image/")
  ) {
    return true;
  }
  const name = (attachment.fileName || attachment.name || "").toLowerCase();
  for (const ext of IMAGE_EXTENSIONS) {
    if (name.endsWith(ext)) {
      return true;
    }
  }
  return attachment.kind === "image";
}

export function AttachmentRow({
  attachment,
  mine,
  messages,
  onPress,
}: {
  attachment: RenderAttachment;
  mine: boolean;
  messages: ChatMessages;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityLabel={`${messages.openFile}: ${attachment.name}`}
      accessibilityRole="button"
      className={cn(
        styles.attachmentBubble,
        !mine && styles.attachmentBubbleOther
      )}
      onPress={onPress}
    >
      <View className={styles.attachmentIcon}>
        {attachment.kind === "pdf" ? (
          <FileText color={colors.primary} size={21} strokeWidth={2.1} />
        ) : (
          <ImagePlus color={colors.primary} size={21} strokeWidth={2.1} />
        )}
      </View>
      <View className={styles.attachmentCopy}>
        <Text className={styles.attachmentName} numberOfLines={1}>
          {attachment.name}
        </Text>
        <Text className={styles.attachmentMeta}>{attachment.meta}</Text>
      </View>
      <Download color={colors.primaryDeep} size={18} strokeWidth={2.1} />
    </Pressable>
  );
}
function getImageSize(
  width?: number,
  height?: number
): {
  width: number;
  height: number;
} {
  if (!width || !height) {
    return { width: 240, height: 160 };
  }
  const ratio = width / height;
  const maxWidth = 260;
  const maxHeight = 320;
  if (ratio >= maxWidth / maxHeight) {
    return { width: maxWidth, height: Math.round(maxWidth / ratio) };
  }
  return { width: Math.round(maxHeight * ratio), height: maxHeight };
}

export function InlineImageAttachment({
  attachment,
  conversationId,
  isCandidateInquiry,
  mine,
  messages,
  messageTime,
  onFilePress,
  onImagePress,
}: {
  attachment: RenderAttachment;
  conversationId: string;
  isCandidateInquiry?: boolean;
  mine: boolean;
  messages: ChatMessages;
  messageTime?: string;
  onFilePress: () => void;
  onImagePress: (url: string, name: string, timestamp?: string) => void;
}) {
  const imageSize = getImageSize(attachment.width, attachment.height);
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(() =>
    attachmentLinkCache.get(attachment.id)
  );
  const [loading, setLoading] = useState<boolean>(
    () => !attachmentLinkCache.get(attachment.id)
  );
  const [error, setError] = useState<boolean>(false);

  /* eslint-disable react-hooks/set-state-in-effect -- cached attachment link lookup */
  useEffect(() => {
    let active = true;
    const cached = attachmentLinkCache.get(attachment.id);
    if (cached) {
      setResolvedUrl(cached);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(false);

    const fetcher = async () => {
      if (isCandidateInquiry) {
        return liveQuestService.getCandidateInquiryAttachmentLink(
          conversationId,
          attachment.id
        );
      }
      return chatApi.getAttachmentLink(conversationId, attachment.id);
    };

    attachmentLinkCache
      .getOrFetch(attachment.id, fetcher)
      .then((url) => {
        if (active) {
          setResolvedUrl(url);
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) {
          setError(true);
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [attachment.id, conversationId, isCandidateInquiry]);
  /* eslint-enable react-hooks/set-state-in-effect */

  if (error) {
    return (
      <AttachmentRow
        attachment={attachment}
        mine={mine}
        messages={messages}
        onPress={onFilePress}
      />
    );
  }

  if (loading || !resolvedUrl) {
    return (
      <View
        testID={"inline-image-loading-" + attachment.id}
        accessibilityRole="image"
        accessibilityLabel={`${messages.openFile}: ${attachment.name}`}
        className={cn(
          styles.inlineImageWrap,
          "min-h-[140px] items-center justify-center bg-ku-surface-muted"
        )}
      >
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  const handlePress = () => {
    if (messageTime) {
      onImagePress(resolvedUrl, attachment.name, messageTime);
      return;
    }
    onImagePress(resolvedUrl, attachment.name);
  };

  return (
    <Pressable
      accessibilityRole="imagebutton"
      accessibilityLabel={messages.openFile + ": " + attachment.name}
      testID={"inline-image-" + attachment.id}
      onPress={handlePress}
      className={styles.inlineImageWrap}
    >
      <Image
        source={{ uri: resolvedUrl }}
        className={styles.inlineImage}
        style={imageSize}
        resizeMode="contain"
      />
    </Pressable>
  );
}

export function MessageBubble({
  message,
  conversation,
  locale,
  messages,
  onFilePress,
  onImagePress = () => undefined,
  onProfilePress,
  isCandidateInquiry = false,
}: {
  message: DisplayChatMessage;
  conversation: ChatConversation;
  locale: "en" | "th";
  messages: ChatMessages;
  onFilePress: (attachment: RenderAttachment) => void;
  onImagePress?: (url: string, name: string, timestamp?: string) => void;
  onProfilePress?: () => void;
  isCandidateInquiry?: boolean;
}) {
  const mine = message.sender === "me";
  const text = message.text ? localizedText(message.text, locale) : undefined;
  return (
    <View className={cn(styles.messageRow, mine && styles.messageRowMe)}>
      {!mine ? (
        <ChatAvatar
          initials={conversation.initials}
          color={conversation.avatarColor}
          name={conversation.participantName}
          profileId={conversation.participantId}
          avatarUrl={conversation.participantAvatarUrl}
          avatarFileId={conversation.participantAvatarFileId}
          onPress={onProfilePress}
          small
        />
      ) : null}
      <View className={cn(styles.messageStack, mine && styles.messageStackMe)}>
        {text ? (
          <View
            className={cn(styles.messageBubble, mine && styles.messageBubbleMe)}
          >
            <Text className={styles.messageText}>{text}</Text>
          </View>
        ) : null}
        {message.attachments.map((attachment) =>
          isImageAttachment(attachment) ? (
            <InlineImageAttachment
              key={attachment.id}
              attachment={attachment}
              conversationId={conversation.id}
              isCandidateInquiry={isCandidateInquiry}
              mine={mine}
              messages={messages}
              messageTime={message.time}
              onFilePress={() => onFilePress(attachment)}
              onImagePress={onImagePress}
            />
          ) : (
            <AttachmentRow
              key={attachment.id}
              attachment={attachment}
              messages={messages}
              mine={mine}
              onPress={() => onFilePress(attachment)}
            />
          )
        )}
        <Text className={styles.messageMeta}>{message.time}</Text>
      </View>
    </View>
  );
}

export default MessageBubble;
export type {
  DisplayChatMessage,
  RenderAttachment,
} from "./ChatConversationPresentation";
