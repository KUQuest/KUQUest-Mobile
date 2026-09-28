import React, { type ReactNode } from "react";
import { View as mockSafeAreaView } from "react-native";
import { fireEvent, waitFor } from "@testing-library/react-native";
import type { QuestV2ProofSubmission } from "@/api/questV2Contracts";
import { renderWithAppTheme } from "@/testing/queryTestUtils";
import { ProofSubmissionSheet } from "../components/ProofSubmissionSheet";

jest.mock("@/features/preferences/localeStore", () => ({
  useLocale: () => ({ locale: "en" }),
}));
jest.mock("react-native-safe-area-context", () => ({
  SafeAreaView: mockSafeAreaView,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock("react-native/Libraries/Modal/Modal", () => ({
  __esModule: true,
  default: ({
    visible,
    children,
  }: {
    visible: boolean;
    children: ReactNode;
  }) => (visible ? <>{children}</> : null),
}));

const proof: QuestV2ProofSubmission = {
  id: "proof-1",
  questId: "quest-1",
  workerId: "worker-1",
  teamId: null,
  submittedByUserId: "worker-1",
  description: "Work complete",
  status: null,
  submittedAt: null,
  createdAt: "2026-09-15T03:30:00.000Z",
  updatedAt: "2026-09-15T03:30:00.000Z",
  visibility: "FULL",
  fileIds: ["file-1", "file-2"],
  files: [
    {
      fileId: "file-1",
      contentType: "application/pdf",
      sizeBytes: 1024,
      position: 0,
      uploadStatus: "PROOF_FILE_READY",
      failureCode: null,
    },
    {
      fileId: "file-2",
      contentType: "image/jpeg",
      sizeBytes: 2048,
      position: 1,
      uploadStatus: "PROOF_FILE_FAILED",
      failureCode: "PROOF_FILE_UPLOAD_FAILED",
    },
  ],
};

test("removes ready and failed server proof files", async () => {
  const onRemoveServerFile = jest.fn().mockResolvedValue(undefined);
  const view = await renderWithAppTheme(
    <ProofSubmissionSheet
      onClose={jest.fn()}
      onRemoveServerFile={onRemoveServerFile}
      proof={proof}
      visible
    />
  );

  await fireEvent.press(view.getByTestId("proof-remove-server-0"));
  await waitFor(() => expect(onRemoveServerFile).toHaveBeenCalledWith(0));

  await fireEvent.press(view.getByTestId("proof-remove-server-1"));
  await waitFor(() => expect(onRemoveServerFile).toHaveBeenCalledWith(1));
});
