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
import { questApi } from "@/api/QuestApi";
import { workerHomeKeys } from "@/features/workerHome/api/workerHomeKeys";
import { renderWithQueryClient } from "@/testing/queryTestUtils";
import type { ProofSendPlan } from "../../proofDraftPlan";
import {
  useRemoveProofFileMutation,
  useSubmitProofMutation,
} from "../workerWorkQueries";

jest.mock("@/api/QuestApi", () => ({
  createQuestIdempotencyKey: jest.fn(() => "idempotency-key"),
  questApi: {
    createProofDraft: jest.fn(),
    deleteProofDraft: jest.fn(),
    submitProofDraft: jest.fn(),
    updateProofDraft: jest.fn(),
  },
}));

const mockedQuestApi = questApi as jest.Mocked<typeof questApi>;
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

  it("lets the Server replace the old draft without a client delete", async () => {
    mockedQuestApi.createProofDraft.mockResolvedValue({
      id: "draft-new",
      files: [{ uploadStatus: "PROOF_FILE_READY", fileId: "file-1" }],
    } as never);
    mockedQuestApi.submitProofDraft.mockResolvedValue({} as never);
    const onError = jest.fn();
    const view = await renderWithQueryClient(
      createElement(SubmitProbe, { plan: replacementPlan, onError })
    );

    await act(async () => {
      await fireEvent.press(view.getByTestId("submit-proof"));
    });
    await waitFor(() =>
      expect(mockedQuestApi.submitProofDraft).toHaveBeenCalledWith(
        "quest-1",
        "draft-new",
        "idempotency-key"
      )
    );

    expect(onError).not.toHaveBeenCalled();
    expect(mockedQuestApi.deleteProofDraft).not.toHaveBeenCalled();
  });

  it("saves an edited description before re-sending an existing draft", async () => {
    mockedQuestApi.updateProofDraft.mockResolvedValue({} as never);
    mockedQuestApi.submitProofDraft.mockResolvedValue({} as never);
    const onError = jest.fn();
    const view = await renderWithQueryClient(
      createElement(SubmitProbe, {
        plan: { kind: "existing", draftId: "draft-1", description: "Old" },
        onError,
      })
    );

    await act(async () => {
      await fireEvent.press(view.getByTestId("submit-proof"));
    });
    await waitFor(() =>
      expect(mockedQuestApi.submitProofDraft).toHaveBeenCalled()
    );

    expect(onError).not.toHaveBeenCalled();
    expect(mockedQuestApi.updateProofDraft).toHaveBeenCalledWith(
      "quest-1",
      "draft-1",
      { description: "Proof description" },
      "idempotency-key"
    );
    expect(
      mockedQuestApi.updateProofDraft.mock.invocationCallOrder[0]
    ).toBeLessThan(mockedQuestApi.submitProofDraft.mock.invocationCallOrder[0]);
  });

  it("invalidates the participation detail after submitting proof", async () => {
    const queryClient = new QueryClient();
    const key = workerHomeKeys.participationDetail("quest-1");
    queryClient.setQueryData(key, { draft: true });
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      createElement(QueryClientProvider, { client: queryClient }, children);
    mockedQuestApi.submitProofDraft.mockResolvedValue({} as never);
    const { result } = await renderHook(() => useSubmitProofMutation(), {
      wrapper,
    });
    await act(async () => {
      await result.current.mutateAsync({
        questId: "quest-1",
        viewerId: "worker-1",
        plan: { kind: "existing", draftId: "draft-1", description: null },
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
    mockedQuestApi.updateProofDraft.mockResolvedValue({} as never);
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
