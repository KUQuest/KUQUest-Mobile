import React from "react";
import { act, renderHook } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { questApi } from "@/api/QuestApi";
import { liveQuestService } from "@/features/questBoard/live/liveQuestService";
import { questBoardKeys } from "@/features/questBoard/api/questBoardQueries";
import { walletKeys } from "@/features/wallet/api/walletQueries";
import {
  createQuestKeys,
  useCancelQuestMutation,
  useCreateQuestMutation,
  useDeleteQuestImageMutation,
  useEditQuestMutation,
  usePublishEditQuestMutation,
  usePublishImageUploadMutation,
  usePublishQuestMutation,
  useUploadQuestImagesMutation,
} from "../api/createQuestQueries";

jest.mock("@/api/QuestApi", () => ({
  questApi: {
    cancelQuest: jest.fn(),
    deleteQuestImage: jest.fn(),
    editQuest: jest.fn(),
    uploadQuestImages: jest.fn(),
  },
}));
jest.mock("@/features/questBoard/live/liveQuestService", () => ({
  liveQuestService: {
    createQuest: jest.fn(),
    editQuest: jest.fn(),
    publishQuest: jest.fn(),
    uploadImages: jest.fn(),
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

describe("Create Quest cache invalidation", () => {
  beforeEach(() => jest.clearAllMocks());

  it("cancel invalidates Quest Board and Wallet reads", async () => {
    const queryClient = createQueryClient();
    const boardKey = questBoardKeys.board();
    const walletKey = walletKeys.detail();
    queryClient.setQueryData(boardKey, []);
    queryClient.setQueryData(walletKey, { balance: 100 });
    jest.mocked(questApi.cancelQuest).mockResolvedValue({} as never);
    const { result } = await renderHook(() => useCancelQuestMutation(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync({
        questId: "quest-1",
        idempotencyKey: "cancel-key",
      });
    });

    expect(queryClient.getQueryState(boardKey)?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(walletKey)?.isInvalidated).toBe(true);
    queryClient.clear();
  });

  it("publish invalidates Quest Board and Wallet reads", async () => {
    const queryClient = createQueryClient();
    const boardKey = questBoardKeys.board();
    const walletKey = walletKeys.detail();
    queryClient.setQueryData(boardKey, []);
    queryClient.setQueryData(walletKey, { balance: 100 });
    jest.mocked(liveQuestService.publishQuest).mockResolvedValue({} as never);
    const { result } = await renderHook(() => usePublishQuestMutation(), {
      wrapper: createWrapper(queryClient),
    });
    await act(async () => {
      await result.current.mutateAsync({
        questId: "quest-1",
        idempotencyKey: "publish-key",
      });
    });
    expect(queryClient.getQueryState(boardKey)?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(walletKey)?.isInvalidated).toBe(true);
    queryClient.clear();
  });

  it("publishing a Quest edit invalidates Quest Board and Wallet reads", async () => {
    const queryClient = createQueryClient();
    const boardKey = questBoardKeys.board();
    const walletKey = walletKeys.detail();
    queryClient.setQueryData(boardKey, []);
    queryClient.setQueryData(walletKey, { balance: 100 });
    jest.mocked(liveQuestService.editQuest).mockResolvedValue({} as never);
    const { result } = await renderHook(() => usePublishEditQuestMutation(), {
      wrapper: createWrapper(queryClient),
    });
    await act(async () => {
      await result.current.mutateAsync({
        questId: "quest-1",
        version: 1,
        payload: { title: "Updated" },
        idempotencyKey: "publish-key",
      });
    });
    expect(queryClient.getQueryState(boardKey)?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(walletKey)?.isInvalidated).toBe(true);
    queryClient.clear();
  });

  it("draft, edit, and update mutations invalidate Quest Board reads", async () => {
    const queryClient = createQueryClient();
    const boardKey = questBoardKeys.board();
    const editSourceKey = createQuestKeys.editSource("quest-1");
    queryClient.setQueryData(boardKey, []);
    queryClient.setQueryData(editSourceKey, { id: "quest-1" });
    jest
      .mocked(liveQuestService.createQuest)
      .mockResolvedValue({ id: "quest-1" } as never);
    jest.mocked(questApi.editQuest).mockResolvedValue({} as never);
    const create = await renderHook(() => useCreateQuestMutation(), {
      wrapper: createWrapper(queryClient),
    });
    await act(async () => {
      await create.result.current.mutateAsync({
        payload: { title: "Draft" } as never,
        idempotencyKey: "create-key",
      });
    });
    expect(queryClient.getQueryState(boardKey)?.isInvalidated).toBe(true);
    await queryClient.resetQueries({ queryKey: boardKey });

    const edit = await renderHook(() => useEditQuestMutation(), {
      wrapper: createWrapper(queryClient),
    });
    await act(async () => {
      await edit.result.current.mutateAsync({
        questId: "quest-1",
        version: 1,
        payload: { title: "Updated" },
        idempotencyKey: "edit-key",
      });
    });
    expect(queryClient.getQueryState(boardKey)?.isInvalidated).toBe(true);
    queryClient.clear();
  });
  it("image mutations invalidate Quest Board reads", async () => {
    const queryClient = createQueryClient();
    const boardKey = questBoardKeys.board();
    queryClient.setQueryData(boardKey, []);
    const wrapper = createWrapper(queryClient);
    jest.mocked(questApi.deleteQuestImage).mockResolvedValue({} as never);
    const remove = await renderHook(() => useDeleteQuestImageMutation(), {
      wrapper,
    });
    await act(async () => {
      await remove.result.current.mutateAsync({
        questId: "quest-1",
        imageId: "image-1",
        idempotencyKey: "delete-key",
      });
    });
    expect(queryClient.getQueryState(boardKey)?.isInvalidated).toBe(true);
    await queryClient.resetQueries({ queryKey: boardKey });

    jest.mocked(questApi.uploadQuestImages).mockResolvedValue([] as never);
    const upload = await renderHook(() => useUploadQuestImagesMutation(), {
      wrapper,
    });
    await act(async () => {
      await upload.result.current.mutateAsync({
        questId: "quest-1",
        assets: [
          { uri: "file://image", name: "image.jpg", type: "image/jpeg" },
        ],
        idempotencyKey: "upload-key",
      });
    });
    expect(queryClient.getQueryState(boardKey)?.isInvalidated).toBe(true);
    await queryClient.resetQueries({ queryKey: boardKey });

    jest.mocked(liveQuestService.uploadImages).mockResolvedValue([] as never);
    const publishImages = await renderHook(
      () => usePublishImageUploadMutation(),
      { wrapper }
    );
    await act(async () => {
      await publishImages.result.current.mutateAsync({
        questId: "quest-1",
        imageUris: ["file://image"],
        idempotencyKey: "publish-image-key",
      });
    });
    expect(queryClient.getQueryState(boardKey)?.isInvalidated).toBe(true);
    queryClient.clear();
  });
});
