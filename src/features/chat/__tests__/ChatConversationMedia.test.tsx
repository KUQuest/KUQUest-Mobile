import React from "react";
import type ReactModule from "react";
import { Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { fireEvent, render, waitFor } from "@testing-library/react-native";

import ChatConversationScreen, {
  AttachmentRow,
  InlineImageAttachment,
  MessageBubble,
  PendingAttachmentsBar,
  type DisplayChatMessage,
  type PendingAttachmentItem,
  type RenderAttachment,
} from "../ChatConversationScreen";
import { attachmentLinkCache } from "../attachmentLinkCache";
import { chatApi } from "@/api/ChatApi";
import type {
  ServerChatMessage,
  ServerChatMessagePage,
  ServerChatParticipant,
} from "@/api/ChatApi";
import { liveQuestService } from "@/features/questBoard/liveQuestService";
import type { LiveQuestSnapshot } from "@/features/questBoard/liveQuestService";
import { chatMessages } from "@/locales/chatMessages";
import type { ChatConversation } from "../chatTypes";

const mockBack = jest.fn();
const mockPush = jest.fn();

jest.mock("expo-router", () => {
  const ReactActual = jest.requireActual("react") as typeof ReactModule;
  return {
    useFocusEffect: (effect: () => (() => void) | void) => {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      ReactActual.useEffect(effect, []);
    },
    useLocalSearchParams: () => ({
      id: "conv-media-1",
      questId: "quest-1",
      viewerId: "viewer-1",
    }),
    useRouter: () => ({
      back: mockBack,
      canGoBack: () => true,
      push: mockPush,
    }),
  };
});

jest.mock("@/locales/LocaleProvider", () => ({
  useLocale: () => ({ locale: "en" }),
}));

jest.mock("@/features/auth/AuthService", () => ({
  authService: {
    getSession: () =>
      Promise.resolve({
        user: { id: "viewer-1" },
      }),
  },
}));

jest.mock("@/api/ChatApi", () => {
  const actual = jest.requireActual("@/api/ChatApi") as Record<string, unknown>;
  return {
    ...actual,
    chatApi: {
      listConversations: jest.fn(),
      listParticipants: jest.fn(),
      getMessages: jest.fn(),
      markRead: jest.fn(),
      getAttachmentLink: jest.fn(),
      uploadAttachment: jest.fn(),
      sendMessage: jest.fn(),
    },
  };
});

jest.mock("@/features/questBoard/liveQuestService", () => ({
  liveQuestService: {
    getLiveSnapshot: jest.fn(),
    getCandidateInquiry: jest.fn(),
    listCandidateInquiryParticipants: jest.fn(),
    getCandidateInquiryMessages: jest.fn(),
    markCandidateInquiryRead: jest.fn(),
    getCandidateInquiryAttachmentLink: jest.fn(),
    uploadCandidateInquiryAttachment: jest.fn(),
    sendCandidateInquiryMessage: jest.fn(),
  },
}));

jest.mock("expo-image-picker", () => ({
  launchCameraAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
}));

const mockConversation: ChatConversation = {
  id: "conv-media-1",
  questId: "quest-1",
  questTitle: { en: "Test Quest", th: "เควสต์ทดสอบ" },
  participantName: "Sora",
  participantRole: "member",
  initials: "SO",
  avatarColor: "#059669",
  latestMessage: { en: "Hello", th: "สวัสดี" },
  latestTime: "10:30 AM",
  unreadCount: 0,
  messages: [],
};

describe("ChatConversationMedia", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    attachmentLinkCache.clear();
  });
  describe("InlineImageAttachment", () => {
    it("calls attachmentLinkCache.getOrFetch and renders Image when URL is available", async () => {
      const getOrFetchSpy = jest
        .spyOn(attachmentLinkCache, "getOrFetch")
        .mockResolvedValue("https://cdn.example.com/resolved-image.png");

      const attachment: RenderAttachment = {
        id: "att-image-1",
        name: "sunset.png",
        meta: "1.2 MB",
        kind: "image",
      };

      const view = await render(
        <InlineImageAttachment
          attachment={attachment}
          conversationId="conv-media-1"
          mine={false}
          messages={chatMessages.en}
          onFilePress={jest.fn()}
          onImagePress={jest.fn()}
        />
      );

      await waitFor(() => {
        expect(getOrFetchSpy).toHaveBeenCalledWith(
          "att-image-1",
          expect.any(Function)
        );
        expect(view.getByTestId("inline-image-att-image-1")).toBeTruthy();
      });

      const button = view.getByTestId("inline-image-att-image-1");
      expect(button.props.accessibilityRole).toBe("imagebutton");
      expect(button.props.accessibilityLabel).toBe("Open file: sunset.png");

      // console.log("button children:", JSON.stringify(button.children));
      // console.log("button props:", Object.keys(button.props));
      const json = button.toJSON();
      expect(JSON.stringify(json)).toContain(
        "https://cdn.example.com/resolved-image.png"
      );
    });

    it("uses candidate inquiry service when isCandidateInquiry is true", async () => {
      const spy = jest
        .spyOn(liveQuestService, "getCandidateInquiryAttachmentLink")
        .mockResolvedValue({
          attachmentId: "att-inquiry-1",
          url: "https://cdn.example.com/inquiry-resolved.png",
          expiresAt: "2026-09-17T12:00:00.000Z",
        });

      const attachment: RenderAttachment = {
        id: "att-inquiry-1",
        name: "inquiry-doc.png",
        meta: "500 KB",
        kind: "image",
      };

      const view = await render(
        <InlineImageAttachment
          attachment={attachment}
          conversationId="inquiry-conv-1"
          isCandidateInquiry={true}
          mine={false}
          messages={chatMessages.en}
          onFilePress={jest.fn()}
          onImagePress={jest.fn()}
        />
      );

      await waitFor(() => {
        expect(spy).toHaveBeenCalledWith("inquiry-conv-1", "att-inquiry-1");
        expect(view.getByTestId("inline-image-att-inquiry-1")).toBeTruthy();
      });
    });

    it("triggers onImagePress with resolved URL and name when pressed", async () => {
      jest
        .spyOn(attachmentLinkCache, "getOrFetch")
        .mockResolvedValue("https://cdn.example.com/photo.jpg");

      const attachment: RenderAttachment = {
        id: "att-image-2",
        name: "photo.jpg",
        meta: "850 KB",
        kind: "image",
      };
      const onImagePress = jest.fn();

      const view = await render(
        <InlineImageAttachment
          attachment={attachment}
          conversationId="conv-media-1"
          mine={true}
          messages={chatMessages.en}
          onFilePress={jest.fn()}
          onImagePress={onImagePress}
        />
      );

      await waitFor(() => {
        expect(view.getByTestId("inline-image-att-image-2")).toBeTruthy();
      });

      fireEvent.press(view.getByTestId("inline-image-att-image-2"));
      expect(onImagePress).toHaveBeenCalledWith(
        "https://cdn.example.com/photo.jpg",
        "photo.jpg"
      );
    });

    it("falls back to AttachmentRow while loading or when link fetch fails", async () => {
      jest
        .spyOn(attachmentLinkCache, "getOrFetch")
        .mockRejectedValue(new Error("Network failed"));

      const attachment: RenderAttachment = {
        id: "att-image-fail",
        name: "failed-photo.png",
        meta: "600 KB",
        kind: "image",
      };

      const view = await render(
        <InlineImageAttachment
          attachment={attachment}
          conversationId="conv-media-1"
          mine={false}
          messages={chatMessages.en}
          onFilePress={jest.fn()}
          onImagePress={jest.fn()}
        />
      );

      await waitFor(() => {
        expect(view.getByText("failed-photo.png")).toBeTruthy();
      });

      expect(view.queryByTestId("inline-image-att-image-fail")).toBeNull();
      expect(view.getByText("600 KB")).toBeTruthy();
    });
  });

  describe("MessageBubble with attachments", () => {
    it("renders non-image attachment using AttachmentRow fallback", async () => {
      const pdfAttachment: RenderAttachment = {
        id: "att-pdf-1",
        name: "guide.pdf",
        meta: "3.5 MB",
        kind: "pdf",
      };
      const message: DisplayChatMessage = {
        id: "msg-1",
        sender: "other",
        time: "11:00 AM",
        attachments: [pdfAttachment],
      };
      const onFilePress = jest.fn();

      const view = await render(
        <MessageBubble
          message={message}
          conversation={mockConversation}
          locale="en"
          messages={chatMessages.en}
          onFilePress={onFilePress}
        />
      );

      expect(view.getByText("guide.pdf")).toBeTruthy();
      expect(view.getByText("3.5 MB")).toBeTruthy();
      expect(view.queryByTestId("inline-image-att-pdf-1")).toBeNull();

      fireEvent.press(
        view.getByRole("button", { name: "Open file: guide.pdf" })
      );
      expect(onFilePress).toHaveBeenCalledWith(pdfAttachment);
    });

    it("renders image attachment as InlineImageAttachment", async () => {
      jest
        .spyOn(attachmentLinkCache, "getOrFetch")
        .mockResolvedValue("https://cdn.example.com/bubble-image.png");

      const imgAttachment: RenderAttachment = {
        id: "att-img-bubble",
        name: "bubble-image.png",
        meta: "2 MB",
        kind: "image",
      };
      const message: DisplayChatMessage = {
        id: "msg-2",
        sender: "me",
        time: "11:05 AM",
        attachments: [imgAttachment],
      };

      const view = await render(
        <MessageBubble
          message={message}
          conversation={mockConversation}
          locale="en"
          messages={chatMessages.en}
          onFilePress={jest.fn()}
        />
      );

      await waitFor(() => {
        expect(view.getByTestId("inline-image-att-img-bubble")).toBeTruthy();
      });
    });
  });

  describe("PendingAttachmentsBar", () => {
    it("renders pending attachment chips and removes them via [X] button", async () => {
      const onRemove = jest.fn();
      const items: PendingAttachmentItem[] = [
        {
          id: "pending-1",
          uri: "file:///photos/pic1.jpg",
          name: "pic1.jpg",
          uploading: false,
        },
        {
          id: "pending-2",
          uri: "file:///photos/pic2.jpg",
          name: "pic2.jpg",
          uploading: true,
        },
      ];

      const view = await render(
        <PendingAttachmentsBar attachments={items} onRemove={onRemove} />
      );

      expect(
        view.getByTestId("remove-pending-attachment-pending-1")
      ).toBeTruthy();
      expect(
        view.getByTestId("remove-pending-attachment-pending-2")
      ).toBeTruthy();

      fireEvent.press(view.getByTestId("remove-pending-attachment-pending-1"));
      expect(onRemove).toHaveBeenCalledTimes(1);
      expect(onRemove).toHaveBeenCalledWith("pending-1");
    });

    it("returns null when attachments array is empty", async () => {
      const view = await render(
        <PendingAttachmentsBar attachments={[]} onRemove={jest.fn()} />
      );
      expect(view.toJSON()).toBeNull();
    });
  });

  describe("ChatConversationScreen integration", () => {
    it("tapping inline image opens ImageViewerModal and can be closed", async () => {
      jest
        .spyOn(attachmentLinkCache, "getOrFetch")
        .mockResolvedValue("https://cdn.example.com/fullscreen-photo.jpg");

      const mockedGetLiveSnapshot =
        liveQuestService.getLiveSnapshot as jest.MockedFunction<
          typeof liveQuestService.getLiveSnapshot
        >;
      const mockedListParticipants =
        chatApi.listParticipants as jest.MockedFunction<
          typeof chatApi.listParticipants
        >;
      const mockedGetMessages = chatApi.getMessages as jest.MockedFunction<
        typeof chatApi.getMessages
      >;

      // Mock liveSnapshot response with strict domain contract
      mockedGetLiveSnapshot.mockResolvedValue({
        workConversation: {
          id: "conv-media-1",
          type: "CONVERSATION_WORK",
          quest: {
            id: "quest-1",
            title: "Test Quest",
            status: "QUEST_IN_PROGRESS",
          },
          latestMessage: null,
          lastActivityAt: new Date().toISOString(),
          archived: false,
          readOnly: false,
          unreadCount: 0,
        },
        capabilities: {
          canReadWorkChat: true,
          canWriteWorkChat: true,
        },
      } as unknown as LiveQuestSnapshot);

      mockedListParticipants.mockResolvedValue([
        {
          userId: "other-user",
          role: "QUEST_MEMBER",
          joinedAt: new Date().toISOString(),
        } as unknown as ServerChatParticipant,
      ]);

      const testServerMessage: ServerChatMessage = {
        id: "srv-msg-1",
        conversationId: "conv-media-1",
        sequence: 1,
        kind: "USER",
        sender: {
          id: "other-user",
          displayName: "Sora",
        },
        text: "Here is the picture",
        attachments: [
          {
            id: "att-screen-img",
            fileName: "fullscreen-photo.jpg",
            mediaType: "image/jpeg",
            sizeBytes: 1024 * 1024,
            createdAt: new Date().toISOString(),
          },
        ],
        createdAt: new Date().toISOString(),
      };

      mockedGetMessages.mockResolvedValue({
        items: [testServerMessage],
        nextCursor: null,
        hasMore: false,
      } as unknown as ServerChatMessagePage);

      const view = await render(<ChatConversationScreen />);

      await waitFor(() => {
        expect(view.getByTestId("inline-image-att-screen-img")).toBeTruthy();
      });

      // Tapping inline image should open the ImageViewerModal
      fireEvent.press(view.getByTestId("inline-image-att-screen-img"));

      await waitFor(() => {
        expect(view.getByTestId("image-viewer-image")).toBeTruthy();
      });

      const modalImage = view.getByTestId("image-viewer-image");
      expect(modalImage.props.source).toEqual({
        uri: "https://cdn.example.com/fullscreen-photo.jpg",
      });

      // Close the modal
      fireEvent.press(view.getByTestId("image-viewer-close-button"));

      await waitFor(() => {
        expect(view.queryByTestId("image-viewer-image")).toBeNull();
      });
    });

    it("handles picking an attachment and allows removing it from composer", async () => {
      const alertSpy = jest.spyOn(Alert, "alert");

      const mockedGetLiveSnapshot =
        liveQuestService.getLiveSnapshot as jest.MockedFunction<
          typeof liveQuestService.getLiveSnapshot
        >;
      const mockedListParticipants =
        chatApi.listParticipants as jest.MockedFunction<
          typeof chatApi.listParticipants
        >;
      const mockedGetMessages = chatApi.getMessages as jest.MockedFunction<
        typeof chatApi.getMessages
      >;
      const mockedUploadAttachment =
        chatApi.uploadAttachment as jest.MockedFunction<
          typeof chatApi.uploadAttachment
        >;
      const mockedLaunchLibrary =
        ImagePicker.launchImageLibraryAsync as jest.MockedFunction<
          typeof ImagePicker.launchImageLibraryAsync
        >;

      mockedGetLiveSnapshot.mockResolvedValue({
        workConversation: {
          id: "conv-media-1",
          type: "CONVERSATION_WORK",
          quest: {
            id: "quest-1",
            title: "Test Quest",
            status: "QUEST_IN_PROGRESS",
          },
          latestMessage: null,
          lastActivityAt: new Date().toISOString(),
          archived: false,
          readOnly: false,
          unreadCount: 0,
        },
        capabilities: {
          canReadWorkChat: true,
          canWriteWorkChat: true,
        },
      } as unknown as LiveQuestSnapshot);

      mockedListParticipants.mockResolvedValue([
        {
          userId: "other-user",
          role: "QUEST_MEMBER",
          joinedAt: new Date().toISOString(),
        } as unknown as ServerChatParticipant,
      ]);

      mockedGetMessages.mockResolvedValue({
        items: [],
        nextCursor: null,
        hasMore: false,
      } as unknown as ServerChatMessagePage);

      mockedLaunchLibrary.mockResolvedValue({
        canceled: false,
        assets: [
          {
            uri: "file:///local/picked-image.jpg",
            fileName: "picked-image.jpg",
            mimeType: "image/jpeg",
            fileSize: 50000,
          } as unknown as ImagePicker.ImagePickerAsset,
        ],
      });
      mockedUploadAttachment.mockResolvedValue({
        id: "uploaded-asset-123",
        fileName: "picked-image.jpg",
        mediaType: "image/jpeg",
        sizeBytes: 50000,
        createdAt: new Date().toISOString(),
      });

      const view = await render(<ChatConversationScreen />);

      await waitFor(() => {
        expect(view.getAllByLabelText("Add attachment")[0]).toBeTruthy();
      });

      // Press add attachment button to trigger menu
      fireEvent.press(view.getAllByLabelText("Add attachment")[0]);
      expect(alertSpy).toHaveBeenCalledWith(
        chatMessages.en.addAttachment,
        undefined,
        expect.any(Array)
      );

      // Find the "Choose from Library" option in the alert buttons
      const alertCall = alertSpy.mock.calls[alertSpy.mock.calls.length - 1];
      const alertButtons = alertCall[2] as Array<{
        text?: string;
        onPress?: () => void;
      }>;
      const choosePhotoButton = alertButtons.find(
        (b) => b.text === chatMessages.en.choosePhoto
      );
      expect(choosePhotoButton).toBeTruthy();

      // Trigger the photo selection
      choosePhotoButton?.onPress?.();

      // Should show the pending attachment chip with real ID after upload
      await waitFor(() => {
        expect(
          view.getByTestId("remove-pending-attachment-uploaded-asset-123")
        ).toBeTruthy();
      });

      // Remove the pending attachment
      fireEvent.press(
        view.getByTestId("remove-pending-attachment-uploaded-asset-123")
      );

      await waitFor(() => {
        expect(
          view.queryByTestId("remove-pending-attachment-uploaded-asset-123")
        ).toBeNull();
      });
    });
  });
});
