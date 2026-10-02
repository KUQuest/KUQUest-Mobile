import React from "react";
import { Alert } from "react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react-native";
import { File } from "expo-file-system";

import { ApiError } from "@/api/ApiClient";
import { useSessionQuery } from "@/features/auth/sessionQueries";
import { useLocale } from "@/features/preferences/localeStore";
import { subscribeToQuestEvents } from "@/features/questBoard/live/questEvents";
import { showErrorAlert } from "@/components/ui/SweetAlert";
import {
  useSendChatMessageMutation,
  useUploadChatAttachmentMutation,
  useWorkConversationQuery,
} from "../api/chatQueries";
import { useChatConversationController } from "../workflow/useChatConversationController";

jest.mock("expo-router", () => ({
  useLocalSearchParams: () => ({
    id: "conversation-1",
    questId: "quest-1",
    viewerId: "viewer-1",
  }),
  useRouter: () => ({ back: jest.fn(), push: jest.fn(), replace: jest.fn() }),
}));
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));
jest.mock("@/features/auth/sessionQueries", () => ({
  useSessionQuery: jest.fn(),
}));
jest.mock("@/features/preferences/localeStore", () => ({
  useLocale: jest.fn(),
}));
jest.mock("@/features/questBoard/live/questEvents", () => ({
  subscribeToQuestEvents: jest.fn(),
}));
jest.mock("@/features/questBoard/live/liveQuestService", () => ({
  liveQuestService: {
    markCandidateInquiryRead: jest.fn(),
    getCandidateInquiryAttachmentLink: jest.fn(),
  },
}));
jest.mock("@/api/ChatApi", () => ({
  chatApi: {
    markRead: jest.fn(),
    getAttachmentLink: jest.fn(),
    uploadAttachment: jest.fn(),
  },
}));
jest.mock("expo-image-picker", () => ({
  launchCameraAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
}));
jest.mock("expo-file-system", () => ({
  File: Object.assign(jest.fn(), { pickFileAsync: jest.fn() }),
}));
jest.mock("@/components/ui/SweetAlert", () => ({
  showErrorAlert: jest.fn(),
}));
jest.mock("../api/useChatSocket", () => ({
  useChatSocket: () => ({ status: "disconnected" }),
}));
jest.mock("../api/chatQueries", () => ({
  ...jest.requireActual("../api/chatQueries"),
  useListConversationsQuery: () => ({ data: [] }),
  useCandidateConversationQuery: () => ({
    data: null,
    error: null,
    isPending: false,
    isError: false,
    isRefetching: false,
    refetch: jest.fn(),
  }),
  useMessagesQuery: () => ({
    data: [],
    error: null,
    isSuccess: true,
    isPending: false,
    isError: false,
    isRefetching: false,
    refetch: jest.fn(),
  }),
  useWorkConversationQuery: jest.fn(),
  useSendChatMessageMutation: jest.fn(),
  useUploadChatAttachmentMutation: jest.fn(),
}));

const mockedSession = useSessionQuery as jest.MockedFunction<
  typeof useSessionQuery
>;
const mockedLocale = useLocale as jest.MockedFunction<typeof useLocale>;
const mockedSubscribe = subscribeToQuestEvents as jest.MockedFunction<
  typeof subscribeToQuestEvents
>;
const mockedWorkQuery = useWorkConversationQuery as jest.MockedFunction<
  typeof useWorkConversationQuery
>;
const mockedSendMutation = useSendChatMessageMutation as jest.MockedFunction<
  typeof useSendChatMessageMutation
>;
const mockedUploadMutation =
  useUploadChatAttachmentMutation as jest.MockedFunction<
    typeof useUploadChatAttachmentMutation
  >;

const workConversation = {
  id: "conversation-1",
  questId: "quest-1",
  questTitle: { en: "Campus cleanup", th: "ทำความสะอาดวิทยาเขต" },
  participantName: "Sora Student",
  participantRole: "owner" as const,
  initials: "SS",
  avatarColor: "#208AEF",
  latestMessage: { en: "Hello", th: "สวัสดี" },
  latestAt: "2026-09-24T03:30:00Z",
  unreadCount: 0,
  messages: [],
  capability: {
    conversationId: "conversation-1",
    canRead: true,
    canWrite: true,
    readOnly: false,
  },
};

async function setup(
  send: jest.Mock = jest.fn().mockResolvedValue(undefined),
  upload: jest.Mock = jest.fn()
) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  mockedSession.mockReturnValue({
    data: { user: { id: "viewer-1" } },
  } as never);
  mockedLocale.mockReturnValue({ locale: "en" } as never);
  mockedSubscribe.mockReturnValue(jest.fn());
  mockedWorkQuery.mockReturnValue({
    data: workConversation,
    error: null,
    isPending: false,
    isError: false,
    isRefetching: false,
    refetch: jest.fn(),
  } as never);
  mockedSendMutation.mockReturnValue({ mutateAsync: send } as never);
  mockedUploadMutation.mockReturnValue({ mutateAsync: upload } as never);
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  const hook = await renderHook(() => useChatConversationController("WORK"), {
    wrapper,
  });
  await act(async () => {
    await Promise.resolve();
  });
  return { ...hook, queryClient };
}

describe("useChatConversationController", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, "alert").mockImplementation(() => undefined);
  });

  it("refetches the Work conversation when its Quest emits an event", async () => {
    const { queryClient } = await setup();
    const key = [
      "chat",
      "conversation",
      "WORK",
      "conversation-1",
      "viewer-1",
      "quest-1",
    ];
    queryClient.setQueryData(key, { marker: "existing" });
    await waitFor(() =>
      expect(mockedSubscribe).toHaveBeenCalledWith(
        "quest-1",
        expect.any(Function)
      )
    );

    await act(async () => {
      mockedSubscribe.mock.calls[0][1]({
        changeType: "QUEST_UPDATED",
      } as never);
    });

    expect(queryClient.getQueryState(key)?.isInvalidated).toBe(true);
  });

  it("reuses the clientMessageId when the same draft is resent after a failed send", async () => {
    const send = jest
      .fn()
      .mockRejectedValueOnce(new Error("network"))
      .mockResolvedValueOnce(undefined);
    const { result } = await setup(send);
    await act(async () => result.current.setDraft("same draft"));
    await act(async () => {
      result.current.sendMessage();
    });
    await waitFor(() => expect(showErrorAlert).toHaveBeenCalledTimes(1));
    await act(async () => {
      result.current.sendMessage();
    });
    await waitFor(() => expect(send).toHaveBeenCalledTimes(2));
    expect(send.mock.calls[1][0].clientMessageId).toBe(
      send.mock.calls[0][0].clientMessageId
    );
  });

  it("rotates the clientMessageId after the draft text changes", async () => {
    const send = jest
      .fn()
      .mockRejectedValueOnce(new Error("network"))
      .mockRejectedValueOnce(new Error("network"));
    const { result } = await setup(send);
    await act(async () => result.current.setDraft("first"));
    await act(async () => {
      result.current.sendMessage();
    });
    await waitFor(() => expect(showErrorAlert).toHaveBeenCalledTimes(1));
    await act(async () => result.current.setDraft("changed"));
    await act(async () => {
      result.current.sendMessage();
    });
    await waitFor(() => expect(send).toHaveBeenCalledTimes(2));
    expect(send.mock.calls[1][0].clientMessageId).not.toBe(
      send.mock.calls[0][0].clientMessageId
    );
  });

  it("shows server-provided wait for a 429 while keeping attachment retryable", async () => {
    const send = jest.fn().mockResolvedValue(undefined);
    const rateLimitError = Object.assign(
      new ApiError(429, "RATE_LIMITED", "slow down"),
      { retryAfterMs: 65_000 }
    );
    const upload = jest
      .fn()
      .mockRejectedValueOnce(rateLimitError)
      .mockResolvedValueOnce({
        id: "asset-1",
        fileName: "photo.jpg",
        mediaType: "image/jpeg",
        sizeBytes: 100,
        createdAt: "2026-10-01T00:00:00Z",
      });
    const { result } = await setup(send, upload);
    (File.pickFileAsync as jest.Mock).mockResolvedValue({
      canceled: false,
      result: {
        uri: "file:///photo.jpg",
        name: "photo.jpg",
        type: "image/jpeg",
        size: 100,
      },
    });
    await act(async () => result.current.setDraft("hello"));
    await act(async () => result.current.openAttachmentMenu());
    const options = (Alert.alert as jest.Mock).mock.calls.at(-1)?.[2] as {
      text: string;
      onPress: () => void;
    }[];
    await act(async () =>
      options.find((option) => option.text === "Choose file")?.onPress()
    );
    await waitFor(() =>
      expect(result.current.pendingAttachments[0]).toMatchObject({
        rateLimited: true,
        type: "image/jpeg",
      })
    );
    await act(async () => {
      result.current.sendMessage();
    });
    expect(send).not.toHaveBeenCalled();

    expect(showErrorAlert).toHaveBeenCalledWith(
      expect.any(String),
      "Too many uploads right now. Try again in 65 seconds."
    );

    await act(async () =>
      result.current.retryAttachment(result.current.pendingAttachments[0].id)
    );
    await waitFor(() =>
      expect(result.current.pendingAttachmentIds).toEqual(["asset-1"])
    );
    await act(async () => {
      result.current.sendMessage();
    });
    await waitFor(() => expect(send).toHaveBeenCalledTimes(1));
    expect(send.mock.calls[0][0].attachmentIds).toEqual(["asset-1"]);
    expect(upload).toHaveBeenCalledTimes(2);
  });

  it("keeps generic 429 messaging when server provides no retry duration", async () => {
    const upload = jest
      .fn()
      .mockRejectedValueOnce(new ApiError(429, "RATE_LIMITED", "slow down"));
    const { result } = await setup(undefined, upload);
    (File.pickFileAsync as jest.Mock).mockResolvedValue({
      canceled: false,
      result: {
        uri: "file:///photo.jpg",
        name: "photo.jpg",
        type: "image/jpeg",
        size: 100,
      },
    });
    await act(async () => result.current.openAttachmentMenu());
    const options = (Alert.alert as jest.Mock).mock.calls.at(-1)?.[2] as {
      text: string;
      onPress: () => void;
    }[];
    await act(async () =>
      options.find((option) => option.text === "Choose file")?.onPress()
    );
    await waitFor(() =>
      expect(showErrorAlert).toHaveBeenCalledWith(
        expect.any(String),
        "Too many uploads right now. Wait a moment, then retry."
      )
    );
  });

  it("does not attach a file the user removed while it was still uploading", async () => {
    const uploadGate = Promise.withResolvers<unknown>();
    const upload = jest.fn().mockReturnValue(uploadGate.promise);
    const { result } = await setup(undefined, upload);
    (File.pickFileAsync as jest.Mock).mockResolvedValue({
      canceled: false,
      result: {
        uri: "file:///photo.jpg",
        name: "photo.jpg",
        type: "image/jpeg",
        size: 100,
      },
    });
    await act(async () => result.current.openAttachmentMenu());
    const options = (Alert.alert as jest.Mock).mock.calls.at(-1)?.[2] as {
      text: string;
      onPress: () => void;
    }[];
    await act(async () =>
      options.find((option) => option.text === "Choose file")?.onPress()
    );
    await waitFor(() =>
      expect(result.current.pendingAttachments[0]).toMatchObject({
        uploading: true,
      })
    );

    await act(async () =>
      result.current.handleRemovePendingAttachment(
        result.current.pendingAttachments[0].id
      )
    );
    await act(async () => {
      uploadGate.resolve({
        id: "asset-1",
        fileName: "photo.jpg",
        mediaType: "image/jpeg",
        sizeBytes: 100,
        createdAt: "2026-10-01T00:00:00Z",
      });
    });

    expect(result.current.pendingAttachments).toEqual([]);
    expect(result.current.pendingAttachmentIds).toEqual([]);
  });
});
