import { fireEvent, waitFor } from "@testing-library/react-native";
import * as ImagePicker from "expo-image-picker";

import { ApiError } from "@/api/ApiClient";
import { liveQuestService } from "@/features/questBoard/live/liveQuestService";
import { SweetAlertHost } from "@/components/ui/SweetAlert";
import { renderWithQueryClient } from "@/testing/queryTestUtils";
import { workerSnapshot } from "@/testing/workerSnapshotFixtures";
import { workerWorkMessages } from "@/locales/workerWorkMessages";
import { WorkerProofForm } from "../components/WorkerProofForm";

jest.mock("@/features/preferences/localeStore", () => ({
  useLocale: () => ({ locale: "en" }),
}));
jest.mock("@/features/questBoard/live/liveQuestService", () => ({
  liveQuestService: {
    createProofDraft: jest.fn(),
    updateProofDraft: jest.fn(),
    deleteProofDraft: jest.fn(),
    submitProofDraft: jest.fn(),
  },
}));
const mockResize = jest.fn();
jest.mock("expo-image-manipulator", () => ({
  SaveFormat: { JPEG: "jpeg", PNG: "png", WEBP: "webp" },
  ImageManipulator: {
    manipulate: () => ({
      resize: (size: { width: number; height: number }) => {
        mockResize(size);
        return {
          renderAsync: async () => ({
            saveAsync: async () => ({ uri: "file:///resized.jpeg" }),
          }),
        };
      },
      renderAsync: async () => ({ width: 4592, height: 8160 }),
    }),
  },
}));
jest.mock("expo-file-system", () => ({
  File: jest.fn().mockImplementation(() => ({ size: 2 * 1024 * 1024 })),
}));
jest.mock("expo-image-picker", () => ({
  launchImageLibraryAsync: jest.fn(),
}));

const mockedService = jest.mocked(liveQuestService);
const mockedPicker = jest.mocked(ImagePicker.launchImageLibraryAsync);

const submittable = workerSnapshot({
  id: "quest-1",
  title: "Print flyers",
  nextAction: "SUBMIT_PROOF",
  capabilities: { canSubmitProof: true },
});

function renderForm(
  snapshot = submittable,
  onSubmitted: () => Promise<unknown> | void = jest.fn(),
  viewerId = "worker-1"
) {
  return renderWithQueryClient(
    <>
      <WorkerProofForm
        onSubmitted={onSubmitted}
        questId="quest-1"
        snapshot={snapshot}
        viewerId={viewerId}
      />
      <SweetAlertHost />
    </>
  );
}

describe("WorkerProofForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("sends several proof files with a description after confirmation", async () => {
    mockedPicker.mockResolvedValue({
      canceled: false,
      assets: [
        {
          uri: "file:///one.jpg",
          fileName: "one.jpg",
          mimeType: "image/jpeg",
          type: "image",
          width: 10,
          height: 10,
        },
        {
          uri: "file:///clip.mp4",
          fileName: "clip.mp4",
          mimeType: "video/mp4",
          type: "video",
          width: 10,
          height: 10,
        },
        {
          uri: "file:///huge.jpg",
          fileName: "huge.jpg",
          mimeType: "image/jpeg",
          type: "image",
          fileSize: 11 * 1024 * 1024,
          width: 10,
          height: 10,
        },
      ],
    });
    mockedService.createProofDraft.mockResolvedValue({
      id: "draft-1",
      files: [{ uploadStatus: "PROOF_FILE_READY" }],
    } as never);
    mockedService.submitProofDraft.mockResolvedValue({
      id: "draft-1",
    } as never);
    const onSubmitted = jest.fn();

    const screen = await renderForm(submittable, onSubmitted);

    expect(
      screen.getByRole("button", { name: "Submit proof", disabled: true })
    ).toBeTruthy();

    await fireEvent.press(screen.getByRole("button", { name: "Add files" }));
    await waitFor(() => expect(screen.getByText("2/5 files")).toBeTruthy());
    expect(mockedPicker).toHaveBeenCalledWith(
      expect.objectContaining({
        allowsMultipleSelection: true,
        selectionLimit: 5,
      })
    );
    expect(screen.getByText("Larger than 10 MB: huge.jpg")).toBeTruthy();

    await fireEvent.changeText(
      screen.getByLabelText("Work description (optional)"),
      "  Printed and delivered.  "
    );
    expect(mockedService.submitProofDraft).not.toHaveBeenCalled();
    await fireEvent.press(screen.getByRole("button", { name: "Submit proof" }));
    expect(screen.getByText("Send proof?")).toBeTruthy();
    expect(
      screen.getByText(workerWorkMessages.en.confirmSubmitMessage)
    ).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByText("Send proof?")).toBeNull();
    expect(mockedService.submitProofDraft).not.toHaveBeenCalled();
    await fireEvent.press(screen.getByRole("button", { name: "Submit proof" }));
    await fireEvent.press(screen.getByRole("button", { name: "Confirm" }));

    await waitFor(() => expect(onSubmitted).toHaveBeenCalled());
    expect(mockedService.createProofDraft).toHaveBeenCalledWith(
      "quest-1",
      {
        assets: [
          { uri: "file:///one.jpg", name: "one.jpg", type: "image/jpeg" },
          { uri: "file:///clip.mp4", name: "clip.mp4", type: "video/mp4" },
        ],
        description: "Printed and delivered.",
      },
      expect.any(String)
    );
    expect(mockedService.submitProofDraft).toHaveBeenCalledWith(
      "quest-1",
      "draft-1",
      expect.any(String)
    );
  });

  it("keeps the draft input and does not send when a file upload fails", async () => {
    mockedPicker.mockResolvedValue({
      canceled: false,
      assets: [
        {
          uri: "file:///fail.jpg",
          fileName: "fail.jpg",
          mimeType: "image/jpeg",
          type: "image",
          width: 10,
          height: 10,
        },
      ],
    });
    mockedService.createProofDraft.mockResolvedValue({
      id: "draft-1",
      files: [{ uploadStatus: "PROOF_FILE_FAILED" }],
    } as never);
    const onSubmitted = jest.fn();

    const screen = await renderForm(submittable, onSubmitted);

    await fireEvent.press(screen.getByRole("button", { name: "Add files" }));
    await waitFor(() => expect(screen.getByText("1/5 files")).toBeTruthy());

    await fireEvent.changeText(
      screen.getByLabelText("Work description (optional)"),
      "Done"
    );
    await fireEvent.press(screen.getByRole("button", { name: "Submit proof" }));
    await fireEvent.press(screen.getByRole("button", { name: "Confirm" }));

    await waitFor(() =>
      expect(
        screen.getByText(
          "1 file(s) failed to upload. Remove or replace them and try again."
        )
      ).toBeTruthy()
    );
    expect(mockedService.submitProofDraft).not.toHaveBeenCalled();
    expect(onSubmitted).not.toHaveBeenCalled();
    expect(screen.getByDisplayValue("Done")).toBeTruthy();
  });
  it.each([
    [
      "rejects the upload",
      () =>
        mockedService.createProofDraft.mockRejectedValue(
          new ApiError(
            415,
            "PROOF_FILE_TYPE_NOT_SUPPORTED",
            "Attachment must be a valid image, PDF, or video file"
          )
        ),
    ],
    [
      "keeps a rejected file in the draft",
      () =>
        mockedService.createProofDraft.mockResolvedValue({
          id: "draft-1",
          files: [
            {
              uploadStatus: "PROOF_FILE_FAILED",
              failureCode: "PROOF_FILE_TYPE_NOT_SUPPORTED",
            },
          ],
        } as never),
    ],
  ])("explains a refused file when the server %s", async (_case, arrange) => {
    mockedPicker.mockResolvedValue({
      canceled: false,
      assets: [
        {
          uri: "file:///refused.jpg",
          fileName: "refused.jpg",
          mimeType: "image/jpeg",
          type: "image",
          width: 10,
          height: 10,
        },
      ],
    });
    arrange();

    const screen = await renderForm();
    await fireEvent.press(screen.getByRole("button", { name: "Add files" }));
    await waitFor(() => expect(screen.getByText("1/5 files")).toBeTruthy());
    await fireEvent.press(screen.getByRole("button", { name: "Submit proof" }));
    await fireEvent.press(screen.getByRole("button", { name: "Confirm" }));

    await waitFor(() =>
      expect(screen.getByText(workerWorkMessages.en.fileRejected)).toBeTruthy()
    );
    expect(mockedService.submitProofDraft).not.toHaveBeenCalled();
    expect(screen.getByText("1/5 files")).toBeTruthy();
  });
  it("downscales a photo above 25 MP before uploading it", async () => {
    mockedPicker.mockResolvedValue({
      canceled: false,
      assets: [
        {
          uri: "file:///camera.jpg",
          fileName: "camera.jpg",
          mimeType: "image/jpeg",
          type: "image",
          fileSize: 3_600_000,
          width: 4592,
          height: 8160,
        },
      ],
    });
    mockedService.createProofDraft.mockResolvedValue({
      id: "draft-1",
      files: [{ fileId: "file-1", uploadStatus: "PROOF_FILE_READY" }],
    } as never);
    mockedService.submitProofDraft.mockResolvedValue({
      id: "draft-1",
    } as never);

    const screen = await renderForm();
    await fireEvent.press(screen.getByRole("button", { name: "Add files" }));
    await waitFor(() => expect(screen.getByText("1/5 files")).toBeTruthy());
    await fireEvent.press(screen.getByRole("button", { name: "Submit proof" }));
    await fireEvent.press(screen.getByRole("button", { name: "Confirm" }));

    await waitFor(() =>
      expect(mockedService.submitProofDraft).toHaveBeenCalled()
    );
    const [size] = mockResize.mock.calls[0];
    expect(size.width * size.height).toBeLessThanOrEqual(25_000_000);
    expect(size.width / size.height).toBeCloseTo(4592 / 8160, 3);
    expect(mockedService.createProofDraft).toHaveBeenCalledWith(
      "quest-1",
      {
        assets: [
          {
            uri: "file:///resized.jpeg",
            name: "camera.jpg",
            type: "image/jpeg",
          },
        ],
        description: undefined,
      },
      expect.any(String)
    );
  });

  it("retries the failed position of the Worker's kept draft instead of creating another", async () => {
    const snapshot = {
      ...submittable,
      proofs: [
        {
          id: "draft-1",
          workerId: "worker-1",
          submittedByUserId: "worker-1",
          teamId: null,
          submittedAt: null,
          files: [
            {
              fileId: null,
              position: 0,
              uploadStatus: "PROOF_FILE_FAILED",
              failureCode: "PROOF_FILE_TYPE_NOT_SUPPORTED",
            },
          ],
        },
      ],
    } as never;
    mockedPicker.mockResolvedValue({
      canceled: false,
      assets: [
        {
          uri: "file:///smaller.jpg",
          fileName: "smaller.jpg",
          mimeType: "image/jpeg",
          type: "image",
          width: 10,
          height: 10,
        },
      ],
    });
    mockedService.updateProofDraft.mockResolvedValue({
      id: "draft-1",
      files: [
        { fileId: "file-1", position: 0, uploadStatus: "PROOF_FILE_READY" },
      ],
    } as never);
    mockedService.submitProofDraft.mockResolvedValue({
      id: "draft-1",
    } as never);
    const onSubmitted = jest.fn();

    const screen = await renderForm(snapshot, onSubmitted);
    await fireEvent.press(screen.getByRole("button", { name: "Add files" }));
    await waitFor(() => expect(screen.getByText("1/5 files")).toBeTruthy());
    await fireEvent.press(screen.getByRole("button", { name: "Submit proof" }));
    await fireEvent.press(screen.getByRole("button", { name: "Confirm" }));

    await waitFor(() => expect(onSubmitted).toHaveBeenCalled());
    expect(mockedService.updateProofDraft).toHaveBeenCalledWith(
      "quest-1",
      "draft-1",
      {
        assets: [
          {
            uri: "file:///smaller.jpg",
            name: "smaller.jpg",
            type: "image/jpeg",
          },
        ],
        retryPosition: 0,
        description: undefined,
      },
      expect.any(String)
    );
    expect(mockedService.createProofDraft).not.toHaveBeenCalled();
    expect(mockedService.deleteProofDraft).not.toHaveBeenCalled();
    expect(mockedService.submitProofDraft).toHaveBeenCalledWith(
      "quest-1",
      "draft-1",
      expect.any(String)
    );
  });

  it("does not send a Proof when API reports no ready file", async () => {
    mockedPicker.mockResolvedValue({
      canceled: false,
      assets: [
        {
          uri: "file:///pending.jpg",
          fileName: "pending.jpg",
          mimeType: "image/jpeg",
          type: "image",
          width: 10,
          height: 10,
        },
      ],
    });
    mockedService.createProofDraft.mockResolvedValue({
      id: "draft-1",
      files: [{ fileId: null, uploadStatus: "PROOF_FILE_READY" }],
    } as never);
    const screen = await renderForm(submittable);

    await fireEvent.press(screen.getByRole("button", { name: "Add files" }));
    await waitFor(() => expect(screen.getByText("1/5 files")).toBeTruthy());
    await fireEvent.press(screen.getByRole("button", { name: "Submit proof" }));
    await fireEvent.press(screen.getByRole("button", { name: "Confirm" }));

    await waitFor(() =>
      expect(screen.getByTestId("worker-proof-notice")).toBeTruthy()
    );
    expect(mockedService.submitProofDraft).not.toHaveBeenCalled();
  });

  it("renders nothing while the Worker cannot submit proof", async () => {
    const screen = await renderForm(
      workerSnapshot({
        id: "quest-1",
        title: "Library shift",
        state: "QUEST_ASSIGNED",
      })
    );

    expect(screen.queryByTestId("worker-proof-form")).toBeNull();
    expect(screen.queryByTestId("worker-proof-sent")).toBeNull();
  });
  it("does not treat another GROUP FCFS Worker's proof as this Worker's proof", async () => {
    const snapshot = workerSnapshot({
      id: "quest-1",
      title: "Print flyers",
      mode: "FIRST_COME_FIRST_SERVED",
      participation: "GROUP",
      viewerId: "worker-2",
      capabilities: { canSubmitProof: true },
      proofs: [
        {
          id: "proof-worker-1",
          questId: "quest-1",
          workerId: "worker-1",
          teamId: null,
          submittedByUserId: "worker-1",
          description: "Done",
          status: "PROOF_PENDING",
          submittedAt: "2026-10-01T10:00:00Z",
          createdAt: "2026-10-01T09:30:00Z",
          updatedAt: "2026-10-01T10:00:00Z",
          visibility: "FULL",
          fileIds: ["proof-file-1"],
          files: [],
        },
      ],
    });
    const screen = await renderForm(snapshot, jest.fn(), "worker-2");

    expect(screen.getByTestId("worker-proof-form")).toBeTruthy();
    expect(screen.queryByTestId("worker-proof-sent")).toBeNull();
  });

  it("requires an attached file even when description is present", async () => {
    const screen = await renderForm();

    await fireEvent.changeText(
      screen.getByLabelText("Work description (optional)"),
      "Done"
    );

    expect(
      screen.getByRole("button", { name: "Submit proof", disabled: true })
    ).toBeTruthy();
  });

  it("shows the sent proof status instead of the form", async () => {
    const screen = await renderForm(
      workerSnapshot({
        id: "quest-1",
        title: "Print flyers",
        capabilities: { canSubmitProof: true },
        proofs: [
          {
            id: "proof-1",
            questId: "quest-1",
            workerId: "worker-1",
            teamId: null,
            submittedByUserId: "worker-1",
            description: "Done",
            status: "PROOF_PENDING",
            submittedAt: "2026-10-01T10:00:00Z",
            createdAt: "2026-10-01T09:30:00Z",
            updatedAt: "2026-10-01T10:00:00Z",
            visibility: "FULL",
            fileIds: [],
            files: [],
          },
        ],
      })
    );

    expect(screen.getByText("Proof sent · Awaiting review")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Submit proof" })).toBeNull();
  });
});
