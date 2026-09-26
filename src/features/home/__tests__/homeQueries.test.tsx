import { act, renderHook, waitFor } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

import { useHirerHomeQuery } from "../api/homeQueries";
import { myQuestService } from "@/features/myQuests/myQuestService";
import { subscribeToHirerQuestEvents } from "@/features/questBoard/live/questEvents";

jest.mock("@/features/myQuests/myQuestService", () => ({
  myQuestService: {
    listAllMyHirerQuests: jest.fn(),
  },
}));

jest.mock("@/features/questBoard/live/questEvents", () => ({
  subscribeToHirerQuestEvents: jest.fn(),
}));

function wrapper(queryClient: QueryClient) {
  return function TestWrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

describe("useHirerHomeQuery realtime updates", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("subscribes to hirerQuestUpdates and invalidates on quest events", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    let emitUpdate: (() => void) | undefined;
    const stopSubscription = jest.fn();
    jest.mocked(subscribeToHirerQuestEvents).mockImplementation((onUpdated) => {
      emitUpdate = () =>
        onUpdated({
          type: "HIRER_QUEST_UPDATED",
          version: 1,
          questId: "00000000-0000-4000-8000-000000000001",
          changeType: "QUEST_STARTED",
        });
      return stopSubscription;
    });

    jest.mocked(myQuestService.listAllMyHirerQuests).mockResolvedValue([]);
    const { result, unmount } = await renderHook(() => useHirerHomeQuery(), {
      wrapper: wrapper(queryClient),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(subscribeToHirerQuestEvents).toHaveBeenCalledTimes(1);
    expect(myQuestService.listAllMyHirerQuests).toHaveBeenCalledTimes(1);

    await act(async () => {
      emitUpdate?.();
    });

    await waitFor(() => {
      expect(myQuestService.listAllMyHirerQuests).toHaveBeenCalledTimes(2);
    });

    await unmount();
    expect(stopSubscription).toHaveBeenCalledTimes(1);
  });
});
