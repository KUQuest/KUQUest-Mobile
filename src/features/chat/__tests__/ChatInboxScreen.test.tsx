import React from "react";
import { act, fireEvent, waitFor } from "@testing-library/react-native";
import { renderWithQueryClient } from "@/testing/queryTestUtils";

import ChatInboxScreen from "../ChatInboxScreen";
import { chatApi } from "@/api/ChatApi";

const mockGetSession = jest.fn();
const mockPush = jest.fn();

jest.mock("expo-router", () => ({
  useFocusEffect: (effect: () => (() => void) | void) =>
    jest.requireActual("react").useEffect(effect, []),
  useRouter: () => ({ push: mockPush }),
}));

jest.mock("@/features/auth/AuthService", () => ({
  authService: {
    getSession: (...args: unknown[]) => mockGetSession(...args),
  },
}));

jest.mock("@/features/preferences/localeStore", () => ({
  useLocale: () => ({ locale: "en" }),
}));

jest.mock("@/features/navigation/navigationUiStore", () => ({
  handleNavigationScroll: jest.fn(),
}));

jest.mock("@/api/ChatApi", () => {
  const actual = jest.requireActual("@/api/ChatApi");
  return {
    ...actual,
    chatApi: {
      listConversations: jest.fn(),
      listCandidateInquiries: jest.fn(),
      listParticipants: jest.fn(),
    },
  };
});

describe("ChatInboxScreen initial loading", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (chatApi.listConversations as jest.Mock).mockResolvedValue({
      items: [
        {
          id: "conversation-1",
          type: "CONVERSATION_WORK",
          quest: {
            id: "quest-1",
            title: "Campus cleanup",
            status: "QUEST_IN_PROGRESS",
          },
          latestMessage: null,
          lastActivityAt: "2026-09-18T10:00:00.000Z",
          archived: false,
          readOnly: false,
          unreadCount: 0,
        },
      ],
      nextCursor: null,
    });
    (chatApi.listCandidateInquiries as jest.Mock).mockResolvedValue({
      items: [],
      nextCursor: null,
    });
    (chatApi.listParticipants as jest.Mock).mockResolvedValue([]);
  });

  it("waits for the authenticated viewer before the first inbox load", async () => {
    const { promise: sessionPromise, resolve: resolveSession } =
      Promise.withResolvers<unknown>();
    mockGetSession.mockReturnValue(sessionPromise);

    const view = await renderWithQueryClient(<ChatInboxScreen />);

    expect(chatApi.listConversations).not.toHaveBeenCalled();
    expect(chatApi.listCandidateInquiries).not.toHaveBeenCalled();

    await act(async () => {
      resolveSession({ user: { id: "worker-1" } });
    });

    await waitFor(() => {
      expect(chatApi.listConversations).toHaveBeenCalledWith(
        { limit: 20 },
        expect.objectContaining({ signal: expect.any(AbortSignal) })
      );
      expect(chatApi.listCandidateInquiries).toHaveBeenCalledWith(
        { limit: 20 },
        expect.objectContaining({ signal: expect.any(AbortSignal) })
      );
      expect(view.getByText("Campus cleanup")).toBeTruthy();
    });
  });

  it("clears a search and restores the conversations", async () => {
    mockGetSession.mockResolvedValue({ user: { id: "worker-1" } });
    const view = await renderWithQueryClient(
      <ChatInboxScreen viewerId="worker-1" />
    );

    await waitFor(() => expect(view.getByText("Campus cleanup")).toBeTruthy());
    fireEvent.changeText(
      view.getByPlaceholderText("Search conversations"),
      "missing quest"
    );
    await waitFor(() => {
      expect(view.queryByText("Campus cleanup")).toBeNull();
      expect(
        view.getByText("No conversations match your search.")
      ).toBeTruthy();
    });

    fireEvent.press(view.getByRole("button", { name: "Clear search" }));
    await waitFor(() => expect(view.getByText("Campus cleanup")).toBeTruthy());
  });
});
