import type { QuestV2CanonicalQuest } from "@/api/questV2Contracts";
import { act, renderHook, waitFor } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

import { questApi } from "@/api/QuestApi";
import { studentApi } from "@/api/StudentApi";
import { useHirerHomeQuery } from "../api/homeQueries";
import { myQuestService } from "@/features/myQuests/myQuestService";
import { subscribeToHirerQuestEvents } from "@/features/questBoard/live/questEvents";

jest.mock("@/api/QuestApi", () => ({
  questApi: {
    listQuestAssignments: jest.fn(),
    listApplications: jest.fn(),
    listCandidateTeams: jest.fn(),
    listProofSubmissions: jest.fn(),
  },
}));

jest.mock("@/api/StudentApi", () => ({
  studentApi: {
    getPublicProfile: jest.fn(),
  },
}));

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
          changeType: "UNDERFILLED_DECISION_PENDING",
          expiresAt: "2026-10-02T04:10:00.000Z",
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

  it("returns applicant and proof attention beyond the carousel without roster fetches", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const quests: QuestV2CanonicalQuest[] = Array.from(
      { length: 7 },
      (_, index) => ({
        id: `quest-${index + 1}`,
        version: 1,
        hiddenAt: null,
        title: `Quest ${index + 1}`,
        description: null,
        condition: { items: [] },
        tag: null,
        mode: index >= 5 ? "CANDIDATE" : "FIRST_COME_FIRST_SERVED",
        participation: "SINGLE",
        state: index === 5 ? "QUEST_OPEN" : "QUEST_IN_PROGRESS",
        questFundingTotal: 100,
        headcount: 1,
        startTime: "2026-09-28T00:00:00.000Z",
        dueAt:
          index === 6 ? "2026-10-01T00:00:00.000Z" : "2026-09-30T00:00:00.000Z",
        proofRequired: true,
        locations: [],
        createdAt: "2026-09-27T00:00:00.000Z",
        updatedAt: "2026-09-27T00:00:00.000Z",
      })
    );
    jest.mocked(myQuestService.listAllMyHirerQuests).mockResolvedValue(quests);
    jest.mocked(questApi.listQuestAssignments).mockResolvedValue([]);
    jest.mocked(questApi.listApplications).mockResolvedValueOnce([
      {
        id: "application-6",
        questId: "quest-6",
        memberId: "candidate-6",
        state: "APPLICATION_APPLIED",
        appliedAt: "2026-09-28T00:00:00.000Z",
      },
    ]);
    jest.mocked(questApi.listCandidateTeams).mockResolvedValue([]);
    jest.mocked(questApi.listProofSubmissions).mockImplementation(async (id) =>
      id === "quest-7"
        ? [
            {
              id: "proof-7",
              questId: id,
              workerId: "worker-7",
              teamId: null,
              submittedByUserId: "worker-7",
              description: null,
              status: "PROOF_PENDING",
              submittedAt: "2026-09-29T00:00:00.000Z",
              createdAt: "2026-09-29T00:00:00.000Z",
              updatedAt: "2026-09-29T00:00:00.000Z",
              visibility: "FULL",
              fileIds: [],
              files: [],
            },
          ]
        : []
    );

    const { result } = await renderHook(() => useHirerHomeQuery(), {
      wrapper: wrapper(queryClient),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.activeQuests.map(({ id }) => id)).toEqual([
      "quest-1",
      "quest-2",
      "quest-3",
      "quest-4",
      "quest-5",
    ]);
    expect(result.current.data?.attentionItems).toEqual([
      {
        kind: "proof",
        questId: "quest-7",
        questTitle: "Quest 7",
      },
      {
        kind: "applicants",
        questId: "quest-6",
        questTitle: "Quest 6",
        count: 1,
      },
    ]);
    expect(
      jest.mocked(questApi.listQuestAssignments).mock.calls.map(([id]) => id)
    ).toEqual(["quest-1", "quest-2", "quest-3", "quest-4", "quest-5"]);
    expect(questApi.listQuestAssignments).not.toHaveBeenCalledWith(
      "quest-6",
      expect.anything()
    );
    expect(questApi.listApplications).toHaveBeenCalledTimes(1);
    expect(questApi.listApplications).toHaveBeenCalledWith(
      "quest-6",
      expect.anything()
    );
    expect(studentApi.getPublicProfile).not.toHaveBeenCalled();
    expect(result.current.data?.hasPartialFailure).toBe(false);
  });

  it("does not read applications or teams for a started Candidate quest", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const quest = (
      participation: "SINGLE" | "GROUP",
      id: string
    ): QuestV2CanonicalQuest =>
      ({
        id,
        version: 1,
        hiddenAt: null,
        title: id,
        description: null,
        condition: { items: [] },
        tag: null,
        mode: "CANDIDATE",
        participation,
        state: "QUEST_IN_PROGRESS",
        questFundingTotal: 100,
        headcount: 1,
        startTime: "2026-09-28T00:00:00.000Z",
        dueAt: "2026-09-30T00:00:00.000Z",
        proofRequired: false,
        locations: [],
        createdAt: "2026-09-27T00:00:00.000Z",
        updatedAt: "2026-09-27T00:00:00.000Z",
      }) as QuestV2CanonicalQuest;
    jest
      .mocked(myQuestService.listAllMyHirerQuests)
      .mockResolvedValue([quest("SINGLE", "single"), quest("GROUP", "group")]);
    jest.mocked(questApi.listQuestAssignments).mockResolvedValue([]);

    const { result } = await renderHook(() => useHirerHomeQuery(), {
      wrapper: wrapper(queryClient),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(questApi.listApplications).not.toHaveBeenCalled();
    expect(questApi.listCandidateTeams).not.toHaveBeenCalled();
    expect(result.current.data?.hasPartialFailure).toBe(false);
  });
});
