import { Alert, type AlertButton } from "react-native";
import { act, fireEvent, waitFor } from "@testing-library/react-native";
import * as ImagePicker from "expo-image-picker";

import { liveQuestService } from "@/features/questBoard/live/liveQuestService";
import { renderWithQueryClient } from "@/testing/queryTestUtils";
import { workerSnapshot } from "@/testing/workerSnapshotFixtures";
import { WorkerProofForm } from "../components/WorkerProofForm";

jest.mock("@/features/preferences/localeStore", () => ({
  useLocale: () => ({ locale: "en" }),
}));
jest.mock("@/features/questBoard/live/liveQuestService", () => ({
  liveQuestService: {
    createProofDraft: jest.fn(),
    submitProofDraft: jest.fn(),
  },
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

/** Presses the named button of the most recent Alert. */
async function pressAlertButton(text: string) {
  const calls = jest.mocked(Alert.alert).mock.calls;
  const buttons = (calls[calls.length - 1]?.[2] ?? []) as AlertButton[];
  const button = buttons.find((candidate) => candidate.text === text);
  if (!button?.onPress) throw new Error(`No alert button "${text}"`);
  const onPress = button.onPress;
  await act(async () => {
    onPress();
  });
}

function renderForm(
  snapshot = submittable,
  onSubmitted: () => Promise<unknown> | void = jest.fn()
) {
  return renderWithQueryClient(
    <WorkerProofForm
      onSubmitted={onSubmitted}
      questId="quest-1"
      snapshot={snapshot}
      viewerId="worker-1"
    />
  );
}

describe("WorkerProofForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, "alert").mockImplementation(() => undefined);
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
    await fireEvent.press(screen.getByRole("button", { name: "Submit proof" }));
    expect(Alert.alert).toHaveBeenCalledWith(
      "Send proof?",
      expect.any(String),
      expect.any(Array)
    );
    await pressAlertButton("Confirm");

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
    mockedService.createProofDraft.mockResolvedValue({
      id: "draft-1",
      files: [{ uploadStatus: "PROOF_FILE_FAILED" }],
    } as never);
    const onSubmitted = jest.fn();

    const screen = await renderForm(submittable, onSubmitted);

    await fireEvent.changeText(
      screen.getByLabelText("Work description (optional)"),
      "Done"
    );
    await fireEvent.press(screen.getByRole("button", { name: "Submit proof" }));
    await pressAlertButton("Confirm");

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
