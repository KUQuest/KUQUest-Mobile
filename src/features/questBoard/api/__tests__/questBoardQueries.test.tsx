import React from "react";
import { act, renderHook, waitFor } from "@testing-library/react-native";
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
import { subscribeToQuestEvents } from "../../live/questEvents";
import type { QuestV2ProofSubmission } from "@/api/questV2Contracts";
import {
  questBoardKeys,
  useApplyQuestMutation,
  useCancelQuestMutation,
  useLiveQuestSnapshotQuery,
  useProofFileLinksQuery,
} from "../questBoardQueries";

jest.mock("../../live/liveQuestService", () => ({
  liveQuestService: {
    getProofFileLink: jest.fn(),
    getLiveSnapshot: jest.fn(),
    applyQuest: jest.fn(),
    cancelQuest: jest.fn(),
  },
}));

jest.mock("../../live/questEvents", () => ({
  subscribeToQuestEvents: jest.fn(),
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
  it("fetches links for each ready proof file before review", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const proof: QuestV2ProofSubmission = {
      id: "proof-1",
      questId: "quest-1",
      workerId: "worker-1",
      teamId: null,
      submittedByUserId: "worker-1",
      description: "Evidence",
      status: "PROOF_PENDING",
      submittedAt: "2026-09-23T10:00:00Z",
      createdAt: "2026-09-23T09:00:00Z",
      updatedAt: "2026-09-23T10:00:00Z",
      visibility: "FULL",
      fileIds: ["file-1", "file-2", "file-failed"],
      files: [
        {
          fileId: "file-1",
          contentType: "image/png",
          sizeBytes: 100,
          position: 0,
          uploadStatus: "PROOF_FILE_READY",
          failureCode: null,
        },
        {
          fileId: "file-2",
          contentType: "application/pdf",
          sizeBytes: 200,
          position: 1,
          uploadStatus: "PROOF_FILE_READY",
          failureCode: null,
        },
        {
          fileId: null,
          contentType: "image/png",
          sizeBytes: 100,
          position: 2,
          uploadStatus: "PROOF_FILE_READY",
          failureCode: null,
        },
        {
          fileId: "file-failed",
          contentType: "image/png",
          sizeBytes: null,
          position: 3,
          uploadStatus: "PROOF_FILE_FAILED",
          failureCode: "UPLOAD_FAILED",
        },
      ],
    };
    jest
      .mocked(liveQuestService.getProofFileLink)
      .mockResolvedValueOnce({
        fileId: "file-1",
        contentType: "image/png",
        sizeBytes: 100,
        position: 0,
        url: "https://files.example.test/file-1?token=temporary",
        urlExpiresAt: "2026-09-24T12:00:00Z",
      })
      .mockResolvedValueOnce({
        fileId: "file-2",
        contentType: "application/pdf",
        sizeBytes: 200,
        position: 1,
        url: "https://files.example.test/file-2?token=temporary",
        urlExpiresAt: "2026-09-24T12:00:00Z",
      });
    const { result } = await renderHook(
      () => useProofFileLinksQuery("quest-1", "hirer-1", proof),
      { wrapper: wrapper(queryClient) }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.map((link) => link.url)).toEqual([
      "https://files.example.test/file-1?token=temporary",
      "https://files.example.test/file-2?token=temporary",
    ]);
    expect(liveQuestService.getProofFileLink).toHaveBeenCalledTimes(2);
    expect(liveQuestService.getProofFileLink).toHaveBeenNthCalledWith(
      1,
      "quest-1",
      "proof-1",
      "file-1",
      expect.objectContaining({ signal: expect.anything() })
    );
    expect(liveQuestService.getProofFileLink).toHaveBeenNthCalledWith(
      2,
      "quest-1",
      "proof-1",
      "file-2",
      expect.objectContaining({ signal: expect.anything() })
    );
    queryClient.clear();
  });
  it("reloads the REST snapshot after a Quest update event", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    let emitQuestUpdate: (() => void) | undefined;
    const stopSubscription = jest.fn();
    jest
      .mocked(liveQuestService.getLiveSnapshot)
      .mockResolvedValueOnce({ state: "QUEST_IN_PROGRESS" } as never)
      .mockResolvedValueOnce({ state: "QUEST_FAILED" } as never);
    jest
      .mocked(subscribeToQuestEvents)
      .mockImplementation((_questId, onQuestUpdated) => {
        emitQuestUpdate = () =>
          onQuestUpdated({
            type: "QUEST_UPDATED",
            version: 1,
            questId: "quest-1",
            changeType: "PROOF_SUBMITTED",
          });
        return stopSubscription;
      });
    const { result, unmount } = await renderHook(
      () => useLiveQuestSnapshotQuery("quest-1", "viewer-1"),
      { wrapper: wrapper(queryClient) }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.state).toBe("QUEST_IN_PROGRESS");
    expect(liveQuestService.getLiveSnapshot).toHaveBeenCalledTimes(1);
    jest.useFakeTimers();
    try {
      await act(async () => {
        if (!emitQuestUpdate)
          throw new Error("Expected Quest event subscription");
        emitQuestUpdate();
        await jest.advanceTimersByTimeAsync(0);
      });
    } finally {
      jest.useRealTimers();
    }
    expect(result.current.data?.state).toBe("QUEST_FAILED");
    expect(liveQuestService.getLiveSnapshot).toHaveBeenCalledTimes(2);

    await unmount();
    expect(stopSubscription).toHaveBeenCalledTimes(1);
    queryClient.clear();
  });
});
