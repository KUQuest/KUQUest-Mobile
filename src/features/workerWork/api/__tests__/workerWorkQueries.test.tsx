import React, { createElement } from "react";
import { Pressable } from "react-native";
import {
  act,
  fireEvent,
  renderHook,
  waitFor,
} from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import type { UploadAsset } from "@/api/fileUpload";
import { liveQuestService } from "@/features/questBoard/live/liveQuestService";
import { workerHomeKeys } from "@/features/workerHome/api/workerHomeKeys";
import { renderWithQueryClient } from "@/testing/queryTestUtils";
import type { ProofSendPlan } from "../../proofDraftPlan";
import {
  useRemoveProofFileMutation,
  useSubmitProofMutation,
} from "../workerWorkQueries";

jest.mock("@/api/QuestApi", () => ({
  createQuestIdempotencyKey: jest.fn(() => "idempotency-key"),
}));

jest.mock("@/features/questBoard/live/liveQuestService", () => ({
  liveQuestService: {
    createProofDraft: jest.fn(),
    deleteProofDraft: jest.fn(),
    submitProofDraft: jest.fn(),
    updateProofDraft: jest.fn(),
  },
}));

const mockedService = liveQuestService as jest.Mocked<typeof liveQuestService>;
type TestFile = UploadAsset & { key: string };
type TestPlan = ProofSendPlan<TestFile>;

function SubmitProbe({
  plan,
  onError,
}: {
  plan: TestPlan;
  onError: jest.Mock;
}) {
  const mutation = useSubmitProofMutation();
  return createElement(Pressable, {
    testID: "submit-proof",
    onPress: () => {
      void mutation
        .mutateAsync({
          questId: "quest-1",
          viewerId: "worker-1",
          plan,
          description: "Proof description",
        })
        .catch(onError);
    },
  });
}

const replacementPlan: TestPlan = {
  kind: "create",
  replaceDraftId: "draft-old",
  files: [
    {
      key: "local-proof",
      uri: "file:///proof.jpg",
      name: "proof.jpg",
      type: "image/jpeg",
    },
  ],
};

describe("useSubmitProofMutation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("keeps old draft when replacement creation fails", async () => {
    mockedService.createProofDraft.mockRejectedValue(new Error("offline"));
    const onError = jest.fn();
    const view = await renderWithQueryClient(
      createElement(SubmitProbe, { plan: replacementPlan, onError })
    );

    await act(async () => {
      await fireEvent.press(view.getByTestId("submit-proof"));
    });
    await waitFor(() =>
      expect(onError).toHaveBeenCalledWith(expect.any(Error))
    );

    expect(mockedService.deleteProofDraft).not.toHaveBeenCalled();
  });

  it("cleans up replacement when old draft deletion fails", async () => {
    mockedService.createProofDraft.mockResolvedValue({
      id: "draft-new",
      files: [],
    } as never);
    mockedService.deleteProofDraft
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce({} as never);
    const onError = jest.fn();
    const view = await renderWithQueryClient(
      createElement(SubmitProbe, { plan: replacementPlan, onError })
    );

    await act(async () => {
      await fireEvent.press(view.getByTestId("submit-proof"));
    });
    await waitFor(() =>
      expect(onError).toHaveBeenCalledWith(expect.any(Error))
    );

    expect(mockedService.deleteProofDraft).toHaveBeenNthCalledWith(
      1,
      "quest-1",
      "draft-old",
      "idempotency-key"
    );
    expect(mockedService.deleteProofDraft).toHaveBeenNthCalledWith(
      2,
      "quest-1",
      "draft-new",
      "idempotency-key"
    );
  });
  it("invalidates the participation detail after submitting proof", async () => {
    const queryClient = new QueryClient();
    const key = workerHomeKeys.participationDetail("quest-1");
    queryClient.setQueryData(key, { draft: true });
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      createElement(QueryClientProvider, { client: queryClient }, children);
    mockedService.submitProofDraft.mockResolvedValue({} as never);
    const { result } = await renderHook(() => useSubmitProofMutation(), {
      wrapper,
    });
    await act(async () => {
      await result.current.mutateAsync({
        questId: "quest-1",
        viewerId: "worker-1",
        plan: { kind: "existing", draftId: "draft-1" },
      });
    });
    expect(queryClient.getQueryState(key)?.isInvalidated).toBe(true);
    queryClient.clear();
  });

  it("invalidates the participation detail after removing a proof file", async () => {
    const queryClient = new QueryClient();
    const key = workerHomeKeys.participationDetail("quest-1");
    queryClient.setQueryData(key, { draft: true });
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      createElement(QueryClientProvider, { client: queryClient }, children);
    mockedService.updateProofDraft.mockResolvedValue({} as never);
    const { result } = await renderHook(() => useRemoveProofFileMutation(), {
      wrapper,
    });
    await act(async () => {
      await result.current.mutateAsync({
        questId: "quest-1",
        viewerId: "worker-1",
        draftId: "draft-1",
        fileIds: [],
      });
    });
    expect(queryClient.getQueryState(key)?.isInvalidated).toBe(true);
    queryClient.clear();
  });
});
