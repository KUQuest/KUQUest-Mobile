import React from "react";
import { act, renderHook } from "@testing-library/react-native";
import {
  QueryClient,
  QueryClientProvider,
  type QueryKey,
} from "@tanstack/react-query";

import { chatKeys } from "@/features/chat/api/chatQueries";
import { homeKeys } from "@/features/home/api/homeQueries";
import { myQuestsKeys } from "@/features/myQuests/api/myQuestsQueries";
import { workerHomeKeys } from "@/features/workerHome/api/workerHomeQueries";
import { liveQuestService } from "../../live/liveQuestService";
import {
  questBoardKeys,
  useApplyQuestMutation,
  useCancelQuestMutation,
} from "../questBoardQueries";

jest.mock("../../live/liveQuestService", () => ({
  liveQuestService: {
    applyQuest: jest.fn(),
    cancelQuest: jest.fn(),
  },
}));

describe("quest board query ownership", () => {
  const wrapper = (queryClient: QueryClient) =>
    function QueryWrapper({ children }: { children: React.ReactNode }) {
      return (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );
    };

  it("invalidates Hirer projections and every live snapshot edit variant", async () => {
    const queryClient = new QueryClient();
    const viewerId = "viewer-1";
    const questId = "quest-1";
    const hirerKeys: QueryKey[] = [
      questBoardKeys.detail(questId),
      questBoardKeys.board(),
      questBoardKeys.liveSnapshot(questId, viewerId),
      questBoardKeys.liveSnapshot(questId, viewerId, "edit-1"),
      homeKeys.hirer(),
      myQuestsKeys.hirer(),
    ];
    const workerKeys: QueryKey[] = [
      workerHomeKeys.assignments("active"),
      workerHomeKeys.assignments("all"),
      workerHomeKeys.participationDetail(questId),
      workerHomeKeys.liveSnapshot(questId, viewerId),
      myQuestsKeys.worker(viewerId),
    ];
    const chatKey = chatKeys.conversations(viewerId);

    for (const key of [...hirerKeys, ...workerKeys, chatKey]) {
      queryClient.setQueryData(key, { cached: true });
    }

    jest.mocked(liveQuestService.cancelQuest).mockResolvedValue({} as never);
    const { result } = await renderHook(() => useCancelQuestMutation(), {
      wrapper: wrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync({ questId, viewerId });
    });

    for (const key of hirerKeys) {
      expect(queryClient.getQueryState(key)?.isInvalidated).toBe(true);
    }
    for (const key of workerKeys) {
      expect(queryClient.getQueryState(key)?.isInvalidated).not.toBe(true);
    }
    expect(queryClient.getQueryState(chatKey)?.isInvalidated).not.toBe(true);
    expect(liveQuestService.cancelQuest).toHaveBeenCalledWith(
      questId,
      undefined
    );
    queryClient.clear();
  });

  it("invalidates Worker projections for worker-owned mutations", async () => {
    const queryClient = new QueryClient();
    const viewerId = "viewer-1";
    const questId = "quest-1";
    const workerKeys: QueryKey[] = [
      questBoardKeys.detail(questId),
      questBoardKeys.board(),
      questBoardKeys.liveSnapshot(questId, viewerId),
      workerHomeKeys.assignments("active"),
      workerHomeKeys.assignments("all"),
      workerHomeKeys.participationDetail(questId),
      workerHomeKeys.liveSnapshot(questId, viewerId),
      myQuestsKeys.worker(viewerId),
    ];
    const hirerKeys: QueryKey[] = [homeKeys.hirer(), myQuestsKeys.hirer()];
    for (const key of [...workerKeys, ...hirerKeys]) {
      queryClient.setQueryData(key, { cached: true });
    }

    jest.mocked(liveQuestService.applyQuest).mockResolvedValue({} as never);
    const { result } = await renderHook(() => useApplyQuestMutation(), {
      wrapper: wrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync({ questId, viewerId });
    });

    for (const key of workerKeys) {
      expect(queryClient.getQueryState(key)?.isInvalidated).toBe(true);
    }
    for (const key of hirerKeys) {
      expect(queryClient.getQueryState(key)?.isInvalidated).not.toBe(true);
    }
    queryClient.clear();
  });
});
