import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Alert, Linking, Platform, RefreshControl } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Camera,
  ChevronLeft,
  CircleAlert,
  ClipboardCheck,
  Download,
  FileText,
  ImagePlus,
  MoreHorizontal,
  Paperclip,
  Search,
  Send,
  X,
} from "lucide-react-native";

import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  View,
} from "@/tw";
import {
  LoadingSkeleton,
  SkeletonBlock,
} from "@/components/ui/LoadingSkeleton";
import {
  chatApi,
  serverConversationToChatConversation,
  serverMessageToChatMessage,
} from "@/api/ChatApi";
import type {
  ServerCandidateInquiry,
  ServerChatAttachment,
  ServerChatMessage,
} from "@/api/ChatApi";
import { ApiError } from "@/api/ApiClient";
import {
  fileNameFromUri,
  mimeTypeFromUri,
  type UploadAsset,
} from "@/api/fileUpload";
import { authService } from "@/features/auth/AuthService";
import { liveQuestService } from "@/features/questBoard/liveQuestService";
import { useLocale } from "@/locales/LocaleProvider";
import { chatMessages, type ChatMessages } from "@/locales/chatMessages";
import { colors } from "@/theme/colors";
import { spacing } from "@/theme/spacing";
import type {
  ChatAttachment,
  ChatConversation,
  ChatMessage,
  ChatRouteParams,
  LocalizedText,
} from "./chatTypes";
import styles from "./chatStyles";
import { cn } from "@/tw/cn";
import { useCalmRefresh } from "@/hooks/useCalmRefresh";
import { ImageViewerModal } from "./ImageViewerModal";
import { attachmentLinkCache } from "./attachmentLinkCache";
import { useChatSocket, type ChatSocketEvent } from "./useChatSocket";

function localizedText(
  value: Record<"en" | "th", string>,
  locale: "en" | "th"
): string {
  return value[locale];
}

export type ConversationMode = "WORK" | "CANDIDATE_INQUIRY";
const MAX_MESSAGE_LENGTH = 1000;
const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;
export type RenderAttachment = ChatAttachment & { id: string };
export type DisplayChatMessage = ChatMessage & {
  attachment?: RenderAttachment;
  attachments: RenderAttachment[];
};

const TERMINAL_QUEST_STATES: Record<string, true> = {
  QUEST_COMPLETED: true,
  QUEST_CANCELLED: true,
  QUEST_FAILED: true,
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

function toDisplayMessage(
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

function candidateInquiryToChatConversation(
  inquiry: ServerCandidateInquiry,
  viewerId: string
): ChatConversation {
  const otherParticipant =
    inquiry.participants.find((participant) => participant.id !== viewerId) ??
    inquiry.participants[0];
  const latestPreview = inquiry.latestMessage?.preview ?? "";
  const localizedTitle: LocalizedText = {
    en: inquiry.quest.title,
    th: inquiry.quest.title,
  };
  return {
    id: inquiry.id,
    questId: inquiry.quest.id,
    questTitle: localizedTitle,
    participantName: otherParticipant?.displayName ?? inquiry.quest.title,
    participantRole: otherParticipant?.role === "HIRER" ? "owner" : "member",
    initials: (otherParticipant?.displayName ?? inquiry.quest.title)
      .slice(0, 2)
      .toUpperCase(),
    avatarColor: "#208AEF",
    latestMessage: { en: latestPreview, th: latestPreview },
    latestTime: inquiry.latestMessage?.createdAt ?? "",
    unreadCount: inquiry.unreadCount,
    messages: [],
    capability: {
      conversationId: inquiry.id,
      canRead: true,
      canWrite: inquiry.state === "INQUIRY_OPEN",
      readOnly: inquiry.state !== "INQUIRY_OPEN",
    },
  };
}

function ChatAvatar({
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

function ChatConversationSkeleton({
  loadingLabel,
  backLabel,
  onBack,
}: {
  loadingLabel: string;
  backLabel: string;
  onBack: () => void;
}) {
  return (
    <SafeAreaView
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
    </SafeAreaView>
  );
}

type ChatRouteSearchParams = Partial<
  Record<keyof ChatRouteParams, string | string[]>
>;

function getSingleRouteParam(value: unknown): string | undefined {
  if (typeof value === "string" && value) return value;
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (Array.isArray(value)) return getSingleRouteParam(value[0]);
  return undefined;
}

type ConversationLoadState = {
  key: string;
  status: "pending" | "settled" | "error";
  conversation: ChatConversation | null;
  messages: DisplayChatMessage[];
};

export interface ChatConversationScreenProps {
  conversationType?: ConversationMode;
}

export default function ChatConversationScreen({
  conversationType = "WORK",
}: ChatConversationScreenProps = {}) {
  const router = useRouter();
  const params = useLocalSearchParams<ChatRouteSearchParams>();
  const { locale } = useLocale();
  const insets = useSafeAreaInsets();
  const messages = chatMessages[locale];
  const routeQuestId =
    conversationType === "CANDIDATE_INQUIRY"
      ? getSingleRouteParam(params.id)
      : getSingleRouteParam(params.questId);
  const routeConversationId =
    conversationType === "CANDIDATE_INQUIRY"
      ? getSingleRouteParam(params.conversationId)
      : getSingleRouteParam(params.id);
  const routeViewerId = getSingleRouteParam(params.viewerId);
  const [sessionUserId, setSessionUserId] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    void authService
      .getSession()
      .then((session) => {
        if (active && session?.user?.id) setSessionUserId(session.user.id);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);
  const viewerId = routeViewerId || sessionUserId || "";
  const conversationRouteKey = `${conversationType}:${routeQuestId ?? ""}:${routeConversationId ?? ""}:${viewerId}`;
  const [loadState, setLoadState] = useState<ConversationLoadState>(() => ({
    key: conversationRouteKey,
    status: routeConversationId && viewerId ? "pending" : "settled",
    conversation: null,
    messages: [],
  }));
  const conversationRouteKeyRef = useRef(conversationRouteKey);
  useEffect(() => {
    conversationRouteKeyRef.current = conversationRouteKey;
  }, [conversationRouteKey]);

  const loadConversation = useCallback(async () => {
    if (!routeConversationId || !viewerId) {
      if (conversationRouteKeyRef.current === conversationRouteKey) {
        setLoadState({
          key: conversationRouteKey,
          status: "settled",
          conversation: null,
          messages: [],
        });
      }
      return null;
    }

    try {
      if (conversationType === "CANDIDATE_INQUIRY") {
        const inquiry =
          await liveQuestService.getCandidateInquiry(routeConversationId);
        if (
          inquiry.id !== routeConversationId ||
          inquiry.state !== "INQUIRY_OPEN"
        ) {
          setLoadState({
            key: conversationRouteKey,
            status: "settled",
            conversation: null,
            messages: [],
          });
          return null;
        }
        const [participants, messagePage] = await Promise.all([
          liveQuestService.listCandidateInquiryParticipants(
            routeConversationId
          ),
          liveQuestService.getCandidateInquiryMessages(routeConversationId, {
            limit: 50,
          }),
        ]);
        if (conversationRouteKeyRef.current !== conversationRouteKey) {
          return undefined;
        }
        if (!participants.some((participant) => participant.id === viewerId)) {
          setLoadState({
            key: conversationRouteKey,
            status: "settled",
            conversation: null,
            messages: [],
          });
          return null;
        }
        const candidate = candidateInquiryToChatConversation(
          { ...inquiry, participants },
          viewerId
        );
        const displayMessages = messagePage.items.map((message) =>
          toDisplayMessage(message, viewerId)
        );
        setLoadState({
          key: conversationRouteKey,
          status: "settled",
          conversation: candidate,
          messages: displayMessages,
        });
        const lastMessage = messagePage.items.at(-1);
        if (lastMessage) {
          await liveQuestService.markCandidateInquiryRead(
            routeConversationId,
            lastMessage.id
          );
        }
        return messagePage;
      }

      let questId = routeQuestId;
      if (!questId) {
        const page = await chatApi.listConversations({ limit: 20 });
        questId = page.items.find((item) => item.id === routeConversationId)
          ?.quest.id;
      }
      if (!questId) return null;
      const liveSnapshot = await liveQuestService.getLiveSnapshot(
        questId,
        viewerId
      );
      const workConversation = liveSnapshot.workConversation;
      if (
        !workConversation ||
        workConversation.id !== routeConversationId ||
        !liveSnapshot.capabilities.canReadWorkChat
      ) {
        setLoadState({
          key: conversationRouteKey,
          status: "settled",
          conversation: null,
          messages: [],
        });
        return null;
      }
      const [participants, messagePage] = await Promise.all([
        chatApi.listParticipants(routeConversationId),
        chatApi.getMessages(routeConversationId, { limit: 50 }),
      ]);
      if (conversationRouteKeyRef.current !== conversationRouteKey) {
        return undefined;
      }
      const converted = serverConversationToChatConversation(
        workConversation,
        viewerId
      );
      const otherParticipant =
        participants.find((participant) => participant.id !== viewerId) ??
        participants[0];
      const canWrite = Boolean(
        liveSnapshot.capabilities.canWriteWorkChat && !workConversation.readOnly
      );
      const readOnlyReason =
        TERMINAL_QUEST_STATES[liveSnapshot.state] === true
          ? "TERMINAL"
          : undefined;
      const workChat: ChatConversation = {
        ...converted,
        participantName:
          otherParticipant?.displayName ?? converted.participantName,
        participantRole:
          otherParticipant?.role === "HIRER" ? "owner" : "member",
        initials: (otherParticipant?.displayName ?? converted.participantName)
          .slice(0, 2)
          .toUpperCase(),
        capability: {
          conversationId: routeConversationId,
          canRead: liveSnapshot.capabilities.canReadWorkChat,
          canWrite,
          readOnly: !canWrite,
          ...(readOnlyReason ? { readOnlyReason } : {}),
        },
      };
      const displayMessages = messagePage.items.map((message) =>
        toDisplayMessage(message, viewerId)
      );
      setLoadState({
        key: conversationRouteKey,
        status: "settled",
        conversation: workChat,
        messages: displayMessages,
      });
      const lastMessage = messagePage.items.at(-1);
      if (lastMessage) {
        await chatApi.markRead(routeConversationId, lastMessage.id);
      }
      return messagePage;
    } catch (error) {
      if (conversationRouteKeyRef.current === conversationRouteKey) {
        setLoadState((current) =>
          current.key === conversationRouteKey && current.conversation
            ? { ...current, status: "settled" }
            : {
                key: conversationRouteKey,
                status: "error",
                conversation: null,
                messages: [],
              }
        );
      }
      throw error;
    }
  }, [
    conversationRouteKey,
    conversationType,
    routeConversationId,
    routeQuestId,
    viewerId,
  ]);
  const { refreshing, refresh, refreshOnFocus } =
    useCalmRefresh(loadConversation);
  useEffect(() => {
    if (!routeConversationId || !viewerId) return;
    void refresh(true).catch(() => undefined);
  }, [conversationRouteKey, refresh, routeConversationId, viewerId]);
  useFocusEffect(
    useCallback(() => {
      refreshOnFocus();
    }, [refreshOnFocus])
  );
  const currentLoadState =
    loadState.key === conversationRouteKey
      ? loadState
      : {
          key: conversationRouteKey,
          status:
            routeConversationId && viewerId
              ? ("pending" as const)
              : ("settled" as const),
          conversation: null,
          messages: [],
        };

  const conversation = currentLoadState.conversation;
  const conversationMessages = currentLoadState.messages;
  const handleChatSocketEvent = useCallback(
    (event: ChatSocketEvent) => {
      if (
        event.type === "chat.message.created" &&
        event.data.conversationId === routeConversationId
      ) {
        void refresh(true).catch(() => undefined);
      }
      if (
        event.type === "quest.state.changed" &&
        event.data.questId === routeQuestId
      ) {
        void refresh(true).catch(() => undefined);
      }
    },
    [refresh, routeConversationId, routeQuestId]
  );
  useChatSocket({
    conversationId: routeConversationId ?? "",
    conversationType,
    enabled: Boolean(routeConversationId && conversation?.capability?.canRead),
    onEvent: handleChatSocketEvent,
  });
  const [draft, setDraft] = useState("");
  const [pendingAttachmentIds, setPendingAttachmentIds] = useState<string[]>(
    []
  );
  const [viewerState, setViewerState] = useState<{
    visible: boolean;
    url: string | null;
    name?: string;
  }>({ visible: false, url: null });
  const [pendingAttachments, setPendingAttachments] = useState<
    PendingAttachmentItem[]
  >([]);

  const handleImagePress = (url: string, name?: string) => {
    setViewerState({ visible: true, url, name });
  };

  const handleRemovePendingAttachment = (idToRemove: string) => {
    setPendingAttachments((current) =>
      current.filter((item) => item.id !== idToRemove)
    );
    setPendingAttachmentIds((current) =>
      current.filter((id) => id !== idToRemove)
    );
  };
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchScope, setSearchScope] = useState<"messages" | "files">(
    "messages"
  );
  const [searchQuery, setSearchQuery] = useState("");

  const normalizedQuery = searchQuery.trim().toLocaleLowerCase();
  const displayedMessages = useMemo(
    () => conversationMessages,
    [conversationMessages]
  );
  const searchedMessages = useMemo(
    () =>
      displayedMessages.filter((message) => {
        if (!normalizedQuery) return true;
        const text = message.text ? localizedText(message.text, locale) : "";
        return `${text} ${message.attachment?.name ?? ""}`
          .toLocaleLowerCase()
          .includes(normalizedQuery);
      }),
    [displayedMessages, locale, normalizedQuery]
  );
  const files = useMemo(
    () =>
      displayedMessages
        .flatMap((message) =>
          message.attachments.map((attachment) => ({
            ...attachment,
            time: message.time,
          }))
        )
        .filter(
          (file) =>
            !normalizedQuery ||
            `${file.name} ${file.meta}`
              .toLocaleLowerCase()
              .includes(normalizedQuery)
        ),
    [displayedMessages, normalizedQuery]
  );
  const conversationPending =
    Boolean(routeConversationId && viewerId) &&
    currentLoadState.status === "pending";
  const conversationLoadFailed =
    Boolean(routeConversationId && viewerId) &&
    currentLoadState.status === "error";
  useEffect(() => {
    if (
      conversationType !== "WORK" ||
      !conversation ||
      conversation.capability?.canWrite
    ) {
      return;
    }
    const interval = setInterval(() => {
      void refresh(true).catch(() => undefined);
    }, 30_000);
    return () => clearInterval(interval);
  }, [conversation, conversationType, refresh]);

  if (conversationPending) {
    return (
      <ChatConversationSkeleton
        loadingLabel={messages.loading}
        backLabel={messages.backToChat}
        onBack={() => router.back()}
      />
    );
  }

  if (conversationLoadFailed) {
    return (
      <SafeAreaView
        edges={["top", "left", "right", "bottom"]}
        className={styles.safeArea}
      >
        <View className={styles.detailHeader}>
          <View className={styles.brandRow}>
            <Pressable
              accessibilityLabel={messages.backToChat}
              accessibilityRole="button"
              className={styles.backButton}
              onPress={() => router.back()}
            >
              <ChevronLeft
                color={colors.primaryDeep}
                size={24}
                strokeWidth={2.5}
              />
            </Pressable>
          </View>
        </View>
        <View accessibilityRole="alert" className={styles.emptyState}>
          <Text className={styles.emptyTitle}>{messages.loadError}</Text>
          <Pressable
            accessibilityRole="button"
            className={styles.loadErrorAction}
            onPress={() => {
              setLoadState({
                key: conversationRouteKey,
                status: "pending",
                conversation: null,
                messages: [],
              });
              void refresh(true).catch(() => undefined);
            }}
          >
            <Text className={styles.loadErrorActionText}>{messages.retry}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (!conversation) {
    return (
      <SafeAreaView
        edges={["top", "left", "right", "bottom"]}
        className={styles.safeArea}
      >
        <View className={styles.emptyState}>
          <Text className={styles.emptyTitle}>
            {messages.conversationNotFound}
          </Text>
          <Pressable
            accessibilityRole="button"
            className="bg-ku-primary rounded-ku-pill mt-[16px] min-h-[48px] justify-center px-[20px]"
            onPress={() => router.replace("/chat")}
          >
            <Text className="text-ku-white font-ku-semibold text-ku-body-small">
              {messages.backToChat}
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }
  const role =
    conversationType === "CANDIDATE_INQUIRY"
      ? locale === "th"
        ? conversation.participantRole === "owner"
          ? "ผู้ว่าจ้าง · Inquiry"
          : "ผู้สนใจทำงาน · Inquiry"
        : conversation.participantRole === "owner"
          ? "Hirer · Inquiry"
          : "Prospective Worker · Inquiry"
      : conversation.participantRole === "owner"
        ? messages.questOwner
        : messages.questMember;
  const conversationKind =
    conversationType === "CANDIDATE_INQUIRY"
      ? locale === "th"
        ? "Candidate Inquiry"
        : "Candidate Inquiry"
      : locale === "th"
        ? "Work Chat"
        : "Work Chat";
  const canWrite = Boolean(
    conversation.capability?.canRead &&
    conversation.capability.canWrite &&
    !conversation.capability.readOnly
  );
  const readOnlyDescription =
    conversation.capability?.readOnlyReason === "TERMINAL"
      ? messages.conversationReadOnlyTerminal
      : messages.conversationNotWritable;
  const canReportConversation = false;
  const handleReportConversation = () => undefined;
  const messagePlaceholder =
    conversation.participantRole === "owner"
      ? messages.typeOwnerMessage
      : messages.typeMessage;
  const pickAttachment = async (
    source: "camera" | "library"
  ): Promise<void> => {
    if (!canWrite || !conversation) return;
    const result =
      source === "camera"
        ? await ImagePicker.launchCameraAsync({
            mediaTypes: ["images"],
            quality: 0.8,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images", "videos"],
            quality: 0.8,
          });
    if (result.canceled || result.assets.length === 0) return;
    const asset = result.assets[0];
    if (asset.fileSize !== undefined && asset.fileSize > MAX_ATTACHMENT_BYTES) {
      Alert.alert(
        messages.addAttachment,
        locale === "th"
          ? "ไฟล์แนบต้องมีขนาดไม่เกิน 10 MB"
          : "Attachments must be 10 MB or smaller."
      );
      return;
    }
    const mimeType = asset.mimeType ?? mimeTypeFromUri(asset.uri);
    if (
      !mimeType.startsWith("image/") &&
      !mimeType.startsWith("video/") &&
      mimeType !== "application/pdf"
    ) {
      Alert.alert(
        messages.addAttachment,
        locale === "th"
          ? "รองรับเฉพาะรูปภาพ PDF และวิดีโอ"
          : "Only images, PDF, and video files are supported."
      );
      return;
    }
    const assetName =
      asset.fileName ?? fileNameFromUri(asset.uri, `chat-${Date.now()}.jpg`);
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setPendingAttachments((current) => [
      ...current,
      { id: tempId, uri: asset.uri, name: assetName, uploading: true },
    ]);
    const uploadAsset: UploadAsset = {
      uri: asset.uri,
      name: assetName,
      type: mimeType,
    };
    try {
      const uploaded =
        conversationType === "CANDIDATE_INQUIRY"
          ? await liveQuestService.uploadCandidateInquiryAttachment(
              conversation.id,
              uploadAsset
            )
          : await chatApi.uploadAttachment(conversation.id, uploadAsset);
      setPendingAttachments((current) => {
        const item = current.find((it) => it.id === tempId);
        if (!item) return current;
        setPendingAttachmentIds((ids) =>
          ids.includes(uploaded.id) ? ids : [...ids, uploaded.id]
        );
        return current.map((it) =>
          it.id === tempId ? { ...it, id: uploaded.id, uploading: false } : it
        );
      });
      void refresh(true).catch(() => undefined);
    } catch (error) {
      setPendingAttachments((current) =>
        current.filter((item) => item.id !== tempId)
      );
      throw error;
    }
  };
  const messageLengthError =
    locale === "th"
      ? "ข้อความต้องมีความยาวไม่เกิน 1,000 ตัวอักษร"
      : "Messages must be 1,000 characters or fewer.";
  const openAttachmentMenu = () => {
    if (!canWrite) return;
    Alert.alert(messages.addAttachment, undefined, [
      {
        text: messages.takePhoto,
        onPress: () => {
          void pickAttachment("camera").catch((error: unknown) => {
            Alert.alert(
              messages.addAttachment,
              error instanceof Error ? error.message : messages.loadError
            );
          });
        },
      },
      {
        text: messages.choosePhoto,
        onPress: () => {
          void pickAttachment("library").catch((error: unknown) => {
            Alert.alert(
              messages.addAttachment,
              error instanceof Error ? error.message : messages.loadError
            );
          });
        },
      },
      {
        text: messages.chooseFile,
        onPress: () => {
          void pickAttachment("library").catch((error: unknown) => {
            Alert.alert(
              messages.addAttachment,
              error instanceof Error ? error.message : messages.loadError
            );
          });
        },
      },
      { text: messages.cancel, style: "cancel" },
    ]);
  };
  const sendMessage = () => {
    if (!canWrite || !viewerId || !conversation) return;
    if (pendingAttachments.some((item) => item.uploading)) return;
    const value = draft.trim();
    if (value.length > MAX_MESSAGE_LENGTH) {
      Alert.alert(messages.send, messageLengthError);
      return;
    }
    if (!value && pendingAttachmentIds.length === 0) return;
    const clientMessageId = `${conversation.id}-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}`;
    const attachmentIds = pendingAttachmentIds;
    const sendPromise =
      conversationType === "CANDIDATE_INQUIRY"
        ? liveQuestService.sendCandidateInquiryMessage(
            conversation.id,
            value,
            clientMessageId,
            attachmentIds
          )
        : chatApi.sendMessage(
            conversation.id,
            value,
            clientMessageId,
            attachmentIds
          );
    void sendPromise
      .then((sentMessage) => {
        setLoadState((current) => ({
          ...current,
          messages: [
            ...current.messages,
            toDisplayMessage(sentMessage, viewerId),
          ],
        }));
        setDraft("");
        setPendingAttachmentIds([]);
        setPendingAttachments([]);
        void refresh(true).catch(() => undefined);
      })
      .catch((error: unknown) => {
        const rateLimited = error instanceof ApiError && error.status === 429;
        Alert.alert(
          messages.send,
          rateLimited
            ? locale === "th"
              ? "ส่งข้อความถี่เกินไป ลองอีกครั้งในอีกสักครู่"
              : "You are sending messages too quickly. Try again shortly."
            : error instanceof Error
              ? error.message
              : messages.loadError
        );
      });
  };
  const openFile = async (attachment: RenderAttachment): Promise<void> => {
    if (!conversation) return;
    try {
      const fetcher = async () => {
        if (conversationType === "CANDIDATE_INQUIRY") {
          return liveQuestService.getCandidateInquiryAttachmentLink(
            conversation.id,
            attachment.id
          );
        }
        return chatApi.getAttachmentLink(conversation.id, attachment.id);
      };
      const url = await attachmentLinkCache.getOrFetch(attachment.id, fetcher);
      await Linking.openURL(url);
    } catch (error) {
      Alert.alert(
        messages.openFile,
        error instanceof Error ? error.message : messages.loadError
      );
    }
  };

  return (
    <SafeAreaView
      edges={["top", "left", "right", "bottom"]}
      className={styles.safeArea}
    >
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View className={styles.detailHeader}>
          <View className={styles.brandRow}>
            <Pressable
              accessibilityLabel={messages.backToChat}
              accessibilityRole="button"
              className={styles.backButton}
              onPress={() => router.back()}
            >
              <ChevronLeft
                color={colors.primaryDeep}
                size={24}
                strokeWidth={2.5}
              />
            </Pressable>
          </View>
          <View className={styles.identityRow}>
            <ChatAvatar
              initials={conversation.initials}
              color={conversation.avatarColor}
              name={conversation.participantName}
            />
            <View className={styles.identityCopy}>
              <Text className={styles.identityTitle} numberOfLines={1}>
                {localizedText(conversation.questTitle, locale)}
              </Text>
              <Text className={styles.identityMeta} numberOfLines={1}>
                {conversation.participantName} · {role}
              </Text>
            </View>
            <View className={styles.headerActions}>
              <Pressable
                accessibilityLabel={messages.search}
                accessibilityRole="button"
                className={styles.headerAction}
                onPress={() => {
                  setSearchOpen(true);
                  setSearchScope("messages");
                }}
              >
                <Search color={colors.textStrong} size={21} strokeWidth={2.2} />
              </Pressable>
              <Pressable
                accessibilityLabel={messages.searchFiles}
                accessibilityRole="button"
                className={styles.headerAction}
                onPress={() => {
                  setSearchOpen(true);
                  setSearchScope("files");
                }}
              >
                <FileText
                  color={colors.textStrong}
                  size={20}
                  strokeWidth={2.1}
                />
              </Pressable>
              <Pressable
                accessibilityLabel={messages.moreOptions}
                accessibilityRole="button"
                className={styles.headerAction}
                onPress={() => Alert.alert(messages.moreOptions)}
              >
                <MoreHorizontal
                  color={colors.textStrong}
                  size={21}
                  strokeWidth={2.2}
                />
              </Pressable>
            </View>
          </View>
        </View>

        <Pressable
          accessibilityLabel={messages.viewQuest}
          accessibilityRole="button"
          className={styles.contextCard}
          onPress={() => {
            if (!conversation.questId) {
              Alert.alert(
                messages.viewQuest,
                locale === "th"
                  ? "ไม่พบบริบทเควสต์สำหรับการนำทาง"
                  : "Quest context is unavailable for navigation."
              );
              return;
            }
            router.push(
              conversationType === "CANDIDATE_INQUIRY"
                ? `../../${conversation.questId}`
                : {
                    pathname: `../quest/${conversation.questId}/work`,
                    params: { viewerId },
                  }
            );
          }}
        >
          <View className={styles.contextIcon}>
            <ClipboardCheck
              color={colors.primary}
              size={21}
              strokeWidth={2.1}
            />
          </View>
          <View className={styles.contextCopy}>
            <Text className={styles.contextLabel}>
              {conversationKind} · {messages.questTeam}
            </Text>
            <Text className={styles.contextTitle} numberOfLines={1}>
              {localizedText(conversation.questTitle, locale)}
            </Text>
          </View>
          <View className={styles.contextAction}>
            <Text className={styles.contextActionText}>
              {messages.viewQuest}
            </Text>
          </View>
        </Pressable>
        {canReportConversation ? (
          <Pressable
            accessibilityLabel={messages.reportConversation}
            accessibilityRole="button"
            className={styles.reportAction}
            onPress={handleReportConversation}
            testID="chat-report-button"
          >
            <View className={styles.reportActionIcon}>
              <CircleAlert color={colors.danger} size={20} strokeWidth={2.2} />
            </View>
            <View className={styles.reportActionCopy}>
              <Text className={styles.reportActionText}>
                {messages.reportConversation}
              </Text>
              <Text className={styles.reportActionDescription}>
                {messages.reportConversationDescription}
              </Text>
            </View>
          </Pressable>
        ) : null}
        {!canWrite ? (
          <View
            accessibilityRole="alert"
            className={styles.readOnlyBanner}
            testID="conversation-read-only-banner"
          >
            <Text className={styles.readOnlyBannerTitle}>
              {messages.conversationReadOnly}
            </Text>
            <Text className={styles.readOnlyBannerText}>
              {readOnlyDescription}
            </Text>
          </View>
        ) : null}

        {searchOpen ? (
          <View className={styles.searchPanel}>
            <View className={styles.compactSearchField}>
              <Search
                color={colors.textSecondary}
                size={20}
                strokeWidth={2.2}
              />
              <TextInput
                accessibilityLabel={messages.searchInConversation}
                autoFocus
                className={styles.compactSearchInput}
                onChangeText={setSearchQuery}
                placeholder={messages.searchInConversation}
                placeholderTextColor={colors.textFaint}
                value={searchQuery}
              />
              <Pressable
                accessibilityLabel={messages.closeSearch}
                accessibilityRole="button"
                className={styles.headerAction}
                onPress={() => {
                  setSearchOpen(false);
                  setSearchQuery("");
                }}
              >
                <X color={colors.textStrong} size={19} strokeWidth={2.3} />
              </Pressable>
            </View>
            <View className={styles.scopeSwitch}>
              {(["messages", "files"] as const).map((scope) => {
                const active = searchScope === scope;
                return (
                  <Pressable
                    key={scope}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: active }}
                    className={cn(
                      styles.scopeItem,
                      active && styles.scopeItemActive
                    )}
                    onPress={() => setSearchScope(scope)}
                  >
                    <Text
                      className={cn(
                        styles.scopeText,
                        active && styles.scopeTextActive
                      )}
                    >
                      {scope === "messages"
                        ? messages.searchMessages
                        : messages.searchFiles}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ) : null}

        {searchOpen ? (
          <Text className={styles.resultMeta}>
            {messages.searchResultCount(
              searchScope === "messages"
                ? searchedMessages.length
                : files.length,
              searchScope
            )}
          </Text>
        ) : null}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: spacing.md }}
          refreshControl={
            <RefreshControl
              colors={[colors.primary]}
              onRefresh={() => {
                void refresh(true).catch(() => undefined);
              }}
              refreshing={refreshing}
              tintColor={colors.primary}
            />
          }
        >
          {searchOpen && searchScope === "files" ? (
            files.length > 0 ? (
              <View className={styles.fileList}>
                {files.map((file) => (
                  <Pressable
                    key={`${file.name}-${file.time}`}
                    accessibilityLabel={`${messages.openFile}: ${file.name}`}
                    accessibilityRole="button"
                    className={styles.fileRow}
                    onPress={() => openFile(file)}
                  >
                    <View
                      className={cn(
                        styles.fileType,
                        file.kind === "pdf"
                          ? styles.fileTypePdf
                          : styles.fileTypeImage
                      )}
                    >
                      <FileText
                        color={
                          file.kind === "pdf"
                            ? colors.dangerIcon
                            : colors.primary
                        }
                        size={21}
                        strokeWidth={2.1}
                      />
                    </View>
                    <View className={styles.fileCopy}>
                      <Text className={styles.fileName} numberOfLines={1}>
                        {file.name}
                      </Text>
                      <Text className={styles.fileMeta}>
                        {file.meta} · {file.time}
                      </Text>
                    </View>
                    <Download
                      color={colors.textSubtle}
                      size={18}
                      strokeWidth={2}
                    />
                  </Pressable>
                ))}
              </View>
            ) : (
              <View className={styles.searchEmpty}>
                <Text className={styles.searchEmptyText}>
                  {messages.noFileResults}
                </Text>
              </View>
            )
          ) : searchOpen && searchedMessages.length === 0 ? (
            <View className={styles.searchEmpty}>
              <Text className={styles.searchEmptyText}>
                {messages.noMessageResults}
              </Text>
            </View>
          ) : (
            <View className={styles.messageContent}>
              {!searchOpen ? (
                <View className={styles.dateSeparator}>
                  <Text className={styles.dateText}>{messages.today}</Text>
                </View>
              ) : null}
              {searchedMessages.map((message) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  conversation={conversation}
                  locale={locale}
                  messages={messages}
                  onFilePress={openFile}
                  onImagePress={handleImagePress}
                  isCandidateInquiry={conversationType === "CANDIDATE_INQUIRY"}
                />
              ))}
            </View>
          )}
        </ScrollView>

        {!searchOpen && canWrite ? (
          <View className="bg-ku-background">
            <PendingAttachmentsBar
              attachments={pendingAttachments}
              onRemove={handleRemovePendingAttachment}
            />
            <View
              className={cn(
                styles.composerWrap,
                pendingAttachments.length > 0 && "border-t-0 pt-[4px]"
              )}
              style={{ paddingBottom: Math.max(insets.bottom, 8) }}
            >
              <View className={styles.composer}>
                <Pressable
                  accessibilityLabel={messages.addAttachment}
                  accessibilityRole="button"
                  className={styles.composerButton}
                  onPress={openAttachmentMenu}
                >
                  <Paperclip
                    color={colors.primary}
                    size={21}
                    strokeWidth={2.2}
                  />
                </Pressable>
                <TextInput
                  accessibilityLabel={messagePlaceholder}
                  className={styles.composerInput}
                  multiline
                  onChangeText={setDraft}
                  onSubmitEditing={sendMessage}
                  placeholder={messagePlaceholder}
                  placeholderTextColor={colors.textFaint}
                  returnKeyType="send"
                  value={draft}
                />
                <Text
                  accessibilityLiveRegion="polite"
                  className={styles.resultMeta}
                  style={{
                    color:
                      draft.length > MAX_MESSAGE_LENGTH
                        ? colors.danger
                        : colors.textSubtle,
                  }}
                >
                  {draft.length}/{MAX_MESSAGE_LENGTH}
                </Text>
                {draft.trim() ||
                pendingAttachmentIds.length > 0 ||
                pendingAttachments.length > 0 ? (
                  <Pressable
                    accessibilityLabel={messages.send}
                    accessibilityRole="button"
                    className={styles.sendButton}
                    onPress={sendMessage}
                  >
                    <Send color={colors.white} size={19} strokeWidth={2.3} />
                  </Pressable>
                ) : (
                  <Pressable
                    accessibilityLabel={messages.addAttachment}
                    accessibilityRole="button"
                    className={styles.composerButton}
                    onPress={openAttachmentMenu}
                  >
                    <Camera
                      color={colors.textStrong}
                      size={21}
                      strokeWidth={2.1}
                    />
                  </Pressable>
                )}
              </View>
            </View>
          </View>
        ) : null}
      </KeyboardAvoidingView>
      <ImageViewerModal
        visible={viewerState.visible}
        imageUrl={viewerState.url}
        fileName={viewerState.name}
        onClose={() => setViewerState({ visible: false, url: null })}
      />
    </SafeAreaView>
  );
}
