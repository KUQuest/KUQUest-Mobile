import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, Linking } from "react-native";

import { showErrorAlert } from "@/components/ui/SweetAlert";
import { useQueryClient } from "@tanstack/react-query";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { formatTimeInBangkok } from "@/domain/datetime";

import { chatApi } from "@/api/ChatApi";
import { ApiError } from "@/api/ApiClient";
import {
  fileNameFromUri,
  mimeTypeFromUri,
  type UploadAsset,
} from "@/api/fileUpload";
import { useSessionQuery } from "@/features/auth/sessionQueries";
import { getRouteParam } from "@/utils/navigation";
import { liveQuestService } from "@/features/questBoard/live/liveQuestService";
import { useLocale } from "@/features/preferences/localeStore";
import { chatMessages } from "@/locales/chatMessages";
import type { ChatConversation, ChatRouteParams } from "../chatTypes";
import { isImageAttachment } from "../components/MessageBubble";
import type { PendingAttachmentItem } from "../components/PendingAttachmentsBar";
import {
  mergeDisplayMessages,
  toDisplayMessage,
  type DisplayChatMessage,
  type RenderAttachment,
} from "../domain/conversationModule";
import { attachmentLinkCache } from "../api/attachmentLinkCache";
import {
  chatKeys,
  useCandidateConversationQuery,
  useListConversationsQuery,
  useMessagesQuery,
  useSendChatMessageMutation,
  useUploadChatAttachmentMutation,
  useWorkConversationQuery,
} from "../api/chatQueries";
import {
  ChatSocketEventType,
  useChatSocket,
  type ChatSocketEvent,
} from "../api/useChatSocket";

export type ConversationMode = "WORK" | "CANDIDATE_INQUIRY";
export const MAX_MESSAGE_LENGTH = 1000;
const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;

type ChatRouteSearchParams = Partial<
  Record<keyof ChatRouteParams, string | string[]>
>;

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
      ? getRouteParam(params.id)
      : getRouteParam(params.questId);
  const routeConversationId =
    conversationType === "CANDIDATE_INQUIRY"
      ? getRouteParam(params.conversationId)
      : getRouteParam(params.id);
  const routeViewerId = getRouteParam(params.viewerId);
  const sessionQuery = useSessionQuery();
  const viewerId = routeViewerId || sessionQuery.data?.user.id || "";
  const queryClient = useQueryClient();
  const lastReadMessageIdRef = useRef<string | null>(null);
  const listConversationsQuery = useListConversationsQuery(
    viewerId,
    conversationType === "WORK" && !routeQuestId
  );
  const fallbackQuestId =
    routeQuestId ??
    listConversationsQuery.data?.find(
      (conversation) => conversation.id === routeConversationId
    )?.questId;
  const workConversationQuery = useWorkConversationQuery(
    routeConversationId ?? "",
    fallbackQuestId,
    viewerId,
    conversationType === "WORK"
  );
  const candidateConversationQuery = useCandidateConversationQuery(
    routeConversationId ?? "",
    viewerId,
    conversationType === "CANDIDATE_INQUIRY"
  );
  const messagesQuery = useMessagesQuery(
    routeConversationId ?? "",
    viewerId,
    conversationType,
    Boolean(routeConversationId && viewerId)
  );
  const conversation =
    conversationType === "CANDIDATE_INQUIRY"
      ? (candidateConversationQuery.data ?? null)
      : (workConversationQuery.data ?? null);
  const conversationMessages = useMemo(
    () => messagesQuery.data ?? [],
    [messagesQuery.data]
  );
  const conversationPending =
    Boolean(routeConversationId && viewerId) &&
    (messagesQuery.isPending ||
      (conversationType === "CANDIDATE_INQUIRY"
        ? candidateConversationQuery.isPending
        : Boolean(fallbackQuestId) && workConversationQuery.isPending));
  const conversationLoadFailed =
    Boolean(routeConversationId && viewerId) &&
    (messagesQuery.isError ||
      (conversationType === "CANDIDATE_INQUIRY"
        ? candidateConversationQuery.isError
        : workConversationQuery.isError));
  const refreshing =
    messagesQuery.isRefetching ||
    (conversationType === "CANDIDATE_INQUIRY"
      ? candidateConversationQuery.isRefetching
      : workConversationQuery.isRefetching);
  const refresh = async () => {
    await Promise.all([
      messagesQuery.refetch(),
      conversationType === "CANDIDATE_INQUIRY"
        ? candidateConversationQuery.refetch()
        : workConversationQuery.refetch(),
    ]);
  };
  useEffect(() => {
    if (
      !routeConversationId ||
      !viewerId ||
      !conversation?.capability?.canRead
    ) {
      return;
    }
    const lastMessage = conversationMessages.at(-1);
    if (!lastMessage || lastMessage.id === lastReadMessageIdRef.current) {
      return;
    }

    lastReadMessageIdRef.current = lastMessage.id;
    const markRead =
      conversationType === "CANDIDATE_INQUIRY"
        ? liveQuestService.markCandidateInquiryRead(
            routeConversationId,
            lastMessage.id
          )
        : chatApi.markRead(routeConversationId, lastMessage.id);

    void Promise.resolve(markRead)
      .then(() =>
        Promise.all([
          queryClient.invalidateQueries({
            queryKey:
              conversationType === "CANDIDATE_INQUIRY"
                ? chatKeys.candidateInquiries(viewerId)
                : chatKeys.conversations(viewerId),
          }),
          queryClient.invalidateQueries({
            queryKey: chatKeys.unread(viewerId),
          }),
        ])
      )
      .catch(() => {
        if (lastReadMessageIdRef.current === lastMessage.id) {
          lastReadMessageIdRef.current = null;
        }
      });
  }, [
    conversation,
    conversationMessages,
    conversationType,
    queryClient,
    routeConversationId,
    viewerId,
  ]);
  const handleChatSocketEvent = useCallback(
    (event: ChatSocketEvent) => {
      const eventMessage =
        event.type === ChatSocketEventType.WORK_CONVERSATION_MESSAGE ||
        event.type === ChatSocketEventType.CANDIDATE_INQUIRY_MESSAGE ||
        event.type === ChatSocketEventType.MESSAGE_ACCEPTED
          ? event.message
          : undefined;
      const messageTypeMatches =
        (event.type === ChatSocketEventType.WORK_CONVERSATION_MESSAGE &&
          conversationType === "WORK") ||
        (event.type === ChatSocketEventType.CANDIDATE_INQUIRY_MESSAGE &&
          conversationType === "CANDIDATE_INQUIRY") ||
        event.type === ChatSocketEventType.MESSAGE_ACCEPTED;

      if (
        eventMessage &&
        messageTypeMatches &&
        eventMessage.conversationId === routeConversationId
      ) {
        const queryKey = chatKeys.messages(
          routeConversationId,
          viewerId,
          conversationType
        );
        const incomingMessage = toDisplayMessage(eventMessage, viewerId);
        queryClient.setQueryData<DisplayChatMessage[]>(queryKey, (current) =>
          mergeDisplayMessages(current ?? [], [incomingMessage])
        );
        const conversationKey = chatKeys.conversation(
          routeConversationId,
          viewerId,
          conversationType,
          conversationType === "WORK" ? fallbackQuestId : undefined
        );
        queryClient.setQueryData<ChatConversation | null>(
          conversationKey,
          (current) => {
            if (!current) return current;
            const preview = eventMessage.text ?? "";
            return {
              ...current,
              latestMessage: { en: preview, th: preview },
              latestAt: eventMessage.createdAt,
            };
          }
        );
        void queryClient.invalidateQueries({
          queryKey:
            conversationType === "WORK"
              ? chatKeys.conversations(viewerId)
              : chatKeys.candidateInquiries(viewerId),
        });
        void queryClient.invalidateQueries({
          queryKey: chatKeys.unread(viewerId),
        });
      }
    },
    [
      conversationType,
      fallbackQuestId,
      queryClient,
      routeConversationId,
      viewerId,
    ]
  );
  const chatSocket = useChatSocket({
    conversationId: routeConversationId ?? "",
    conversationType,
    enabled: Boolean(
      routeConversationId &&
      conversation?.capability?.canRead &&
      messagesQuery.isSuccess
    ),
    onEvent: handleChatSocketEvent,
  });
  const refetchMessages = messagesQuery.refetch;
  useEffect(() => {
    if (chatSocket.status !== "connected") return;
    void refetchMessages().catch(() => undefined);
  }, [chatSocket.status, refetchMessages]);
  const sendMessageMutation = useSendChatMessageMutation(chatSocket);
  const uploadAttachmentMutation = useUploadChatAttachmentMutation();
  const [draft, setDraft] = useState("");
  const [pendingAttachmentIds, setPendingAttachmentIds] = useState<string[]>(
    []
  );
  const [viewerState, setViewerState] = useState<{
    visible: boolean;
    url: string | null;
    name?: string;
    timestamp?: string;
  }>({ visible: false, url: null });
  const [pendingAttachments, setPendingAttachments] = useState<
    PendingAttachmentItem[]
  >([]);

  const handleImagePress = (url: string, name?: string, timestamp?: string) => {
    setViewerState({ visible: true, url, name, timestamp });
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
            time: formatTimeInBangkok(message.createdAt),
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
      showErrorAlert(
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
      showErrorAlert(
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
      const uploaded = await uploadAttachmentMutation.mutateAsync({
        conversationId: conversation.id,
        mode: conversationType,
        asset: uploadAsset,
      });
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
            showErrorAlert(
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
            showErrorAlert(
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
            showErrorAlert(
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
      showErrorAlert(messages.send, messageLengthError);
      return;
    }
    if (!value && pendingAttachmentIds.length === 0) return;
    const clientMessageId = `${conversation.id}-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}`;
    const attachmentIds = pendingAttachmentIds;
    const optimisticMessage: DisplayChatMessage = {
      id: clientMessageId,
      sender: "me",
      text: { en: value, th: value },
      createdAt: new Date().toISOString(),
      attachments: [],
    };
    void sendMessageMutation
      .mutateAsync({
        conversationId: conversation.id,
        mode: conversationType,
        text: value,
        clientMessageId,
        attachmentIds,
        viewerId,
        optimisticMessage,
      })
      .then(() => {
        setDraft("");
        setPendingAttachmentIds([]);
        setPendingAttachments([]);
      })
      .catch((error: unknown) => {
        const rateLimited = error instanceof ApiError && error.status === 429;
        showErrorAlert(
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
      if (isImageAttachment(attachment)) {
        const timestamp =
          "time" in attachment && typeof attachment.time === "string"
            ? attachment.time
            : undefined;
        handleImagePress(url, attachment.name, timestamp);
        return;
      }
      await Linking.openURL(url);
    } catch (error) {
      showErrorAlert(
        messages.openFile,
        error instanceof Error ? error.message : messages.loadError
      );
    }
  };
  const retryLoad = () => {
    void refresh().catch(() => undefined);
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
