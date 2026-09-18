import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, Linking } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { chatApi, serverConversationToChatConversation } from "@/api/ChatApi";
import type { ServerCandidateInquiry } from "@/api/ChatApi";
import { ApiError } from "@/api/ApiClient";
import {
  fileNameFromUri,
  mimeTypeFromUri,
  type UploadAsset,
} from "@/api/fileUpload";
import { authService } from "@/features/auth/AuthService";
import { liveQuestService } from "@/features/questBoard/liveQuestService";
import { useLocale } from "@/locales/LocaleProvider";
import { chatMessages } from "@/locales/chatMessages";
import type {
  ChatConversation,
  ChatRouteParams,
  LocalizedText,
} from "./chatTypes";
import {
  toDisplayMessage,
  type DisplayChatMessage,
  type PendingAttachmentItem,
  type RenderAttachment,
} from "./ChatConversationPresentation";
import { attachmentLinkCache } from "./attachmentLinkCache";
import { enrichChatConversation } from "./chatProfile";
import { useCalmRefresh } from "@/hooks/useCalmRefresh";
import { useChatSocket, type ChatSocketEvent } from "./useChatSocket";

export type ConversationMode = "WORK" | "CANDIDATE_INQUIRY";
export const MAX_MESSAGE_LENGTH = 1000;
const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;

const TERMINAL_QUEST_STATES: Record<string, true> = {
  QUEST_COMPLETED: true,
  QUEST_CANCELLED: true,
  QUEST_FAILED: true,
};

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
    ...(otherParticipant?.id ? { participantId: otherParticipant.id } : {}),
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
  canPost?: boolean;
};

export function useChatConversationController(
  conversationType: ConversationMode
) {
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
    canPost: false,
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
        const candidate = await enrichChatConversation(
          candidateInquiryToChatConversation(
            { ...inquiry, participants },
            viewerId
          )
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
      const workChat = await enrichChatConversation({
        ...converted,
        ...(otherParticipant?.id ? { participantId: otherParticipant.id } : {}),
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
      });
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
          canPost: false,
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
        const text = message.text ? message.text[locale] : "";
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

  const role = conversation
    ? conversationType === "CANDIDATE_INQUIRY"
      ? locale === "th"
        ? conversation.participantRole === "owner"
          ? "ผู้ว่าจ้าง · Inquiry"
          : "ผู้สนใจทำงาน · Inquiry"
        : conversation.participantRole === "owner"
          ? "Hirer · Inquiry"
          : "Prospective Worker · Inquiry"
      : conversation.participantRole === "owner"
        ? messages.questOwner
        : messages.questMember
    : "";
  const conversationKind =
    conversationType === "CANDIDATE_INQUIRY"
      ? locale === "th"
        ? "Candidate Inquiry"
        : "Candidate Inquiry"
      : locale === "th"
        ? "Work Chat"
        : "Work Chat";
  const canWrite = Boolean(
    conversation?.capability?.canRead &&
    conversation.capability.canWrite &&
    !conversation.capability.readOnly
  );
  const readOnlyDescription =
    conversation?.capability?.readOnlyReason === "TERMINAL"
      ? messages.conversationReadOnlyTerminal
      : messages.conversationNotWritable;
  const canReportConversation = false;
  const handleReportConversation = () => undefined;
  const messagePlaceholder =
    conversation?.participantRole === "owner"
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
  const retryLoad = () => {
    setLoadState({
      key: conversationRouteKey,
      status: "pending",
      conversation: null,
      messages: [],
      canPost: false,
    });
    void refresh(true).catch(() => undefined);
  };

  return {
    router,
    locale,
    messages,
    insets,
    viewerId,
    conversationType,
    conversationPending,
    conversationLoadFailed,
    conversation,
    refreshing,
    refresh,
    retryLoad,
    role,
    conversationKind,
    canWrite,
    readOnlyDescription,
    messagePlaceholder,
    canReportConversation,
    handleReportConversation,
    searchOpen,
    setSearchOpen,
    searchScope,
    setSearchScope,
    searchQuery,
    setSearchQuery,
    searchedMessages,
    files,
    draft,
    setDraft,
    pendingAttachments,
    pendingAttachmentIds,
    handleRemovePendingAttachment,
    openAttachmentMenu,
    sendMessage,
    viewerState,
    setViewerState,
    handleImagePress,
    openFile,
  };
}
