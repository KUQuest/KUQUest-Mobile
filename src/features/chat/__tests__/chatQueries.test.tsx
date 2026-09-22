import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react-native";

import { chatApi } from "@/api/ChatApi";
import { useHasUnreadChatQuery } from "../api/chatQueries";

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return function QueryWrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

describe("useHasUnreadChatQuery", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("aggregates unread Work Conversations and Candidate Inquiries", async () => {
    const listConversations = jest
      .spyOn(chatApi, "listConversations")
      .mockResolvedValue({
        items: [{ unreadCount: 0 }],
        nextCursor: null,
      } as never);
    const listCandidateInquiries = jest
      .spyOn(chatApi, "listCandidateInquiries")
      .mockResolvedValue({
        items: [{ unreadCount: 1 }],
        nextCursor: null,
      } as never);

    const { result } = await renderHook(
      () => useHasUnreadChatQuery("viewer-1"),
      { wrapper: createWrapper() }
    );

    await waitFor(() => expect(result.current.data).toBe(true));
    expect(listConversations).toHaveBeenCalledTimes(1);
    expect(listCandidateInquiries).toHaveBeenCalledTimes(1);
  });

  it("returns false when both inbox sections have no unread activity", async () => {
    jest.spyOn(chatApi, "listConversations").mockResolvedValue({
      items: [{ unreadCount: 0 }],
      nextCursor: null,
    } as never);
    jest.spyOn(chatApi, "listCandidateInquiries").mockResolvedValue({
      items: [{ unreadCount: 0 }],
      nextCursor: null,
    } as never);

    const { result } = await renderHook(
      () => useHasUnreadChatQuery("viewer-1"),
      { wrapper: createWrapper() }
    );

    await waitFor(() => expect(result.current.data).toBe(false));
  });
});
