import {
  enrichChatConversation,
  clearChatParticipantProfileCache,
} from "../api/chatProfile";
import { authService } from "@/features/auth/AuthService";
import type { ChatConversation } from "../chatTypes";

jest.mock("@/features/auth/AuthService", () => ({
  authService: {
    getStudentApi: jest.fn(),
  },
}));

const conversation: ChatConversation = {
  id: "conversation-1",
  questId: "quest-1",
  questTitle: { en: "Quest", th: "เควสต์" },
  participantId: "participant-1",
  participantName: "Sora",
  participantRole: "member",
  initials: "SO",
  avatarColor: "#059669",
  latestMessage: { en: "Hello", th: "สวัสดี" },
  latestAt: "2026-09-15T03:30:00Z",
  unreadCount: 0,
  messages: [],
};

describe("chat participant profile enrichment", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearChatParticipantProfileCache();
  });

  it("loads the participant public avatar and preserves the chat identity", async () => {
    const getPublicProfile = jest.fn().mockResolvedValue({
      firstName: "Sora",
      lastName: "Student",
      avatar: {
        fileId: "avatar-1",
        url: "https://example.test/sora.png",
      },
    });
    (authService.getStudentApi as jest.Mock).mockResolvedValue({
      getPublicProfile,
    });

    const enriched = await enrichChatConversation(conversation);

    expect(enriched).toMatchObject({
      participantId: "participant-1",
      participantName: "Sora",
      participantAvatarUrl: "https://example.test/sora.png",
      participantAvatarFileId: "avatar-1",
    });
    expect(getPublicProfile).toHaveBeenCalledWith("participant-1");
  });
});
