import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import * as ImagePicker from "expo-image-picker";
import { liveQuestService } from "@/features/questBoard/liveQuestService";
import WorkerProofUploadScreen from "../WorkerProofUploadScreen";

const mockBack = jest.fn();
const mockReplace = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({ back: mockBack, replace: mockReplace }),
  useLocalSearchParams: () => ({ id: "quest-test-1", viewerId: "worker-1" }),
}));

jest.mock("@/locales/LocaleProvider", () => ({
  useLocale: () => ({ locale: "en" }),
}));

jest.mock("@/features/auth/AuthService", () => ({
  authService: {
    getSession: () =>
      Promise.resolve({
        user: { id: "worker-1", name: "Worker Test" },
      }),
  },
}));

jest.mock("@/features/questBoard/liveQuestService", () => ({
  liveQuestService: {
    getLiveSnapshot: jest.fn(),
    confirmCompletion: jest.fn(),
    createProofDraft: jest.fn(),
    submitProofDraft: jest.fn(),
  },
}));

jest.mock("expo-image-picker", () => ({
  launchImageLibraryAsync: jest.fn(),
}));

describe("WorkerProofUploadScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("handles quest that does NOT require proof: allows direct completion", async () => {
    (liveQuestService.getLiveSnapshot as jest.Mock).mockResolvedValue({
      quest: {
        id: "quest-test-1",
        title: "Clean Whiteboard",
      },
      proofRequired: false,
      capabilities: {
        canConfirmCompletion: true,
        canSubmitProof: false,
      },
    });
    (liveQuestService.confirmCompletion as jest.Mock).mockResolvedValue({
      success: true,
    });

    const view = await render(
      <WorkerProofUploadScreen questId="quest-test-1" viewerId="worker-1" />
    );

    await waitFor(() => {
      expect(
        view.getByTestId("worker-proof-not-required-section")
      ).toBeTruthy();
      expect(
        view.getByText("This quest does not require proof to complete.")
      ).toBeTruthy();
      expect(view.getByTestId("worker-direct-complete-button")).toBeTruthy();
    });
    await fireEvent.press(view.getByTestId("worker-direct-complete-button"));

    await waitFor(() => {
      expect(liveQuestService.confirmCompletion).toHaveBeenCalledWith(
        "quest-test-1",
        expect.any(String)
      );
    });
  });

  it("handles quest that REQUIRES proof: allows image upload and submit", async () => {
    (liveQuestService.getLiveSnapshot as jest.Mock).mockResolvedValue({
      quest: {
        id: "quest-test-1",
        title: "Print 500 Flyers",
      },
      proofRequired: true,
      capabilities: {
        canConfirmCompletion: false,
        canSubmitProof: true,
      },
    });
    (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
      canceled: false,
      assets: [
        {
          uri: "file:///sample-proof.jpg",
          fileName: "proof.jpg",
          mimeType: "image/jpeg",
        },
      ],
    });
    (liveQuestService.createProofDraft as jest.Mock).mockResolvedValue({
      id: "proof-draft-1",
    });
    (liveQuestService.submitProofDraft as jest.Mock).mockResolvedValue({
      id: "proof-submission-1",
    });

    const view = await render(
      <WorkerProofUploadScreen questId="quest-test-1" viewerId="worker-1" />
    );

    await waitFor(() => {
      expect(view.getByTestId("worker-proof-required-section")).toBeTruthy();
      expect(view.getByTestId("worker-image-upload-box")).toBeTruthy();
      expect(view.getByText("+ Image upload")).toBeTruthy();
    });

    // Pick Image
    await fireEvent.press(view.getByTestId("worker-image-upload-box"));
    await waitFor(() => {
      expect(view.getByTestId("worker-proof-image-preview")).toBeTruthy();
      expect(view.getByTestId("worker-change-image-btn")).toBeTruthy();
      expect(view.getByTestId("worker-remove-image-btn")).toBeTruthy();
    });

    // Enter description
    await fireEvent.changeText(
      view.getByTestId("worker-proof-description-input"),
      "Done printing and folded all 500 copies."
    );

    // Submit
    await fireEvent.press(view.getByTestId("worker-proof-submit-button"));
    await waitFor(() => {
      expect(liveQuestService.createProofDraft).toHaveBeenCalledWith(
        "quest-test-1",
        expect.objectContaining({
          assets: [
            expect.objectContaining({
              uri: "file:///sample-proof.jpg",
            }),
          ],
          description: "Done printing and folded all 500 copies.",
        }),
        expect.any(String)
      );
      expect(liveQuestService.submitProofDraft).toHaveBeenCalledWith(
        "quest-test-1",
        "proof-draft-1",
        expect.any(String)
      );
    });
  });
});
