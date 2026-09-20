import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  chatApi,
  serverConversationToChatConversation,
  type ServerCandidateInquiry,
} from "@/api/ChatApi";
import { liveQuestService } from "@/features/questBoard/liveQuestService";
import type { ChatConversation } from "../chatTypes";
import { enrichChatConversation } from "../chatProfile";
import {
  type DisplayChatMessage,
  toDisplayMessage,
} from "../conversationModule";

export type ChatConversationMode = "WORK" | "CANDIDATE_INQUIRY";

export const chatKeys = {
  all: ["chat"] as const,
  conversations: (viewerId: string) =>
    [...chatKeys.all, "conversations", viewerId] as const,
  candidateInquiries: (viewerId: string) =>
    [...chatKeys.all, "candidate-inquiries", viewerId] as const,
  conversation: (
    conversationId: string,
    viewerId: string,
    mode: ChatConversationMode,
    questId?: string
  ) =>
    [
      ...chatKeys.all,
      "conversation",
      mode,
      conversationId,
      viewerId,
      ...(mode === "WORK" ? [questId] : []),
    ] as const,
  participants: (conversationId: string) =>
    [...chatKeys.all, "participants", conversationId] as const,
  candidateParticipants: (conversationId: string) =>
    [...chatKeys.all, "candidate-participants", conversationId] as const,
  messages: (
    conversationId: string,
    viewerId: string,
    mode: ChatConversationMode = "WORK"
  ) => [...chatKeys.all, "messages", mode, conversationId, viewerId] as const,
};

function candidateInquiryToConversation(
  inquiry: ServerCandidateInquiry,
  viewerId: string
): ChatConversation {
  const otherParticipant =
    inquiry.participants.find((participant) => participant.id !== viewerId) ??
    inquiry.participants[0];
  const latestPreview = inquiry.latestMessage?.preview ?? "";
  return {
    id: inquiry.id,
    questId: inquiry.quest.id,
    questTitle: { en: inquiry.quest.title, th: inquiry.quest.title },
    ...(otherParticipant?.id ? { participantId: otherParticipant.id } : {}),
    participantName: otherParticipant?.displayName ?? inquiry.quest.title,
    participantRole: otherParticipant?.role === "HIRER" ? "owner" : "member",
    initials: (otherParticipant?.displayName ?? inquiry.quest.title)
      .slice(0, 2)
      .toUpperCase(),
    avatarColor: "#208AEF",
    latestMessage: { en: latestPreview, th: latestPreview },
    latestAt: inquiry.latestMessage?.createdAt ?? "",
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

export function useListConversationsQuery(viewerId: string, enabled = true) {
  return useQuery<ChatConversation[]>({
    enabled: Boolean(viewerId) && enabled,
    queryKey: chatKeys.conversations(viewerId),
    queryFn: async ({ signal }) => {
      const page = await chatApi.listConversations({ limit: 20 }, { signal });
      return Promise.all(
        page.items.map(async (conversation) => {
          const converted = serverConversationToChatConversation(
            conversation,
            viewerId
          );
          try {
            const participants = await chatApi.listParticipants(
              conversation.id,
              {
                signal,
              }
            );
            const otherParticipant =
              participants.find((participant) => participant.id !== viewerId) ??
              participants[0];
            return enrichChatConversation({
              ...converted,
              ...(otherParticipant?.id
                ? { participantId: otherParticipant.id }
                : {}),
              participantName:
                otherParticipant?.displayName ?? converted.participantName,
              participantRole:
                otherParticipant?.role === "HIRER" ? "owner" : "member",
              initials: (
                otherParticipant?.displayName ?? converted.participantName
              )
                .slice(0, 2)
                .toUpperCase(),
            });
          } catch {
            return converted;
          }
        })
      );
    },
  });
}

export function useListCandidateInquiriesQuery(
  viewerId: string,
  enabled = true
) {
  return useQuery<ChatConversation[]>({
    enabled: Boolean(viewerId) && enabled,
    queryKey: chatKeys.candidateInquiries(viewerId),
    queryFn: async ({ signal }) => {
      const page = await chatApi.listCandidateInquiries(
        { limit: 20 },
        { signal }
      );
      return Promise.all(
        page.items.map((inquiry) =>
          enrichChatConversation(
            candidateInquiryToConversation(inquiry, viewerId)
          )
        )
      );
    },
  });
}

export function useListParticipantsQuery(
  conversationId: string,
  enabled = true
) {
  return useQuery({
    enabled: Boolean(conversationId) && enabled,
    queryKey: chatKeys.participants(conversationId),
    queryFn: ({ signal }) =>
      chatApi.listParticipants(conversationId, { signal }),
  });
}

export function useCandidateInquiryParticipantsQuery(
  conversationId: string,
  enabled = true
) {
  return useQuery({
    enabled: Boolean(conversationId) && enabled,
    queryKey: chatKeys.candidateParticipants(conversationId),
    queryFn: ({ signal }) =>
      liveQuestService.listCandidateInquiryParticipants(conversationId, {
        signal,
      }),
  });
}

export function useMessagesQuery(
  conversationId: string,
  viewerId: string,
  mode: ChatConversationMode,
  enabled = true
) {
  return useQuery({
    enabled: Boolean(conversationId && viewerId) && enabled,
    queryKey: chatKeys.messages(conversationId, viewerId, mode),
    queryFn: async ({ signal }) => {
      const page =
        mode === "CANDIDATE_INQUIRY"
          ? await liveQuestService.getCandidateInquiryMessages(
              conversationId,
              { limit: 50 },
              { signal }
            )
          : await chatApi.getMessages(
              conversationId,
              { limit: 50 },
              { signal }
            );
      return page.items.map((message) => toDisplayMessage(message, viewerId));
    },
  });
}

export function useWorkConversationQuery(
  conversationId: string,
  questId: string | undefined,
  viewerId: string,
  enabled = true
) {
  return useQuery({
    enabled: Boolean(conversationId && viewerId && questId) && enabled,
    queryKey: chatKeys.conversation(conversationId, viewerId, "WORK", questId),
    queryFn: async ({ signal }) => {
      const liveSnapshot = await liveQuestService.getLiveSnapshot(
        questId as string,
        viewerId,
        { signal }
      );
      const workConversation = liveSnapshot.workConversation;
      if (
        !workConversation ||
        workConversation.id !== conversationId ||
        !liveSnapshot.capabilities.canReadWorkChat
      ) {
        return null;
      }
      const participants = await chatApi.listParticipants(conversationId, {
        signal,
      });
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
      const terminal =
        liveSnapshot.state === "QUEST_COMPLETED" ||
        liveSnapshot.state === "QUEST_CANCELLED" ||
        liveSnapshot.state === "QUEST_FAILED";
      return enrichChatConversation({
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
          conversationId,
          canRead: liveSnapshot.capabilities.canReadWorkChat,
          canWrite,
          readOnly: !canWrite,
          ...(terminal ? { readOnlyReason: "TERMINAL" as const } : {}),
        },
      });
    },
  });
}

export function useCandidateConversationQuery(
  conversationId: string,
  viewerId: string,
  enabled = true
) {
  return useQuery({
    enabled: Boolean(conversationId && viewerId) && enabled,
    queryKey: chatKeys.conversation(
      conversationId,
      viewerId,
      "CANDIDATE_INQUIRY",
      undefined
    ),
    queryFn: async ({ signal }) => {
      const [inquiry, participants] = await Promise.all([
        liveQuestService.getCandidateInquiry(conversationId, { signal }),
        liveQuestService.listCandidateInquiryParticipants(conversationId, {
          signal,
        }),
      ]);
      if (
        inquiry.id !== conversationId ||
        inquiry.state !== "INQUIRY_OPEN" ||
        !participants.some((participant) => participant.id === viewerId)
      ) {
        return null;
      }
      return enrichChatConversation(
        candidateInquiryToConversation({ ...inquiry, participants }, viewerId)
      );
    },
  });
}

export interface SendChatMessageVariables {
  conversationId: string;
  mode: ChatConversationMode;
  text: string;
  clientMessageId: string;
  attachmentIds: string[];
  viewerId: string;
  optimisticMessage?: DisplayChatMessage;
}

export function useSendChatMessageMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      conversationId,
      mode,
      text,
      clientMessageId,
      attachmentIds,
    }: SendChatMessageVariables) =>
      mode === "CANDIDATE_INQUIRY"
        ? liveQuestService.sendCandidateInquiryMessage(
            conversationId,
            text,
            clientMessageId,
            attachmentIds
          )
        : chatApi.sendMessage(
            conversationId,
            text,
            clientMessageId,
            attachmentIds
          ),
    onMutate: async (variables) => {
      const queryKey = chatKeys.messages(
        variables.conversationId,
        variables.viewerId,
        variables.mode
      );
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<DisplayChatMessage[]>(queryKey);
      const optimisticMessage = variables.optimisticMessage;
      if (optimisticMessage) {
        queryClient.setQueryData<DisplayChatMessage[]>(queryKey, (current) => [
          ...(current ?? []),
          optimisticMessage,
        ]);
      }
      return { previous, queryKey };
    },
    onSuccess: (sentMessage, variables, context) => {
      const sent = toDisplayMessage(sentMessage, variables.viewerId);
      queryClient.setQueryData<DisplayChatMessage[]>(
        context?.queryKey ??
          chatKeys.messages(
            variables.conversationId,
            variables.viewerId,
            variables.mode
          ),
        (current) =>
          (current ?? []).map((message) =>
            message.id === variables.clientMessageId ? sent : message
          )
      );
    },
    onError: (_error, _variables, context) => {
      if (context?.queryKey) {
        queryClient.setQueryData(context.queryKey, context.previous);
      }
    },
  });
}

export interface UploadChatAttachmentVariables {
  conversationId: string;
  mode: ChatConversationMode;
  asset: Parameters<typeof chatApi.uploadAttachment>[1];
}

export function useUploadChatAttachmentMutation() {
  return useMutation({
    mutationFn: ({
      conversationId,
      mode,
      asset,
    }: UploadChatAttachmentVariables) =>
      mode === "CANDIDATE_INQUIRY"
        ? liveQuestService.uploadCandidateInquiryAttachment(
            conversationId,
            asset
          )
        : chatApi.uploadAttachment(conversationId, asset),
  });
}
