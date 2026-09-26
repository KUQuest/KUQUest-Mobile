import React from "react";
import { act, renderHook } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { initialDraft } from "../domain/createQuestModel";
import { useQuestPublish } from "../publish/useQuestPublish";

const mockCreateQuest = jest.fn();
const mockEditQuest = jest.fn();
const mockUploadImage = jest.fn();
const mockPublishQuest = jest.fn();
const mockRefetch = jest.fn();
const mockGetPublishCheck = jest.fn();

jest.mock("../api/createQuestQueries", () => ({
  useCreateQuestMutation: () => ({
    error: null,
    isPending: false,
    mutateAsync: (variables: unknown) => mockCreateQuest(variables),
  }),
  usePublishEditQuestMutation: () => ({
    error: null,
    isPending: false,
    mutateAsync: (variables: unknown) => mockEditQuest(variables),
  }),
  usePublishImageUploadMutation: () => ({
    error: null,
    isPending: false,
    mutateAsync: (variables: unknown) => mockUploadImage(variables),
  }),
  usePublishQuestMutation: () => ({
    error: null,
    isPending: false,
    mutateAsync: (variables: unknown) => mockPublishQuest(variables),
  }),
  useQuestPublishCheckQuery: () => ({
    data: undefined,
    error: null,
    isFetching: false,
    refetch: mockRefetch,
  }),
}));

jest.mock("../../wallet/api/walletQueries", () => ({
  useWalletQuery: () => ({ data: null }),
}));

jest.mock("../../preferences/localeStore", () => ({
  useLocale: () => ({ locale: "en" }),
}));

jest.mock("../../questBoard/live/liveQuestService", () => ({
  liveQuestService: {
    getPublishCheck: mockGetPublishCheck,
  },
}));

describe("useQuestPublish", () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={new QueryClient()}>
      {children}
    </QueryClientProvider>
  );

  beforeEach(() => {
    mockCreateQuest.mockReset();
    mockCreateQuest.mockResolvedValue({ id: "server-quest", version: 1 });
    mockEditQuest.mockReset();
    mockUploadImage.mockReset();
    mockUploadImage.mockResolvedValue([]);
    mockPublishQuest.mockReset();
    mockRefetch.mockReset();
    mockRefetch.mockResolvedValue({ error: null });
    mockGetPublishCheck.mockReset();
    mockGetPublishCheck.mockResolvedValue({
      canPublish: true,
      blockingReasons: [],
    });
  });

  function createProps(enabled = true) {
    return {
      completedState: null,
      draft: initialDraft,
      draftHydrated: true,
      draftIdRef: { current: null } as { current: string | null },
      draftRevisionRef: { current: 0 },
      draftStorageKey: "draft-key",
      editQuestId: undefined,
      enabled,
      publishedQuestRef: { current: null } as {
        current: {
          questId: string;
          version: number;
          storageKey: string;
          editQuestId?: string;
          publishIdempotencyKey?: string;
        } | null;
      },
      saveRequestRef: { current: 0 },
      setSaveErrorIntent: jest.fn(),
      step: 3 as const,
    };
  }

  it("does not create when publishing is disabled", async () => {
    const props = createProps(false);
    const { result } = await renderHook(() => useQuestPublish(props), {
      wrapper,
    });

    await act(async () => {
      await result.current.refreshPublishCheck();
      expect(await result.current.publishQuest(initialDraft)).toBe(false);
    });

    expect(mockCreateQuest).not.toHaveBeenCalled();
  });

  it("shares one create request across overlapping publish checks", async () => {
    let resolveCreate!: (value: { id: string; version: number }) => void;
    mockCreateQuest.mockImplementation(
      () =>
        new Promise<{ id: string; version: number }>((resolve) => {
          resolveCreate = resolve;
        })
    );
    const props = createProps();
    const { result } = await renderHook(() => useQuestPublish(props), {
      wrapper,
    });

    let first!: Promise<void>;
    let second!: Promise<void>;
    await act(async () => {
      first = result.current.refreshPublishCheck();
      second = result.current.refreshPublishCheck();
    });

    expect(mockCreateQuest).toHaveBeenCalledTimes(1);
    resolveCreate({ id: "server-quest", version: 1 });
    await act(async () => {
      await Promise.all([first, second]);
    });
  });

  it("clears stale publish-check busy state when the draft changes", async () => {
    let resolveCreate!: (value: { id: string; version: number }) => void;
    mockCreateQuest.mockImplementation(
      () =>
        new Promise<{ id: string; version: number }>((resolve) => {
          resolveCreate = resolve;
        })
    );
    const props = createProps();
    const { result } = await renderHook(() => useQuestPublish(props), {
      wrapper,
    });

    let refresh!: Promise<void>;
    await act(async () => {
      refresh = result.current.refreshPublishCheck();
    });
    expect(result.current.isCheckingPublish).toBe(true);

    await act(async () => {
      result.current.setPublishCheck(null);
    });
    expect(result.current.isCheckingPublish).toBe(false);

    resolveCreate({ id: "server-quest", version: 1 });
    await act(async () => {
      await refresh;
    });
  });

  it("reuses a failed create key until the operation is reset", async () => {
    mockCreateQuest.mockRejectedValueOnce(new Error("offline"));
    const props = createProps();
    const { result } = await renderHook(() => useQuestPublish(props), {
      wrapper,
    });

    await act(async () => {
      await result.current.refreshPublishCheck();
    });
    const firstKey = mockCreateQuest.mock.calls[0][0].idempotencyKey;

    mockCreateQuest.mockResolvedValueOnce({ id: "server-quest", version: 1 });
    await act(async () => {
      await result.current.refreshPublishCheck();
    });
    const retryKey = mockCreateQuest.mock.calls[1][0].idempotencyKey;
    expect(retryKey).toBe(firstKey);

    props.publishedQuestRef.current = null;
    result.current.resetCreateIdempotencyKey();
    mockCreateQuest.mockResolvedValueOnce({ id: "server-quest-2", version: 1 });
    await act(async () => {
      await result.current.refreshPublishCheck();
    });
    const nextOperationKey = mockCreateQuest.mock.calls[2][0].idempotencyKey;
    expect(nextOperationKey).not.toBe(firstKey);
  });
});
