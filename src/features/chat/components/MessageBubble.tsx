import React, { useEffect, useState } from "react";
import { ActivityIndicator } from "react-native";
import { Download, FileText, ImagePlus } from "lucide-react-native";

import { Image, Pressable, Text, View } from "@/tw";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/tw/cn";
import { useAppTheme } from "@/features/workspace/AppThemeProvider";
import { chatApi } from "@/api/ChatApi";
import { liveQuestService } from "@/features/questBoard/live/liveQuestService";
import type { ChatMessages } from "@/locales/chatMessages";
import type { ChatConversation } from "../chatTypes";
import { localizedText } from "./ChatConversationPresentation";
import {
  type DisplayChatMessage,
  isReportableMessage,
  type RenderAttachment,
} from "../domain/conversationModule";
import { attachmentLinkCache } from "../api/attachmentLinkCache";
import { formatTimeInBangkok } from "@/domain/datetime";

import styles from "../chatStyles";

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
  onLongPress,
  accessibilityActions,
  onAccessibilityAction,
}: {
  attachment: RenderAttachment;
  mine: boolean;
  messages: ChatMessages;
  onPress: () => void;
  onLongPress?: () => void;
  accessibilityActions?: { name: string; label: string }[];
  onAccessibilityAction?: (event: {
    nativeEvent: { actionName: string };
  }) => void;
}) {
  const { colors } = useAppTheme();
  return (
    <Pressable
      accessibilityLabel={`${messages.openFile}: ${attachment.name}`}
      accessibilityRole="button"
      className={cn(
        styles.attachmentBubble,
        !mine && styles.attachmentBubbleOther
      )}
      onPress={onPress}
      onLongPress={onLongPress}
      accessibilityActions={accessibilityActions}
      onAccessibilityAction={onAccessibilityAction}
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
  onLongPress,
  accessibilityActions,
  onAccessibilityAction,
}: {
  attachment: RenderAttachment;
  conversationId: string;
  isCandidateInquiry?: boolean;
  mine: boolean;
  messages: ChatMessages;
  messageTime?: string;
  onFilePress: () => void;
  onImagePress: (url: string, name: string, timestamp?: string) => void;
  onLongPress?: () => void;
  accessibilityActions?: { name: string; label: string }[];
  onAccessibilityAction?: (event: {
    nativeEvent: { actionName: string };
  }) => void;
}) {
  const { colors } = useAppTheme();
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
        onLongPress={onLongPress}
        accessibilityActions={accessibilityActions}
        onAccessibilityAction={onAccessibilityAction}
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
      onLongPress={onLongPress}
      accessibilityActions={accessibilityActions}
      onAccessibilityAction={onAccessibilityAction}
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
  onReportMessage,
  isCandidateInquiry = false,
}: {
  message: DisplayChatMessage;
  conversation: ChatConversation;
  locale: "en" | "th";
  messages: ChatMessages;
  onFilePress: (attachment: RenderAttachment) => void;
  onImagePress?: (url: string, name: string, timestamp?: string) => void;
  onProfilePress?: () => void;
  onReportMessage?: (message: DisplayChatMessage) => void;
  isCandidateInquiry?: boolean;
}) {
  const mine = message.sender === "me";
  const text = message.text ? localizedText(message.text, locale) : undefined;
  const messageTime = formatTimeInBangkok(message.createdAt);
  const canReport =
    !mine && isReportableMessage(message) && Boolean(onReportMessage);
  const reportActions = canReport
    ? [{ name: "report", label: messages.reportMessage }]
    : undefined;
  const handleLongPress = canReport
    ? () => {
        onReportMessage?.(message);
      }
    : undefined;
  const handleAccessibilityAction = canReport
    ? (event: { nativeEvent: { actionName: string } }) => {
        if (event.nativeEvent.actionName === "report") {
          onReportMessage?.(message);
        }
      }
    : undefined;
  return (
    <View
      className={cn(styles.messageRow, mine && styles.messageRowMe)}
      testID={`chat-message-${message.id}`}
    >
      {!mine ? (
        <Avatar
          accessibilityLabel={
            onProfilePress
              ? `View profile of ${conversation.participantName}`
              : undefined
          }
          cacheKey={conversation.participantAvatarFileId}
          className={styles.messageAvatar}
          imageTestID={`chat-avatar-image-${conversation.participantId ?? conversation.participantName}`}
          name={conversation.participantName}
          onPress={onProfilePress}
          size={32}
          style={{ backgroundColor: conversation.avatarColor }}
          testID={`chat-avatar-${conversation.participantId ?? conversation.participantName}`}
          textClassName={styles.messageAvatarText}
          uri={conversation.participantAvatarUrl}
        />
      ) : null}
      <View className={cn(styles.messageStack, mine && styles.messageStackMe)}>
        {text ? (
          <Pressable
            accessibilityActions={reportActions}
            accessibilityRole={canReport ? "button" : undefined}
            className={cn(styles.messageBubble, mine && styles.messageBubbleMe)}
            delayLongPress={350}
            onAccessibilityAction={handleAccessibilityAction}
            onLongPress={handleLongPress}
            testID={`chat-message-bubble-${message.id}`}
          >
            <Text className={styles.messageText}>{text}</Text>
          </Pressable>
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
              messageTime={messageTime}
              onFilePress={() => onFilePress(attachment)}
              onImagePress={onImagePress}
              onLongPress={handleLongPress}
              accessibilityActions={reportActions}
              onAccessibilityAction={handleAccessibilityAction}
            />
          ) : (
            <AttachmentRow
              key={attachment.id}
              attachment={attachment}
              messages={messages}
              mine={mine}
              onPress={() => onFilePress(attachment)}
              onLongPress={handleLongPress}
              accessibilityActions={reportActions}
              onAccessibilityAction={handleAccessibilityAction}
            />
          )
        )}
        <Text className={styles.messageMeta}>{messageTime}</Text>
      </View>
    </View>
  );
}
