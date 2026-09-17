import { useEffect, useState } from "react";
import {
  ChevronLeft,
  Download,
  FileText,
  ImagePlus,
  X,
} from "lucide-react-native";

import { ScreenLayout } from "@/components/layout/ScreenLayout";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
} from "@/tw";
import {
  LoadingSkeleton,
  SkeletonBlock,
} from "@/components/ui/LoadingSkeleton";
import { chatApi, serverMessageToChatMessage } from "@/api/ChatApi";
import type { ServerChatAttachment, ServerChatMessage } from "@/api/ChatApi";
import { liveQuestService } from "@/features/questBoard/liveQuestService";
import type { ChatMessages } from "@/locales/chatMessages";
import { colors } from "@/theme/colors";
import { spacing } from "@/theme/spacing";
import type {
  ChatAttachment,
  ChatConversation,
  ChatMessage,
} from "./chatTypes";
import styles from "./chatStyles";
import { cn } from "@/tw/cn";
import { attachmentLinkCache } from "./attachmentLinkCache";

export function localizedText(
  value: Record<"en" | "th", string>,
  locale: "en" | "th"
): string {
  return value[locale];
}

export type RenderAttachment = ChatAttachment & { id: string };
export type DisplayChatMessage = ChatMessage & {
  attachment?: RenderAttachment;
  attachments: RenderAttachment[];
};

function attachmentToChatAttachment(
  attachment: ServerChatAttachment
): RenderAttachment {
  return {
    id: attachment.id,
    name: attachment.fileName,
    meta:
      attachment.sizeBytes >= 1024 * 1024
        ? `${(attachment.sizeBytes / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.max(1, Math.round(attachment.sizeBytes / 1024))} KB`,
    kind: attachment.mediaType === "application/pdf" ? "pdf" : "image",
  };
}

export function toDisplayMessage(
  message: ServerChatMessage,
  viewerId: string
): DisplayChatMessage {
  const converted = serverMessageToChatMessage(message, viewerId);
  const attachments: RenderAttachment[] = message.attachments.map(
    attachmentToChatAttachment
  );
  const { attachment: _legacyAttachment, ...convertedWithoutAttachment } =
    converted;
  return {
    ...convertedWithoutAttachment,
    attachments,
    ...(attachments[0] ? { attachment: attachments[0] } : {}),
  };
}

export function ChatAvatar({
  initials,
  color,
  name,
  small = false,
}: {
  initials: string;
  color: string;
  name: string;
  small?: boolean;
}) {
  return (
    <View
      accessible
      accessibilityLabel={name}
      className={cn(styles.avatar, small && styles.avatarSmall)}
      style={{ backgroundColor: color }}
    >
      <Text className={small ? styles.avatarSmallText : styles.avatarText}>
        {initials}
      </Text>
    </View>
  );
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

export function InlineImageAttachment({
  attachment,
  conversationId,
  isCandidateInquiry,
  mine,
  messages,
  onFilePress,
  onImagePress,
}: {
  attachment: RenderAttachment;
  conversationId: string;
  isCandidateInquiry?: boolean;
  mine: boolean;
  messages: ChatMessages;
  onFilePress: () => void;
  onImagePress: (url: string, name: string) => void;
}) {
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

  if (loading || error || !resolvedUrl) {
    return (
      <AttachmentRow
        attachment={attachment}
        mine={mine}
        messages={messages}
        onPress={onFilePress}
      />
    );
  }

  return (
    <Pressable
      accessibilityRole="imagebutton"
      accessibilityLabel={messages.openFile + ": " + attachment.name}
      testID={"inline-image-" + attachment.id}
      onPress={() => onImagePress(resolvedUrl, attachment.name)}
      className={styles.inlineImageWrap}
    >
      <Image
        source={{ uri: resolvedUrl }}
        className={styles.inlineImage}
        resizeMode="cover"
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
  isCandidateInquiry = false,
}: {
  message: DisplayChatMessage;
  conversation: ChatConversation;
  locale: "en" | "th";
  messages: ChatMessages;
  onFilePress: (attachment: RenderAttachment) => void;
  onImagePress?: (url: string, name: string) => void;
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
          attachment.kind === "image" ? (
            <InlineImageAttachment
              key={attachment.id}
              attachment={attachment}
              conversationId={conversation.id}
              isCandidateInquiry={isCandidateInquiry}
              mine={mine}
              messages={messages}
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

export interface PendingAttachmentItem {
  id: string;
  uri: string;
  name: string;
  uploading?: boolean;
}

export function PendingAttachmentsBar({
  attachments,
  onRemove,
}: {
  attachments: PendingAttachmentItem[];
  onRemove: (id: string) => void;
}) {
  if (attachments.length === 0) {
    return null;
  }

  return (
    <View className={styles.pendingAttachmentsBar}>
      {attachments.map((item) => (
        <View key={item.id} className={styles.pendingAttachmentChip}>
          <Image
            source={{ uri: item.uri }}
            className={styles.pendingAttachmentImage}
            resizeMode="cover"
          />
          {item.uploading ? (
            <View className={styles.pendingAttachmentUploading}>
              <ActivityIndicator size="small" color={colors.white} />
            </View>
          ) : null}
          <Pressable
            accessibilityLabel={`Remove ${item.name}`}
            accessibilityRole="button"
            testID={"remove-pending-attachment-" + item.id}
            className={styles.pendingAttachmentRemove}
            onPress={() => onRemove(item.id)}
          >
            <X color={colors.white} size={12} strokeWidth={2.5} />
          </Pressable>
        </View>
      ))}
    </View>
  );
}

export function ChatConversationSkeleton({
  loadingLabel,
  backLabel,
  onBack,
}: {
  loadingLabel: string;
  backLabel: string;
  onBack: () => void;
}) {
  return (
    <ScreenLayout
      edges={["top", "left", "right", "bottom"]}
      className={styles.safeArea}
    >
      <View className={styles.detailHeader}>
        <View className={styles.brandRow}>
          <Pressable
            accessibilityLabel={backLabel}
            accessibilityRole="button"
            className={styles.backButton}
            onPress={onBack}
            testID="chat-loading-back-button"
          >
            <ChevronLeft
              color={colors.primaryDeep}
              size={24}
              strokeWidth={2.5}
            />
          </Pressable>
        </View>
        <View className={styles.identityRow}>
          <SkeletonBlock
            variant="image"
            height={48}
            width={48}
            borderRadius={24}
          />
          <View style={{ flex: 1, gap: spacing.xs, marginLeft: spacing.sm }}>
            <SkeletonBlock height={18} width="78%" borderRadius={4} />
            <SkeletonBlock height={15} width="56%" borderRadius={4} />
          </View>
          <View
            style={{
              flexDirection: "row",
              gap: spacing.xs,
              marginLeft: spacing.sm,
            }}
          >
            {[1, 2, 3].map((item) => (
              <SkeletonBlock
                key={item}
                height={36}
                width={36}
                borderRadius={18}
              />
            ))}
          </View>
        </View>
      </View>
      <LoadingSkeleton
        loadingLabel={loadingLabel}
        style={{ flex: 1 }}
        contentStyle={{ flex: 1 }}
        testID="chat-conversation-loading-skeleton"
      >
        <View style={{ flex: 1 }}>
          <View className={styles.contextCard}>
            <SkeletonBlock
              variant="image"
              height={40}
              width={40}
              borderRadius={12}
            />
            <View style={{ flex: 1, gap: spacing.xs, marginLeft: spacing.sm }}>
              <SkeletonBlock height={14} width="42%" borderRadius={4} />
              <SkeletonBlock height={17} width="74%" borderRadius={4} />
            </View>
            <SkeletonBlock
              height={16}
              width={74}
              borderRadius={4}
              style={{ marginLeft: spacing.sm }}
            />
          </View>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              flexGrow: 1,
              gap: spacing.md,
              paddingHorizontal: spacing.lg,
              paddingTop: spacing.lg,
            }}
          >
            <View style={{ alignItems: "center" }}>
              <SkeletonBlock height={22} width={58} borderRadius={12} />
            </View>
            {[1, 2, 3, 4].map((item) => (
              <View
                key={item}
                style={{
                  alignItems: item % 2 === 0 ? "flex-end" : "flex-start",
                  flexDirection: "row",
                  gap: spacing.sm,
                  marginTop: spacing.sm,
                }}
              >
                {item % 2 === 1 ? (
                  <SkeletonBlock
                    variant="image"
                    height={36}
                    width={36}
                    borderRadius={18}
                  />
                ) : null}
                <View style={{ gap: spacing.xs, maxWidth: "78%" }}>
                  <SkeletonBlock
                    height={item % 2 === 0 ? 42 : 34}
                    width={item % 2 === 0 ? 178 : 142}
                    borderRadius={18}
                  />
                  <SkeletonBlock
                    height={13}
                    width={42}
                    borderRadius={4}
                    style={{
                      alignSelf: item % 2 === 0 ? "flex-end" : "flex-start",
                    }}
                  />
                </View>
              </View>
            ))}
          </ScrollView>
          <View className={styles.composerWrap}>
            <SkeletonBlock height={56} borderRadius={28} />
          </View>
        </View>
      </LoadingSkeleton>
    </ScreenLayout>
  );
}
