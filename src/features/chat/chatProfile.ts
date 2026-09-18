import { authService } from "@/features/auth/AuthService";
import type { ChatConversation } from "./chatTypes";

export interface ChatParticipantProfile {
  id: string;
  avatarUrl?: string;
  avatarFileId?: string;
}

const profileCache = new Map<string, ChatParticipantProfile>();
const profileRequests = new Map<
  string,
  Promise<ChatParticipantProfile | null>
>();

export async function getChatParticipantProfile(
  participantId: string | null | undefined
): Promise<ChatParticipantProfile | null> {
  if (!participantId) return null;
  const cached = profileCache.get(participantId);
  if (cached) return cached;
  const inFlight = profileRequests.get(participantId);
  if (inFlight) return inFlight;

  const request = (async () => {
    try {
      const api = await authService.getStudentApi();
      const profile = await api.getPublicProfile(participantId);
      const result: ChatParticipantProfile = {
        id: participantId,
        ...(profile.avatar?.url ? { avatarUrl: profile.avatar.url } : {}),
        ...(profile.avatar?.fileId
          ? { avatarFileId: profile.avatar.fileId }
          : {}),
      };
      profileCache.set(participantId, result);
      return result;
    } catch {
      return null;
    } finally {
      profileRequests.delete(participantId);
    }
  })();

  profileRequests.set(participantId, request);
  return request;
}

export async function enrichChatConversation(
  conversation: ChatConversation
): Promise<ChatConversation> {
  const profile = await getChatParticipantProfile(conversation.participantId);
  if (!profile) return conversation;
  return {
    ...conversation,
    ...(profile.avatarUrl ? { participantAvatarUrl: profile.avatarUrl } : {}),
    ...(profile.avatarFileId
      ? { participantAvatarFileId: profile.avatarFileId }
      : {}),
  };
}

export function clearChatParticipantProfileCache(): void {
  profileCache.clear();
  profileRequests.clear();
}
