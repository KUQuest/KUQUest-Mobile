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
import { profileKeys } from "@/features/profile/api/profileQueries";
import { walletKeys } from "@/features/wallet/api/walletQueries";
import { workerHomeKeys } from "@/features/workerHome/api/workerHomeQueries";
import { liveQuestService } from "../../live/liveQuestService";
import {
  subscribeToCandidateRosterEvents,
  subscribeToQuestBoardEvents,
  subscribeToQuestEvents,
} from "../../live/questEvents";
import { QuestEditRequestStatus } from "../../domain/types";
import type { QuestV2ProofSubmission } from "@/api/questV2Contracts";
import {
  invalidateWorkerQuestReads,
  questBoardKeys,
  useApplyQuestMutation,
  useCancelQuestMutation,
  useCreateReviewMutation,
  useJoinCandidateTeamMutation,
  useLiveQuestSnapshotQuery,
  useProofFileLinksQuery,
  useQuestBoardQuery,
  useQuestReviewsQuery,
  useReviewProofMutation,
  useSelectApplicationMutation,
  useUpdateReviewMutation,
} from "../questBoardQueries";

jest.mock("../../live/liveQuestService", () => ({
  liveQuestService: {
    getProofFileLink: jest.fn(),
    getLiveSnapshot: jest.fn(),
    listBoardQuests: jest.fn(),
    listQuestReviews: jest.fn(),
    applyQuest: jest.fn(),
    cancelQuest: jest.fn(),
    createReview: jest.fn(),
    updateReview: jest.fn(),
    reviewProof: jest.fn(),
    selectApplication: jest.fn(),
    joinCandidateTeam: jest.fn(),
    joinCandidateTeamByCode: jest.fn(),
  },
}));

jest.mock("../../live/questEvents", () => ({
  subscribeToCandidateRosterEvents: jest.fn(),
  subscribeToQuestBoardEvents: jest.fn(),
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

  it("subscribes after its enabled REST snapshot and refetches on acceptance or invalidation", async () => {
    jest.mocked(liveQuestService.listBoardQuests).mockReset();
    jest.mocked(subscribeToQuestBoardEvents).mockReset();
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const disabled = await renderHook(() => useQuestBoardQuery(false), {
      wrapper: wrapper(queryClient),
    });
    expect(liveQuestService.listBoardQuests).not.toHaveBeenCalled();
    expect(subscribeToQuestBoardEvents).not.toHaveBeenCalled();
    await disabled.unmount();

    let resolveInitialBoard: ((board: never) => void) | undefined;
    jest
      .mocked(liveQuestService.listBoardQuests)
      .mockImplementationOnce(
        () =>
          new Promise<never>((resolve) => {
            resolveInitialBoard = resolve;
          })
      )
      .mockResolvedValueOnce([{ id: "after-subscription" }] as never)
      .mockResolvedValueOnce([{ id: "after-invalidation" }] as never);

    let emitInvalidation: (() => void) | undefined;
    let emitSubscribed: (() => void) | undefined;
    const stopSubscription = jest.fn();
    jest
      .mocked(subscribeToQuestBoardEvents)
      .mockImplementation((onInvalidated, onSubscribed) => {
        emitInvalidation = () =>
          onInvalidated({
            type: "QUEST_BOARD_INVALIDATED",
            version: 1,
            questId: "00000000-0000-4000-8000-000000000001",
          });
        emitSubscribed = onSubscribed;
        return stopSubscription;
      });
    const { result, unmount } = await renderHook(() => useQuestBoardQuery(), {
      wrapper: wrapper(queryClient),
    });

    expect(subscribeToQuestBoardEvents).not.toHaveBeenCalled();
    await act(async () => {
      if (!resolveInitialBoard)
        throw new Error("Expected the initial Board REST request");
      resolveInitialBoard([{ id: "initial" }] as never);
    });
    await waitFor(() => expect(result.current.data?.[0]?.id).toBe("initial"));
    await waitFor(() =>
      expect(subscribeToQuestBoardEvents).toHaveBeenCalledTimes(1)
    );

    await act(async () => {
      if (!emitSubscribed) throw new Error("Expected Board subscription");
      emitSubscribed();
    });
    await waitFor(() =>
      expect(result.current.data?.[0]?.id).toBe("after-subscription")
    );
    await act(async () => {
      if (!emitInvalidation) throw new Error("Expected Board invalidation");
      emitInvalidation();
    });
    await waitFor(() =>
      expect(result.current.data?.[0]?.id).toBe("after-invalidation")
    );
    expect(liveQuestService.listBoardQuests).toHaveBeenCalledTimes(3);
    expect(subscribeToQuestBoardEvents).toHaveBeenCalledTimes(1);

    await unmount();
    expect(stopSubscription).toHaveBeenCalledTimes(1);
    queryClient.clear();
  });

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
  it("reloads the REST snapshot after Quest updates and subscription acceptance", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    let emitQuestUpdate: (() => void) | undefined;
    let emitQuestSubscribed: (() => void) | undefined;
    const stopSubscription = jest.fn();
    jest
      .mocked(liveQuestService.getLiveSnapshot)
      .mockResolvedValueOnce({ state: "QUEST_IN_PROGRESS" } as never)
      .mockResolvedValueOnce({ state: "QUEST_FAILED" } as never)
      .mockResolvedValueOnce({ state: "QUEST_COMPLETED" } as never);
    jest
      .mocked(subscribeToQuestEvents)
      .mockImplementation((_questId, onQuestUpdated, onSubscribed) => {
        emitQuestUpdate = () =>
          onQuestUpdated({
            type: "QUEST_UPDATED",
            version: 1,
            questId: "quest-1",
            changeType: "PROOF_SUBMITTED",
          });
        emitQuestSubscribed = onSubscribed;
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
    await act(async () => {
      if (!emitQuestSubscribed)
        throw new Error("Expected Quest subscription handshake");
      emitQuestSubscribed();
    });
    await waitFor(() =>
      expect(result.current.data?.state).toBe("QUEST_COMPLETED")
    );
    expect(liveQuestService.getLiveSnapshot).toHaveBeenCalledTimes(3);

    await unmount();
    expect(stopSubscription).toHaveBeenCalledTimes(1);
    queryClient.clear();
  });
  it("subscribes while the initial REST snapshot is pending", async () => {
    jest.mocked(subscribeToQuestEvents).mockReset();
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    let resolveSnapshot: ((snapshot: never) => void) | undefined;
    jest.mocked(liveQuestService.getLiveSnapshot).mockImplementation(
      () =>
        new Promise<never>((resolve) => {
          resolveSnapshot = resolve;
        })
    );
    const stopSubscription = jest.fn();
    jest.mocked(subscribeToQuestEvents).mockReturnValue(stopSubscription);
    const { result, unmount } = await renderHook(
      () => useLiveQuestSnapshotQuery("quest-1", "viewer-1"),
      { wrapper: wrapper(queryClient) }
    );

    expect(subscribeToQuestEvents).toHaveBeenCalledTimes(1);
    await act(async () => {
      if (!resolveSnapshot) throw new Error("Expected REST snapshot request");
      resolveSnapshot({ state: "QUEST_OPEN" } as never);
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(subscribeToQuestEvents).toHaveBeenCalledTimes(1);

    await unmount();
    expect(stopSubscription).toHaveBeenCalledTimes(1);
    queryClient.clear();
  });

  it("refetches the REST snapshot after Candidate roster events and subscription acceptance", async () => {
    jest.mocked(subscribeToCandidateRosterEvents).mockReset();
    jest.mocked(subscribeToQuestEvents).mockReset();
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const snapshot = (rosterRevision: number) =>
      ({
        viewerId: "viewer-1",
        actor: "HIRER",
        quest: { id: "quest-1" },
        mode: "CANDIDATE",
        capabilities: {
          canSelectCandidate: true,
          canSelectTeam: false,
        },
        rosterRevision,
      }) as never;
    jest.mocked(liveQuestService.getLiveSnapshot).mockClear();
    jest
      .mocked(liveQuestService.getLiveSnapshot)
      .mockResolvedValueOnce(snapshot(1))
      .mockResolvedValueOnce(snapshot(2))
      .mockResolvedValueOnce(snapshot(3));
    let emitRosterUpdate: (() => void) | undefined;
    let emitRosterSubscribed: (() => void) | undefined;
    const stopRosterSubscription = jest.fn();
    jest
      .mocked(subscribeToCandidateRosterEvents)
      .mockImplementation((questId, onRosterUpdated, onSubscribed) => {
        emitRosterUpdate = () =>
          onRosterUpdated({
            type: "CANDIDATE_ROSTER_UPDATED",
            version: 1,
            questId,
          });
        emitRosterSubscribed = onSubscribed;
        return stopRosterSubscription;
      });
    jest.mocked(subscribeToQuestEvents).mockReturnValue(jest.fn());
    const { result, unmount } = await renderHook(
      () => {
        const query = useLiveQuestSnapshotQuery("quest-1", "viewer-1");
        return query;
      },
      { wrapper: wrapper(queryClient) }
    );

    await waitFor(() =>
      expect(result.current.data).toMatchObject({ rosterRevision: 1 })
    );
    expect(subscribeToCandidateRosterEvents).toHaveBeenCalledTimes(1);
    await act(async () => {
      if (!emitRosterUpdate)
        throw new Error("Expected Candidate roster subscription");
      emitRosterUpdate();
    });
    await waitFor(() =>
      expect(result.current.data).toMatchObject({ rosterRevision: 2 })
    );
    expect(liveQuestService.getLiveSnapshot).toHaveBeenCalledTimes(2);
    await act(async () => {
      if (!emitRosterSubscribed)
        throw new Error("Expected Candidate roster handshake");
      emitRosterSubscribed();
    });
    await waitFor(() =>
      expect(result.current.data).toMatchObject({ rosterRevision: 3 })
    );
    expect(liveQuestService.getLiveSnapshot).toHaveBeenCalledTimes(3);

    await unmount();
    expect(stopRosterSubscription).toHaveBeenCalledTimes(1);
    queryClient.clear();
  });

  it("subscribes Candidate Team members to roster updates", async () => {
    jest.mocked(subscribeToCandidateRosterEvents).mockReset();
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    jest.mocked(liveQuestService.getLiveSnapshot).mockResolvedValueOnce({
      viewerId: "candidate-1",
      actor: "CANDIDATE",
      quest: { id: "quest-1" },
      mode: "CANDIDATE",
      team: { id: "team-1" },
      capabilities: {
        canSelectCandidate: false,
        canSelectTeam: false,
      },
    } as never);
    const stopSubscription = jest.fn();
    jest.mocked(subscribeToQuestEvents).mockReturnValue(jest.fn());
    jest
      .mocked(subscribeToCandidateRosterEvents)
      .mockReturnValue(stopSubscription);
    const { result, unmount } = await renderHook(
      () => useLiveQuestSnapshotQuery("quest-1", "candidate-1"),
      { wrapper: wrapper(queryClient) }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(subscribeToCandidateRosterEvents).toHaveBeenCalledTimes(1);

    await unmount();
    expect(stopSubscription).toHaveBeenCalledTimes(1);
    queryClient.clear();
  });
  it("does not subscribe to Candidate roster events without roster access", async () => {
    jest.mocked(subscribeToCandidateRosterEvents).mockReset();
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    jest.mocked(liveQuestService.getLiveSnapshot).mockResolvedValueOnce({
      viewerId: "candidate-1",
      actor: "CANDIDATE",
      quest: { id: "quest-1" },
      mode: "CANDIDATE",
      team: null,
      capabilities: {
        canSelectCandidate: false,
        canSelectTeam: false,
      },
    } as never);
    jest.mocked(subscribeToQuestEvents).mockReturnValue(jest.fn());
    const { result, unmount } = await renderHook(
      () => useLiveQuestSnapshotQuery("quest-1", "candidate-1"),
      { wrapper: wrapper(queryClient) }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(subscribeToCandidateRosterEvents).not.toHaveBeenCalled();

    await unmount();
    queryClient.clear();
  });
  it("joins candidate teams using teamId or by code directly", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    jest.mocked(liveQuestService.joinCandidateTeam).mockResolvedValue({
      id: "team-1",
    } as never);
    jest.mocked(liveQuestService.joinCandidateTeamByCode).mockResolvedValue({
      id: "team-2",
    } as never);

    const { result } = await renderHook(() => useJoinCandidateTeamMutation(), {
      wrapper: wrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync({
        questId: "quest-1",
        teamId: "team-1",
        joinCode: "CODE123",
      });
    });

    expect(liveQuestService.joinCandidateTeam).toHaveBeenCalledWith(
      "quest-1",
      "team-1",
      "CODE123",
      undefined
    );
    expect(liveQuestService.joinCandidateTeamByCode).not.toHaveBeenCalled();

    await act(async () => {
      await result.current.mutateAsync({
        questId: "quest-1",
        joinCode: "CODE999",
      });
    });

    expect(liveQuestService.joinCandidateTeamByCode).toHaveBeenCalledWith(
      "quest-1",
      "CODE999",
      undefined
    );
  });
  it("loads the live edit request after an edit event", async () => {
    jest.mocked(subscribeToQuestEvents).mockReset();
    jest.mocked(liveQuestService.getLiveSnapshot).mockResolvedValue({
      editRequest: null,
    } as never);
    let emit: ((event: never) => void) | undefined;
    jest.mocked(subscribeToQuestEvents).mockImplementation((_id, callback) => {
      emit = callback as (event: never) => void;
      return jest.fn();
    });
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const { unmount } = await renderHook(
      () => useLiveQuestSnapshotQuery("quest-1", "viewer-1"),
      { wrapper: wrapper(queryClient) }
    );
    await waitFor(() => expect(emit).toBeDefined());
    await act(async () => {
      emit?.({
        type: "QUEST_UPDATED",
        version: 1,
        questId: "quest-1",
        changeType: "QUEST_EDIT_UPDATED",
        editRequestId: "edit-1",
      } as never);
    });
    await waitFor(() =>
      expect(liveQuestService.getLiveSnapshot).toHaveBeenCalledWith(
        "quest-1",
        "viewer-1",
        expect.objectContaining({ editRequestId: "edit-1" })
      )
    );
    await unmount();
    queryClient.clear();
  });

  it("clears a cached edit id after an absent or terminal request is fetched", async () => {
    for (const editRequest of [
      null,
      { status: QuestEditRequestStatus.EDIT_REQUEST_APPLIED },
      { status: QuestEditRequestStatus.EDIT_REQUEST_FAILED },
    ]) {
      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
      });
      queryClient.setQueryData(
        questBoardKeys.editRequestId("quest-1"),
        "edit-1"
      );
      jest.mocked(liveQuestService.getLiveSnapshot).mockResolvedValueOnce({
        editRequest,
      } as never);
      const { unmount } = await renderHook(
        () => useLiveQuestSnapshotQuery("quest-1", "viewer-1"),
        { wrapper: wrapper(queryClient) }
      );
      await waitFor(() =>
        expect(
          queryClient.getQueryData(questBoardKeys.editRequestId("quest-1"))
        ).toBeNull()
      );
      await unmount();
      queryClient.clear();
    }
  });

  it("does not clear an explicit edit request id", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    queryClient.setQueryData(questBoardKeys.editRequestId("quest-1"), "edit-1");
    jest.mocked(liveQuestService.getLiveSnapshot).mockResolvedValueOnce({
      editRequest: {
        status: QuestEditRequestStatus.EDIT_REQUEST_APPLIED,
      },
    } as never);
    const { unmount } = await renderHook(
      () =>
        useLiveQuestSnapshotQuery("quest-1", "viewer-1", {
          editRequestId: "explicit-edit",
        }),
      { wrapper: wrapper(queryClient) }
    );
    await waitFor(() =>
      expect(liveQuestService.getLiveSnapshot).toHaveBeenCalled()
    );
    expect(
      queryClient.getQueryData(questBoardKeys.editRequestId("quest-1"))
    ).toBe("edit-1");
    await unmount();
    queryClient.clear();
  });

  it("invalidates all Worker projection keys with the shared invalidator", async () => {
    const queryClient = new QueryClient();
    const keys: QueryKey[] = [
      questBoardKeys.detail("quest-1"),
      questBoardKeys.board(),
      questBoardKeys.liveSnapshotScope("quest-1", "worker-1"),
      workerHomeKeys.assignments("active"),
      workerHomeKeys.assignments("all"),
      workerHomeKeys.participationDetail("quest-1"),
      workerHomeKeys.liveSnapshot("quest-1", "worker-1"),
      myQuestsKeys.worker("worker-1"),
    ];
    keys.forEach((key) => queryClient.setQueryData(key, { cached: true }));
    await invalidateWorkerQuestReads(queryClient, "quest-1", "worker-1");
    keys.forEach((key) =>
      expect(queryClient.getQueryState(key)?.isInvalidated).toBe(true)
    );
    queryClient.clear();
  });

  it("invalidates Wallet after cancel and proof review, not candidate selection", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const walletKey = walletKeys.detail();
    const invalidated = () =>
      queryClient.getQueryState(walletKey)?.isInvalidated;
    queryClient.setQueryData(walletKey, { cached: true });
    jest.mocked(liveQuestService.cancelQuest).mockResolvedValue({} as never);
    const cancel = await renderHook(() => useCancelQuestMutation(), {
      wrapper: wrapper(queryClient),
    });
    await act(async () => {
      await cancel.result.current.mutateAsync({ questId: "quest-1" });
    });
    expect(invalidated()).toBe(true);
    await queryClient.resetQueries({ queryKey: walletKey });
    jest.mocked(liveQuestService.reviewProof).mockResolvedValue({} as never);
    const review = await renderHook(() => useReviewProofMutation(), {
      wrapper: wrapper(queryClient),
    });
    await act(async () => {
      await review.result.current.mutateAsync({
        questId: "quest-1",
        proofSubmissionId: "proof-1",
        payload: { decision: "PROOF_APPROVED" },
      });
    });
    expect(invalidated()).toBe(true);
    await queryClient.resetQueries({ queryKey: walletKey });
    jest
      .mocked(liveQuestService.selectApplication)
      .mockResolvedValue({} as never);
    const select = await renderHook(() => useSelectApplicationMutation(), {
      wrapper: wrapper(queryClient),
    });
    await act(async () => {
      await select.result.current.mutateAsync({
        questId: "quest-1",
        applicationId: "application-1",
        viewerId: "hirer-1",
      });
    });
    expect(invalidated()).toBe(false);
    queryClient.clear();
  });

  it("invalidates reviewee public data for create and public prefixes when unknown", async () => {
    const queryClient = new QueryClient();
    const publicKey = profileKeys.public("worker-1");
    const publicReviewsKey = profileKeys.publicReviews("worker-1");
    queryClient.setQueryData(publicKey, { name: "Worker" });
    queryClient.setQueryData(publicReviewsKey, { items: [] });
    jest.mocked(liveQuestService.createReview).mockResolvedValue({} as never);
    const create = await renderHook(() => useCreateReviewMutation(), {
      wrapper: wrapper(queryClient),
    });
    await act(async () => {
      await create.result.current.mutateAsync({
        questId: "quest-1",
        viewerId: "hirer-1",
        input: { revieweeId: "worker-1", rating: 5 },
      });
    });
    expect(queryClient.getQueryState(publicKey)?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(publicReviewsKey)?.isInvalidated).toBe(
      true
    );

    await queryClient.resetQueries({ queryKey: publicKey });
    await queryClient.resetQueries({ queryKey: publicReviewsKey });
    jest.mocked(liveQuestService.updateReview).mockResolvedValue({} as never);
    const update = await renderHook(() => useUpdateReviewMutation(), {
      wrapper: wrapper(queryClient),
    });
    await act(async () => {
      await update.result.current.mutateAsync({
        questId: "quest-1",
        viewerId: "worker-1",
        reviewId: "review-1",
        input: { rating: 4 },
      });
    });
    expect(queryClient.getQueryState(publicKey)?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(publicReviewsKey)?.isInvalidated).toBe(
      true
    );
    queryClient.clear();
  });
  it("loads reviews for a Quest and viewer", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const reviews = [{ id: "review-1", reviewerId: "worker-1" }];
    jest
      .mocked(liveQuestService.listQuestReviews)
      .mockResolvedValue(reviews as never);
    const { result } = await renderHook(
      () => useQuestReviewsQuery("quest-1", "worker-1"),
      { wrapper: wrapper(queryClient) }
    );
    await waitFor(() => expect(result.current.data).toEqual(reviews));
    expect(liveQuestService.listQuestReviews).toHaveBeenCalledWith(
      "quest-1",
      "worker-1"
    );
    queryClient.clear();
  });
});
