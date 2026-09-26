import React from "react";
import { fireEvent, waitFor } from "@testing-library/react-native";
import { renderWithAppTheme } from "@/testing/queryTestUtils";

import { chatMessages } from "@/locales/chatMessages";
import { attachmentLinkCache } from "../api/attachmentLinkCache";
import { isImageAttachment, MessageBubble } from "../components/MessageBubble";
import type {
  DisplayChatMessage,
  RenderAttachment,
} from "../domain/conversationModule";
import type { ChatConversation } from "../chatTypes";

const conversation: ChatConversation = {
  id: "conversation-1",
  questTitle: { en: "Quest", th: "งาน" },
  participantName: "Alex",
  participantRole: "member",
  initials: "AL",
  avatarColor: "#208AEF",
  latestMessage: { en: "", th: "" },
  latestAt: "",
  unreadCount: 0,
  messages: [],
};

describe("MessageBubble", () => {
  beforeEach(() => {
    attachmentLinkCache.clear();
    jest.restoreAllMocks();
  });

  it("recognizes image media types and supported file extensions", () => {
    expect(isImageAttachment({ mediaType: "image/jpeg" })).toBe(true);
    expect(isImageAttachment({ name: "photo.HEIC" })).toBe(true);
    expect(isImageAttachment({ mediaType: "application/pdf" })).toBe(false);
  });

  it("renders an image attachment and opens it with its message timestamp", async () => {
    jest
      .spyOn(attachmentLinkCache, "getOrFetch")
      .mockResolvedValue("https://cdn.example.test/photo.jpg");
    const image: RenderAttachment = {
      id: "attachment-image",
      name: "photo.jpg",
      meta: "1 MB",
      kind: "image",
      mediaType: "image/jpeg",
    };
    const message: DisplayChatMessage = {
      id: "message-1",
      sender: "me",
      createdAt: "2026-09-15T04:05:00Z",
      attachments: [image],
    };
    const onImagePress = jest.fn();

    const view = await renderWithAppTheme(
      <MessageBubble
        message={message}
        conversation={conversation}
        locale="en"
        messages={chatMessages.en}
        onFilePress={jest.fn()}
        onImagePress={onImagePress}
      />
    );

    await waitFor(() => {
      expect(view.getByTestId("inline-image-attachment-image")).toBeTruthy();
    });
    await fireEvent.press(view.getByTestId("inline-image-attachment-image"));

    expect(onImagePress).toHaveBeenCalledWith(
      "https://cdn.example.test/photo.jpg",
      "photo.jpg",
      "11:05"
    );
  });

  it("triggers onReportMessage on long-press and accessibility action for other's message", async () => {
    const onReportMessage = jest.fn();
    const message: DisplayChatMessage = {
      id: "a1b2c3d4-e5f6-4789-a012-3456789abcde",
      sender: "other",
      text: { en: "Reportable message", th: "ข้อความที่รายงานได้" },
      createdAt: "2026-09-15T04:05:00Z",
      attachments: [],
      kind: "USER",
    };

    const view = await renderWithAppTheme(
      <MessageBubble
        message={message}
        conversation={conversation}
        locale="en"
        messages={chatMessages.en}
        onFilePress={jest.fn()}
        onReportMessage={onReportMessage}
      />
    );

    const bubble = view.getByTestId(
      "chat-message-bubble-a1b2c3d4-e5f6-4789-a012-3456789abcde"
    );
    expect(bubble.props.accessibilityActions).toEqual([
      { name: "report", label: chatMessages.en.reportMessage },
    ]);

    await fireEvent(bubble, "longPress");
    expect(onReportMessage).toHaveBeenCalledTimes(1);
    expect(onReportMessage).toHaveBeenCalledWith(message);

    await fireEvent(bubble, "accessibilityAction", {
      nativeEvent: { actionName: "report" },
    });
    expect(onReportMessage).toHaveBeenCalledTimes(2);
  });

  it("does not allow reporting own message, system message, or pending message", async () => {
    const onReportMessage = jest.fn();
    const ownMessage: DisplayChatMessage = {
      id: "b2c3d4e5-f6a7-4890-b123-456789abcdef",
      sender: "me",
      text: { en: "My message", th: "ข้อความของฉัน" },
      createdAt: "2026-09-15T04:05:00Z",
      attachments: [],
    };

    const view = await renderWithAppTheme(
      <MessageBubble
        message={ownMessage}
        conversation={conversation}
        locale="en"
        messages={chatMessages.en}
        onFilePress={jest.fn()}
        onReportMessage={onReportMessage}
      />
    );

    const ownBubble = view.getByTestId(
      "chat-message-bubble-b2c3d4e5-f6a7-4890-b123-456789abcdef"
    );
    expect(ownBubble.props.accessibilityActions).toBeUndefined();
    await fireEvent(ownBubble, "longPress");
    expect(onReportMessage).not.toHaveBeenCalled();

    const systemMessage: DisplayChatMessage = {
      id: "c3d4e5f6-a7b8-4901-c234-56789abcdef0",
      sender: "other",
      text: { en: "System notice", th: "ประกาศระบบ" },
      createdAt: "2026-09-15T04:05:00Z",
      attachments: [],
      kind: "SYSTEM",
    };

    await view.rerender(
      <MessageBubble
        message={systemMessage}
        conversation={conversation}
        locale="en"
        messages={chatMessages.en}
        onFilePress={jest.fn()}
        onReportMessage={onReportMessage}
      />
    );

    const systemBubble = view.getByTestId(
      "chat-message-bubble-c3d4e5f6-a7b8-4901-c234-56789abcdef0"
    );
    expect(systemBubble.props.accessibilityActions).toBeUndefined();
    await fireEvent(systemBubble, "longPress");
    expect(onReportMessage).not.toHaveBeenCalled();

    const pendingMessage: DisplayChatMessage = {
      id: "temp-98765",
      sender: "other",
      text: { en: "Pending notice", th: "ประกาศรอดำเนินการ" },
      createdAt: "2026-09-15T04:05:00Z",
      attachments: [],
      pending: true,
    };

    await view.rerender(
      <MessageBubble
        message={pendingMessage}
        conversation={conversation}
        locale="en"
        messages={chatMessages.en}
        onFilePress={jest.fn()}
        onReportMessage={onReportMessage}
      />
    );

    const pendingBubble = view.getByTestId("chat-message-bubble-temp-98765");
    expect(pendingBubble.props.accessibilityActions).toBeUndefined();
    await fireEvent(pendingBubble, "longPress");
    expect(onReportMessage).not.toHaveBeenCalled();
  });
});
