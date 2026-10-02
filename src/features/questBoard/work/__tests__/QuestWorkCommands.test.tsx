import React from "react";
import { act, renderHook } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import {
  QuestEditRequestStatus,
  QuestEditResponseDecision,
  QuestStatus,
} from "../../domain/types";
import { liveQuestService } from "../../live/liveQuestService";
import { workerHomeKeys } from "@/features/workerHome/api/workerHomeKeys";
import { walletKeys } from "@/features/wallet/api/walletQueries";
import {
  useConfirmCompletionMutation,
  useRespondToEditMutation,
  useStartWorkMutation,
} from "../../api/questBoardQueries";

jest.mock("../../live/liveQuestService", () => ({
  liveQuestService: {
    startWork: jest.fn(),
    respondToEditRequest: jest.fn(),
    confirmCompletion: jest.fn(),
  },
}));

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      mutations: { retry: false },
      queries: { retry: false },
    },
  });
}

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

describe("Work Hub command mutations", () => {
  beforeEach(() => jest.clearAllMocks());

  it("Start Work refreshes the active assignment and participation detail", async () => {
    const queryClient = createQueryClient();
    const assignmentsKey = workerHomeKeys.assignments("active");
    const detailKey = workerHomeKeys.participationDetail("quest-1");
    queryClient.setQueryData(assignmentsKey, []);
    queryClient.setQueryData(detailKey, { state: QuestStatus.QUEST_ASSIGNED });
    jest.mocked(liveQuestService.startWork).mockResolvedValue({} as never);
    const { result } = await renderHook(() => useStartWorkMutation(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync({
        questId: "quest-1",
        viewerId: "worker-1",
        idempotencyKey: "start-key",
      });
    });

    expect(queryClient.getQueryState(assignmentsKey)?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(detailKey)?.isInvalidated).toBe(true);
    queryClient.clear();
  });

  it("responding to an edit refreshes Work Hub projections", async () => {
    const queryClient = createQueryClient();
    const snapshotKey = workerHomeKeys.liveSnapshot("quest-1", "worker-1");
    queryClient.setQueryData(snapshotKey, {
      editRequest: { status: QuestEditRequestStatus.EDIT_REQUEST_PENDING },
    });
    jest
      .mocked(liveQuestService.respondToEditRequest)
      .mockResolvedValue({} as never);
    const { result } = await renderHook(() => useRespondToEditMutation(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync({
        questId: "quest-1",
        viewerId: "worker-1",
        requestId: "edit-1",
        decision: QuestEditResponseDecision.EDIT_RESPONSE_ACCEPTED,
      });
    });

    expect(queryClient.getQueryState(snapshotKey)?.isInvalidated).toBe(true);
    queryClient.clear();
  });

  it("completion refreshes Worker projections and wallet balances", async () => {
    const queryClient = createQueryClient();
    const walletKey = walletKeys.detail();
    const participationKey = workerHomeKeys.participationDetail("quest-1");
    queryClient.setQueryData(walletKey, { balance: 100 });
    queryClient.setQueryData(participationKey, {
      state: QuestStatus.QUEST_IN_PROGRESS,
    });
    jest
      .mocked(liveQuestService.confirmCompletion)
      .mockResolvedValue({} as never);
    const { result } = await renderHook(() => useConfirmCompletionMutation(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync({
        questId: "quest-1",
        viewerId: "worker-1",
      });
    });

    expect(queryClient.getQueryState(participationKey)?.isInvalidated).toBe(
      true
    );
    expect(queryClient.getQueryState(walletKey)?.isInvalidated).toBe(true);
    queryClient.clear();
  });
});
