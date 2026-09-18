import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react-native";

import { chatMessages } from "@/locales/chatMessages";
import { attachmentLinkCache } from "../attachmentLinkCache";
import {
  isImageAttachment,
  MessageBubble,
  type DisplayChatMessage,
  type RenderAttachment,
} from "../MessageBubble";
import type { ChatConversation } from "../chatTypes";

const conversation: ChatConversation = {
  id: "conversation-1",
  questTitle: { en: "Quest", th: "งาน" },
  participantName: "Alex",
  participantRole: "member",
  initials: "AL",
  avatarColor: "#208AEF",
  latestMessage: { en: "", th: "" },
  latestTime: "",
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
      time: "11:05 AM",
      attachments: [image],
    };
    const onImagePress = jest.fn();

    const view = await render(
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
    fireEvent.press(view.getByTestId("inline-image-attachment-image"));

    expect(onImagePress).toHaveBeenCalledWith(
      "https://cdn.example.test/photo.jpg",
      "photo.jpg",
      "11:05 AM"
    );
  });
});
